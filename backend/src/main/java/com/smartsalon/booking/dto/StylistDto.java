package com.smartsalon.booking.dto;

import java.math.BigDecimal;

public record StylistDto(
        Long id,
        Long branchId,
        String branchName,
        String fullName,
        String phone,
        String avatarUrl,
        BigDecimal averageRating,
        long reviewCount
) {
    public StylistDto(Long id, Long branchId, String branchName, String fullName, String phone, String avatarUrl) {
        this(id, branchId, branchName, fullName, phone, avatarUrl, BigDecimal.ZERO.setScale(1), 0L);
    }
}
