package com.smartsalon.pos.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
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
public class ActualBomItemDto {

    @NotNull(message = "ID sản phẩm vật tư không được để trống")
    private Long productId;

    private String productName;

    @JsonProperty("sku")
    @JsonAlias({"sku", "productSku"})
    private String productSku;

    private BigDecimal standardAmount;

    @NotNull(message = "Lượng thực tế tiêu hao không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Lượng thực tế phải lớn hơn hoặc bằng 0")
    private BigDecimal actualAmount;

    @NotBlank(message = "Đơn vị tính không được để trống")
    @Builder.Default
    private String unit = "ml";
}
