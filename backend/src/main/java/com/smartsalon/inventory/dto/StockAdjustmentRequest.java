package com.smartsalon.inventory.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
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
public class StockAdjustmentRequest {

    @NotNull(message = "ID sản phẩm không được để trống")
    private Long productId;

    @Min(value = 0, message = "Số lượng đóng gói nguyên seal thực tế không thể âm")
    private Integer actualStockUnits;

    @DecimalMin(value = "0.00", message = "Dung tích/khối lượng dở dang thực tế không thể âm")
    private BigDecimal actualVolume;

    @NotBlank(message = "Lý do kiểm kê / điều chỉnh không được để trống")
    private String reason;
}
