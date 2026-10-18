package com.smartsalon.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryAlertsAnalyticsResponse {
    private Long branchId;
    private String branchName;
    private LocalDate startDate;
    private LocalDate endDate;
    private int totalProducts;
    private int outOfStockCount;
    private int lowStockCount;
    private int nearThresholdCount;
    private int healthyCount;
    private BigDecimal totalWastageCostAmount;
    private List<StockAlertItemResponse> alerts;
    private List<BomWastageItemResponse> bomWastages;
}
