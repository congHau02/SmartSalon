package com.smartsalon.booking.entity;

import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.common.BaseEntity;
import com.smartsalon.user.entity.UserEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private BranchEntity branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private UserEntity customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private UserEntity staff;

    @Column(name = "booking_code", nullable = false, unique = true, length = 30)
    private String bookingCode;

    @Column(name = "booking_time", nullable = false)
    private LocalDateTime bookingTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "total_duration_minutes", nullable = false)
    @Builder.Default
    private int totalDurationMinutes = 30;

    @Column(name = "total_price", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalPrice = BigDecimal.ZERO;

    @Column(name = "slot_lock_expires_at")
    private LocalDateTime slotLockExpiresAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING_PAYMENT;

    @Column(name = "deposit_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal depositAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "deposit_status", nullable = false, length = 30)
    @Builder.Default
    private DepositStatus depositStatus = DepositStatus.UNPAID;

    @Column(name = "is_stylist_requested", nullable = false)
    @Builder.Default
    private boolean isStylistRequested = false;

    @Column(name = "customer_name", length = 150)
    private String customerName;

    @Column(name = "customer_phone", length = 20)
    private String customerPhone;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BookingServiceItemEntity> items = new ArrayList<>();

    public void addItem(BookingServiceItemEntity item) {
        items.add(item);
        item.setBooking(this);
    }

    public static final BigDecimal DEPOSIT_RATE = new BigDecimal("0.20");
    public static final int HOLD_TTL_MINUTES = 5;

    public static BigDecimal calculateDepositAmount(BigDecimal totalPrice) {
        if (totalPrice == null || totalPrice.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return totalPrice.multiply(DEPOSIT_RATE).setScale(0, java.math.RoundingMode.HALF_UP);
    }

    public boolean isHoldExpired(LocalDateTime now) {
        LocalDateTime referenceNow = now != null ? now : LocalDateTime.now();
        return status == BookingStatus.PENDING_PAYMENT
                && slotLockExpiresAt != null
                && !slotLockExpiresAt.isAfter(referenceNow);
    }

    public boolean canTransitionTo(BookingStatus target) {
        if (status == null || target == null) return false;
        if (status == target) return true;
        return switch (status) {
            case PENDING_PAYMENT -> target == BookingStatus.CONFIRMED || target == BookingStatus.CANCELLED || target == BookingStatus.EXPIRED;
            case CONFIRMED -> target == BookingStatus.CHECKED_IN || target == BookingStatus.CANCELLED || target == BookingStatus.NO_SHOW;
            case CHECKED_IN -> target == BookingStatus.IN_PROGRESS || target == BookingStatus.CANCELLED;
            case IN_PROGRESS -> target == BookingStatus.COMPLETED;
            case COMPLETED, CANCELLED, EXPIRED, NO_SHOW -> false;
        };
    }

    public void confirmDeposit() {
        this.status = BookingStatus.CONFIRMED;
        this.depositStatus = DepositStatus.PAID;
        this.slotLockExpiresAt = null;
    }

    public void expireHold() {
        this.status = BookingStatus.EXPIRED;
    }

    public String resolvedCustomerName() {
        if (customerName != null && !customerName.isBlank()) {
            return customerName;
        }
        return customer != null && customer.getFullName() != null ? customer.getFullName() : "Khách hàng";
    }

    public String resolvedCustomerPhone() {
        if (customerPhone != null && !customerPhone.isBlank()) {
            return customerPhone;
        }
        return customer != null && customer.getPhone() != null ? customer.getPhone() : "";
    }

    public boolean canCancelOnline(LocalDateTime now) {
        return computeCanCancelOnline(this.status, this.bookingTime, now);
    }

    public String resolveCancelPolicyNotice(LocalDateTime now) {
        return resolveCancelPolicyNotice(this.status, this.bookingTime, now);
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

    public static String resolveCancelPolicyNotice(BookingStatus status, LocalDateTime bookingTime, LocalDateTime now) {
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
}
