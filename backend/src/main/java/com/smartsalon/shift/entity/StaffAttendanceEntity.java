package com.smartsalon.shift.entity;

import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.common.BaseEntity;
import com.smartsalon.user.entity.UserEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "staff_attendances", uniqueConstraints = {
        @UniqueConstraint(name = "uq_staff_attendances_user_date", columnNames = {"user_id", "attendance_date"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffAttendanceEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private BranchEntity branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id")
    private StaffScheduleEntity schedule;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @Column(name = "clock_in_at")
    private LocalDateTime clockInAt;

    @Column(name = "break_start_at")
    private LocalDateTime breakStartAt;

    @Column(name = "break_end_at")
    private LocalDateTime breakEndAt;

    @Column(name = "clock_out_at")
    private LocalDateTime clockOutAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private StaffAttendanceStatus status = StaffAttendanceStatus.PRESENT;

    @Column(name = "overtime_minutes", nullable = false)
    @Builder.Default
    private int overtimeMinutes = 0;

    @Column(name = "notes", length = 255)
    private String notes;

    public void clockIn(LocalDateTime now, String notes) {
        if (this.clockInAt == null) {
            this.clockInAt = now;
        }
        this.status = StaffAttendanceStatus.PRESENT;
        if (notes != null) {
            this.notes = notes;
        }
    }

    public void toggleBreak(LocalDateTime now, String notes) {
        if (this.clockInAt == null && this.status == null) {
            this.clockInAt = now;
        }
        if (this.status == StaffAttendanceStatus.ON_BREAK) {
            this.status = StaffAttendanceStatus.PRESENT;
            this.breakEndAt = now;
        } else {
            if (this.clockInAt == null) {
                this.clockInAt = now;
            }
            this.status = StaffAttendanceStatus.ON_BREAK;
            this.breakStartAt = now;
        }
        if (notes != null) {
            this.notes = notes;
        }
    }

    public void clockOut(LocalDateTime now, StaffScheduleEntity effectiveSchedule, String notes) {
        if (this.clockInAt == null) {
            this.clockInAt = now;
        }
        this.clockOutAt = now;
        this.status = StaffAttendanceStatus.COMPLETED;
        if (this.breakStartAt != null && this.breakEndAt == null) {
            this.breakEndAt = now;
        }
        if (notes != null) {
            this.notes = notes;
        }
        if (effectiveSchedule != null && effectiveSchedule.getShiftTemplate() != null) {
            LocalDateTime scheduledShiftEnd = LocalDateTime.of(
                    this.attendanceDate, effectiveSchedule.getShiftTemplate().getEndTime());
            this.overtimeMinutes = now.isAfter(scheduledShiftEnd)
                    ? (int) java.time.Duration.between(scheduledShiftEnd, now).toMinutes()
                    : 0;
        }
    }

    public void markAbsent(String notes) {
        this.status = StaffAttendanceStatus.ABSENT;
        if (notes != null) {
            this.notes = notes;
        }
    }
}
