package com.smartsalon.customer.service.impl;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.booking.service.BookingService;
import com.smartsalon.customer.dto.*;
import com.smartsalon.customer.service.CustomerService;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.pos.entity.OrderStatus;
import com.smartsalon.pos.repository.OrderRepository;
import com.smartsalon.review.entity.ServiceReviewEntity;
import com.smartsalon.review.repository.ServiceReviewRepository;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final BookingService bookingService;
    private final OrderRepository orderRepository;
    private final ServiceReviewRepository serviceReviewRepository;
    private final CustomerPortalMapper customerPortalMapper;

    @Override
    @Transactional(readOnly = true)
    public CustomerLoyaltyDto getLoyaltyPreview(String phone) {
        if (phone == null || phone.isBlank()) {
            return customerPortalMapper.defaultLoyaltyPreview(phone, true);
        }
        String cleanPhone = phone.trim();
        Optional<UserEntity> userOpt = userRepository.findByPhoneAndIsDeletedFalse(cleanPhone);
        boolean canViewFullPii = canCurrentCallerViewFullPii(cleanPhone, userOpt.orElse(null));

        return userOpt
                .map(u -> customerPortalMapper.toLoyaltyDto(u, canViewFullPii))
                .orElseGet(() -> customerPortalMapper.defaultLoyaltyPreview(cleanPhone, canViewFullPii));
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerSummaryDto getCustomerSummary(String username) {
        UserEntity user = resolveUserByUsername(username);
        long completedVisits = orderRepository.countCompletedVisitsByCustomerId(user.getId());
        long upcomingBookings = bookingRepository.countUpcomingBookingsForCustomer(user.getId(), LocalDateTime.now());
        return customerPortalMapper.toSummaryDto(user, completedVisits, upcomingBookings);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerBookingResponse> getCustomerBookings(String username) {
        UserEntity user = resolveUserByUsername(username);
        LocalDateTime now = LocalDateTime.now();
        return bookingRepository.findByCustomerIdAndIsDeletedFalseOrderByBookingTimeDesc(user.getId()).stream()
                .map(b -> customerPortalMapper.toBookingResponse(b, now))
                .toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CustomerBookingResponse cancelCustomerBooking(String username, Long bookingId) {
        UserEntity user = resolveUserByUsername(username);
        BookingEntity booking = bookingRepository.findById(bookingId)
                .filter(b -> !b.isDeleted())
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        LocalDateTime now = LocalDateTime.now();
        validateCustomerCancellationAccess(user, booking, now);

        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
        }

        BookingEntity cancelledBooking = bookingService.cancelBooking(booking);
        return customerPortalMapper.toBookingResponse(cancelledBooking, now);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerOrderResponse> getCustomerOrders(String username) {
        UserEntity user = resolveUserByUsername(username);
        return orderRepository.findCustomerOrdersByStatus(user.getId(), user.getPhone(), OrderStatus.PAID).stream()
                .map(customerPortalMapper::toOrderResponse)
                .toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CustomerReviewDto submitServiceReview(String username, Long orderId, CreateServiceReviewRequest request) {
        UserEntity customer = resolveUserByUsername(username);
        OrderEntity order = orderRepository.findByIdAndIsDeletedFalse(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        validateOrderReviewEligibility(customer, order);
        UserEntity stylist = resolveStylistForReview(order, request.getStylistId());

        ServiceReviewEntity review = ServiceReviewEntity.builder()
                .order(order)
                .customer(customer)
                .stylist(stylist)
                .branch(order.getBranch())
                .rating(request.getRating())
                .comment(request.getComment() != null ? request.getComment().trim() : null)
                .build();
        return customerPortalMapper.toReviewDto(serviceReviewRepository.save(review));
    }

    public static boolean computeCanCancelOnline(BookingStatus status, LocalDateTime bookingTime, LocalDateTime now) {
        return BookingEntity.computeCanCancelOnline(status, bookingTime, now);
    }

    private UserEntity resolveUserByUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return userRepository.findByUsernameAndIsDeletedFalse(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private boolean canCurrentCallerViewFullPii(String cleanPhone, UserEntity targetUser) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return false;
        }
        boolean isPrivilegedStaff = auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MANAGER")
                        || a.getAuthority().equals("ROLE_STAFF") || a.getAuthority().equals("ROLE_STYLIST"));
        boolean isSelfCustomer = auth.getName() != null && (auth.getName().equals(cleanPhone)
                || (targetUser != null && auth.getName().equals(targetUser.getUsername())));
        return isPrivilegedStaff || isSelfCustomer;
    }

    private void validateCustomerCancellationAccess(UserEntity user, BookingEntity booking, LocalDateTime now) {
        boolean isStaffOrAdmin = user.getRoles().stream().anyMatch(r ->
                "ADMIN".equals(r.getName()) || "MANAGER".equals(r.getName()) || "STAFF".equals(r.getName()));
        if (isStaffOrAdmin) return;

        if (booking.getCustomer() == null || !booking.getCustomer().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        if (!booking.canCancelOnline(now)) {
            if (booking.getStatus() != BookingStatus.PENDING_PAYMENT && booking.getStatus() != BookingStatus.CONFIRMED) {
                throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
            }
            throw new AppException(ErrorCode.BOOKING_CANCELLATION_WINDOW_EXPIRED);
        }
    }

    private void validateOrderReviewEligibility(UserEntity customer, OrderEntity order) {
        if (!order.isOwnedByCustomer(customer)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        if (order.getStatus() != OrderStatus.PAID) {
            throw new AppException(ErrorCode.INVALID_ORDER_STATUS, "Chỉ có thể đánh giá đơn hàng đã hoàn tất thanh toán");
        }
        if (!order.hasServiceItems()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Đơn hàng chỉ mua sản phẩm bán lẻ không thể đánh giá dịch vụ");
        }
        if (serviceReviewRepository.findByOrderIdAndIsDeletedFalse(order.getId()).isPresent()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Đơn hàng này đã được đánh giá dịch vụ");
        }
    }

    private UserEntity resolveStylistForReview(OrderEntity order, Long requestedStylistId) {
        List<CustomerStylistDto> participatingStylists = customerPortalMapper.resolveParticipatingStylists(order);
        if (requestedStylistId != null) {
            UserEntity picked = userRepository.findByIdAndIsDeletedFalse(requestedStylistId)
                    .orElseThrow(() -> new AppException(ErrorCode.STYLIST_NOT_FOUND));
            boolean participated = participatingStylists.stream()
                    .anyMatch(s -> s.getId().equals(picked.getId()));
            if (!picked.isActive() || !participated) {
                throw new AppException(ErrorCode.STYLIST_NOT_FOUND);
            }
            return picked;
        }
        if (!participatingStylists.isEmpty()) {
            return userRepository.findByIdAndIsDeletedFalse(participatingStylists.get(0).getId())
                    .orElseThrow(() -> new AppException(ErrorCode.STYLIST_NOT_FOUND, "Không xác định được kỹ thuật viên phục vụ đơn hàng"));
        }
        if (order.getBooking() != null && order.getBooking().getStaff() != null) {
            return order.getBooking().getStaff();
        }
        throw new AppException(ErrorCode.STYLIST_NOT_FOUND, "Không xác định được kỹ thuật viên phục vụ đơn hàng");
    }
}
