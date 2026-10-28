package com.smartsalon.shift.service.impl;

import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.pos.entity.OrderItemEntity;
import com.smartsalon.pos.entity.OrderStepAssignmentEntity;
import com.smartsalon.pos.entity.StepAssignmentStatus;
import com.smartsalon.shift.entity.StaffAttendanceEntity;
import com.smartsalon.shift.entity.StaffAttendanceStatus;
import com.smartsalon.shift.entity.StaffScheduleEntity;
import com.smartsalon.shift.entity.StaffScheduleStatus;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/** Shared worked-day / prorated base salary rules for payroll and P&L (spec L121). */
public final class ShiftPayrollHelper {

    private ShiftPayrollHelper() {
    }

    /** Dates with a WORKING schedule that has a shift template. */
    public static Set<LocalDate> scheduledWorkingDates(Collection<StaffScheduleEntity> schedules) {
        return schedules.stream()
                .filter(s -> s.getStatus() == StaffScheduleStatus.WORKING && s.getShiftTemplate() != null)
                .map(StaffScheduleEntity::getScheduleDate)
                .collect(Collectors.toSet());
    }

    /** Dates with PRESENT/COMPLETED attendance, per staff id. */
    public static Map<Long, Set<LocalDate>> attendedDatesByStaff(Collection<StaffAttendanceEntity> attendances) {
        Map<Long, Set<LocalDate>> result = new HashMap<>();
        for (StaffAttendanceEntity a : attendances) {
            if (a.getStatus() == StaffAttendanceStatus.COMPLETED || a.getStatus() == StaffAttendanceStatus.PRESENT) {
                result.computeIfAbsent(a.getUser().getId(), k -> new HashSet<>()).add(a.getAttendanceDate());
            }
        }
        return result;
    }

    /** Dates with a completed step, per staff id (single pass over the orders). */
    public static Map<Long, Set<LocalDate>> completedStepDatesByStaff(Collection<OrderEntity> orders) {
        Map<Long, Set<LocalDate>> result = new HashMap<>();
        for (OrderEntity order : orders) {
            if (order.getItems() == null) continue;
            for (OrderItemEntity item : order.getItems()) {
                if (item.isDeleted() || item.getStepAssignments() == null) continue;
                for (OrderStepAssignmentEntity step : item.getStepAssignments()) {
                    if (step.getStaff() != null && step.getStatus() == StepAssignmentStatus.COMPLETED
                            && step.getCompletedAt() != null) {
                        result.computeIfAbsent(step.getStaff().getId(), k -> new HashSet<>())
                                .add(step.getCompletedAt().toLocalDate());
                    }
                }
            }
        }
        return result;
    }

    public static Set<LocalDate> union(Set<LocalDate> a, Set<LocalDate> b) {
        Set<LocalDate> merged = new HashSet<>();
        if (a != null) merged.addAll(a);
        if (b != null) merged.addAll(b);
        return merged;
    }

    /** contract × worked / scheduled; extra cover days count, so the result may exceed the contract salary. */
    public static BigDecimal prorate(BigDecimal contractSalary, int workedCount, int scheduledCount) {
        return contractSalary
                .multiply(BigDecimal.valueOf(workedCount))
                .divide(BigDecimal.valueOf(scheduledCount), 0, RoundingMode.HALF_UP);
    }
}
