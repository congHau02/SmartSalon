package com.smartsalon.booking.dto;

public record SlotDto(
        String time,
        String endTime,
        SlotStatus status,
        int availableStylistCount
) {}
