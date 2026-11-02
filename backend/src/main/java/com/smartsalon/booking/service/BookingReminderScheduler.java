package com.smartsalon.booking.service;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.event.BookingReminderDueEvent;
import com.smartsalon.booking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingReminderScheduler {

    private final BookingRepository bookingRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Scheduled(fixedDelay = 300000)
    @Transactional(rollbackFor = Exception.class)
    public void sweepDueReminders() {
        sweepDueReminders(LocalDateTime.now());
    }

    @Transactional(rollbackFor = Exception.class)
    public void sweepDueReminders(LocalDateTime referenceNow) {
        LocalDateTime now = referenceNow != null ? referenceNow : LocalDateTime.now();
        LocalDateTime startWindow = now.plusHours(23);
        LocalDateTime endWindow = now.plusHours(24);

        List<BookingEntity> dueBookings = bookingRepository.findBookingsDueForReminder(startWindow, endWindow);
        if (dueBookings.isEmpty()) {
            return;
        }

        log.info("Found {} booking(s) due for 24h reminder window [{} - {}]",
                dueBookings.size(), startWindow, endWindow);

        for (BookingEntity booking : dueBookings) {
            booking.setReminderSentAt(now);
            bookingRepository.save(booking);
            eventPublisher.publishEvent(new BookingReminderDueEvent(booking.getId()));
            log.info("Stamped reminderSentAt and published BookingReminderDueEvent for booking: id={}, code={}",
                    booking.getId(), booking.getBookingCode());
        }
    }
}
