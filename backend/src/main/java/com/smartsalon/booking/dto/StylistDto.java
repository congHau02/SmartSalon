package com.smartsalon.booking.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalTime;

public record StylistDto(
        Long id,
        Long branchId,
        String branchName,
        String fullName,
        String phone,
        String avatarUrl,
        BigDecimal averageRating,
        long reviewCount,
        String shiftCode,
        String shiftName,
        @JsonFormat(pattern = "HH:mm")
        LocalTime shiftStartTime,
        @JsonFormat(pattern = "HH:mm")
        LocalTime shiftEndTime,
        Integer maxOvertimeMinutes,
        Boolean isWorking
) {
    public StylistDto(Long id, Long branchId, String branchName, String fullName, String phone, String avatarUrl) {
        this(id, branchId, branchName, fullName, phone, avatarUrl, BigDecimal.ZERO.setScale(1), 0L, null, null, null, null, 0, true);
    }

    public StylistDto(Long id, Long branchId, String branchName, String fullName, String phone, String avatarUrl, BigDecimal averageRating, long reviewCount) {
        this(id, branchId, branchName, fullName, phone, avatarUrl, averageRating, reviewCount, null, null, null, null, 0, true);
    }
}
