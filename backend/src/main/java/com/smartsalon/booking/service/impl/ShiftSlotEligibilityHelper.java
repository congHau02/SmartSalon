package com.smartsalon.booking.service.impl;

import com.smartsalon.shift.entity.ShiftTemplateEntity;
import com.smartsalon.shift.entity.StaffAttendanceEntity;
import com.smartsalon.shift.entity.StaffAttendanceStatus;
import com.smartsalon.shift.entity.StaffScheduleEntity;
import com.smartsalon.shift.entity.StaffScheduleStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;

public final class ShiftSlotEligibilityHelper {

    public static final LocalTime OPENING_TIME = LocalTime.of(8, 30);
    public static final LocalTime CLOSING_TIME = LocalTime.of(20, 30);

    private ShiftSlotEligibilityHelper() {
    }

    public static boolean isEligible(
            Long stylistId,
            LocalTime slotStart,
            LocalTime slotEnd,
            LocalDate date,
            boolean hasBranchRoster,
            Map<Long, StaffScheduleEntity> scheduleByStylist,
            Map<Long, StaffAttendanceEntity> attendanceByStylist,
            LocalDate today,
            LocalTime nowTime) {

        StaffScheduleEntity schedule = scheduleByStylist != null ? scheduleByStylist.get(stylistId) : null;

        if (schedule != null) {
            // Stylist has an explicit schedule on this date
            if (schedule.getStatus() == StaffScheduleStatus.OFF
                    || schedule.getShiftTemplate() == null
                    || !schedule.getShiftTemplate().isActive()) {
                return false;
            }

            ShiftTemplateEntity shift = schedule.getShiftTemplate();
            LocalTime shiftStart = shift.getStartTime();
            LocalTime shiftEnd = shift.getEndTime();
            int maxOvertime = shift.getMaxOvertimeMinutes();

            LocalTime maxAllowedEnd = shiftEnd.plusMinutes(maxOvertime);
            if (maxAllowedEnd.isAfter(CLOSING_TIME) || maxAllowedEnd.isBefore(shiftEnd)) {
                maxAllowedEnd = CLOSING_TIME;
            }

            // 1. Strict Shift Start: slotStartTime >= shift.startTime and slotStartTime < shift.endTime
            if (slotStart.isBefore(shiftStart) || !slotStart.isBefore(shiftEnd)) {
                return false;
            }

            // 2. Overtime Slot Window: slotEndTime <= min(20:30, shift.endTime + shift.maxOvertimeMinutes)
            if (slotEnd.isAfter(maxAllowedEnd)) {
                return false;
            }
        } else {
            // Roster published for this date: an unscheduled stylist is OFF (spec L95)
            if (hasBranchRoster) {
                return false;
            }
            // Far-future date with no published roster: fallback to standard branch operating hours (08:30–20:30)
            if (slotStart.isBefore(OPENING_TIME) || !slotStart.isBefore(CLOSING_TIME)) {
                return false;
            }
            if (slotEnd.isAfter(CLOSING_TIME)) {
                return false;
            }
        }

        // Attendance guard for today
        if (date.isEqual(today) && attendanceByStylist != null) {
            StaffAttendanceEntity attendance = attendanceByStylist.get(stylistId);
            if (attendance != null) {
                if (attendance.getStatus() == StaffAttendanceStatus.ABSENT) {
                    return false;
                }
                if (attendance.getStatus() == StaffAttendanceStatus.ON_BREAK) {
                    LocalTime breakWindowEnd = nowTime.plusMinutes(60);
                    if (!breakWindowEnd.isBefore(nowTime) && slotStart.isBefore(breakWindowEnd)) {
                        return false;
                    }
                }
            }
        }

        return true;
    }
}
