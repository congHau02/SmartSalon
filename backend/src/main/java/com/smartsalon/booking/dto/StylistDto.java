package com.smartsalon.booking.dto;

public record StylistDto(
        Long id,
        Long branchId,
        String branchName,
        String fullName,
        String phone,
        String avatarUrl
) {}
