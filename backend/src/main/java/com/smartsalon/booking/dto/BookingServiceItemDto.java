package com.smartsalon.booking.dto;

import java.math.BigDecimal;

public record BookingServiceItemDto(
        Long id,
        Long serviceId,
        String serviceName,
        BigDecimal price,
        int durationMinutes
) {}
