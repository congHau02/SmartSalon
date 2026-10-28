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
public class CommissionLedgerDetailResponse {
    private Long id;
    private Long orderId;
    private String orderCode;
    private String serviceName;
    private String stepName;
    /** Commission rate (percent) snapshotted on the step assignment. */
    private BigDecimal commissionRate;
    private BigDecimal amount;
    private String status;
    private String calculationNotes;
    private Boolean isOvertime;
    private Instant createdAt;
}
