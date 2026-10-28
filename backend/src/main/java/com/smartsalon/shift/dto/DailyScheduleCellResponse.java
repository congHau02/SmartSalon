package com.smartsalon.shift.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyScheduleCellResponse {
    private Long scheduleId;
    private LocalDate date;
    private String status; // WORKING, OFF
    private Long shiftTemplateId;
    private String shiftTemplateCode;
    private String shiftTemplateName;
    private LocalTime startTime;
    private LocalTime endTime;
    private int maxOvertimeMinutes;
    private String notes;
    private StaffAttendanceSummaryDto attendance;
}
