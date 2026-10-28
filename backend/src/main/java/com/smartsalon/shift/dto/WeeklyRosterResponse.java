package com.smartsalon.shift.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyRosterResponse {
    private Long branchId;
    private String branchName;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<ShiftTemplateResponse> templates;
    private List<StaffRosterRowResponse> staff;
}
