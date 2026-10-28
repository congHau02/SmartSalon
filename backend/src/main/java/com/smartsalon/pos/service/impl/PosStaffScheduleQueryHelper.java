package com.smartsalon.pos.service.impl;

import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.pos.dto.PersonalWeeklyScheduleDayDto;
import com.smartsalon.pos.dto.StylistAvailabilityDto;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.pos.entity.OrderStepAssignmentEntity;
import com.smartsalon.pos.entity.StepAssignmentStatus;
import com.smartsalon.pos.repository.OrderStepAssignmentRepository;
import com.smartsalon.shift.entity.StaffAttendanceEntity;
import com.smartsalon.shift.entity.StaffAttendanceStatus;
import com.smartsalon.shift.entity.StaffScheduleEntity;
import com.smartsalon.shift.entity.StaffScheduleStatus;
import com.smartsalon.shift.repository.StaffAttendanceRepository;
import com.smartsalon.shift.repository.StaffScheduleRepository;
import com.smartsalon.shift.service.impl.ShiftDayView;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PosStaffScheduleQueryHelper {

    private static final String[] DAY_NAMES = {"T2", "T3", "T4", "T5", "T6", "T7", "CN"};

    private final UserRepository userRepository;
    private final StaffScheduleRepository staffScheduleRepository;
    private final StaffAttendanceRepository staffAttendanceRepository;
    private final OrderStepAssignmentRepository stepAssignmentRepository;
    private final BranchRepository branchRepository;
    private final PosStaffResolutionHelper staffResolutionHelper;

    public record WorklogContext(
            Long branchId,
            String branchName,
            Long stylistId,
            String stylistName
    ) {}

    public record StylistShiftSnapshot(
            String shiftCode,
            String shiftName,
            LocalTime shiftStartTime,
            LocalTime shiftEndTime,
            Boolean isWorking,
            StaffAttendanceStatus attendanceStatus,
            LocalDateTime clockInAt,
            LocalDateTime breakStartAt,
            LocalDateTime breakEndAt,
            LocalDateTime clockOutAt,
            int overtimeMinutes,
            List<PersonalWeeklyScheduleDayDto> weeklySchedule
    ) {}

    public void checkBranchAccess(Long branchId) {
        staffResolutionHelper.checkBranchAccess(branchId);
    }

    public List<StylistAvailabilityDto> buildStylistAvailabilityStrip(Long branchId, LocalDate targetDate) {
        List<UserEntity> stylists = userRepository.findActiveStylistsByBranchId(branchId);
        List<StaffScheduleEntity> branchSchedules = staffScheduleRepository
                .findByBranchIdAndScheduleDateAndIsDeletedFalse(branchId, targetDate);
        boolean hasBranchRoster = !branchSchedules.isEmpty();

        Map<Long, StaffScheduleEntity> scheduleMap = branchSchedules.stream()
                .filter(s -> s.getUser() != null)
                .collect(Collectors.toMap(s -> s.getUser().getId(), s -> s, (s1, s2) -> s1));
        Map<Long, StaffAttendanceEntity> attendanceMap = staffAttendanceRepository
                .findByBranchIdAndAttendanceDateAndIsDeletedFalse(branchId, targetDate).stream()
                .filter(a -> a.getUser() != null)
                .collect(Collectors.toMap(a -> a.getUser().getId(), a -> a, (a1, a2) -> a1));

        List<StylistAvailabilityDto> dtos = new ArrayList<>();
        for (UserEntity stylist : stylists) {
            dtos.add(buildSingleStylistAvailability(
                    stylist, scheduleMap.get(stylist.getId()), attendanceMap.get(stylist.getId()), hasBranchRoster));
        }
        return dtos;
    }

    public WorklogContext resolveWorklogContext(Long requestedBranchId, Long requestedStylistId) {
        Long effectiveBranchId = staffResolutionHelper.getEffectiveBranchId(requestedBranchId);
        UserEntity currentUser = staffResolutionHelper.resolveCurrentUser();

        UserEntity targetStylist = null;
        if (currentUser != null && currentUser.getRoles().stream().anyMatch(r -> "STYLIST".equals(r.getName()))) {
            targetStylist = currentUser;
        } else if (requestedStylistId != null) {
            targetStylist = staffResolutionHelper.findActiveStaffByIdOrThrow(
                    requestedStylistId, "Không tìm thấy nhân viên với ID: " + requestedStylistId);
        } else if (currentUser != null) {
            targetStylist = currentUser;
        }

        BranchEntity branch = resolveWorklogBranch(requestedBranchId, targetStylist, currentUser);
        Long finalBranchId = effectiveBranchId != null ? effectiveBranchId : (branch != null ? branch.getId() : 1L);
        String finalBranchName = branch != null ? branch.getName() : "";
        Long finalStylistId = targetStylist != null ? targetStylist.getId() : (currentUser != null ? currentUser.getId() : null);
        String finalStylistName = targetStylist != null ? targetStylist.getFullName() : (currentUser != null ? currentUser.getFullName() : "");

        return new WorklogContext(finalBranchId, finalBranchName, finalStylistId, finalStylistName);
    }

    public StylistShiftSnapshot buildStylistShiftSnapshot(Long stylistId, LocalDate queryDate) {
        if (stylistId == null) {
            return new StylistShiftSnapshot(null, null, null, null, true, null, null, null, null, null, 0, List.of());
        }

        StaffScheduleEntity todaySched = staffScheduleRepository
                .findByUserIdAndScheduleDateAndIsDeletedFalse(stylistId, queryDate).orElse(null);
        StaffAttendanceEntity todayAtt = staffAttendanceRepository
                .findByUserIdAndAttendanceDateAndIsDeletedFalse(stylistId, queryDate).orElse(null);
        ShiftDayView wv = ShiftDayView.resolve(todaySched, false);

        return new StylistShiftSnapshot(
                wv.code(),
                wv.name(),
                wv.start(),
                wv.end(),
                wv.working(),
                todayAtt != null ? todayAtt.getStatus() : null,
                todayAtt != null ? todayAtt.getClockInAt() : null,
                todayAtt != null ? todayAtt.getBreakStartAt() : null,
                todayAtt != null ? todayAtt.getBreakEndAt() : null,
                todayAtt != null ? todayAtt.getClockOutAt() : null,
                todayAtt != null ? todayAtt.getOvertimeMinutes() : 0,
                buildWeeklySchedule(stylistId, queryDate)
        );
    }

    private StylistAvailabilityDto buildSingleStylistAvailability(
            UserEntity stylist,
            StaffScheduleEntity schedule,
            StaffAttendanceEntity attendance,
            boolean hasBranchRoster) {

        List<OrderStepAssignmentEntity> activeSteps = stepAssignmentRepository
                .findByStaffIdAndStatus(stylist.getId(), StepAssignmentStatus.IN_PROGRESS);
        boolean isBusy = !activeSteps.isEmpty();
        String currentOrderCode = null;
        String currentCustomerName = null;
        String currentStepName = null;

        if (isBusy) {
            OrderStepAssignmentEntity activeStep = activeSteps.get(0);
            currentStepName = activeStep.getStepName();
            if (activeStep.getOrderItem() != null && activeStep.getOrderItem().getOrder() != null) {
                OrderEntity activeOrder = activeStep.getOrderItem().getOrder();
                currentOrderCode = activeOrder.getOrderCode();
                currentCustomerName = activeOrder.getCustomerName();
            }
        }

        ShiftDayView sv = ShiftDayView.resolve(schedule, hasBranchRoster);
        return StylistAvailabilityDto.builder()
                .stylistId(stylist.getId())
                .fullName(stylist.getFullName())
                .phone(stylist.getPhone())
                .avatarUrl(stylist.getAvatarUrl())
                .isBusy(isBusy)
                .currentOrderCode(currentOrderCode)
                .currentCustomerName(currentCustomerName)
                .currentStepName(currentStepName)
                .shiftCode(sv.code())
                .shiftName(sv.name())
                .shiftStartTime(sv.start())
                .shiftEndTime(sv.end())
                .isWorking(sv.working())
                .attendanceStatus(attendance != null ? attendance.getStatus() : null)
                .clockInAt(attendance != null ? attendance.getClockInAt() : null)
                .clockOutAt(attendance != null ? attendance.getClockOutAt() : null)
                .overtimeMinutes(attendance != null ? attendance.getOvertimeMinutes() : 0)
                .build();
    }

    private BranchEntity resolveWorklogBranch(Long requestedBranchId, UserEntity targetStylist, UserEntity currentUser) {
        if (requestedBranchId != null) {
            return branchRepository.findByIdAndIsDeletedFalse(requestedBranchId).orElse(null);
        }
        if (targetStylist != null && targetStylist.getBranch() != null) {
            return targetStylist.getBranch();
        }
        if (currentUser != null && currentUser.getBranch() != null) {
            return currentUser.getBranch();
        }
        return branchRepository.findAllByIsDeletedFalseAndIsActiveTrue().stream().findFirst().orElse(null);
    }

    private List<PersonalWeeklyScheduleDayDto> buildWeeklySchedule(Long stylistId, LocalDate queryDate) {
        LocalDate monday = queryDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        Map<LocalDate, StaffScheduleEntity> wsMap = staffScheduleRepository
                .findByUserIdAndScheduleDateBetweenAndIsDeletedFalseOrderByScheduleDateAsc(stylistId, monday, monday.plusDays(6))
                .stream().collect(Collectors.toMap(StaffScheduleEntity::getScheduleDate, s -> s, (s1, s2) -> s1));
        Map<LocalDate, StaffAttendanceEntity> waMap = staffAttendanceRepository
                .findByUserIdAndAttendanceDateBetweenAndIsDeletedFalseOrderByAttendanceDateAsc(stylistId, monday, monday.plusDays(6))
                .stream().collect(Collectors.toMap(StaffAttendanceEntity::getAttendanceDate, a -> a, (a1, a2) -> a1));

        List<PersonalWeeklyScheduleDayDto> weeklyScheduleList = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate d = monday.plusDays(i);
            weeklyScheduleList.add(buildSingleWeekDayDto(d, DAY_NAMES[i], wsMap.get(d), waMap.get(d)));
        }
        return weeklyScheduleList;
    }

    private PersonalWeeklyScheduleDayDto buildSingleWeekDayDto(
            LocalDate date,
            String dayOfWeek,
            StaffScheduleEntity s,
            StaffAttendanceEntity a) {

        boolean isOff = s != null && s.getStatus() == StaffScheduleStatus.OFF;
        boolean hasTemplate = s != null && s.getShiftTemplate() != null;
        String sc = hasTemplate ? s.getShiftTemplate().getCode() : (isOff ? "OFF" : "FULL_DAY");
        String sn = hasTemplate ? s.getShiftTemplate().getName() : (isOff ? "Nghỉ (OFF)" : "Ca Cả ngày");
        LocalTime st = hasTemplate ? s.getShiftTemplate().getStartTime() : ("OFF".equals(sc) ? null : LocalTime.of(8, 30));
        LocalTime et = hasTemplate ? s.getShiftTemplate().getEndTime() : ("OFF".equals(sc) ? null : LocalTime.of(20, 30));
        Boolean iw = s != null ? (s.getStatus() == StaffScheduleStatus.WORKING) : true;
        String as = (a != null && a.getStatus() != null) ? a.getStatus().name() : null;

        return PersonalWeeklyScheduleDayDto.builder()
                .date(date)
                .dayOfWeek(dayOfWeek)
                .shiftCode(sc)
                .shiftName(sn)
                .shiftStartTime(st)
                .shiftEndTime(et)
                .isWorking(iw)
                .attendanceStatus(as)
                .build();
    }
}
