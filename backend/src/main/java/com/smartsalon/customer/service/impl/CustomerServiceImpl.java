package com.smartsalon.customer.service.impl;

import com.smartsalon.booking.dto.BookingServiceItemDto;
import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.booking.service.RedisLockService;
import com.smartsalon.customer.dto.CustomerBookingResponse;
import com.smartsalon.customer.dto.CustomerLoyaltyDto;
import com.smartsalon.customer.dto.CustomerSummaryDto;
import com.smartsalon.customer.service.CustomerService;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.pos.repository.OrderRepository;
import com.smartsalon.realtime.service.RealtimeNotificationService;
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
}
