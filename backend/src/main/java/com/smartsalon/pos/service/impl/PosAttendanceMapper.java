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
        String roleName = resolveRoleName(staff);
        ShiftDayView sv = ShiftDayView.resolve(schedule, hasBranchRoster);
        Long shiftTemplateId = sv.working() && schedule != null && schedule.getShiftTemplate() != null
                ? schedule.getShiftTemplate().getId() : null;

        PosStaffAttendanceDto.PosStaffAttendanceDtoBuilder builder = PosStaffAttendanceDto.builder()
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
                .isWorking(sv.working());

        populateAttendanceFields(builder, attendance);
        return builder.build();
    }

    private static String resolveRoleName(UserEntity staff) {
        return staff.getRoles().stream()
                .filter(r -> "STYLIST".equals(r.getName()) || "STAFF".equals(r.getName()) || "MANAGER".equals(r.getName()))
                .map(r -> r.getName())
                .findFirst()
                .orElse("STAFF");
    }

    private static void populateAttendanceFields(
            PosStaffAttendanceDto.PosStaffAttendanceDtoBuilder builder,
            StaffAttendanceEntity attendance) {
        if (attendance == null) return;
        builder.attendanceId(attendance.getId())
                .attendanceStatus(attendance.getStatus())
                .clockInAt(attendance.getClockInAt())
                .breakStartAt(attendance.getBreakStartAt())
                .breakEndAt(attendance.getBreakEndAt())
                .clockOutAt(attendance.getClockOutAt())
                .overtimeMinutes(attendance.getOvertimeMinutes())
                .notes(attendance.getNotes());
    }
}
