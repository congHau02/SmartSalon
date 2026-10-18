package com.smartsalon.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BomWastageItemResponse {
    private Long productId;
    private String productName;
    private String sku;
    private String volumeUnit;
    private BigDecimal unitCostSnapshot;
    private BigDecimal standardBomVolume;
    private BigDecimal serviceConsumptionVolume;
    private BigDecimal adjustmentLossVolume;
    private BigDecimal actualTotalVolume;
    private BigDecimal varianceVolume;
    private BigDecimal wastageVolume;
    private BigDecimal wastagePercentage;
    private BigDecimal wastageCostAmount;
}
