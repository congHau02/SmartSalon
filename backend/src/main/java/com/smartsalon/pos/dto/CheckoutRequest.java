package com.smartsalon.pos.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutRequest {

    @NotBlank(message = "Phương thức thanh toán không được để trống")
    private String paymentMethod; // CASH, VIETQR, CARD

    private BigDecimal discountAmount;

    private String notes;
}
