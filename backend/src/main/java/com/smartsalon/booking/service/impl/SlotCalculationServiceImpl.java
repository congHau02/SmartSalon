package com.smartsalon.booking.service.impl;

import com.smartsalon.booking.dto.AvailableSlotsResponse;
import com.smartsalon.booking.dto.SlotDto;
import com.smartsalon.booking.dto.SlotStatus;
import com.smartsalon.booking.dto.StylistDto;
import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.booking.service.RedisLockService;
import com.smartsalon.booking.service.SlotCalculationService;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.review.repository.ServiceReviewRepository;
import com.smartsalon.shift.entity.StaffAttendanceEntity;
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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SlotCalculationServiceImpl implements SlotCalculationService {

    private final BranchRepository branchRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final RedisLockService redisLockService;
    private final ServiceReviewRepository serviceReviewRepository;
    private final StaffScheduleRepository staffScheduleRepository;
    private final StaffAttendanceRepository staffAttendanceRepository;

    public static final LocalTime OPENING_TIME = LocalTime.of(8, 30);
    public static final LocalTime CLOSING_TIME = LocalTime.of(20, 30);
    public static final int SLOT_INTERVAL_MINUTES = 30;
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    @Override
    public List<StylistDto> getActiveStylists(Long branchId) {
        return getActiveStylists(branchId, LocalDate.now());
    }

    @Override
    public List<StylistDto> getActiveStylists(Long branchId, LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();

        List<UserEntity> users;
        List<StaffScheduleEntity> branchSchedules;
        if (branchId != null) {
            users = userRepository.findActiveStylistsByBranchId(branchId);
            branchSchedules = staffScheduleRepository.findByBranchIdAndScheduleDateAndIsDeletedFalse(branchId, targetDate);
        } else {
            users = userRepository.findAllActiveStylists();
            branchSchedules = Collections.emptyList();
        }

        if (users.isEmpty()) {
            return Collections.emptyList();
        }

        boolean hasBranchRoster = !branchSchedules.isEmpty();
        Map<Long, StaffScheduleEntity> scheduleMap = branchSchedules.stream()
                .filter(s -> s.getUser() != null)
                .collect(Collectors.toMap(s -> s.getUser().getId(), s -> s, (s1, s2) -> s1));

        List<Long> stylistIds = users.stream().map(UserEntity::getId).toList();
        Map<Long, ServiceReviewRepository.StylistReviewStats> statsMap = serviceReviewRepository
                .getReviewStatsByStylistIds(stylistIds)
                .stream()
                .collect(Collectors.toMap(ServiceReviewRepository.StylistReviewStats::getStylistId, s -> s, (s1, s2) -> s1));

        return users.stream()
                .map(u -> {
                    ServiceReviewRepository.StylistReviewStats stats = statsMap.get(u.getId());
                    BigDecimal avgRating = (stats != null && stats.getAverageRating() != null)
                            ? BigDecimal.valueOf(stats.getAverageRating()).setScale(1, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO.setScale(1);
                    long reviewCount = (stats != null && stats.getReviewCount() != null)
                            ? stats.getReviewCount()
                            : 0L;

                    StaffScheduleEntity schedule = scheduleMap.get(u.getId());
                    String shiftCode = null;
                    String shiftName = null;
                    LocalTime shiftStart = null;
                    LocalTime shiftEnd = null;
                    Integer maxOvertime = 0;
                    Boolean isWorking = true;

                    if (schedule != null && schedule.getStatus() == StaffScheduleStatus.WORKING && schedule.getShiftTemplate() != null) {
                        shiftCode = schedule.getShiftTemplate().getCode();
                        shiftName = schedule.getShiftTemplate().getName();
                        shiftStart = schedule.getShiftTemplate().getStartTime();
                        shiftEnd = schedule.getShiftTemplate().getEndTime();
                        maxOvertime = schedule.getShiftTemplate().getMaxOvertimeMinutes();
                        isWorking = true;
                    } else if (schedule != null && schedule.getStatus() == StaffScheduleStatus.OFF) {
                        shiftCode = "OFF";
                        shiftName = "Nghỉ (OFF)";
                        shiftStart = null;
                        shiftEnd = null;
                        maxOvertime = 0;
                        isWorking = false;
                    } else if (hasBranchRoster) {
                        shiftCode = "OFF";
                        shiftName = "Không xếp ca";
                        shiftStart = null;
                        shiftEnd = null;
                        maxOvertime = 0;
                        isWorking = false;
                    } else {
                        // Far-future date fallback without published roster
                        shiftCode = "FULL_DAY";
                        shiftName = "Ca Cả ngày (Mặc định)";
                        shiftStart = OPENING_TIME;
                        shiftEnd = CLOSING_TIME;
                        maxOvertime = 0;
                        isWorking = true;
                    }

                    return new StylistDto(
                            u.getId(),
                            u.getBranch() != null ? u.getBranch().getId() : null,
                            u.getBranch() != null ? u.getBranch().getName() : null,
                            u.getFullName(),
                            u.getPhone(),
                            u.getAvatarUrl(),
                            avgRating,
                            reviewCount,
                            shiftCode,
                            shiftName,
                            shiftStart,
                            shiftEnd,
                            maxOvertime,
                            isWorking
                    );
                })
                .toList();
    }

    @Override
    public AvailableSlotsResponse calculateAvailableSlots(Long branchId, LocalDate date, List<Long> serviceIds, Long stylistId) {
        if (branchId == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }
        if (date == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }
        if (serviceIds == null || serviceIds.isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        BranchEntity branch = branchRepository.findByIdAndIsDeletedFalse(branchId)
                .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));

        List<ServiceEntity> services = serviceRepository.findAllByIdInAndIsDeletedFalseAndIsActiveTrue(serviceIds);
        if (services.size() != serviceIds.size()) {
            throw new AppException(ErrorCode.SERVICE_NOT_FOUND);
        }

        int totalDurationMinutes = services.stream().mapToInt(ServiceEntity::getDurationMinutes).sum();
        if (totalDurationMinutes <= 0) {
            totalDurationMinutes = SLOT_INTERVAL_MINUTES;
        }

        BigDecimal totalPrice = services.stream()
                .map(ServiceEntity::getBasePrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal depositAmount = BookingEntity.calculateDepositAmount(totalPrice);

        List<UserEntity> candidates;
        String stylistName;

        if (stylistId != null) {
            UserEntity stylist = userRepository.findById(stylistId)
                    .filter(u -> !u.isDeleted() && u.isActive())
                    .orElseThrow(() -> new AppException(ErrorCode.STYLIST_NOT_FOUND));

            boolean hasStylistRole = stylist.getRoles().stream()
                    .anyMatch(r -> "STYLIST".equals(r.getName()));
            if (!hasStylistRole) {
                throw new AppException(ErrorCode.STYLIST_NOT_FOUND);
            }
            if (stylist.getBranch() != null && !branchId.equals(stylist.getBranch().getId())) {
                throw new AppException(ErrorCode.STYLIST_NOT_FOUND);
            }
            candidates = List.of(stylist);
            stylistName = stylist.getFullName();
        } else {
            candidates = userRepository.findActiveStylistsByBranchId(branchId);
            stylistName = "Bất kỳ Stylist nào còn trống";
        }

        List<SlotDto> slots = new ArrayList<>();
        LocalTime current = OPENING_TIME;
        LocalDate today = LocalDate.now();
        LocalTime nowTime = LocalTime.now();
        LocalDateTime now = LocalDateTime.now();

        // 1. Single database query for the day's active branch bookings
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
        List<BookingEntity> activeBookings = bookingRepository.findActiveBookingsByBranchAndDay(branchId, dayStart, dayEnd, now);
        Map<Long, List<BookingEntity>> bookingsByStylist = activeBookings.stream()
                .filter(b -> b.getStaff() != null && b.getStaff().getId() != null)
                .collect(Collectors.groupingBy(b -> b.getStaff().getId()));

        // 2. Batch-load daily shift schedules and staff attendances for target branch and date
        List<StaffScheduleEntity> branchSchedules = staffScheduleRepository.findByBranchIdAndScheduleDateAndIsDeletedFalse(branchId, date);
        List<StaffAttendanceEntity> branchAttendances = staffAttendanceRepository.findByBranchIdAndAttendanceDateAndIsDeletedFalse(branchId, date);
        boolean hasBranchRoster = !branchSchedules.isEmpty();

        Map<Long, StaffScheduleEntity> scheduleByStylist = branchSchedules.stream()
                .filter(s -> s.getUser() != null)
                .collect(Collectors.toMap(s -> s.getUser().getId(), s -> s, (s1, s2) -> s1));

        Map<Long, StaffAttendanceEntity> attendanceByStylist = branchAttendances.stream()
                .filter(a -> a.getUser() != null)
                .collect(Collectors.toMap(a -> a.getUser().getId(), a -> a, (a1, a2) -> a1));

        // 3. Single batch Redis multiGet query for candidate slot lock keys across the entire day
        Set<String> candidateKeys = new LinkedHashSet<>();
        LocalTime t = OPENING_TIME;
        while (!t.plusMinutes(totalDurationMinutes).isAfter(CLOSING_TIME)) {
            LocalTime slotEnd = t.plusMinutes(totalDurationMinutes);
            LocalDateTime startDt = LocalDateTime.of(date, t);
            LocalDateTime endDt = LocalDateTime.of(date, slotEnd);
            for (UserEntity stylist : candidates) {
                if (ShiftSlotEligibilityHelper.isEligible(
                        stylist.getId(), t, slotEnd, date, hasBranchRoster,
                        scheduleByStylist, attendanceByStylist, today, nowTime)) {
                    candidateKeys.addAll(RedisLockServiceImpl.generateBucketKeys(stylist.getId(), startDt, endDt));
                }
            }
            t = t.plusMinutes(SLOT_INTERVAL_MINUTES);
        }
        Set<String> lockedKeys = redisLockService.getLockedKeys(candidateKeys);

        // 4. Compute slot availability purely in memory without SQL or Redis calls inside the loop
        while (!current.plusMinutes(totalDurationMinutes).isAfter(CLOSING_TIME)) {
            LocalTime slotEnd = current.plusMinutes(totalDurationMinutes);
            LocalDateTime slotStartDateTime = LocalDateTime.of(date, current);
            LocalDateTime slotEndDateTime = LocalDateTime.of(date, slotEnd);

            boolean isPast = date.isBefore(today) || (date.isEqual(today) && current.isBefore(nowTime));

            SlotStatus status;
            int availableCount = 0;

            if (isPast) {
                status = SlotStatus.PAST;
            } else if (candidates.isEmpty()) {
                status = SlotStatus.BOOKED;
            } else {
                int lockedCount = 0;
                int bookedCount = 0;

                for (UserEntity stylist : candidates) {
                    if (!ShiftSlotEligibilityHelper.isEligible(
                            stylist.getId(), current, slotEnd, date, hasBranchRoster,
                            scheduleByStylist, attendanceByStylist, today, nowTime)) {
                        continue;
                    }

                    List<BookingEntity> stylistBookings = bookingsByStylist.getOrDefault(stylist.getId(), Collections.emptyList());
                    boolean hasOverlap = false;
                    for (BookingEntity b : stylistBookings) {
                        if (b.getBookingTime().isBefore(slotEndDateTime) && b.getEndTime().isAfter(slotStartDateTime)) {
                            hasOverlap = true;
                            break;
                        }
                    }

                    if (hasOverlap) {
                        bookedCount++;
                        continue;
                    }

                    List<String> slotKeys = RedisLockServiceImpl.generateBucketKeys(stylist.getId(), slotStartDateTime, slotEndDateTime);
                    boolean isLockedInRedis = false;
                    for (String key : slotKeys) {
                        if (lockedKeys.contains(key)) {
                            isLockedInRedis = true;
                            break;
                        }
                    }

                    if (isLockedInRedis) {
                        lockedCount++;
                        continue;
                    }

                    availableCount++;
                }

                if (availableCount > 0) {
                    status = SlotStatus.AVAILABLE;
                } else if (lockedCount > 0) {
                    status = SlotStatus.LOCKED;
                } else {
                    status = SlotStatus.BOOKED;
                }
            }

            slots.add(new SlotDto(
                    current.format(TIME_FORMATTER),
                    slotEnd.format(TIME_FORMATTER),
                    status,
                    availableCount
            ));

            current = current.plusMinutes(SLOT_INTERVAL_MINUTES);
        }

        return new AvailableSlotsResponse(
                branch.getId(),
                branch.getName(),
                stylistId,
                stylistName,
                date,
                totalDurationMinutes,
                totalPrice,
                depositAmount,
                slots
        );
    }
}
