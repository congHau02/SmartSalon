package com.smartsalon.catalog.dto;

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
public class ServiceBomDto {
    private Long id;

    @NotNull(message = "ID sản phẩm vật tư không được để trống")
    private Long productId;

    private String productName;
    private String productSku;

    @NotNull(message = "Định mức tiêu hao không được để trống")
    @DecimalMin(value = "0.01", message = "Định mức tiêu hao phải lớn hơn 0")
    private BigDecimal standardAmount;

    @NotBlank(message = "Đơn vị tính không được để trống")
    @Builder.Default
    private String unit = "ml";
}
