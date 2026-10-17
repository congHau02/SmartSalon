package com.smartsalon.booking.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record AvailableSlotsResponse(
        Long branchId,
        String branchName,
        Long stylistId,
        String stylistName,
        LocalDate date,
        int totalDurationMinutes,
        BigDecimal totalPrice,
        BigDecimal depositAmount,
        List<SlotDto> slots
) {}
