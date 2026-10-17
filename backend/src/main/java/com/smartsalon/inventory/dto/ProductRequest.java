package com.smartsalon.inventory.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class ProductRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;

    @NotBlank(message = "Mã SKU không được để trống")
    private String sku;

    private String barcode;

    @NotBlank(message = "Đơn vị đóng gói không được để trống (ví dụ: chai, hộp, tuýp)")
    private String unit;

    @NotNull(message = "Định lượng chuẩn trên mỗi đơn vị không được để trống")
    @DecimalMin(value = "0.01", message = "Định lượng chuẩn phải lớn hơn 0")
    private BigDecimal volumeOrWeightPerUnit;

    @NotBlank(message = "Đơn vị dung tích/khối lượng không được để trống (ví dụ: ml, gram)")
    @Builder.Default
    private String volumeUnit = "ml";

    @Min(value = 0, message = "Ngưỡng cảnh báo tồn kho tối thiểu không thể âm")
    @Builder.Default
    private Integer minStockAlertUnits = 5;

    @NotNull(message = "Giá vốn không được để trống")
    @DecimalMin(value = "0.00", message = "Giá vốn không thể âm")
    @Builder.Default
    private BigDecimal costPrice = BigDecimal.ZERO;

    @NotNull(message = "Giá bán lẻ không được để trống")
    @DecimalMin(value = "0.00", message = "Giá bán lẻ không thể âm")
    @Builder.Default
    private BigDecimal retailPrice = BigDecimal.ZERO;

    @JsonProperty("isActive")
    @Builder.Default
    private Boolean isActive = true;

    public boolean isActive() {
        return isActive == null || isActive;
    }
}
