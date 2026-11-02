package com.smartsalon.voucher.dto;

import com.smartsalon.voucher.entity.VoucherType;

import java.math.BigDecimal;

public record VoucherValidationResponse(
        String code,
        VoucherType type,
        BigDecimal value,
        BigDecimal maxDiscount,
        BigDecimal minOrderAmount,
        BigDecimal discountAmount,
        boolean valid
) {}
