package com.smartsalon.customer.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record CustomerRescheduleRequest(
        @NotNull(message = "Thời gian dời lịch không được để trống")
        LocalDateTime newBookingTime,
        Long stylistId
) {}
