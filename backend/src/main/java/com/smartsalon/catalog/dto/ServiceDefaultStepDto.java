package com.smartsalon.catalog.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
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
public class ServiceDefaultStepDto {
    private Long id;

    @NotBlank(message = "Tên bước kỹ thuật không được để trống")
    private String stepName;

    @Builder.Default
    private Integer stepOrder = 1;

    @NotNull(message = "Tỷ lệ hoa hồng không được để trống")
    @DecimalMin(value = "0.00", message = "Tỷ lệ hoa hồng không thể nhỏ hơn 0%")
    @DecimalMax(value = "100.00", message = "Tỷ lệ hoa hồng không thể lớn hơn 100%")
    @Builder.Default
    private BigDecimal commissionRate = BigDecimal.ZERO;
}
