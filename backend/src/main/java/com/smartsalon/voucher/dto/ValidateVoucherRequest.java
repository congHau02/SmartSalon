package com.smartsalon.voucher.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ValidateVoucherRequest(
        @NotBlank(message = "Mã voucher không được để trống")
        String code,

        @NotNull(message = "Chi nhánh không được để trống")
        Long branchId,

        @NotNull(message = "Giá trị đơn hàng không được để trống")
        BigDecimal subtotal,

        String phone
) {}
