package com.smartsalon.analytics.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBaseSalaryRequest {

    @NotNull(message = "Base salary is required")
    @DecimalMin(value = "0.00", inclusive = true, message = "Base salary must be non-negative")
    private BigDecimal baseSalary;
}
