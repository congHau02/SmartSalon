package com.smartsalon.booking.service.impl;

import com.smartsalon.booking.dto.CreateBookingRequest;
import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingServiceItemEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.payment.entity.PaymentTransactionEntity;
import com.smartsalon.payment.repository.PaymentTransactionRepository;
import com.smartsalon.realtime.service.RealtimeNotificationService;
import com.smartsalon.security.BranchScopeGuard;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.UserRepository;
import com.smartsalon.user.service.CustomerIdentityService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class BookingCreditSettlementHelper {

    private final CustomerIdentityService customerIdentityService;
    private final UserRepository userRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final RealtimeNotificationService realtimeNotificationService;
    private final BranchScopeGuard branchScopeGuard;
    private final EntityManager entityManager;

    public record CreditResolution(
            UserEntity customer,
            boolean coveredByCredit,
            BigDecimal appliedCredit
    ) {}

    public CreditResolution resolveCustomerAndApplyCredit(
            CreateBookingRequest request,
            BranchEntity branch,
            BigDecimal depositAmount) {

        String phone = request.customerPhone().trim();
        UserEntity customer = customerIdentityService.resolveForBooking(phone, request.customerName(), branch);

        if (customer == null || "walkin.guest".equalsIgnoreCase(customer.getUsername())
                || depositAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return new CreditResolution(customer, false, BigDecimal.ZERO);
        }

        UserEntity lockedCustomer = userRepository.findByIdForUpdate(customer.getId()).orElse(customer);
        if (entityManager != null) {
            entityManager.refresh(lockedCustomer);
        }
        BigDecimal customerCredit = lockedCustomer.getCreditBalance() != null
                ? lockedCustomer.getCreditBalance()
                : BigDecimal.ZERO;

        if (customerCredit.compareTo(depositAmount) >= 0) {
            lockedCustomer.setCreditBalance(customerCredit.subtract(depositAmount));
            userRepository.saveAndFlush(lockedCustomer);
            return new CreditResolution(lockedCustomer, true, depositAmount);
        }
        return new CreditResolution(lockedCustomer, false, BigDecimal.ZERO);
    }

    public void recordInitialTransactionAndNotify(
            BookingEntity booking,
            CreditResolution creditResolution,
            BigDecimal depositAmount) {

        String method = creditResolution.coveredByCredit()
                ? PaymentTransactionEntity.METHOD_CREDIT_BALANCE
                : PaymentTransactionEntity.METHOD_PAYOS_VIETQR;
        BigDecimal amount = creditResolution.coveredByCredit()
                ? creditResolution.appliedCredit()
                : depositAmount;
        String status = creditResolution.coveredByCredit()
                ? PaymentTransactionEntity.STATUS_SUCCESS
                : PaymentTransactionEntity.STATUS_PENDING;

        PaymentTransactionEntity transaction = PaymentTransactionEntity.builder()
                .booking(booking)
                .paymentMethod(method)
                .transactionCode("TX-" + booking.getBookingCode() + "-" + System.currentTimeMillis())
                .amount(amount)
                .status(status)
                .build();
        paymentTransactionRepository.save(transaction);

        if (realtimeNotificationService != null) {
            realtimeNotificationService.notifyBookingCreated(booking);
        }
    }

    public void refundDepositToCreditIfPaid(BookingEntity booking) {
        if (booking.getDepositStatus() != DepositStatus.PAID
                || booking.getDepositAmount() == null
                || booking.getDepositAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        UserEntity customer = booking.getCustomer();
        if (customer == null || "walkin.guest".equalsIgnoreCase(customer.getUsername())) {
            return;
        }
        UserEntity lockedCustomer = userRepository.findByIdForUpdate(customer.getId()).orElse(customer);
        if (entityManager != null) {
            entityManager.refresh(lockedCustomer);
        }
        BigDecimal currentCredit = lockedCustomer.getCreditBalance() != null
                ? lockedCustomer.getCreditBalance()
                : BigDecimal.ZERO;
        lockedCustomer.setCreditBalance(currentCredit.add(booking.getDepositAmount()));
        userRepository.saveAndFlush(lockedCustomer);
        booking.setDepositStatus(DepositStatus.CREDITED);
    }

    public void checkBranchAccess(BookingEntity booking) {
        if (branchScopeGuard != null) {
            branchScopeGuard.checkBranchAccess(booking.getBranch() != null ? booking.getBranch().getId() : null);
        }
    }

    public void notifyStatusChanged(BookingEntity booking, BookingStatus oldStatus, BookingStatus newStatus) {
        if (realtimeNotificationService != null) {
            realtimeNotificationService.notifyBookingStatusChanged(booking, oldStatus, newStatus);
        }
    }

    public BookingEntity buildDraftBooking(
            CreateBookingRequest request,
            BranchEntity branch,
            CreditResolution creditResolution,
            UserEntity assignedStylist,
            String bookingCode,
            LocalDateTime startTime,
            LocalDateTime endTime,
            LocalDateTime now,
            int totalDurationMinutes,
            BigDecimal totalPrice,
            BigDecimal depositAmount,
            List<ServiceEntity> services) {

        boolean covered = creditResolution.coveredByCredit();
        BookingEntity booking = BookingEntity.builder()
                .branch(branch)
                .customer(creditResolution.customer())
                .staff(assignedStylist)
                .bookingCode(bookingCode)
                .bookingTime(startTime)
                .endTime(endTime)
                .totalDurationMinutes(totalDurationMinutes)
                .totalPrice(totalPrice)
                .depositAmount(depositAmount)
                .depositStatus(covered ? DepositStatus.PAID : DepositStatus.UNPAID)
                .isStylistRequested(request.stylistId() != null)
                .status(covered ? BookingStatus.CONFIRMED : BookingStatus.PENDING_PAYMENT)
                .slotLockExpiresAt(covered ? null : now.plusMinutes(BookingEntity.HOLD_TTL_MINUTES))
                .customerName(request.customerName().trim())
                .customerPhone(request.customerPhone().trim())
                .notes(request.notes())
                .items(new ArrayList<>())
                .build();

        for (ServiceEntity service : services) {
            booking.addItem(BookingServiceItemEntity.builder()
                    .booking(booking)
                    .service(service)
                    .price(service.getBasePrice())
                    .durationMinutes(service.getDurationMinutes())
                    .build());
        }
        return booking;
    }
}
