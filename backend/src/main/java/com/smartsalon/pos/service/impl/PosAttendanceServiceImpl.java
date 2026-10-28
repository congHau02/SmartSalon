package com.smartsalon.pos.service.impl;

import com.smartsalon.shift.service.impl.ShiftDayView;

import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.pos.dto.PosAttendanceActionRequest;
import com.smartsalon.pos.dto.PosStaffAttendanceDto;
import com.smartsalon.pos.service.PosAttendanceService;
import com.smartsalon.realtime.service.RealtimeNotificationService;
import com.smartsalon.security.BranchScopeGuard;
import com.smartsalon.shift.entity.ShiftTemplateEntity;
import com.smartsalon.shift.entity.StaffAttendanceEntity;
import com.smartsalon.shift.entity.StaffAttendanceStatus;
import com.smartsalon.shift.entity.StaffScheduleEntity;
import com.smartsalon.shift.entity.StaffScheduleStatus;
import com.smartsalon.shift.repository.StaffAttendanceRepository;
import com.smartsalon.shift.repository.StaffScheduleRepository;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PosAttendanceServiceImpl implements PosAttendanceService {

    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final StaffScheduleRepository staffScheduleRepository;
    private final StaffAttendanceRepository staffAttendanceRepository;
    private final BranchScopeGuard branchScopeGuard;
    private final RealtimeNotificationService realtimeNotificationService;

    @Override
    @Transactional(readOnly = true)
    public List<PosStaffAttendanceDto> getTodayAttendance(Long branchId) {
        Long effectiveBranchId = branchScopeGuard.getEffectiveBranchId(branchId);
        branchScopeGuard.checkBranchAccess(effectiveBranchId);

        LocalDate today = LocalDate.now();

        List<UserEntity> staffMembers = userRepository.findActiveStaffByBranchId(effectiveBranchId);
        List<StaffScheduleEntity> schedules = staffScheduleRepository.findByBranchIdAndScheduleDateAndIsDeletedFalse(effectiveBranchId, today);
        boolean hasBranchRoster = !schedules.isEmpty();
        Map<Long, StaffScheduleEntity> scheduleMap = schedules.stream()
                .filter(s -> s.getUser() != null)
                .collect(Collectors.toMap(s -> s.getUser().getId(), s -> s, (s1, s2) -> s1));

        List<StaffAttendanceEntity> attendances = staffAttendanceRepository.findByBranchIdAndAttendanceDateAndIsDeletedFalse(effectiveBranchId, today);
        Map<Long, StaffAttendanceEntity> attendanceMap = attendances.stream()
                .filter(a -> a.getUser() != null)
                .collect(Collectors.toMap(a -> a.getUser().getId(), a -> a, (a1, a2) -> a1));

        List<PosStaffAttendanceDto> dtos = new ArrayList<>();
        for (UserEntity staff : staffMembers) {
            StaffScheduleEntity schedule = scheduleMap.get(staff.getId());
            StaffAttendanceEntity attendance = attendanceMap.get(staff.getId());
            dtos.add(mapToDto(staff, schedule, attendance, hasBranchRoster));
        }

        return dtos;
    }

    @Override
    @Transactional
    public PosStaffAttendanceDto executeAttendanceAction(PosAttendanceActionRequest request) {
        Long effectiveBranchId = branchScopeGuard.getEffectiveBranchId(request.getBranchId());
        branchScopeGuard.checkBranchAccess(effectiveBranchId);

        UserEntity currentUser = branchScopeGuard.getCurrentUser();
        BranchEntity branch = branchRepository.findByIdAndIsDeletedFalse(effectiveBranchId)
                .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));

        UserEntity targetUser = userRepository.findByIdAndIsDeletedFalse(request.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        boolean isPrivileged = currentUser.getRoles().stream()
                .anyMatch(r -> "ADMIN".equals(r.getName()) || "ROLE_ADMIN".equals(r.getName())
                        || "MANAGER".equals(r.getName()) || "ROLE_MANAGER".equals(r.getName())
                        || "STAFF".equals(r.getName()) || "ROLE_STAFF".equals(r.getName()));

        String action = request.getAction() != null ? request.getAction().toUpperCase().trim() : "";

        // Verify PIN or administrative override
        if (Boolean.TRUE.equals(request.getOverridePin())) {
            if (!isPrivileged) {
                throw new AppException(ErrorCode.FORBIDDEN, "Chỉ Quản lý hoặc Nhân viên lễ tân mới có quyền ghi đè mã PIN");
            }
        } else {
            // Stylist or normal PIN flow
            String enteredPin = request.getPin();
            String userPin = targetUser.getAttendancePin() != null ? targetUser.getAttendancePin() : "1234";
            if (enteredPin == null || !enteredPin.trim().equals(userPin)) {
                throw new AppException(ErrorCode.INVALID_ATTENDANCE_PIN);
            }
        }

        LocalDate today = LocalDate.now();
        StaffScheduleEntity schedule = staffScheduleRepository.findByUserIdAndScheduleDateAndIsDeletedFalse(targetUser.getId(), today)
                .orElse(null);

        StaffAttendanceEntity attendance = staffAttendanceRepository.findByUserIdAndAttendanceDateAndIsDeletedFalse(targetUser.getId(), today)
                .orElse(null);

        LocalDateTime now = LocalDateTime.now();

        switch (action) {
            case "CLOCK_IN":
                if (attendance == null) {
                    attendance = StaffAttendanceEntity.builder()
                            .branch(branch)
                            .user(targetUser)
                            .schedule(schedule)
                            .attendanceDate(today)
                            .clockInAt(now)
                            .status(StaffAttendanceStatus.PRESENT)
                            .overtimeMinutes(0)
                            .notes(request.getNotes())
                            .build();
                } else {
                    if (attendance.getClockInAt() == null) {
                        attendance.setClockInAt(now);
                    }
                    attendance.setStatus(StaffAttendanceStatus.PRESENT);
                    if (request.getNotes() != null) {
                        attendance.setNotes(request.getNotes());
                    }
                }
                break;

            case "TOGGLE_BREAK":
                if (attendance == null) {
                    attendance = StaffAttendanceEntity.builder()
                            .branch(branch)
                            .user(targetUser)
                            .schedule(schedule)
                            .attendanceDate(today)
                            .clockInAt(now)
                            .status(StaffAttendanceStatus.ON_BREAK)
                            .breakStartAt(now)
                            .overtimeMinutes(0)
                            .notes(request.getNotes())
                            .build();
                } else {
                    if (attendance.getStatus() == StaffAttendanceStatus.ON_BREAK) {
                        attendance.setStatus(StaffAttendanceStatus.PRESENT);
                        attendance.setBreakEndAt(now);
                    } else {
                        attendance.setStatus(StaffAttendanceStatus.ON_BREAK);
                        attendance.setBreakStartAt(now);
                    }
                    if (request.getNotes() != null) {
                        attendance.setNotes(request.getNotes());
                    }
                }
                break;

            case "CLOCK_OUT":
                if (attendance == null) {
                    attendance = StaffAttendanceEntity.builder()
                            .branch(branch)
                            .user(targetUser)
                            .schedule(schedule)
                            .attendanceDate(today)
                            .clockInAt(now)
                            .clockOutAt(now)
                            .status(StaffAttendanceStatus.COMPLETED)
                            .overtimeMinutes(0)
                            .notes(request.getNotes())
                            .build();
                } else {
                    attendance.setClockOutAt(now);
                    attendance.setStatus(StaffAttendanceStatus.COMPLETED);
                    if (attendance.getBreakStartAt() != null && attendance.getBreakEndAt() == null) {
                        attendance.setBreakEndAt(now);
                    }
                    if (request.getNotes() != null) {
                        attendance.setNotes(request.getNotes());
                    }
                }

                // Compute overtimeMinutes if past scheduled shift.endTime
                if (schedule != null && schedule.getShiftTemplate() != null) {
                    ShiftTemplateEntity shift = schedule.getShiftTemplate();
                    LocalTime shiftEnd = shift.getEndTime();
                    LocalDateTime scheduledShiftEnd = LocalDateTime.of(today, shiftEnd);
                    if (now.isAfter(scheduledShiftEnd)) {
                        long diff = Duration.between(scheduledShiftEnd, now).toMinutes();
                        attendance.setOvertimeMinutes((int) diff);
                    } else {
                        attendance.setOvertimeMinutes(0);
                    }
                }
                break;

            case "MARK_ABSENT":
                if (!isPrivileged) {
                    throw new AppException(ErrorCode.FORBIDDEN, "Chỉ Quản lý hoặc Nhân viên lễ tân mới có quyền đánh dấu vắng mặt");
                }
                if (attendance == null) {
                    attendance = StaffAttendanceEntity.builder()
                            .branch(branch)
                            .user(targetUser)
                            .schedule(schedule)
                            .attendanceDate(today)
                            .status(StaffAttendanceStatus.ABSENT)
                            .overtimeMinutes(0)
                            .notes(request.getNotes())
                            .build();
                } else {
                    attendance.setStatus(StaffAttendanceStatus.ABSENT);
                    if (request.getNotes() != null) {
                        attendance.setNotes(request.getNotes());
                    }
                }
                break;

            default:
                throw new AppException(ErrorCode.ATTENDANCE_ACTION_INVALID, "Thao tác chấm công không hợp lệ: " + action);
        }

        StaffAttendanceEntity saved = staffAttendanceRepository.save(attendance);

        // Real-time broadcast
        realtimeNotificationService.notifyAttendanceUpdated(saved, action);

        boolean hasBranchRoster = !staffScheduleRepository
                .findByBranchIdAndScheduleDateAndIsDeletedFalse(effectiveBranchId, today).isEmpty();

        return mapToDto(targetUser, schedule, saved, hasBranchRoster);
    }

    private PosStaffAttendanceDto mapToDto(UserEntity staff, StaffScheduleEntity schedule, StaffAttendanceEntity attendance, boolean hasBranchRoster) {
        String roleName = staff.getRoles().stream()
                .filter(r -> "STYLIST".equals(r.getName()) || "STAFF".equals(r.getName()) || "MANAGER".equals(r.getName()))
                .map(r -> r.getName())
                .findFirst()
                .orElse("STAFF");

        ShiftDayView sv = ShiftDayView.resolve(schedule, hasBranchRoster);
        Long shiftTemplateId = sv.working() && schedule != null && schedule.getShiftTemplate() != null
                ? schedule.getShiftTemplate().getId() : null;
        String shiftCode = sv.code();
        String shiftName = sv.name();
        LocalTime shiftStartTime = sv.start();
        LocalTime shiftEndTime = sv.end();
        Integer maxOvertimeMinutes = sv.maxOvertimeMinutes();
        Boolean isWorking = sv.working();

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
                .shiftCode(shiftCode)
                .shiftName(shiftName)
                .shiftStartTime(shiftStartTime)
                .shiftEndTime(shiftEndTime)
                .maxOvertimeMinutes(maxOvertimeMinutes)
                .isWorking(isWorking)
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
