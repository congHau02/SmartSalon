package com.smartsalon.pos.service.impl;

import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.pos.entity.OrderItemEntity;
import com.smartsalon.pos.entity.OrderStepAssignmentEntity;
import com.smartsalon.pos.repository.OrderRepository;
import com.smartsalon.security.BranchScopeGuard;
import com.smartsalon.shift.entity.StaffAttendanceEntity;
import com.smartsalon.shift.entity.StaffAttendanceStatus;
import com.smartsalon.shift.entity.StaffScheduleEntity;
import com.smartsalon.shift.entity.StaffScheduleStatus;
import com.smartsalon.shift.repository.StaffAttendanceRepository;
import com.smartsalon.shift.repository.StaffScheduleRepository;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.UserRepository;
import com.smartsalon.user.service.CustomerIdentityService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PosStaffResolutionHelper {

    private static final DateTimeFormatter BASIC_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final String ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final StaffScheduleRepository staffScheduleRepository;
    private final StaffAttendanceRepository staffAttendanceRepository;
    private final OrderRepository orderRepository;
    private final CustomerIdentityService customerIdentityService;
    private final BranchScopeGuard branchScopeGuard;

    public void checkBranchAccess(Long branchId) {
        branchScopeGuard.checkBranchAccess(branchId);
    }

    public Long getEffectiveBranchId(Long branchId) {
        return branchScopeGuard.getEffectiveBranchId(branchId);
    }

    public CustomerIdentityService.ResolvedWalkInCustomer resolveForWalkIn(
            boolean quickGuest, String phone, String name, BranchEntity branch) {
        return customerIdentityService.resolveForWalkIn(quickGuest, phone, name, branch);
    }

    public UserEntity resolveWalkInGuest() {
        return customerIdentityService.resolveWalkInGuest();
    }

    public UserEntity resolveCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return userRepository.findByUsernameAndIsDeletedFalse(auth.getName()).orElse(null);
        }
        return null;
    }

    public UserEntity findStaffByIdOrNull(Long staffId) {
        return staffId != null ? userRepository.findById(staffId).orElse(null) : null;
    }

    public UserEntity findStaffByIdOrThrow(Long staffId, ErrorCode errorCode) {
        return userRepository.findById(staffId).orElseThrow(() -> new AppException(errorCode));
    }

    public UserEntity findActiveStaffByIdOrThrow(Long staffId, String message) {
        return userRepository.findByIdAndIsDeletedFalse(staffId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, message));
    }

    public UserEntity resolveDefaultStaff(BranchEntity branch) {
        List<UserEntity> stylists = userRepository.findActiveStylistsByBranchId(branch.getId());
        if (!stylists.isEmpty()) {
            LocalDate today = LocalDate.now();
            Map<Long, StaffScheduleEntity> scheduleMap = staffScheduleRepository
                    .findByBranchIdAndScheduleDateAndIsDeletedFalse(branch.getId(), today).stream()
                    .filter(s -> s.getUser() != null)
                    .collect(Collectors.toMap(s -> s.getUser().getId(), s -> s, (s1, s2) -> s1));
            Map<Long, StaffAttendanceEntity> attendanceMap = staffAttendanceRepository
                    .findByBranchIdAndAttendanceDateAndIsDeletedFalse(branch.getId(), today).stream()
                    .filter(a -> a.getUser() != null)
                    .collect(Collectors.toMap(a -> a.getUser().getId(), a -> a, (a1, a2) -> a1));

            List<UserEntity> available = stylists.stream()
                    .filter(s -> isStylistCurrentlyAvailable(s.getId(), scheduleMap, attendanceMap))
                    .toList();
            return !available.isEmpty() ? available.get(0) : stylists.get(0);
        }
        return userRepository.findAllActiveStylists().stream().findFirst().orElse(null);
    }

    public UserEntity resolveOrderStaff(OrderEntity order) {
        if (order.getItems() != null) {
            for (OrderItemEntity item : order.getItems()) {
                if (item.getStepAssignments() == null) continue;
                for (OrderStepAssignmentEntity step : item.getStepAssignments()) {
                    if (step.getStaff() != null) {
                        return step.getStaff();
                    }
                }
            }
        }
        return userRepository.findAllActiveStylists().stream().findFirst().orElse(null);
    }

    public UserEntity resolveFallbackActiveStylistOrThrow() {
        return userRepository.findAllActiveStylists().stream().findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.STYLIST_NOT_FOUND));
    }

    public String generateOrderCode() {
        String datePart = LocalDate.now().format(BASIC_DATE_FORMATTER);
        for (int attempts = 0; attempts < 10; attempts++) {
            char[] randChars = new char[6];
            for (int i = 0; i < 6; i++) {
                randChars[i] = ALPHANUMERIC.charAt(SECURE_RANDOM.nextInt(ALPHANUMERIC.length()));
            }
            String orderCode = "ORD-" + datePart + "-" + new String(randChars);
            if (!orderRepository.existsByOrderCode(orderCode)) {
                return orderCode;
            }
        }
        throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION, "Không thể tạo mã đơn hàng duy nhất");
    }

    public boolean isStepOvertime(OrderEntity order, OrderStepAssignmentEntity step, UserEntity staff, LocalDateTime now, ZoneId zone) {
        if (staff == null) return false;
        LocalDate stepDate = resolveStepDate(order, step, now, zone);
        LocalTime finishTime = resolveStepFinishTime(order, step, now);

        Optional<StaffScheduleEntity> scheduleOpt =
                staffScheduleRepository.findByUserIdAndScheduleDateAndIsDeletedFalse(staff.getId(), stepDate);
        if (scheduleOpt.isPresent()) {
            StaffScheduleEntity schedule = scheduleOpt.get();
            if (schedule.getStatus() == StaffScheduleStatus.OFF || schedule.getShiftTemplate() == null) {
                return true;
            }
            LocalTime shiftEndTime = schedule.getShiftTemplate().getEndTime();
            LocalTime shiftStartTime = schedule.getShiftTemplate().getStartTime();
            boolean startedEarly = order.getBooking() != null && order.getBooking().getBookingTime() != null
                    && order.getBooking().getBookingTime().toLocalTime().isBefore(shiftStartTime);
            return startedEarly || finishTime.isAfter(shiftEndTime);
        }

        Long branchId = order.getBranch() != null ? order.getBranch().getId()
                : (staff.getBranch() != null ? staff.getBranch().getId() : null);
        if (branchId != null && !staffScheduleRepository.findByBranchIdAndScheduleDateAndIsDeletedFalse(branchId, stepDate).isEmpty()) {
            return true;
        }
        return finishTime.isAfter(LocalTime.of(20, 30));
    }

    private LocalDate resolveStepDate(OrderEntity order, OrderStepAssignmentEntity step, LocalDateTime now, ZoneId zone) {
        if (order.getBooking() != null && order.getBooking().getBookingTime() != null) {
            return order.getBooking().getBookingTime().toLocalDate();
        }
        if (step.getCompletedAt() != null) return step.getCompletedAt().toLocalDate();
        if (order.getSettledAt() != null) return order.getSettledAt().atZone(zone).toLocalDate();
        return now.toLocalDate();
    }

    private LocalTime resolveStepFinishTime(OrderEntity order, OrderStepAssignmentEntity step, LocalDateTime now) {
        LocalTime finishTime = step.getCompletedAt() != null ? step.getCompletedAt().toLocalTime() : now.toLocalTime();
        if (order.getBooking() != null && order.getBooking().getEndTime() != null) {
            LocalTime bookingFinish = order.getBooking().getEndTime().toLocalTime();
            if (finishTime == null || bookingFinish.isAfter(finishTime)) {
                return bookingFinish;
            }
        }
        return finishTime;
    }

    private boolean isStylistCurrentlyAvailable(
            Long stylistId,
            Map<Long, StaffScheduleEntity> scheduleMap,
            Map<Long, StaffAttendanceEntity> attendanceMap) {
        StaffScheduleEntity sched = scheduleMap.get(stylistId);
        if (sched != null && sched.getStatus() == StaffScheduleStatus.OFF) return false;
        StaffAttendanceEntity att = attendanceMap.get(stylistId);
        return att == null || (att.getStatus() != StaffAttendanceStatus.ABSENT
                && att.getStatus() != StaffAttendanceStatus.ON_BREAK);
    }
}
