package com.smartsalon.shift.service.impl;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.security.BranchScopeGuard;
import com.smartsalon.shift.dto.*;
import com.smartsalon.shift.entity.*;
import com.smartsalon.shift.repository.ShiftTemplateRepository;
import com.smartsalon.shift.repository.StaffAttendanceRepository;
import com.smartsalon.shift.repository.StaffScheduleRepository;
import com.smartsalon.shift.service.ShiftService;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShiftServiceImpl implements ShiftService {

    private static final LocalTime BRANCH_CLOSING_TIME = LocalTime.of(20, 30);

    private final ShiftTemplateRepository shiftTemplateRepository;
    private final StaffScheduleRepository staffScheduleRepository;
    private final StaffAttendanceRepository staffAttendanceRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final BranchScopeGuard branchScopeGuard;

    @Override
    @Transactional(readOnly = true)
    public List<ShiftTemplateResponse> getTemplates(Long branchId) {
        Long effectiveBranchId = branchScopeGuard.getEffectiveBranchId(branchId);
        branchScopeGuard.checkBranchAccess(effectiveBranchId);

        return shiftTemplateRepository.findByBranchIdAndIsDeletedFalseOrderByStartTimeAsc(effectiveBranchId)
                .stream()
                .map(this::mapTemplateToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ShiftTemplateResponse createTemplate(ShiftTemplateRequest request) {
        branchScopeGuard.checkBranchAccess(request.getBranchId());

        BranchEntity branch = branchRepository.findByIdAndIsDeletedFalse(request.getBranchId())
                .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));

        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Giờ bắt đầu phải trước giờ kết thúc ca làm việc");
        }

        String code = request.getCode().trim().toUpperCase();
        if (shiftTemplateRepository.findByBranchIdAndCodeAndIsDeletedFalse(request.getBranchId(), code).isPresent()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Mã ca làm việc '" + code + "' đã tồn tại tại chi nhánh này");
        }

        ShiftTemplateEntity entity = ShiftTemplateEntity.builder()
                .branch(branch)
                .code(code)
                .name(request.getName().trim())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .maxOvertimeMinutes(Math.max(0, request.getMaxOvertimeMinutes()))
                .isActive(request.getIsActive() == null || request.getIsActive())
                .build();

        ShiftTemplateEntity saved = shiftTemplateRepository.save(entity);
        return mapTemplateToResponse(saved);
    }

    @Override
    @Transactional
    public ShiftTemplateResponse updateTemplate(Long id, ShiftTemplateRequest request) {
        ShiftTemplateEntity entity = shiftTemplateRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.SHIFT_TEMPLATE_NOT_FOUND));

        branchScopeGuard.checkBranchAccess(entity.getBranch().getId());
        if (request.getBranchId() != null) {
            branchScopeGuard.checkBranchAccess(request.getBranchId());
        }

        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Giờ bắt đầu phải trước giờ kết thúc ca làm việc");
        }

        String code = request.getCode().trim().toUpperCase();
        if (shiftTemplateRepository.existsByBranchIdAndCodeAndIdNotAndIsDeletedFalse(entity.getBranch().getId(), code, id)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Mã ca làm việc '" + code + "' đã tồn tại tại chi nhánh này");
        }

        entity.setCode(code);
        entity.setName(request.getName().trim());
        entity.setStartTime(request.getStartTime());
        entity.setEndTime(request.getEndTime());
        entity.setMaxOvertimeMinutes(Math.max(0, request.getMaxOvertimeMinutes()));
        if (request.getIsActive() != null) {
            entity.setActive(request.getIsActive());
        }

        ShiftTemplateEntity updated = shiftTemplateRepository.save(entity);
        return mapTemplateToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public WeeklyRosterResponse getWeeklyRoster(Long branchId, LocalDate startDate, LocalDate endDate) {
        Long effectiveBranchId = branchScopeGuard.getEffectiveBranchId(branchId);
        branchScopeGuard.checkBranchAccess(effectiveBranchId);

        BranchEntity branch = branchRepository.findByIdAndIsDeletedFalse(effectiveBranchId)
                .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));

        LocalDate effectiveStart = (startDate != null)
                ? startDate
                : LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate effectiveEnd = (endDate != null)
                ? endDate
                : effectiveStart.plusDays(6);

        if (effectiveEnd.isBefore(effectiveStart)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Ngày kết thúc không được trước ngày bắt đầu");
        }

        List<ShiftTemplateResponse> templates = shiftTemplateRepository
                .findByBranchIdAndIsActiveTrueAndIsDeletedFalseOrderByStartTimeAsc(effectiveBranchId)
                .stream()
                .map(this::mapTemplateToResponse)
                .collect(Collectors.toList());

        List<UserEntity> staffMembers = userRepository.findActiveStaffByBranchId(effectiveBranchId);

        List<StaffScheduleEntity> schedules = staffScheduleRepository
                .findSchedulesForRoster(effectiveBranchId, effectiveStart, effectiveEnd);

        List<StaffAttendanceEntity> attendances = staffAttendanceRepository
                .findByBranchIdAndAttendanceDateBetweenAndIsDeletedFalse(effectiveBranchId, effectiveStart, effectiveEnd);

        Map<String, StaffScheduleEntity> scheduleMap = new HashMap<>();
        for (StaffScheduleEntity s : schedules) {
            scheduleMap.put(s.getUser().getId() + "_" + s.getScheduleDate(), s);
        }

        Map<String, StaffAttendanceEntity> attendanceMap = new HashMap<>();
        for (StaffAttendanceEntity a : attendances) {
            attendanceMap.put(a.getUser().getId() + "_" + a.getAttendanceDate(), a);
        }

        List<StaffRosterRowResponse> staffRows = new ArrayList<>();
        for (UserEntity staff : staffMembers) {
            String roleName = staff.getRoles().stream()
                    .filter(r -> "STYLIST".equals(r.getName()) || "STAFF".equals(r.getName()))
                    .findFirst()
                    .map(r -> r.getName())
                    .orElse("STAFF");

            List<DailyScheduleCellResponse> cells = new ArrayList<>();
            LocalDate cur = effectiveStart;
            while (!cur.isAfter(effectiveEnd)) {
                String key = staff.getId() + "_" + cur;
                StaffScheduleEntity sched = scheduleMap.get(key);
                StaffAttendanceEntity att = attendanceMap.get(key);

                StaffAttendanceSummaryDto attDto = null;
                if (att != null) {
                    attDto = StaffAttendanceSummaryDto.builder()
                            .id(att.getId())
                            .status(att.getStatus().name())
                            .clockInAt(att.getClockInAt())
                            .breakStartAt(att.getBreakStartAt())
                            .breakEndAt(att.getBreakEndAt())
                            .clockOutAt(att.getClockOutAt())
                            .overtimeMinutes(att.getOvertimeMinutes())
                            .build();
                }

                DailyScheduleCellResponse cell;
                if (sched != null) {
                    ShiftTemplateEntity tmpl = sched.getShiftTemplate();
                    cell = DailyScheduleCellResponse.builder()
                            .scheduleId(sched.getId())
                            .date(cur)
                            .status(sched.getStatus().name())
                            .shiftTemplateId(tmpl != null ? tmpl.getId() : null)
                            .shiftTemplateCode(tmpl != null ? tmpl.getCode() : null)
                            .shiftTemplateName(tmpl != null ? tmpl.getName() : null)
                            .startTime(tmpl != null ? tmpl.getStartTime() : null)
                            .endTime(tmpl != null ? tmpl.getEndTime() : null)
                            .maxOvertimeMinutes(tmpl != null ? tmpl.getMaxOvertimeMinutes() : 0)
                            .notes(sched.getNotes())
                            .attendance(attDto)
                            .build();
                } else {
                    cell = DailyScheduleCellResponse.builder()
                            .scheduleId(null)
                            .date(cur)
                            .status("OFF")
                            .shiftTemplateId(null)
                            .shiftTemplateCode(null)
                            .shiftTemplateName(null)
                            .startTime(null)
                            .endTime(null)
                            .maxOvertimeMinutes(0)
                            .notes(null)
                            .attendance(attDto)
                            .build();
                }
                cells.add(cell);
                cur = cur.plusDays(1);
            }

            staffRows.add(StaffRosterRowResponse.builder()
                    .userId(staff.getId())
                    .username(staff.getUsername())
                    .fullName(staff.getFullName())
                    .role(roleName)
                    .avatarUrl(staff.getAvatarUrl())
                    .schedules(cells)
                    .build());
        }

        return WeeklyRosterResponse.builder()
                .branchId(effectiveBranchId)
                .branchName(branch.getName())
                .startDate(effectiveStart)
                .endDate(effectiveEnd)
                .templates(templates)
                .staff(staffRows)
                .build();
    }

    @Override
    @Transactional
    public List<DailyScheduleCellResponse> updateRoster(UpdateRosterRequest request) {
        branchScopeGuard.checkBranchAccess(request.getBranchId());

        BranchEntity branch = branchRepository.findByIdAndIsDeletedFalse(request.getBranchId())
                .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));

        List<ConflictingBookingDto> conflicts = new ArrayList<>();
        Map<Long, ShiftTemplateEntity> templateCache = new HashMap<>();

        // 1. Conflict Guard Check for each requested cell
        for (UpdateRosterCellRequest cell : request.getCells()) {
            UserEntity staff = userRepository.findByIdAndIsDeletedFalse(cell.getUserId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            StaffScheduleStatus targetStatus;
            try {
                targetStatus = StaffScheduleStatus.valueOf(cell.getStatus().trim().toUpperCase());
            } catch (Exception e) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Trạng thái ca trực phải là WORKING hoặc OFF");
            }

            ShiftTemplateEntity template = null;
            if (targetStatus == StaffScheduleStatus.WORKING) {
                if (cell.getShiftTemplateId() == null) {
                    throw new AppException(ErrorCode.VALIDATION_ERROR, "Vui lòng chọn Mẫu ca làm việc khi đặt trạng thái ca trực là WORKING");
                }
                template = templateCache.computeIfAbsent(cell.getShiftTemplateId(), id ->
                        shiftTemplateRepository.findByIdAndIsDeletedFalse(id)
                                .orElseThrow(() -> new AppException(ErrorCode.SHIFT_TEMPLATE_NOT_FOUND))
                );
                if (!template.getBranch().getId().equals(request.getBranchId())) {
                    throw new AppException(ErrorCode.FORBIDDEN, "Mẫu ca làm việc không thuộc chi nhánh được yêu cầu");
                }
            }

            // Inspect active bookings for the stylist on this schedule date
            LocalDateTime dayStart = cell.getScheduleDate().atStartOfDay();
            LocalDateTime dayEnd = cell.getScheduleDate().plusDays(1).atStartOfDay();
            List<BookingEntity> activeBookings = bookingRepository.findActiveBookingsByStylistAndDay(
                    staff.getId(), dayStart, dayEnd, LocalDateTime.now());

            if (!activeBookings.isEmpty()) {
                if (targetStatus == StaffScheduleStatus.OFF) {
                    for (BookingEntity b : activeBookings) {
                        conflicts.add(ConflictingBookingDto.builder()
                                .bookingCode(b.getBookingCode())
                                .customerName(b.getCustomerName())
                                .customerPhone(b.getCustomerPhone())
                                .startTime(b.getBookingTime())
                                .endTime(b.getEndTime())
                                .reason("Stylist chuyển sang nghỉ (OFF) nhưng có lịch hẹn " + b.getBookingCode()
                                        + " (" + b.getBookingTime().toLocalTime() + " - " + b.getEndTime().toLocalTime() + ")")
                                .build());
                    }
                } else if (template != null) {
                    LocalTime shiftStart = template.getStartTime();
                    LocalTime shiftEnd = template.getEndTime();
                    LocalTime maxAllowedEnd = shiftEnd.plusMinutes(template.getMaxOvertimeMinutes());
                    if (maxAllowedEnd.isAfter(BRANCH_CLOSING_TIME)) {
                        maxAllowedEnd = BRANCH_CLOSING_TIME;
                    }

                    for (BookingEntity b : activeBookings) {
                        LocalTime bStart = b.getBookingTime().toLocalTime();
                        LocalTime bEnd = b.getEndTime().toLocalTime();

                        boolean startsBeforeShift = bStart.isBefore(shiftStart);
                        boolean startsAfterShift = !bStart.isBefore(shiftEnd);
                        boolean endsPastOvertime = bEnd.isAfter(maxAllowedEnd);

                        if (startsBeforeShift || startsAfterShift || endsPastOvertime) {
                            String reason;
                            if (startsBeforeShift) {
                                reason = "Lịch hẹn bắt đầu lúc " + bStart + " trước giờ vào ca " + shiftStart;
                            } else if (startsAfterShift) {
                                reason = "Lịch hẹn bắt đầu lúc " + bStart + " sau giờ kết thúc ca " + shiftEnd;
                            } else {
                                reason = "Lịch hẹn kết thúc lúc " + bEnd + " vượt quá giới hạn làm thêm " + maxAllowedEnd;
                            }

                            conflicts.add(ConflictingBookingDto.builder()
                                    .bookingCode(b.getBookingCode())
                                    .customerName(b.getCustomerName())
                                    .customerPhone(b.getCustomerPhone())
                                    .startTime(b.getBookingTime())
                                    .endTime(b.getEndTime())
                                    .reason(reason)
                                    .build());
                        }
                    }
                }
            }
        }

        // If conflicts detected, abort and return HTTP 409 Conflict with details
        if (!conflicts.isEmpty()) {
            String conflictMsg = "Không thể cập nhật lịch trực: Phát hiện " + conflicts.size()
                    + " lịch hẹn đang hoạt động bị xung đột. Vui lòng điều phối lại lịch hẹn trên Dispatch Board trước.";
            throw new AppException(ErrorCode.SHIFT_BOOKING_CONFLICT, conflictMsg, conflicts);
        }

        // 2. Persist the updated cells
        List<DailyScheduleCellResponse> results = new ArrayList<>();
        for (UpdateRosterCellRequest cell : request.getCells()) {
            UserEntity staff = userRepository.findByIdAndIsDeletedFalse(cell.getUserId()).orElseThrow();
            StaffScheduleStatus targetStatus = StaffScheduleStatus.valueOf(cell.getStatus().trim().toUpperCase());
            ShiftTemplateEntity template = (targetStatus == StaffScheduleStatus.WORKING)
                    ? templateCache.get(cell.getShiftTemplateId())
                    : null;

            StaffScheduleEntity schedule = staffScheduleRepository
                    .findByUserIdAndScheduleDateAndIsDeletedFalse(staff.getId(), cell.getScheduleDate())
                    .orElse(null);

            if (schedule == null) {
                schedule = StaffScheduleEntity.builder()
                        .branch(branch)
                        .user(staff)
                        .scheduleDate(cell.getScheduleDate())
                        .status(targetStatus)
                        .shiftTemplate(template)
                        .notes(cell.getNotes())
                        .build();
            } else {
                schedule.setStatus(targetStatus);
                schedule.setShiftTemplate(template);
                schedule.setNotes(cell.getNotes());
            }

            StaffScheduleEntity saved = staffScheduleRepository.save(schedule);

            results.add(DailyScheduleCellResponse.builder()
                    .scheduleId(saved.getId())
                    .date(saved.getScheduleDate())
                    .status(saved.getStatus().name())
                    .shiftTemplateId(template != null ? template.getId() : null)
                    .shiftTemplateCode(template != null ? template.getCode() : null)
                    .shiftTemplateName(template != null ? template.getName() : null)
                    .startTime(template != null ? template.getStartTime() : null)
                    .endTime(template != null ? template.getEndTime() : null)
                    .maxOvertimeMinutes(template != null ? template.getMaxOvertimeMinutes() : 0)
                    .notes(saved.getNotes())
                    .build());
        }

        return results;
    }

    @Override
    @Transactional
    public int copyWeekRoster(CopyWeekRosterRequest request) {
        branchScopeGuard.checkBranchAccess(request.getBranchId());

        BranchEntity branch = branchRepository.findByIdAndIsDeletedFalse(request.getBranchId())
                .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));

        LocalDate sourceStart = request.getSourceStartDate();
        LocalDate sourceEnd = sourceStart.plusDays(6);
        LocalDate targetStart = request.getTargetStartDate();

        if (sourceStart.equals(targetStart)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Tuần đích không được trùng với tuần nguồn");
        }

        List<StaffScheduleEntity> sourceSchedules = staffScheduleRepository
                .findSchedulesForRoster(request.getBranchId(), sourceStart, sourceEnd);

        if (sourceSchedules.isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Tuần nguồn không có dữ liệu lịch trực để sao chép");
        }

        // Build update requests for the target week and run the exact same Conflict Guard
        List<UpdateRosterCellRequest> targetCells = new ArrayList<>();
        for (StaffScheduleEntity src : sourceSchedules) {
            long dayOffset = ChronoUnit.DAYS.between(sourceStart, src.getScheduleDate());
            LocalDate targetDate = targetStart.plusDays(dayOffset);

            targetCells.add(UpdateRosterCellRequest.builder()
                    .userId(src.getUser().getId())
                    .scheduleDate(targetDate)
                    .status(src.getStatus().name())
                    .shiftTemplateId(src.getShiftTemplate() != null ? src.getShiftTemplate().getId() : null)
                    .notes(src.getNotes())
                    .build());
        }

        UpdateRosterRequest updateReq = UpdateRosterRequest.builder()
                .branchId(request.getBranchId())
                .cells(targetCells)
                .build();

        List<DailyScheduleCellResponse> saved = updateRoster(updateReq);
        return saved.size();
    }

    private ShiftTemplateResponse mapTemplateToResponse(ShiftTemplateEntity entity) {
        return ShiftTemplateResponse.builder()
                .id(entity.getId())
                .branchId(entity.getBranch().getId())
                .code(entity.getCode())
                .name(entity.getName())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .maxOvertimeMinutes(entity.getMaxOvertimeMinutes())
                .isActive(entity.isActive())
                .build();
    }
}
