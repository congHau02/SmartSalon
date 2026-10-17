package com.smartsalon.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentQrInfo(
        String bookingCode,
        BigDecimal amount,
        String bankId,
        String accountNo,
        String accountName,
        String qrCodeUrl,
        String paymentUrl,
        String description,
        LocalDateTime slotLockExpiresAt
) {}
