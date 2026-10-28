package com.smartsalon.pos.service.impl;

import com.smartsalon.pos.dto.PosStaffAttendanceDto;
import com.smartsalon.shift.entity.StaffAttendanceEntity;
import com.smartsalon.shift.entity.StaffAttendanceStatus;
import com.smartsalon.shift.entity.StaffScheduleEntity;
import com.smartsalon.shift.service.impl.ShiftDayView;
import com.smartsalon.user.entity.UserEntity;

import java.time.LocalDateTime;
import java.time.LocalTime;

public final class PosAttendanceMapper {

    private PosAttendanceMapper() {}

    public static PosStaffAttendanceDto toDto(
            UserEntity staff,
            StaffScheduleEntity schedule,
            StaffAttendanceEntity attendance,
            boolean hasBranchRoster) {
        String roleName = staff.getRoles().stream()
                .filter(r -> "STYLIST".equals(r.getName()) || "STAFF".equals(r.getName()) || "MANAGER".equals(r.getName()))
                .map(r -> r.getName())
                .findFirst()
                .orElse("STAFF");

        ShiftDayView sv = ShiftDayView.resolve(schedule, hasBranchRoster);
        Long shiftTemplateId = sv.working() && schedule != null && schedule.getShiftTemplate() != null
                ? schedule.getShiftTemplate().getId() : null;

        Long attendanceId = null;
        StaffAttendanceStatus attendanceStatus = null;
        LocalDateTime clockInAt = null;
        LocalDateTime breakStartAt = null;
        LocalDateTime breakEndAt = null;
        LocalDateTime clockOutAt = null;
        int overtimeMinutes = 0;
        String notes = null;

        if (attendance != null) {
            attendanceId = attendance.getId();
            attendanceStatus = attendance.getStatus();
            clockInAt = attendance.getClockInAt();
            breakStartAt = attendance.getBreakStartAt();
            breakEndAt = attendance.getBreakEndAt();
            clockOutAt = attendance.getClockOutAt();
            overtimeMinutes = attendance.getOvertimeMinutes();
            notes = attendance.getNotes();
        }

        return PosStaffAttendanceDto.builder()
                .userId(staff.getId())
                .fullName(staff.getFullName())
                .phone(staff.getPhone())
                .avatarUrl(staff.getAvatarUrl())
                .roleName(roleName)
                .shiftTemplateId(shiftTemplateId)
                .shiftCode(sv.code())
                .shiftName(sv.name())
                .shiftStartTime(sv.start())
                .shiftEndTime(sv.end())
                .maxOvertimeMinutes(sv.maxOvertimeMinutes())
                .isWorking(sv.working())
                .attendanceId(attendanceId)
                .attendanceStatus(attendanceStatus)
                .clockInAt(clockInAt)
                .breakStartAt(breakStartAt)
                .breakEndAt(breakEndAt)
                .clockOutAt(clockOutAt)
                .overtimeMinutes(overtimeMinutes)
                .notes(notes)
                .build();
    }
}
