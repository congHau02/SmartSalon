package com.smartsalon.customer.service.impl;

import com.smartsalon.booking.dto.BookingServiceItemDto;
import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.booking.service.RedisLockService;
import com.smartsalon.customer.dto.*;
import com.smartsalon.customer.service.CustomerService;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.pos.entity.OrderItemEntity;
import com.smartsalon.pos.entity.OrderItemType;
import com.smartsalon.pos.entity.OrderStatus;
import com.smartsalon.pos.entity.OrderStepAssignmentEntity;
import com.smartsalon.pos.entity.TechnicalLogEntity;
import com.smartsalon.pos.repository.OrderRepository;
import com.smartsalon.pos.repository.TechnicalLogRepository;
import com.smartsalon.realtime.service.RealtimeNotificationService;
import com.smartsalon.review.entity.ServiceReviewEntity;
import com.smartsalon.review.repository.ServiceReviewRepository;
import com.smartsalon.user.entity.MembershipTier;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final OrderRepository orderRepository;
    private final RedisLockService redisLockService;
    private final RealtimeNotificationService realtimeNotificationService;
    private final TechnicalLogRepository technicalLogRepository;
    private final ServiceReviewRepository serviceReviewRepository;

    @Override
    @Transactional(readOnly = true)
    public CustomerLoyaltyDto getLoyaltyPreview(String phone) {
        if (phone == null || phone.isBlank()) {
            return defaultLoyaltyPreview(phone);
        }

        String cleanPhone = phone.trim();
        Optional<UserEntity> userOpt = userRepository.findByPhoneAndIsDeletedFalse(cleanPhone);
        if (userOpt.isEmpty()) {
            return defaultLoyaltyPreview(cleanPhone);
        }

        UserEntity user = userOpt.get();
        MembershipTier tier = user.getMembershipTier() != null ? user.getMembershipTier() : MembershipTier.STANDARD;
        BigDecimal spent = user.getTotalSpent() != null ? user.getTotalSpent() : BigDecimal.ZERO;
        BigDecimal credit = user.getCreditBalance() != null ? user.getCreditBalance() : BigDecimal.ZERO;

        return CustomerLoyaltyDto.builder()
                .customerId(user.getId())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .membershipTier(tier)
                .discountPercent(tier.getDiscountPercent())
                .totalSpent(spent)
                .nextTier(tier.getNextTier())
                .amountToNextTier(tier.getAmountToNextTier(spent))
                .creditBalance(credit)
                .isProvisional(user.isProvisional())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerSummaryDto getCustomerSummary(String username) {
        UserEntity user = resolveUserByUsername(username);

        MembershipTier tier = user.getMembershipTier() != null ? user.getMembershipTier() : MembershipTier.STANDARD;
        BigDecimal spent = user.getTotalSpent() != null ? user.getTotalSpent() : BigDecimal.ZERO;
        BigDecimal credit = user.getCreditBalance() != null ? user.getCreditBalance() : BigDecimal.ZERO;
        long completedVisits = orderRepository.countCompletedVisitsByCustomerId(user.getId());
        long upcomingBookings = bookingRepository.countUpcomingBookingsForCustomer(user.getId(), LocalDateTime.now());

        return CustomerSummaryDto.builder()
                .customerId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .membershipTier(tier)
                .discountPercent(tier.getDiscountPercent())
                .totalSpent(spent)
                .nextTier(tier.getNextTier())
                .amountToNextTier(tier.getAmountToNextTier(spent))
                .creditBalance(credit)
                .isProvisional(user.isProvisional())
                .totalCompletedVisits(completedVisits)
                .upcomingBookingCount(upcomingBookings)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerBookingResponse> getCustomerBookings(String username) {
        UserEntity user = resolveUserByUsername(username);
        LocalDateTime now = LocalDateTime.now();

        List<BookingEntity> bookings = bookingRepository.findByCustomerIdAndIsDeletedFalseOrderByBookingTimeDesc(user.getId());
        return bookings.stream()
                .map(b -> mapToCustomerBookingResponse(b, now))
                .toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CustomerBookingResponse cancelCustomerBooking(String username, Long bookingId) {
        UserEntity user = resolveUserByUsername(username);
        BookingEntity booking = bookingRepository.findById(bookingId)
                .filter(b -> !b.isDeleted())
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        boolean isStaffOrAdmin = user.getRoles().stream().anyMatch(r ->
                "ADMIN".equals(r.getName()) || "MANAGER".equals(r.getName()) || "STAFF".equals(r.getName()));

        LocalDateTime now = LocalDateTime.now();
        if (!isStaffOrAdmin) {
            if (booking.getCustomer() == null || !booking.getCustomer().getId().equals(user.getId())) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
            // 2-hour online cancellation rule: bookingTime - now >= 2 hours (customers only)
            if (booking.getBookingTime().isBefore(now.plusHours(2))) {
                throw new AppException(ErrorCode.BOOKING_CANCELLATION_WINDOW_EXPIRED);
            }
        }

        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
        }

        BookingStatus oldStatus = booking.getStatus();
        booking.setStatus(BookingStatus.CANCELLED);

        // 1. Release active Redis slot lock if assigned stylist
        if (booking.getStaff() != null) {
            redisLockService.unlockSlots(booking.getStaff().getId(), booking.getBookingTime(), booking.getEndTime());
        }

        // 2. If deposit was paid, credit full deposit amount into customer's Retained Deposit balance
        if (booking.getDepositStatus() == DepositStatus.PAID &&
                booking.getDepositAmount() != null &&
                booking.getDepositAmount().compareTo(BigDecimal.ZERO) > 0) {
            UserEntity customer = booking.getCustomer();
            if (customer != null && !"walkin.guest".equalsIgnoreCase(customer.getUsername())) {
                BigDecimal currentCredit = customer.getCreditBalance() != null ? customer.getCreditBalance() : BigDecimal.ZERO;
                customer.setCreditBalance(currentCredit.add(booking.getDepositAmount()));
                userRepository.save(customer);
                booking.setDepositStatus(DepositStatus.CREDITED);
            }
        }

        booking = bookingRepository.save(booking);

        if (realtimeNotificationService != null) {
            realtimeNotificationService.notifyBookingStatusChanged(booking, oldStatus, BookingStatus.CANCELLED);
        }

        return mapToCustomerBookingResponse(booking, now);
    }

    private UserEntity resolveUserByUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return userRepository.findByUsernameAndIsDeletedFalse(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private CustomerBookingResponse mapToCustomerBookingResponse(BookingEntity b, LocalDateTime now) {
        boolean canCancel = computeCanCancelOnline(b.getStatus(), b.getBookingTime(), now);
        String notice = resolveCancelPolicyNotice(b.getStatus(), b.getBookingTime(), now);

        List<BookingServiceItemDto> items = (b.getItems() != null) ? b.getItems().stream()
                .map(item -> new BookingServiceItemDto(
                        item.getId(),
                        item.getService() != null ? item.getService().getId() : null,
                        item.getService() != null ? item.getService().getName() : "",
                        item.getPrice(),
                        item.getDurationMinutes()
                ))
                .toList() : List.of();

        return new CustomerBookingResponse(
                b.getId(),
                b.getBookingCode(),
                b.getBranch() != null ? b.getBranch().getId() : null,
                b.getBranch() != null ? b.getBranch().getName() : "",
                b.getCustomer() != null ? b.getCustomer().getId() : null,
                b.resolvedCustomerName(),
                b.resolvedCustomerPhone(),
                b.getStaff() != null ? b.getStaff().getId() : null,
                b.getStaff() != null ? b.getStaff().getFullName() : null,
                b.isStylistRequested(),
                b.getBookingTime(),
                b.getEndTime(),
                b.getTotalDurationMinutes(),
                b.getTotalPrice(),
                b.getDepositAmount(),
                b.getDepositStatus(),
                b.getStatus(),
                b.getNotes(),
                canCancel,
                notice,
                items,
                b.getCreatedAt()
        );
    }

    public static boolean computeCanCancelOnline(BookingStatus status, LocalDateTime bookingTime, LocalDateTime now) {
        if (status != BookingStatus.PENDING_PAYMENT && status != BookingStatus.CONFIRMED) {
            return false;
        }
        if (bookingTime == null) {
            return false;
        }
        LocalDateTime refNow = now != null ? now : LocalDateTime.now();
        return !bookingTime.isBefore(refNow.plusHours(2));
    }

    private String resolveCancelPolicyNotice(BookingStatus status, LocalDateTime bookingTime, LocalDateTime now) {
        if (status == BookingStatus.CANCELLED) {
            return "Lịch hẹn đã được hủy.";
        }
        if (status == BookingStatus.COMPLETED) {
            return "Lịch hẹn đã hoàn thành.";
        }
        if (status == BookingStatus.EXPIRED) {
            return "Lịch hẹn đã hết hạn giữ chỗ.";
        }
        if (status != BookingStatus.PENDING_PAYMENT && status != BookingStatus.CONFIRMED) {
            return "Trạng thái này không thể hủy trực tuyến.";
        }
        if (computeCanCancelOnline(status, bookingTime, now)) {
            return "Có thể hủy trực tuyến trước giờ hẹn ít nhất 2 tiếng.";
        }
        return "Không thể hủy trực tuyến do thời gian bắt đầu còn dưới 2 tiếng. Vui lòng liên hệ hotline chi nhánh để được hỗ trợ.";
    }

    private CustomerLoyaltyDto defaultLoyaltyPreview(String phone) {
        MembershipTier standard = MembershipTier.STANDARD;
        return CustomerLoyaltyDto.builder()
                .phone(phone)
                .membershipTier(standard)
                .discountPercent(standard.getDiscountPercent())
                .totalSpent(BigDecimal.ZERO)
                .nextTier(standard.getNextTier())
                .amountToNextTier(standard.getAmountToNextTier(BigDecimal.ZERO))
                .creditBalance(BigDecimal.ZERO)
                .isProvisional(true)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerOrderResponse> getCustomerOrders(String username) {
        UserEntity user = resolveUserByUsername(username);
        List<OrderEntity> orders = orderRepository.findCustomerOrdersByStatus(user.getId(), user.getPhone(), OrderStatus.PAID);
        return orders.stream()
                .map(this::mapToCustomerOrderResponse)
                .toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CustomerReviewDto submitServiceReview(String username, Long orderId, CreateServiceReviewRequest request) {
        UserEntity customer = resolveUserByUsername(username);
        OrderEntity order = orderRepository.findByIdAndIsDeletedFalse(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        boolean isOwner = (order.getCustomer() != null && order.getCustomer().getId().equals(customer.getId()))
                || (order.getCustomerPhone() != null && order.getCustomerPhone().equals(customer.getPhone()));
        if (!isOwner) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (order.getStatus() != OrderStatus.PAID) {
            throw new AppException(ErrorCode.INVALID_ORDER_STATUS, "Chỉ có thể đánh giá đơn hàng đã hoàn tất thanh toán");
        }

        boolean hasService = order.getItems() != null && order.getItems().stream()
                .anyMatch(i -> !i.isDeleted() && i.getItemType() == OrderItemType.SERVICE);
        if (!hasService) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Đơn hàng chỉ mua sản phẩm bán lẻ không thể đánh giá dịch vụ");
        }

        if (serviceReviewRepository.findByOrderIdAndIsDeletedFalse(orderId).isPresent()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Đơn hàng này đã được đánh giá dịch vụ");
        }

        UserEntity stylist;
        if (request.getStylistId() != null) {
            stylist = userRepository.findByIdAndIsDeletedFalse(request.getStylistId())
                    .orElseThrow(() -> new AppException(ErrorCode.STYLIST_NOT_FOUND));
        } else {
            CustomerOrderResponse orderResp = mapToCustomerOrderResponse(order);
            if (orderResp.getPrimaryStylist() != null) {
                stylist = userRepository.findByIdAndIsDeletedFalse(orderResp.getPrimaryStylist().getId())
                        .orElse(null);
            } else if (order.getBooking() != null && order.getBooking().getStaff() != null) {
                stylist = order.getBooking().getStaff();
            } else {
                stylist = null;
            }
            if (stylist == null) {
                throw new AppException(ErrorCode.STYLIST_NOT_FOUND, "Không xác định được kỹ thuật viên phục vụ đơn hàng");
            }
        }

        ServiceReviewEntity review = ServiceReviewEntity.builder()
                .order(order)
                .customer(customer)
                .stylist(stylist)
                .branch(order.getBranch())
                .rating(request.getRating())
                .comment(request.getComment() != null ? request.getComment().trim() : null)
                .build();
        review = serviceReviewRepository.save(review);

        return CustomerReviewDto.builder()
                .id(review.getId())
                .orderId(order.getId())
                .customerId(customer.getId())
                .stylistId(stylist.getId())
                .stylistName(stylist.getFullName())
                .stylistAvatarUrl(stylist.getAvatarUrl())
                .branchId(order.getBranch() != null ? order.getBranch().getId() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }

    private CustomerOrderResponse mapToCustomerOrderResponse(OrderEntity order) {
        List<CustomerOrderItemDto> items = (order.getItems() != null)
                ? order.getItems().stream()
                .filter(i -> !i.isDeleted())
                .map(i -> CustomerOrderItemDto.builder()
                        .id(i.getId())
                        .itemType(i.getItemType() != null ? i.getItemType().name() : null)
                        .serviceId(i.getService() != null ? i.getService().getId() : null)
                        .productId(i.getProduct() != null ? i.getProduct().getId() : null)
                        .name(i.getService() != null ? i.getService().getName() : (i.getProduct() != null ? i.getProduct().getName() : ""))
                        .unitPrice(i.getUnitPrice())
                        .quantity(i.getQuantity())
                        .totalPrice(i.getTotalPrice())
                        .build())
                .toList()
                : java.util.List.of();

        // 1. Resolve participating stylists and primary stylist by earned step commission
        java.util.Map<Long, StylistAccumulator> stylistMap = new java.util.LinkedHashMap<>();

        if (order.getItems() != null) {
            for (OrderItemEntity item : order.getItems()) {
                if (item.isDeleted() || item.getStepAssignments() == null) continue;
                for (OrderStepAssignmentEntity step : item.getStepAssignments()) {
                    if (step.getStaff() != null) {
                        UserEntity staff = step.getStaff();
                        BigDecimal comm = step.getCommissionAmount() != null ? step.getCommissionAmount() : BigDecimal.ZERO;
                        stylistMap.computeIfAbsent(staff.getId(), id -> new StylistAccumulator(staff))
                                .addCommission(comm);
                    }
                }
            }
        }

        if (order.getBooking() != null && order.getBooking().getStaff() != null) {
            UserEntity bookingStaff = order.getBooking().getStaff();
            stylistMap.computeIfAbsent(bookingStaff.getId(), id -> new StylistAccumulator(bookingStaff));
        }

        Optional<TechnicalLogEntity> techLogOpt = technicalLogRepository.findByOrderIdAndIsDeletedFalse(order.getId());
        if (techLogOpt.isPresent() && techLogOpt.get().getStaff() != null) {
            UserEntity techStaff = techLogOpt.get().getStaff();
            stylistMap.computeIfAbsent(techStaff.getId(), id -> new StylistAccumulator(techStaff));
        }

        java.util.List<StylistAccumulator> accumulators = new java.util.ArrayList<>(stylistMap.values());
        accumulators.sort((a, b) -> {
            int cmp = b.commissionAmount.compareTo(a.commissionAmount);
            if (cmp != 0) return cmp;
            boolean aIsBooking = order.getBooking() != null && order.getBooking().getStaff() != null && order.getBooking().getStaff().getId().equals(a.staff.getId());
            boolean bIsBooking = order.getBooking() != null && order.getBooking().getStaff() != null && order.getBooking().getStaff().getId().equals(b.staff.getId());
            if (aIsBooking && !bIsBooking) return -1;
            if (!aIsBooking && bIsBooking) return 1;
            return a.staff.getId().compareTo(b.staff.getId());
        });

        List<CustomerStylistDto> participatingStylists = accumulators.stream()
                .map(acc -> CustomerStylistDto.builder()
                        .id(acc.staff.getId())
                        .fullName(acc.staff.getFullName())
                        .phone(acc.staff.getPhone())
                        .avatarUrl(acc.staff.getAvatarUrl())
                        .totalCommission(acc.commissionAmount)
                        .build())
                .toList();

        CustomerStylistDto primaryStylist = !participatingStylists.isEmpty() ? participatingStylists.get(0) : null;

        // 2. Visual Log (Privacy: NO actualBomJson)
        CustomerVisualLogDto visualLogDto = techLogOpt.map(t -> CustomerVisualLogDto.builder()
                .id(t.getId())
                .beforeImageUrl(t.getBeforeImageUrl())
                .afterImageUrl(t.getAfterImageUrl())
                .hairConditionNotes(t.getHairConditionNotes())
                .formulaNotes(t.getFormulaNotes())
                .createdAt(t.getCreatedAt())
                .build()).orElse(null);

        // 3. Service Review
        Optional<ServiceReviewEntity> reviewOpt = serviceReviewRepository.findByOrderIdAndIsDeletedFalse(order.getId());
        CustomerReviewDto reviewDto = reviewOpt.map(r -> CustomerReviewDto.builder()
                .id(r.getId())
                .orderId(r.getOrder() != null ? r.getOrder().getId() : null)
                .customerId(r.getCustomer() != null ? r.getCustomer().getId() : null)
                .stylistId(r.getStylist() != null ? r.getStylist().getId() : null)
                .stylistName(r.getStylist() != null ? r.getStylist().getFullName() : null)
                .stylistAvatarUrl(r.getStylist() != null ? r.getStylist().getAvatarUrl() : null)
                .branchId(r.getBranch() != null ? r.getBranch().getId() : null)
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .build()).orElse(null);

        boolean hasService = (order.getItems() != null) && order.getItems().stream()
                .anyMatch(i -> !i.isDeleted() && i.getItemType() == OrderItemType.SERVICE);
        boolean canReview = (reviewDto == null) && (order.getStatus() == OrderStatus.PAID) && hasService;

        OrderEntity.RevenueBreakdown breakdown = order.calculateRevenueBreakdown();

        return CustomerOrderResponse.builder()
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .branchId(order.getBranch() != null ? order.getBranch().getId() : null)
                .branchName(order.getBranch() != null ? order.getBranch().getName() : "")
                .createdAt(order.getCreatedAt())
                .status(order.getStatus())
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .depositDeducted(order.getDepositDeducted())
                .finalAmount(order.getFinalAmount())
                .netRevenue(breakdown.totalNetRevenue())
                .items(items)
                .participatingStylists(participatingStylists)
                .primaryStylist(primaryStylist)
                .visualLog(visualLogDto)
                .review(reviewDto)
                .canReview(canReview)
                .build();
    }

    private static class StylistAccumulator {
        private final UserEntity staff;
        private BigDecimal commissionAmount = BigDecimal.ZERO;

        public StylistAccumulator(UserEntity staff) {
            this.staff = staff;
        }

        public void addCommission(BigDecimal amount) {
            if (amount != null) {
                this.commissionAmount = this.commissionAmount.add(amount);
            }
        }
    }
}
