package com.smartsalon.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record GuestRescheduleRequest(
        @NotBlank(message = "Số điện thoại không được để trống")
        String phone,

        @NotBlank(message = "Mã đặt hẹn không được để trống")
        String bookingCode,

        @NotNull(message = "Thời gian hẹn mới không được để trống")
        LocalDateTime newBookingTime,

        Long stylistId
) {}
