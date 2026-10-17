package com.smartsalon.booking.dto;

import com.smartsalon.booking.entity.BookingStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateBookingStatusRequest(
        @NotNull(message = "Trạng thái đặt lịch không được để trống")
        BookingStatus status,
        String notes
) {}
