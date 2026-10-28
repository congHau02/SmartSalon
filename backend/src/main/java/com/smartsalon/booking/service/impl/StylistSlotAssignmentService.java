package com.smartsalon.booking.service.impl;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.booking.service.RedisLockService;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.shift.entity.StaffAttendanceEntity;
import com.smartsalon.shift.entity.StaffScheduleEntity;
import com.smartsalon.shift.repository.StaffAttendanceRepository;
import com.smartsalon.shift.repository.StaffScheduleRepository;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class StylistSlotAssignmentService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final StaffScheduleRepository staffScheduleRepository;
    private final StaffAttendanceRepository staffAttendanceRepository;
    private final RedisLockService redisLockService;

    public UserEntity assignAndLockStylist(
            BranchEntity branch,
            Long requestedStylistId,
            LocalDateTime startTime,
            LocalDateTime endTime,
            LocalDateTime now,
            String bookingCode) {

        LocalDate bookingDate = startTime.toLocalDate();
        List<StaffScheduleEntity> schedules = staffScheduleRepository
                .findByBranchIdAndScheduleDateAndIsDeletedFalse(branch.getId(), bookingDate);
        List<StaffAttendanceEntity> attendances = staffAttendanceRepository
                .findByBranchIdAndAttendanceDateAndIsDeletedFalse(branch.getId(), bookingDate);

        RosterSnapshot roster = new RosterSnapshot(
                bookingDate,
                startTime.toLocalTime(),
                endTime.toLocalTime(),
                !schedules.isEmpty(),
                mapSchedulesByUser(schedules),
                mapAttendancesByUser(attendances)
        );

        if (requestedStylistId != null) {
            return assignExplicitStylist(branch, requestedStylistId, startTime, endTime, now, bookingCode, roster);
        }
        return assignAutoStylist(branch, startTime, endTime, now, bookingCode, roster);
    }

    public void unlockStylistSlots(UserEntity staff, LocalDateTime startTime, LocalDateTime endTime) {
        if (staff != null) {
            redisLockService.unlockSlots(staff.getId(), startTime, endTime);
        }
    }

    private UserEntity assignExplicitStylist(
            BranchEntity branch,
            Long stylistId,
            LocalDateTime startTime,
            LocalDateTime endTime,
            LocalDateTime now,
            String bookingCode,
            RosterSnapshot roster) {

        UserEntity stylist = userRepository.findById(stylistId)
                .filter(u -> u.isActive() && !u.isDeleted())
                .orElseThrow(() -> new AppException(ErrorCode.STYLIST_NOT_FOUND));

        boolean isStylist = stylist.getRoles().stream().anyMatch(r -> "STYLIST".equals(r.getName()));
        if (!isStylist) {
            throw new AppException(ErrorCode.STYLIST_NOT_FOUND);
        }
        if (stylist.getBranch() != null && !stylist.getBranch().getId().equals(branch.getId())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }
        if (!isStylistEligibleForShift(stylist.getId(), roster)) {
            throw new AppException(ErrorCode.SLOT_NOT_AVAILABLE);
        }
        if (!bookingRepository.findOverlappingBookingsForStylist(stylist.getId(), startTime, endTime, now).isEmpty()) {
            throw new AppException(ErrorCode.SLOT_NOT_AVAILABLE);
        }
        if (!redisLockService.tryLockSlots(stylist.getId(), startTime, endTime, bookingCode)) {
            throw new AppException(ErrorCode.SLOT_ALREADY_LOCKED);
        }
        return stylist;
    }

    private UserEntity assignAutoStylist(
            BranchEntity branch,
            LocalDateTime startTime,
            LocalDateTime endTime,
            LocalDateTime now,
            String bookingCode,
            RosterSnapshot roster) {

        List<UserEntity> activeStylists = userRepository.findActiveStylistsByBranchId(branch.getId());
        if (activeStylists.isEmpty()) {
            throw new AppException(ErrorCode.STYLIST_NOT_FOUND);
        }

        List<UserEntity> freeStylists = activeStylists.stream()
                .filter(s -> isStylistEligibleForShift(s.getId(), roster))
                .filter(s -> bookingRepository.findOverlappingBookingsForStylist(s.getId(), startTime, endTime, now).isEmpty())
                .filter(s -> !redisLockService.isAnySlotLocked(s.getId(), startTime, endTime))
                .toList();

        if (freeStylists.isEmpty()) {
            throw new AppException(ErrorCode.SLOT_NOT_AVAILABLE);
        }

        Map<Long, Integer> workload = calculateStylistWorkload(branch.getId(), startTime.toLocalDate(), now);
        List<UserEntity> sortedCandidates = freeStylists.stream()
                .sorted(Comparator.comparingInt(s -> workload.getOrDefault(s.getId(), 0)))
                .toList();

        for (UserEntity candidate : sortedCandidates) {
            if (redisLockService.tryLockSlots(candidate.getId(), startTime, endTime, bookingCode)) {
                return candidate;
            }
        }
        throw new AppException(ErrorCode.SLOT_ALREADY_LOCKED);
    }

    private Map<Long, Integer> calculateStylistWorkload(Long branchId, LocalDate date, LocalDateTime now) {
        LocalDateTime dayStart = date.atTime(SlotCalculationServiceImpl.OPENING_TIME);
        LocalDateTime dayEnd = date.atTime(SlotCalculationServiceImpl.CLOSING_TIME);
        List<BookingEntity> dayBookings = bookingRepository.findActiveBookingsByBranchAndDay(branchId, dayStart, dayEnd, now);
        Map<Long, Integer> workload = new HashMap<>();
        for (BookingEntity b : dayBookings) {
            if (b.getStaff() != null) {
                workload.merge(b.getStaff().getId(), b.getTotalDurationMinutes(), Integer::sum);
            }
        }
        return workload;
    }

    private boolean isStylistEligibleForShift(Long stylistId, RosterSnapshot roster) {
        return ShiftSlotEligibilityHelper.isEligible(
                stylistId,
                roster.slotStart(),
                roster.slotEnd(),
                roster.bookingDate(),
                roster.hasBranchRoster(),
                roster.scheduleByStylist(),
                roster.attendanceByStylist(),
                LocalDate.now(),
                LocalTime.now()
        );
    }

    private Map<Long, StaffScheduleEntity> mapSchedulesByUser(List<StaffScheduleEntity> schedules) {
        return schedules.stream()
                .filter(s -> s.getUser() != null)
                .collect(Collectors.toMap(s -> s.getUser().getId(), s -> s, (s1, s2) -> s1));
    }

    private Map<Long, StaffAttendanceEntity> mapAttendancesByUser(List<StaffAttendanceEntity> attendances) {
        return attendances.stream()
                .filter(a -> a.getUser() != null)
                .collect(Collectors.toMap(a -> a.getUser().getId(), a -> a, (a1, a2) -> a1));
    }

    private record RosterSnapshot(
            LocalDate bookingDate,
            LocalTime slotStart,
            LocalTime slotEnd,
            boolean hasBranchRoster,
            Map<Long, StaffScheduleEntity> scheduleByStylist,
            Map<Long, StaffAttendanceEntity> attendanceByStylist
    ) {}
}
