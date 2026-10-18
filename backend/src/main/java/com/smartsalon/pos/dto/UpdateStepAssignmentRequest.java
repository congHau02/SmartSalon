package com.smartsalon.pos.dto;

import jakarta.validation.constraints.DecimalMax;
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
public class UpdateStepAssignmentRequest {

    private Long staffId;

    @DecimalMin(value = "0.00", message = "Tỷ lệ hoa hồng không được âm")
    @DecimalMax(value = "100.00", message = "Tỷ lệ hoa hồng không được vượt quá 100%")
    private BigDecimal commissionRate;
}
