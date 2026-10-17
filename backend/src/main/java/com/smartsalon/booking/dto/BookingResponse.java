package com.smartsalon.booking.dto;

import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

public record BookingResponse(
        Long id,
        String bookingCode,
        Long branchId,
        String branchName,
        Long customerId,
        String customerName,
        String customerPhone,
        Long stylistId,
        String stylistName,
        LocalDateTime bookingTime,
        LocalDateTime endTime,
        int totalDurationMinutes,
        BigDecimal totalPrice,
        BigDecimal depositAmount,
        DepositStatus depositStatus,
        BookingStatus status,
        LocalDateTime slotLockExpiresAt,
        String notes,
        List<BookingServiceItemDto> items,
        Instant createdAt
) {}
