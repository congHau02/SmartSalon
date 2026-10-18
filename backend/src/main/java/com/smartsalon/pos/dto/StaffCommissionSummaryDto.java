package com.smartsalon.pos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffCommissionSummaryDto {
    private Long staffId;
    private String staffName;
    private BigDecimal totalAmount;
    private int stepCount;
}
