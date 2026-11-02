package com.smartsalon.booking.service;

import com.smartsalon.booking.entity.BookingEntity;

import java.time.LocalDateTime;

public interface BookingRescheduleService {

    /**
     * Reschedule an existing confirmed booking to a new time and optional stylist.
     * Enforces >=2h notice, max 1 reschedule, slot operating hours, shift/overtime eligibility,
     * and lock-new-then-release-old Redis semantics.
     *
     * @param booking the existing booking
     * @param newBookingTime requested new start time
     * @param requestedStylistId optional stylist ID (null for auto-assign)
     * @param now current reference time
     * @return the updated BookingEntity
     */
    BookingEntity rescheduleBooking(
            BookingEntity booking,
            LocalDateTime newBookingTime,
            Long requestedStylistId,
            LocalDateTime now
    );
}
