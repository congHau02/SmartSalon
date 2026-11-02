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
        String customerEmail,
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
        LocalDateTime slotLockExpiresAt,
        String notes,
        boolean canRescheduleOnline,
        String reschedulePolicyNotice,
        int rescheduleCount,
        List<BookingServiceItemDto> items,
        Instant createdAt
) {
    public BookingResponse(
            Long id,
            String bookingCode,
            Long branchId,
            String branchName,
            Long customerId,
            String customerName,
            String customerPhone,
            String customerEmail,
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
            LocalDateTime slotLockExpiresAt,
            String notes,
            List<BookingServiceItemDto> items,
            Instant createdAt
    ) {
        this(id, bookingCode, branchId, branchName, customerId, customerName, customerPhone, customerEmail,
                stylistId, stylistName, isStylistRequested, bookingTime, endTime,
                totalDurationMinutes, totalPrice, depositAmount, depositStatus, status,
                slotLockExpiresAt, notes, false, null, 0, items, createdAt);
    }

    public BookingResponse(
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
            LocalDateTime slotLockExpiresAt,
            String notes,
            List<BookingServiceItemDto> items,
            Instant createdAt
    ) {
        this(id, bookingCode, branchId, branchName, customerId, customerName, customerPhone, null,
                stylistId, stylistName, isStylistRequested, bookingTime, endTime,
                totalDurationMinutes, totalPrice, depositAmount, depositStatus, status,
                slotLockExpiresAt, notes, items, createdAt);
    }
}
