package com.smartsalon.shift.service.impl;

import com.smartsalon.shift.entity.ShiftTemplateEntity;
import com.smartsalon.shift.entity.StaffScheduleEntity;
import com.smartsalon.shift.entity.StaffScheduleStatus;

import java.time.LocalTime;

/**
 * A stylist's shift for one day: WORKING template, OFF, unscheduled-on-published-roster (OFF),
 * or the 08:30–20:30 FULL_DAY fallback when the branch has no roster.
 */
public record ShiftDayView(
        String code, String name, LocalTime start, LocalTime end, int maxOvertimeMinutes, boolean working) {

    public static final LocalTime OPENING_TIME = LocalTime.of(8, 30);
    public static final LocalTime CLOSING_TIME = LocalTime.of(20, 30);

    public static ShiftDayView resolve(StaffScheduleEntity schedule, boolean hasBranchRoster) {
        if (schedule != null && schedule.getStatus() == StaffScheduleStatus.WORKING
                && schedule.getShiftTemplate() != null) {
            ShiftTemplateEntity t = schedule.getShiftTemplate();
            return new ShiftDayView(t.getCode(), t.getName(), t.getStartTime(), t.getEndTime(),
                    t.getMaxOvertimeMinutes(), true);
        }
        if (schedule != null && schedule.getStatus() == StaffScheduleStatus.OFF) {
            return new ShiftDayView("OFF", "Nghỉ (OFF)", null, null, 0, false);
        }
        if (hasBranchRoster) {
            return new ShiftDayView("OFF", "Không xếp ca (OFF)", null, null, 0, false);
        }
        return new ShiftDayView("FULL_DAY", "Ca Cả ngày", OPENING_TIME, CLOSING_TIME, 0, true);
    }
}
