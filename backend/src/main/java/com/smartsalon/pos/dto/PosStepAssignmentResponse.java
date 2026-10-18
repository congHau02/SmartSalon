package com.smartsalon.pos.dto;

import com.smartsalon.pos.entity.StepAssignmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PosStepAssignmentResponse {
    private Long id;
    private String stepName;
    private Long staffId;
    private String staffName;
    private BigDecimal commissionRate;
    private BigDecimal commissionAmount;
    private StepAssignmentStatus status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}
