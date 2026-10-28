package com.smartsalon.pos.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.smartsalon.shift.entity.StaffAttendanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PosStaffAttendanceDto {
    private Long userId;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private String roleName;

    // Shift info for today
    private Long shiftTemplateId;
    private String shiftCode;
    private String shiftName;
    @JsonFormat(pattern = "HH:mm")
    private LocalTime shiftStartTime;
    @JsonFormat(pattern = "HH:mm")
    private LocalTime shiftEndTime;
    private Integer maxOvertimeMinutes;
    private Boolean isWorking;

    // Attendance info
    private Long attendanceId;
    private StaffAttendanceStatus attendanceStatus;
    private LocalDateTime clockInAt;
    private LocalDateTime breakStartAt;
    private LocalDateTime breakEndAt;
    private LocalDateTime clockOutAt;
    private int overtimeMinutes;
    private String notes;
}
