package com.smartsalon.shift.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffAttendanceSummaryDto {
    private Long id;
    private String status; // PRESENT, ON_BREAK, COMPLETED, ABSENT
    private LocalDateTime clockInAt;
    private LocalDateTime breakStartAt;
    private LocalDateTime breakEndAt;
    private LocalDateTime clockOutAt;
    private int overtimeMinutes;
}
