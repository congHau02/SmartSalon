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
public class PnlAnalyticsResponse {
    private Long branchId;
    private String branchName;
    private LocalDate startDate;
    private LocalDate endDate;
    private int totalOrders;
    private BigDecimal grossServiceRevenue;
    private BigDecimal grossRetailRevenue;
    private BigDecimal totalDiscounts;
    private BigDecimal netServiceRevenue;
    private BigDecimal netRetailRevenue;
    private BigDecimal totalNetRevenue;
    private BigDecimal chemicalCogs;
    private BigDecimal retailCogs;
    private BigDecimal totalCogs;
    private BigDecimal totalCommissions;
    private BigDecimal totalCosts;
    private BigDecimal operationalNetProfit;
    private BigDecimal grossMarginPercentage;
    private BigDecimal netProfitMarginPercentage;
    private BigDecimal fixedBaseSalaryCost;
    private BigDecimal netProfitAfterPayroll;
    private BigDecimal netProfitAfterPayrollMarginPercentage;
    private List<DailyPnlResponse> dailySeries;
    private List<OrderPnlResponse> orders;
}
