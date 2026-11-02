package com.smartsalon.booking.service.impl;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.event.BookingRescheduledEvent;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.booking.service.BookingRescheduleService;
import com.smartsalon.booking.service.RedisLockService;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.shift.entity.StaffAttendanceEntity;
import com.smartsalon.shift.entity.StaffScheduleEntity;
import com.smartsalon.shift.repository.StaffAttendanceRepository;
import com.smartsalon.shift.repository.StaffScheduleRepository;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingRescheduleServiceImpl implements BookingRescheduleService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final StaffScheduleRepository staffScheduleRepository;
    private final StaffAttendanceRepository staffAttendanceRepository;
    private final RedisLockService redisLockService;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingEntity rescheduleGuestBooking(
            com.smartsalon.booking.dto.GuestRescheduleRequest request,
            LocalDateTime now) {
        if (request == null || request.phone() == null || request.phone().isBlank()
                || request.bookingCode() == null || request.bookingCode().isBlank()) {
            throw new AppException(ErrorCode.BOOKING_NOT_FOUND);
        }
        String cleanPhone = request.phone().trim();
        String cleanCode = request.bookingCode().trim();
        BookingEntity booking = bookingRepository
                .findByCustomerPhoneAndBookingCodeAndIsDeletedFalse(cleanPhone, cleanCode)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        return rescheduleBooking(booking, request.newBookingTime(), request.stylistId(), now);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingEntity rescheduleBooking(
            BookingEntity booking,
            LocalDateTime newBookingTime,
            Long requestedStylistId,
            LocalDateTime now) {

        if (booking == null) {
            throw new AppException(ErrorCode.BOOKING_NOT_FOUND);
        }
        LocalDateTime refNow = now != null ? now : LocalDateTime.now();

        // 1. Validate entity reschedule rules
        booking.validateRescheduleEligibility(refNow);

        int totalDuration = Math.max(30, booking.getTotalDurationMinutes());
        LocalDateTime newEndTime = newBookingTime.plusMinutes(totalDuration);
        validateSlotOperatingWindow(newBookingTime, newEndTime, refNow);

        // 2. Resolve stylist (requested or Least-Workload, shift-eligible)
        UserEntity assignedStylist = resolveStylist(booking, newBookingTime, newEndTime, requestedStylistId, refNow);

        // 3. Acquire new multi-bucket slot lock via Redis
        boolean lockAcquired = redisLockService.tryLockSlots(
                assignedStylist.getId(), newBookingTime, newEndTime, booking.getBookingCode());
        if (!lockAcquired) {
            throw new AppException(ErrorCode.SLOT_NOT_AVAILABLE);
        }

        // Capture previous slot info before entity mutation
        Long oldStaffId = booking.getStaff() != null ? booking.getStaff().getId() : null;
        LocalDateTime oldStartTime = booking.getBookingTime();
        LocalDateTime oldEndTime = booking.getEndTime();

        // 4. Persist booking mutation
        booking.reschedule(newBookingTime, newEndTime, assignedStylist, requestedStylistId != null, refNow);

        BookingEntity savedBooking;
        try {
            savedBooking = bookingRepository.save(booking);
        } catch (Exception ex) {
            log.error("Failed to persist rescheduled booking {}, releasing new slot lock", booking.getBookingCode(), ex);
            redisLockService.unlockSlots(assignedStylist.getId(), newBookingTime, newEndTime);
            throw ex;
        }

        // 5. Register after-commit hook: release old keys, broadcast, publish domain event
        registerPostCommitActions(savedBooking, oldStaffId, oldStartTime, oldEndTime,
                assignedStylist.getId(), newBookingTime, newEndTime);

        return savedBooking;
    }

    private void validateSlotOperatingWindow(LocalDateTime startTime, LocalDateTime endTime, LocalDateTime now) {
        if (startTime.isBefore(now)) {
            throw new AppException(ErrorCode.SLOT_NOT_AVAILABLE);
        }
        LocalTime openTime = SlotCalculationServiceImpl.OPENING_TIME;
        LocalTime closeTime = SlotCalculationServiceImpl.CLOSING_TIME;
        if (startTime.toLocalTime().isBefore(openTime) || endTime.toLocalTime().isAfter(closeTime)
                || !endTime.toLocalDate().isEqual(startTime.toLocalDate())) {
            throw new AppException(ErrorCode.SLOT_NOT_AVAILABLE);
        }
    }

    private UserEntity resolveStylist(
            BookingEntity booking,
            LocalDateTime startTime,
            LocalDateTime endTime,
            Long requestedStylistId,
            LocalDateTime now) {

        Long branchId = booking.getBranch().getId();
        LocalDate bookingDate = startTime.toLocalDate();

        List<StaffScheduleEntity> schedules = staffScheduleRepository
                .findByBranchIdAndScheduleDateAndIsDeletedFalse(branchId, bookingDate);
        List<StaffAttendanceEntity> attendances = staffAttendanceRepository
                .findByBranchIdAndAttendanceDateAndIsDeletedFalse(branchId, bookingDate);

        Map<Long, StaffScheduleEntity> scheduleMap = schedules.stream()
                .filter(s -> s.getUser() != null)
                .collect(Collectors.toMap(s -> s.getUser().getId(), s -> s, (s1, s2) -> s1));

        Map<Long, StaffAttendanceEntity> attendanceMap = attendances.stream()
                .filter(a -> a.getUser() != null)
                .collect(Collectors.toMap(a -> a.getUser().getId(), a -> a, (a1, a2) -> a1));

        boolean hasBranchRoster = !schedules.isEmpty();

        if (requestedStylistId != null) {
            return resolveExplicitStylist(booking, requestedStylistId, startTime, endTime, now,
                    bookingDate, hasBranchRoster, scheduleMap, attendanceMap);
        }
        return resolveAutoStylist(booking, startTime, endTime, now,
                bookingDate, hasBranchRoster, scheduleMap, attendanceMap);
    }

    private UserEntity resolveExplicitStylist(
            BookingEntity booking,
            Long requestedStylistId,
            LocalDateTime startTime,
            LocalDateTime endTime,
            LocalDateTime now,
            LocalDate bookingDate,
            boolean hasBranchRoster,
            Map<Long, StaffScheduleEntity> scheduleMap,
            Map<Long, StaffAttendanceEntity> attendanceMap) {

        UserEntity stylist = userRepository.findById(requestedStylistId)
                .filter(u -> u.isActive() && !u.isDeleted())
                .orElseThrow(() -> new AppException(ErrorCode.STYLIST_NOT_FOUND));

        boolean isStylist = stylist.getRoles().stream().anyMatch(r -> "STYLIST".equals(r.getName()));
        if (!isStylist) {
            throw new AppException(ErrorCode.STYLIST_NOT_FOUND);
        }
        if (stylist.getBranch() != null && !stylist.getBranch().getId().equals(booking.getBranch().getId())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        boolean eligibleForShift = ShiftSlotEligibilityHelper.isEligible(
                stylist.getId(),
                startTime.toLocalTime(),
                endTime.toLocalTime(),
                bookingDate,
                hasBranchRoster,
                scheduleMap,
                attendanceMap,
                now.toLocalDate(),
                now.toLocalTime()
        );
        if (!eligibleForShift) {
            throw new AppException(ErrorCode.STYLIST_OFF_SHIFT);
        }

        List<BookingEntity> overlaps = bookingRepository.findOverlappingBookingsForStylistExcluding(
                stylist.getId(), startTime, endTime, now, booking.getId());
        if (!overlaps.isEmpty()) {
            throw new AppException(ErrorCode.SLOT_NOT_AVAILABLE);
        }
        return stylist;
    }

    private UserEntity resolveAutoStylist(
            BookingEntity booking,
            LocalDateTime startTime,
            LocalDateTime endTime,
            LocalDateTime now,
            LocalDate bookingDate,
            boolean hasBranchRoster,
            Map<Long, StaffScheduleEntity> scheduleMap,
            Map<Long, StaffAttendanceEntity> attendanceMap) {

        Long branchId = booking.getBranch().getId();
        List<UserEntity> activeStylists = userRepository.findActiveStylistsByBranchId(branchId);
        if (activeStylists.isEmpty()) {
            throw new AppException(ErrorCode.STYLIST_NOT_FOUND);
        }

        List<UserEntity> eligibleCandidates = activeStylists.stream()
                .filter(s -> ShiftSlotEligibilityHelper.isEligible(
                        s.getId(),
                        startTime.toLocalTime(),
                        endTime.toLocalTime(),
                        bookingDate,
                        hasBranchRoster,
                        scheduleMap,
                        attendanceMap,
                        now.toLocalDate(),
                        now.toLocalTime()
                ))
                .filter(s -> bookingRepository.findOverlappingBookingsForStylistExcluding(
                        s.getId(), startTime, endTime, now, booking.getId()).isEmpty())
                .filter(s -> !redisLockService.isAnySlotLocked(s.getId(), startTime, endTime))
                .toList();

        if (eligibleCandidates.isEmpty()) {
            throw new AppException(ErrorCode.SLOT_NOT_AVAILABLE);
        }

        Map<Long, Integer> workload = calculateStylistWorkload(branchId, bookingDate, now);
        return eligibleCandidates.stream()
                .min(Comparator.comparingInt(s -> workload.getOrDefault(s.getId(), 0)))
                .orElse(eligibleCandidates.get(0));
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

    private void registerPostCommitActions(
            BookingEntity savedBooking, Long oldStaffId, LocalDateTime oldStartTime, LocalDateTime oldEndTime,
            Long newStaffId, LocalDateTime newStartTime, LocalDateTime newEndTime) {

        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    executePostCommit(savedBooking, oldStaffId, oldStartTime, oldEndTime);
                }

                @Override
                public void afterCompletion(int status) {
                    if (status != STATUS_COMMITTED) {
                        redisLockService.unlockSlots(newStaffId, newStartTime, newEndTime);
                    }
                }
            });
        } else {
            executePostCommit(savedBooking, oldStaffId, oldStartTime, oldEndTime);
        }
    }

    private void executePostCommit(BookingEntity savedBooking, Long oldStaffId,
            LocalDateTime oldStartTime, LocalDateTime oldEndTime) {

        if (oldStaffId != null && oldStartTime != null && oldEndTime != null) {
            redisLockService.unlockSlots(oldStaffId, oldStartTime, oldEndTime);
        }
        eventPublisher.publishEvent(new BookingRescheduledEvent(savedBooking.getId()));
    }
}
