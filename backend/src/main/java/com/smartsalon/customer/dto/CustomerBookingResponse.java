package com.smartsalon.customer.dto;

import com.smartsalon.booking.dto.BookingServiceItemDto;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

public record CustomerBookingResponse(
        Long id,
        String bookingCode,
        Long branchId,
        String branchName,
        Long customerId,
        String customerName,
        String customerPhone,
        Long stylistId,
        String stylistName,
        boolean isStylistRequested,
        LocalDateTime bookingTime,
        LocalDateTime endTime,
        int totalDurationMinutes,
        BigDecimal totalPrice,
        BigDecimal depositAmount,
        DepositStatus depositStatus,
        BookingStatus status,
        String notes,
        boolean canCancelOnline,
        String cancelPolicyNotice,
        List<BookingServiceItemDto> items,
        Instant createdAt
) {}
