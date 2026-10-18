package com.smartsalon.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderPnlResponse {
    private Long orderId;
    private String orderCode;
    private Instant createdAt;
    private String customerName;
    private String customerPhone;
    private String paymentMethod;
    private BigDecimal grossServiceRevenue;
    private BigDecimal grossRetailRevenue;
    private BigDecimal serviceDiscount;
    private BigDecimal retailDiscount;
    private BigDecimal totalDiscount;
    private BigDecimal netServiceRevenue;
    private BigDecimal netRetailRevenue;
    private BigDecimal totalNetRevenue;
    private BigDecimal chemicalCogs;
    private BigDecimal retailCogs;
    private BigDecimal totalCogs;
    private BigDecimal staffCommissions;
    private BigDecimal serviceNetProfit;
    private BigDecimal retailNetProfit;
    private BigDecimal orderNetProfit;
    private BigDecimal netProfitMarginPercentage;
}
