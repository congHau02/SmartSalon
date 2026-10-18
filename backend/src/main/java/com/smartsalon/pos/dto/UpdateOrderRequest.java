package com.smartsalon.pos.dto;

import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrderRequest {

    @DecimalMin(value = "0.00", message = "Số tiền giảm giá không được âm")
    private BigDecimal discountAmount;

    private String notes;
}
