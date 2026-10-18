package com.smartsalon.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyPnlResponse {
    private LocalDate date;
    private BigDecimal netServiceRevenue;
    private BigDecimal netRetailRevenue;
    private BigDecimal totalNetRevenue;
    private BigDecimal chemicalCogs;
    private BigDecimal retailCogs;
    private BigDecimal totalCommissions;
    private BigDecimal operationalNetProfit;
    private int orderCount;
}
