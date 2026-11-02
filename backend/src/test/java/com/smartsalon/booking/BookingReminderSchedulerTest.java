package com.smartsalon.booking;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.event.BookingReminderDueEvent;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.booking.service.BookingReminderScheduler;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingReminderSchedulerTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private BookingReminderScheduler scheduler;

    @Test
    @DisplayName("Scheduler picks due bookings, stamps reminder_sent_at, saves booking and publishes BookingReminderDueEvent")
    void sweepDueReminders_picksAndPublishes() {
        LocalDateTime now = LocalDateTime.of(2026, 11, 2, 10, 0);
        BookingEntity booking = BookingEntity.builder()
                .bookingCode("BK-REMIND-001")
                .bookingTime(now.plusHours(23).plusMinutes(30))
                .status(BookingStatus.CONFIRMED)
                .build();
        booking.setId(99L);

        when(bookingRepository.findBookingsDueForReminder(now.plusHours(23), now.plusHours(24)))
                .thenReturn(List.of(booking));

        scheduler.sweepDueReminders(now);

        assertThat(booking.getReminderSentAt()).isEqualTo(now);
        verify(bookingRepository, times(1)).save(booking);

        ArgumentCaptor<BookingReminderDueEvent> eventCaptor = ArgumentCaptor.forClass(BookingReminderDueEvent.class);
        verify(eventPublisher, times(1)).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getValue().bookingId()).isEqualTo(99L);
    }

    @Test
    @DisplayName("Scheduler does nothing when no bookings are due")
    void sweepDueReminders_empty_doesNothing() {
        LocalDateTime now = LocalDateTime.of(2026, 11, 2, 10, 0);
        when(bookingRepository.findBookingsDueForReminder(any(), any())).thenReturn(List.of());

        scheduler.sweepDueReminders(now);

        verify(bookingRepository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }
}
