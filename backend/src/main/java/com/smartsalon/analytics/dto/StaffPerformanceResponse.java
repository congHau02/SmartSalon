package com.smartsalon.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffPerformanceResponse {
    private Long staffId;
    private String fullName;
    private String username;
    private String phone;
    private String email;
    private String avatarUrl;
    @Builder.Default
    private List<String> roles = new ArrayList<>();
    private Long branchId;
    private String branchName;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal baseSalary;
    private int completedOrderCount;
    private int completedStepCount;
    private BigDecimal totalCommission;
    private BigDecimal totalPayout;

    // Customer Loyalty & Retention KPIs
    private int completedBookingCount;
    private int requestedBookingCount;
    private BigDecimal requestedStylistRate;
    private int totalIdentifiedCustomers;
    private int repeatCustomerCount;
    private BigDecimal rebookingRate;

    // Service Reviews & Customer Satisfaction
    @Builder.Default
    private BigDecimal averageRating = BigDecimal.ZERO.setScale(1);
    private long reviewCount;

    @Builder.Default
    private List<CommissionLedgerDetailResponse> commissionLedgers = new ArrayList<>();
}
