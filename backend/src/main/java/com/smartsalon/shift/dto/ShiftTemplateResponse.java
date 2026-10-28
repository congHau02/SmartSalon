package com.smartsalon.shift.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftTemplateResponse {
    private Long id;
    private Long branchId;
    private String code;
    private String name;
    private LocalTime startTime;
    private LocalTime endTime;
    private int maxOvertimeMinutes;
    private boolean isActive;
}
