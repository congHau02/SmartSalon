package com.smartsalon.pos.service.impl;

import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.pos.dto.PosAttendanceActionRequest;
import com.smartsalon.pos.dto.PosStaffAttendanceDto;
import com.smartsalon.pos.service.PosAttendanceService;
import com.smartsalon.realtime.service.RealtimeNotificationService;
import com.smartsalon.security.BranchScopeGuard;
import com.smartsalon.shift.entity.StaffAttendanceEntity;
import com.smartsalon.shift.entity.StaffScheduleEntity;
import com.smartsalon.shift.repository.StaffAttendanceRepository;
import com.smartsalon.shift.repository.StaffScheduleRepository;
import com.smartsalon.shift.service.impl.ShiftDayView;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
        List<StaffScheduleEntity> schedules = staffScheduleRepository
                .findByBranchIdAndScheduleDateAndIsDeletedFalse(effectiveBranchId, today);
        boolean hasBranchRoster = !schedules.isEmpty();

        Map<Long, StaffScheduleEntity> scheduleMap = schedules.stream()
                .filter(s -> s.getUser() != null)
                .collect(Collectors.toMap(s -> s.getUser().getId(), s -> s, (s1, s2) -> s1));
        Map<Long, StaffAttendanceEntity> attendanceMap = staffAttendanceRepository
                .findByBranchIdAndAttendanceDateAndIsDeletedFalse(effectiveBranchId, today).stream()
                .filter(a -> a.getUser() != null)
                .collect(Collectors.toMap(a -> a.getUser().getId(), a -> a, (a1, a2) -> a1));

        List<PosStaffAttendanceDto> dtos = new ArrayList<>();
        for (UserEntity staff : staffMembers) {
            dtos.add(mapToDto(staff, scheduleMap.get(staff.getId()), attendanceMap.get(staff.getId()), hasBranchRoster));
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

        boolean isPrivileged = isPrivilegedStaffOrManager(currentUser);
        verifyPinOrOverride(request, targetUser, isPrivileged);

        LocalDate today = LocalDate.now();
        StaffScheduleEntity schedule = staffScheduleRepository
                .findByUserIdAndScheduleDateAndIsDeletedFalse(targetUser.getId(), today).orElse(null);
        StaffAttendanceEntity attendance = staffAttendanceRepository
                .findByUserIdAndAttendanceDateAndIsDeletedFalse(targetUser.getId(), today)
                .orElseGet(() -> StaffAttendanceEntity.builder()
                        .branch(branch)
                        .user(targetUser)
                        .schedule(schedule)
                        .attendanceDate(today)
                        .status(null)
                        .overtimeMinutes(0)
                        .notes(request.getNotes())
                        .build());

        String action = request.getAction() != null ? request.getAction().toUpperCase().trim() : "";
        applyAttendanceAction(attendance, action, schedule, request.getNotes(), isPrivileged);

        StaffAttendanceEntity saved = staffAttendanceRepository.save(attendance);
        realtimeNotificationService.notifyAttendanceUpdated(saved, action);

        boolean hasBranchRoster = !staffScheduleRepository
                .findByBranchIdAndScheduleDateAndIsDeletedFalse(effectiveBranchId, today).isEmpty();
        return mapToDto(targetUser, schedule, saved, hasBranchRoster);
    }

    private void applyAttendanceAction(
            StaffAttendanceEntity attendance,
            String action,
            StaffScheduleEntity schedule,
            String notes,
            boolean isPrivileged) {

        LocalDateTime now = LocalDateTime.now();
        switch (action) {
            case "CLOCK_IN" -> attendance.clockIn(now, notes);
            case "TOGGLE_BREAK" -> attendance.toggleBreak(now, notes);
            case "CLOCK_OUT" -> attendance.clockOut(now, schedule, notes);
            case "MARK_ABSENT" -> {
                if (!isPrivileged) {
                    throw new AppException(ErrorCode.FORBIDDEN, "Chỉ Quản lý hoặc Nhân viên lễ tân mới có quyền đánh dấu vắng mặt");
                }
                attendance.markAbsent(notes);
            }
            default -> throw new AppException(ErrorCode.ATTENDANCE_ACTION_INVALID, "Thao tác chấm công không hợp lệ: " + action);
        }
    }

    private boolean isPrivilegedStaffOrManager(UserEntity user) {
        return user.getRoles().stream().anyMatch(r ->
                "ADMIN".equals(r.getName()) || "ROLE_ADMIN".equals(r.getName())
                        || "MANAGER".equals(r.getName()) || "ROLE_MANAGER".equals(r.getName())
                        || "STAFF".equals(r.getName()) || "ROLE_STAFF".equals(r.getName()));
    }

    private void verifyPinOrOverride(PosAttendanceActionRequest request, UserEntity targetUser, boolean isPrivileged) {
        if (Boolean.TRUE.equals(request.getOverridePin())) {
            if (!isPrivileged) {
                throw new AppException(ErrorCode.FORBIDDEN, "Chỉ Quản lý hoặc Nhân viên lễ tân mới có quyền ghi đè mã PIN");
            }
            return;
        }
        String enteredPin = request.getPin();
        String userPin = targetUser.getAttendancePin() != null ? targetUser.getAttendancePin() : "1234";
        if (enteredPin == null || !enteredPin.trim().equals(userPin)) {
            throw new AppException(ErrorCode.INVALID_ATTENDANCE_PIN);
        }
    }

    private PosStaffAttendanceDto mapToDto(
            UserEntity staff,
            StaffScheduleEntity schedule,
            StaffAttendanceEntity attendance,
            boolean hasBranchRoster) {

        String roleName = staff.getRoles().stream()
                .map(r -> r.getName())
                .filter(name -> "STYLIST".equals(name) || "STAFF".equals(name) || "MANAGER".equals(name))
                .findFirst()
                .orElse("STAFF");

        ShiftDayView sv = ShiftDayView.resolve(schedule, hasBranchRoster);
        Long shiftTemplateId = sv.working() && schedule != null && schedule.getShiftTemplate() != null
                ? schedule.getShiftTemplate().getId() : null;

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
                .attendanceId(attendance != null ? attendance.getId() : null)
                .attendanceStatus(attendance != null ? attendance.getStatus() : null)
                .clockInAt(attendance != null ? attendance.getClockInAt() : null)
                .breakStartAt(attendance != null ? attendance.getBreakStartAt() : null)
                .breakEndAt(attendance != null ? attendance.getBreakEndAt() : null)
                .clockOutAt(attendance != null ? attendance.getClockOutAt() : null)
                .overtimeMinutes(attendance != null ? attendance.getOvertimeMinutes() : 0)
                .notes(attendance != null ? attendance.getNotes() : null)
                .build();
    }
}
