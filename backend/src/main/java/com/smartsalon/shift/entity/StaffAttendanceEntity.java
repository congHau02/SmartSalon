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

    public static StaffAttendanceEntity createForAction(
            BranchEntity branch,
            UserEntity user,
            StaffScheduleEntity schedule,
            LocalDate date,
            String action,
            LocalDateTime now,
            String notes) {
        StaffAttendanceEntity entity = StaffAttendanceEntity.builder()
                .branch(branch)
                .user(user)
                .schedule(schedule)
                .attendanceDate(date)
                .overtimeMinutes(0)
                .notes(notes)
                .build();
        switch (action) {
            case "CLOCK_IN" -> {
                entity.status = StaffAttendanceStatus.PRESENT;
                entity.clockInAt = now;
            }
            case "TOGGLE_BREAK" -> {
                entity.status = StaffAttendanceStatus.ON_BREAK;
                entity.clockInAt = now;
                entity.breakStartAt = now;
            }
            case "CLOCK_OUT" -> {
                entity.status = StaffAttendanceStatus.COMPLETED;
                entity.clockInAt = now;
                entity.clockOutAt = now;
            }
            case "MARK_ABSENT" -> entity.status = StaffAttendanceStatus.ABSENT;
            default -> entity.status = null;
        }
        return entity;
    }

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
        if (this.status == StaffAttendanceStatus.ON_BREAK) {
            this.status = StaffAttendanceStatus.PRESENT;
            this.breakEndAt = now;
        } else {
            this.status = StaffAttendanceStatus.ON_BREAK;
            this.breakStartAt = now;
        }
        if (notes != null) {
            this.notes = notes;
        }
    }

    public void clockOut(LocalDateTime now, StaffScheduleEntity effectiveSchedule, String notes) {
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
