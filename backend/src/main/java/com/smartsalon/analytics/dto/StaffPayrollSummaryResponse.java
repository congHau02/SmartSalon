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
public class StaffPayrollSummaryResponse {
    private Long branchId;
    private String branchName;
    private LocalDate startDate;
    private LocalDate endDate;

    private int totalStaffCount;
    private int totalCompletedOrders;
    private int totalCompletedSteps;
    private BigDecimal totalBaseSalary;
    private BigDecimal totalCommission;
    private BigDecimal totalPayrollPayout;

    private BigDecimal averageRequestedStylistRate;
    private BigDecimal averageRebookingRate;

    @Builder.Default
    private List<StaffPerformanceResponse> staffMembers = new ArrayList<>();
}
