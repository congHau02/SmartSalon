package com.smartsalon.booking.entity;

import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.user.entity.UserEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BookingRescheduleDomainTest {

    private final LocalDateTime now = LocalDateTime.of(2026, 10, 20, 10, 0);

    @Test
    @DisplayName("Reschedule throws BOOKING_NOT_CONFIRMED when status is not CONFIRMED")
    void shouldThrowWhenStatusIsNotConfirmed() {
        BookingEntity booking = BookingEntity.builder()
                .status(BookingStatus.PENDING_PAYMENT)
                .bookingTime(now.plusHours(5))
                .endTime(now.plusHours(6))
                .rescheduleCount(0)
                .build();

        LocalDateTime newTime = now.plusDays(1);
        LocalDateTime newEndTime = newTime.plusHours(1);

        assertThatThrownBy(() -> booking.reschedule(newTime, newEndTime, null, now))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.BOOKING_NOT_CONFIRMED);
    }

    @Test
    @DisplayName("Reschedule throws RESCHEDULE_WINDOW_EXPIRED when booking time is less than 2h ahead")
    void shouldThrowWhenLessThanTwoHoursBeforeBooking() {
        BookingEntity booking = BookingEntity.builder()
                .status(BookingStatus.CONFIRMED)
                .bookingTime(now.plusMinutes(90)) // only 1h30m ahead (< 2h)
                .endTime(now.plusMinutes(150))
                .rescheduleCount(0)
                .build();

        LocalDateTime newTime = now.plusDays(1);
        LocalDateTime newEndTime = newTime.plusHours(1);

        assertThatThrownBy(() -> booking.reschedule(newTime, newEndTime, null, now))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.RESCHEDULE_WINDOW_EXPIRED);
    }

    @Test
    @DisplayName("Reschedule throws BOOKING_ALREADY_RESCHEDULED when booking was already rescheduled once")
    void shouldThrowWhenAlreadyRescheduled() {
        BookingEntity booking = BookingEntity.builder()
                .status(BookingStatus.CONFIRMED)
                .bookingTime(now.plusHours(5))
                .endTime(now.plusHours(6))
                .rescheduleCount(1) // already rescheduled
                .build();

        LocalDateTime newTime = now.plusDays(1);
        LocalDateTime newEndTime = newTime.plusHours(1);

        assertThatThrownBy(() -> booking.reschedule(newTime, newEndTime, null, now))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.BOOKING_ALREADY_RESCHEDULED);
    }

    @Test
    @DisplayName("Reschedule happy path: updates time, staff, increments count, clears reminderSentAt, and updates isStylistRequested")
    void shouldRescheduleSuccessfully() {
        UserEntity oldStylist = UserEntity.builder().fullName("Stylist A").build();
        oldStylist.setId(10L);
        UserEntity newStylist = UserEntity.builder().fullName("Stylist B").build();
        newStylist.setId(11L);

        BookingEntity booking = BookingEntity.builder()
                .status(BookingStatus.CONFIRMED)
                .bookingTime(now.plusHours(5))
                .endTime(now.plusHours(6))
                .staff(oldStylist)
                .isStylistRequested(false)
                .rescheduleCount(0)
                .reminderSentAt(now.minusHours(1))
                .build();

        LocalDateTime newTime = now.plusDays(2).withHour(14).withMinute(0);
        LocalDateTime newEndTime = newTime.plusHours(1);

        booking.reschedule(newTime, newEndTime, newStylist, true, now);

        assertThat(booking.getBookingTime()).isEqualTo(newTime);
        assertThat(booking.getEndTime()).isEqualTo(newEndTime);
        assertThat(booking.getStaff()).isEqualTo(newStylist);
        assertThat(booking.isStylistRequested()).isTrue();
        assertThat(booking.getRescheduleCount()).isEqualTo(1);
        assertThat(booking.getReminderSentAt()).isNull();
    }

    @Test
    @DisplayName("canRescheduleOnline correctly evaluates eligibility")
    void shouldEvaluateCanRescheduleOnline() {
        BookingEntity eligible = BookingEntity.builder()
                .status(BookingStatus.CONFIRMED)
                .bookingTime(now.plusHours(3))
                .rescheduleCount(0)
                .build();
        assertThat(eligible.canRescheduleOnline(now)).isTrue();

        BookingEntity late = BookingEntity.builder()
                .status(BookingStatus.CONFIRMED)
                .bookingTime(now.plusHours(1))
                .rescheduleCount(0)
                .build();
        assertThat(late.canRescheduleOnline(now)).isFalse();

        BookingEntity alreadyRescheduled = BookingEntity.builder()
                .status(BookingStatus.CONFIRMED)
                .bookingTime(now.plusHours(3))
                .rescheduleCount(1)
                .build();
        assertThat(alreadyRescheduled.canRescheduleOnline(now)).isFalse();

        BookingEntity pending = BookingEntity.builder()
                .status(BookingStatus.PENDING_PAYMENT)
                .bookingTime(now.plusHours(3))
                .rescheduleCount(0)
                .build();
        assertThat(pending.canRescheduleOnline(now)).isFalse();
    }
}
