package com.smartsalon.pos.dto;

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
public class CommissionLedgerSummaryResponse {
    private Long branchId;
    private String branchName;
    private LocalDate date;
    private BigDecimal totalCommissionAmount;
    @Builder.Default
    private List<StaffCommissionSummaryDto> staffSummaries = new ArrayList<>();
    @Builder.Default
    private List<CommissionLedgerEntryDto> entries = new ArrayList<>();
}
