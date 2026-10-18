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
public class StockAlertItemResponse {
    private Long branchId;
    private String branchName;
    private Long productId;
    private String productName;
    private String sku;
    private String unit;
    private String volumeUnit;
    private BigDecimal volumeOrWeightPerUnit;
    private int stockUnits;
    private BigDecimal currentVolume;
    private int minStockAlertUnits;
    private BigDecimal totalAvailableVolume;
    private BigDecimal avgDailyConsumptionVolume;
    private Integer estimatedDaysRemaining;
    private StockAlertLevel alertLevel;
    private BigDecimal unitCost;
}
