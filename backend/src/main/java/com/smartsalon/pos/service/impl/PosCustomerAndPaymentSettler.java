package com.smartsalon.pos.service.impl;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.payment.entity.PaymentTransactionEntity;
import com.smartsalon.payment.repository.PaymentTransactionRepository;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.realtime.service.RealtimeNotificationService;
import com.smartsalon.security.BranchScopeGuard;
import com.smartsalon.user.entity.MembershipTier;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class PosCustomerAndPaymentSettler {

    private final UserRepository userRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final BookingRepository bookingRepository;
    private final RealtimeNotificationService realtimeNotificationService;
    private final BranchScopeGuard branchScopeGuard;
    private final EntityManager entityManager;

    public void checkBranchAccess(OrderEntity order) {
        branchScopeGuard.checkBranchAccess(order.getBranch() != null ? order.getBranch().getId() : null);
    }

    public UserEntity lockCustomerAndApplyRetainedCredit(OrderEntity order) {
        UserEntity customer = order.getCustomer();
        if (customer == null || "walkin.guest".equalsIgnoreCase(customer.getUsername())) {
            return null;
        }
        UserEntity lockedCustomer = userRepository.findByIdForUpdate(customer.getId()).orElse(customer);
        if (entityManager != null) {
            entityManager.refresh(lockedCustomer);
        }
        BigDecimal credit = lockedCustomer.getCreditBalance() != null
                ? lockedCustomer.getCreditBalance()
                : BigDecimal.ZERO;
        if (credit.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal subtotal = order.getSubtotal() != null ? order.getSubtotal() : BigDecimal.ZERO;
            BigDecimal discount = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;
            BigDecimal existingDeposit = order.getDepositDeducted() != null ? order.getDepositDeducted() : BigDecimal.ZERO;
            BigDecimal payableBeforeCredit = subtotal.subtract(discount).subtract(existingDeposit).max(BigDecimal.ZERO);
            if (payableBeforeCredit.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal appliedCredit = credit.min(payableBeforeCredit);
                lockedCustomer.setCreditBalance(credit.subtract(appliedCredit));
                order.setDepositDeducted(existingDeposit.add(appliedCredit));
                order.recalculateTotals();
            }
        }
        return lockedCustomer;
    }

    public void recordPaymentTransaction(OrderEntity order, String paymentMethod) {
        PaymentTransactionEntity tx = PaymentTransactionEntity.builder()
                .orderId(order.getId())
                .booking(order.getBooking())
                .paymentMethod(paymentMethod)
                .transactionCode("TX-POS-" + order.getOrderCode() + "-" + System.currentTimeMillis())
                .amount(order.getFinalAmount())
                .status(PaymentTransactionEntity.STATUS_SUCCESS)
                .build();
        paymentTransactionRepository.save(tx);
    }

    public void finalizePostSettlement(OrderEntity savedOrder, UserEntity lockedCustomer) {
        if (lockedCustomer != null) {
            BigDecimal netRevenue = savedOrder.calculateRevenueBreakdown().totalNetRevenue();
            BigDecimal currentSpent = lockedCustomer.getTotalSpent() != null
                    ? lockedCustomer.getTotalSpent()
                    : BigDecimal.ZERO;
            BigDecimal updatedSpent = currentSpent.add(netRevenue);
            lockedCustomer.setTotalSpent(updatedSpent);
            lockedCustomer.setMembershipTier(MembershipTier.fromTotalSpent(updatedSpent));
            userRepository.saveAndFlush(lockedCustomer);
        }

        if (savedOrder.getBooking() != null) {
            BookingEntity booking = savedOrder.getBooking();
            BookingStatus oldBookingStatus = booking.getStatus();
            booking.setStatus(BookingStatus.COMPLETED);
            bookingRepository.save(booking);
            if (realtimeNotificationService != null && oldBookingStatus != BookingStatus.COMPLETED) {
                realtimeNotificationService.notifyBookingStatusChanged(booking, oldBookingStatus, BookingStatus.COMPLETED);
            }
        }

        realtimeNotificationService.notifyOrderCheckedOut(savedOrder);
    }
}
