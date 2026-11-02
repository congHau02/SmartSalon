package com.smartsalon.notification.listener;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.event.BookingConfirmedEvent;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.notification.dto.NotificationMessage;
import com.smartsalon.notification.service.NotificationSender;
import com.smartsalon.notification.service.impl.BookingConfirmationEmailTemplateBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingConfirmationEmailListener {

    private final BookingRepository bookingRepository;
    private final NotificationSender notificationSender;
    private final BookingConfirmationEmailTemplateBuilder templateBuilder;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public void onBookingConfirmed(BookingConfirmedEvent event) {
        if (event == null || event.bookingId() == null) {
            return;
        }

        try {
            BookingEntity booking = bookingRepository.findByIdWithDetails(event.bookingId()).orElse(null);
            if (booking == null) {
                log.warn("Booking with ID {} not found for confirmation email dispatch", event.bookingId());
                return;
            }

            String recipient = booking.resolvedCustomerEmail();
            if (recipient == null || recipient.isBlank()) {
                log.info("Booking {} has no recipient email; skipping email confirmation", booking.getBookingCode());
                return;
            }

            NotificationMessage message = templateBuilder.buildConfirmationMessage(booking, recipient);
            notificationSender.send(message);
            log.info("Dispatched booking confirmation email to {} for booking {}", recipient, booking.getBookingCode());
        } catch (Exception ex) {
            log.error("Error processing booking confirmation email for bookingId {}: {}", event.bookingId(), ex.getMessage(), ex);
            // Non-blocking: side effects must never propagate errors to the core transaction
        }
    }
}
