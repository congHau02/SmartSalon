package com.smartsalon.analytics.service.impl;

import com.smartsalon.analytics.AnalyticsPeriod;
import com.smartsalon.analytics.dto.CommissionLedgerDetailResponse;
import com.smartsalon.analytics.dto.StaffPayrollSummaryResponse;
import com.smartsalon.analytics.dto.StaffPerformanceResponse;
import com.smartsalon.analytics.service.StaffPayrollService;
import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.pos.entity.CommissionLedgerEntity;
import com.smartsalon.shift.service.impl.ShiftPayrollHelper;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.pos.entity.OrderItemEntity;
import com.smartsalon.pos.entity.OrderStatus;
import com.smartsalon.pos.entity.OrderStepAssignmentEntity;
import com.smartsalon.pos.entity.StepAssignmentStatus;
import com.smartsalon.pos.repository.CommissionLedgerRepository;
import com.smartsalon.pos.repository.OrderRepository;
import com.smartsalon.review.repository.ServiceReviewRepository;
import com.smartsalon.shift.entity.StaffAttendanceEntity;
import com.smartsalon.shift.entity.StaffAttendanceStatus;
import com.smartsalon.shift.entity.StaffScheduleEntity;
import com.smartsalon.shift.entity.StaffScheduleStatus;
import com.smartsalon.shift.repository.StaffAttendanceRepository;
import com.smartsalon.shift.repository.StaffScheduleRepository;
import com.smartsalon.user.entity.RoleEntity;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StaffPayrollServiceImpl implements StaffPayrollService {

    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final OrderRepository orderRepository;
    private final BookingRepository bookingRepository;
    private final CommissionLedgerRepository commissionLedgerRepository;
    private final ServiceReviewRepository serviceReviewRepository;
    private final com.smartsalon.security.BranchScopeGuard branchScopeGuard;
    private final StaffScheduleRepository staffScheduleRepository;
    private final StaffAttendanceRepository staffAttendanceRepository;

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final String STATUS_CANCELLED = "CANCELLED";

    @Override
    @Transactional(readOnly = true)
    public StaffPayrollSummaryResponse getStaffPayrollReport(Long branchId, LocalDate startDate, LocalDate endDate) {
        AnalyticsPeriod period = AnalyticsPeriod.of(startDate, endDate);
        LocalDate actualStart = period.start();
        LocalDate actualEnd = period.end();

        BranchEntity branch = null;
        if (branchId != null) {
            branch = branchRepository.findByIdAndIsDeletedFalse(branchId)
                    .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));
        }

        Instant startInstant = actualStart.atStartOfDay(DEFAULT_ZONE).toInstant();
        Instant endInstant = actualEnd.plusDays(1).atStartOfDay(DEFAULT_ZONE).toInstant();
        LocalDateTime startDateTime = actualStart.atStartOfDay(DEFAULT_ZONE).toLocalDateTime();
        LocalDateTime endDateTime = actualEnd.plusDays(1).atStartOfDay(DEFAULT_ZONE).toLocalDateTime();

        List<UserEntity> activeStaff = (branchId != null)
                ? userRepository.findActiveStaffByBranchId(branchId)
                : userRepository.findAllActiveStaff();

        List<OrderEntity> orders = (branchId != null)
                ? orderRepository.findByBranchAndStatusAndDateRange(branchId, OrderStatus.PAID, startInstant, endInstant)
                : orderRepository.findByStatusAndDateRange(OrderStatus.PAID, startInstant, endInstant);

        List<BookingEntity> bookings = bookingRepository.findCompletedBookingsByDateRange(branchId, startDateTime, endDateTime);

        List<CommissionLedgerEntity> ledgers = commissionLedgerRepository.findByBranchAndDateRange(branchId, startInstant, endInstant);

        List<StaffPerformanceResponse> staffResponses = new ArrayList<>();

        int totalCompletedOrdersSum = 0;
        int totalCompletedStepsSum = 0;
        BigDecimal totalBaseSalarySum = BigDecimal.ZERO;
        BigDecimal totalCommissionSum = BigDecimal.ZERO;
        BigDecimal totalPayrollPayoutSum = BigDecimal.ZERO;
        int totalScheduledShiftsSum = 0;
        int totalCompletedShiftsSum = 0;
        int totalExtraShiftsSum = 0;
        BigDecimal totalContractBaseSalarySum = BigDecimal.ZERO;
        BigDecimal totalOvertimeCommissionSum = BigDecimal.ZERO;

        int totalBookedStylistsCount = 0;
        BigDecimal sumRequestedRate = BigDecimal.ZERO;

        int totalStylistsWithCustomers = 0;
        BigDecimal sumRebookingRate = BigDecimal.ZERO;

        for (UserEntity staff : activeStaff) {
            StaffPerformanceResponse staffResp = computeStaffPerformance(
                    staff, orders, bookings, ledgers, endInstant, actualStart, actualEnd
            );
            staffResponses.add(staffResp);

            totalCompletedOrdersSum += staffResp.getCompletedOrderCount();
            totalCompletedStepsSum += staffResp.getCompletedStepCount();
            totalBaseSalarySum = totalBaseSalarySum.add(staffResp.getBaseSalary());
            totalCommissionSum = totalCommissionSum.add(staffResp.getTotalCommission());
            totalPayrollPayoutSum = totalPayrollPayoutSum.add(staffResp.getTotalPayout());
            totalScheduledShiftsSum += (staffResp.getScheduledShiftCount() != null ? staffResp.getScheduledShiftCount() : 0);
            totalCompletedShiftsSum += (staffResp.getCompletedShiftCount() != null ? staffResp.getCompletedShiftCount() : 0);
            totalExtraShiftsSum += (staffResp.getExtraShiftCount() != null ? staffResp.getExtraShiftCount() : 0);
            totalContractBaseSalarySum = totalContractBaseSalarySum.add(staffResp.getContractBaseSalary() != null ? staffResp.getContractBaseSalary() : BigDecimal.ZERO);
            totalOvertimeCommissionSum = totalOvertimeCommissionSum.add(staffResp.getOvertimeCommissionTotal() != null ? staffResp.getOvertimeCommissionTotal() : BigDecimal.ZERO);

            if (staffResp.getCompletedBookingCount() > 0) {
                totalBookedStylistsCount++;
                sumRequestedRate = sumRequestedRate.add(staffResp.getRequestedStylistRate());
            }

            if (staffResp.getTotalIdentifiedCustomers() > 0) {
                totalStylistsWithCustomers++;
                sumRebookingRate = sumRebookingRate.add(staffResp.getRebookingRate());
            }
        }

        BigDecimal averageRequestedRate = BigDecimal.ZERO;
        if (totalBookedStylistsCount > 0) {
            averageRequestedRate = sumRequestedRate.divide(BigDecimal.valueOf(totalBookedStylistsCount), 2, RoundingMode.HALF_UP);
        }

        BigDecimal averageRebookingRate = BigDecimal.ZERO;
        if (totalStylistsWithCustomers > 0) {
            averageRebookingRate = sumRebookingRate.divide(BigDecimal.valueOf(totalStylistsWithCustomers), 2, RoundingMode.HALF_UP);
        }

        Double branchAvgRating = serviceReviewRepository.getAverageRatingByBranchId(branchId);
        BigDecimal overallAvgRating = branchAvgRating != null
                ? BigDecimal.valueOf(branchAvgRating).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(1);

        return StaffPayrollSummaryResponse.builder()
                .branchId(branch != null ? branch.getId() : null)
                .branchName(branch != null ? branch.getName() : "Tất cả chi nhánh")
                .startDate(actualStart)
                .endDate(actualEnd)
                .totalStaffCount(staffResponses.size())
                .totalCompletedOrders(totalCompletedOrdersSum)
                .totalCompletedSteps(totalCompletedStepsSum)
                .totalScheduledShifts(totalScheduledShiftsSum)
                .totalCompletedShifts(totalCompletedShiftsSum)
                .totalExtraShifts(totalExtraShiftsSum)
                .totalContractBaseSalary(totalContractBaseSalarySum)
                .totalOvertimeCommission(totalOvertimeCommissionSum)
                .totalBaseSalary(totalBaseSalarySum)
                .totalCommission(totalCommissionSum)
                .totalPayrollPayout(totalPayrollPayoutSum)
                .averageRequestedStylistRate(averageRequestedRate)
                .averageRebookingRate(averageRebookingRate)
                .averageRating(overallAvgRating)
                .staffMembers(staffResponses)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public StaffPerformanceResponse getMyPayrollReport(String username, LocalDate startDate, LocalDate endDate) {
        AnalyticsPeriod period = AnalyticsPeriod.of(startDate, endDate);
        LocalDate actualStart = period.start();
        LocalDate actualEnd = period.end();

        UserEntity staff = userRepository.findByUsernameAndIsDeletedFalse(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        branchScopeGuard.checkBranchAccess(staff.getBranch() != null ? staff.getBranch().getId() : null);

        Long branchId = staff.getBranch() != null ? staff.getBranch().getId() : null;

        Instant startInstant = actualStart.atStartOfDay(DEFAULT_ZONE).toInstant();
        Instant endInstant = actualEnd.plusDays(1).atStartOfDay(DEFAULT_ZONE).toInstant();
        LocalDateTime startDateTime = actualStart.atStartOfDay(DEFAULT_ZONE).toLocalDateTime();
        LocalDateTime endDateTime = actualEnd.plusDays(1).atStartOfDay(DEFAULT_ZONE).toLocalDateTime();

        List<OrderEntity> orders = (branchId != null)
                ? orderRepository.findByBranchAndStatusAndDateRange(branchId, OrderStatus.PAID, startInstant, endInstant)
                : orderRepository.findByStatusAndDateRange(OrderStatus.PAID, startInstant, endInstant);

        List<BookingEntity> bookings = bookingRepository.findCompletedBookingsByDateRange(branchId, startDateTime, endDateTime);

        List<CommissionLedgerEntity> ledgers = commissionLedgerRepository.findByStaffIdAndDateRange(staff.getId(), startInstant, endInstant);

        return computeStaffPerformance(staff, orders, bookings, ledgers, endInstant, actualStart, actualEnd);
    }

    private StaffPerformanceResponse computeStaffPerformance(
            UserEntity staff,
            List<OrderEntity> orders,
            List<BookingEntity> bookings,
            List<CommissionLedgerEntity> ledgers,
            Instant endInstant,
            LocalDate startDate,
            LocalDate endDate
    ) {
        Long staffId = staff.getId();

        // 1. Commission Ledgers & Total Commission
        List<CommissionLedgerEntity> staffLedgers = ledgers.stream()
                .filter(l -> l.getStaff() != null && staffId.equals(l.getStaff().getId()))
                .filter(l -> !STATUS_CANCELLED.equalsIgnoreCase(l.getStatus()))
                .sorted(Comparator.comparing(CommissionLedgerEntity::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        BigDecimal totalCommission = staffLedgers.stream()
                .map(CommissionLedgerEntity::safeAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalOvertimeCommission = staffLedgers.stream()
                .filter(CommissionLedgerEntity::isOvertime)
                .map(CommissionLedgerEntity::safeAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<CommissionLedgerDetailResponse> ledgerDetails = staffLedgers.stream()
                .map(l -> CommissionLedgerDetailResponse.builder()
                        .id(l.getId())
                        .orderId(l.getOrder() != null ? l.getOrder().getId() : null)
                        .orderCode(l.getOrder() != null ? l.getOrder().getOrderCode() : "")
                        .serviceName(l.resolveServiceName() != null ? l.resolveServiceName() : "")
                        .stepName(l.resolveStepName() != null ? l.resolveStepName() : "")
                        .commissionRate(l.resolveCommissionRate())
                        .amount(l.safeAmount())
                        .status(l.getStatus())
                        .calculationNotes(l.getCalculationNotes())
                        .isOvertime(l.isOvertime())
                        .createdAt(l.getCreatedAt())
                        .build())
                .toList();

        // 2. Completed Orders & Service Steps in the period
        Set<Long> completedOrderIds = new HashSet<>();
        int completedStepCount = 0;

        for (OrderEntity order : orders) {
            boolean staffInvolved = false;

            if (order.getBooking() != null && order.getBooking().getStaff() != null
                    && staffId.equals(order.getBooking().getStaff().getId())) {
                staffInvolved = true;
            }

            if (order.getItems() != null) {
                for (OrderItemEntity item : order.getItems()) {
                    if (item.isDeleted()) continue;
                    if (item.getStepAssignments() != null) {
                        for (OrderStepAssignmentEntity step : item.getStepAssignments()) {
                            if (step.getStaff() != null && staffId.equals(step.getStaff().getId())
                                    && step.getStatus() == StepAssignmentStatus.COMPLETED) {
                                completedStepCount++;
                                staffInvolved = true;
                            }
                        }
                    }
                }
            }

            if (staffInvolved) {
                completedOrderIds.add(order.getId());
            }
        }

        for (CommissionLedgerEntity l : staffLedgers) {
            if (l.getOrder() != null) {
                completedOrderIds.add(l.getOrder().getId());
            }
        }

        // 3. Requested Stylist Rate (from Bookings)
        List<BookingEntity> stylistBookings = bookings.stream()
                .filter(b -> b.getStaff() != null && staffId.equals(b.getStaff().getId()))
                .toList();

        int completedBookingCount = stylistBookings.size();
        int requestedBookingCount = (int) stylistBookings.stream()
                .filter(BookingEntity::isStylistRequested)
                .count();

        BigDecimal requestedStylistRate = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        if (completedBookingCount > 0) {
            requestedStylistRate = BigDecimal.valueOf(requestedBookingCount)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(completedBookingCount), 2, RoundingMode.HALF_UP);
        }

        // 4. Re-booking Rate (identified customers with >= 2 PAID orders with this stylist)
        // Identify customers who had an order with this stylist in the reporting period
        Set<Long> identifiedCustomerIdsInPeriod = new HashSet<>();
        for (OrderEntity order : orders) {
            if (!isStaffInOrder(order, staffId)) continue;
            UserEntity cust = order.getCustomer();
            if (com.smartsalon.user.service.CustomerIdentityService.isIdentifiedCustomer(cust, order.getCustomerPhone())) {
                identifiedCustomerIdsInPeriod.add(cust.getId());
            }
        }
        for (BookingEntity b : stylistBookings) {
            UserEntity cust = b.getCustomer();
            if (com.smartsalon.user.service.CustomerIdentityService.isIdentifiedCustomer(cust, b.getCustomerPhone())) {
                identifiedCustomerIdsInPeriod.add(cust.getId());
            }
        }

        int totalIdentifiedCustomers = identifiedCustomerIdsInPeriod.size();
        int repeatCustomerCount = 0;

        for (Long custId : identifiedCustomerIdsInPeriod) {
            // Count total distinct PAID orders with this stylist up to endInstant using indexed DB count
            long orderCount = orderRepository.countPaidOrdersByCustomerAndStaff(custId, staffId, endInstant);
            if (orderCount >= 2) {
                repeatCustomerCount++;
            }
        }

        BigDecimal rebookingRate = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        if (totalIdentifiedCustomers > 0) {
            rebookingRate = BigDecimal.valueOf(repeatCustomerCount)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalIdentifiedCustomers), 2, RoundingMode.HALF_UP);
        }

        Double avgRating = serviceReviewRepository.getAverageRatingByStylistId(staffId);
        BigDecimal safeAvgRating = avgRating != null
                ? BigDecimal.valueOf(avgRating).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(1);
        long reviewCount = serviceReviewRepository.countByStylistId(staffId);

        List<StaffScheduleEntity> staffSchedules = staffScheduleRepository
                .findByUserIdAndScheduleDateBetweenAndIsDeletedFalseOrderByScheduleDateAsc(staffId, startDate, endDate);

        int scheduledShiftCount = (int) staffSchedules.stream()
                .filter(s -> s.getStatus() == StaffScheduleStatus.WORKING && s.getShiftTemplate() != null)
                .count();

        Set<LocalDate> workedDates = ShiftPayrollHelper.union(
                ShiftPayrollHelper.attendedDatesByStaff(staffAttendanceRepository
                        .findByUserIdAndAttendanceDateBetweenAndIsDeletedFalseOrderByAttendanceDateAsc(staffId, startDate, endDate))
                        .get(staffId),
                ShiftPayrollHelper.completedStepDatesByStaff(orders).get(staffId));
        Set<LocalDate> scheduledWorkingDates = ShiftPayrollHelper.scheduledWorkingDates(staffSchedules);

        int completedShiftCount = workedDates.size();
        int extraShiftCount = (int) workedDates.stream().filter(d -> !scheduledWorkingDates.contains(d)).count();

        BigDecimal contractBaseSalary = staff.getBaseSalary() != null ? staff.getBaseSalary() : BigDecimal.ZERO;
        // Historical period fallback without scheduled shifts keeps the full contract salary
        BigDecimal baseSalary = scheduledShiftCount == 0
                ? contractBaseSalary
                : ShiftPayrollHelper.prorate(contractBaseSalary, completedShiftCount, scheduledShiftCount);
        BigDecimal totalPayout = baseSalary.add(totalCommission);

        List<String> roleNames = staff.getRoles() != null
                ? staff.getRoles().stream().map(RoleEntity::getName).collect(Collectors.toList())
                : Collections.emptyList();

        return StaffPerformanceResponse.builder()
                .staffId(staff.getId())
                .fullName(staff.getFullName())
                .username(staff.getUsername())
                .phone(staff.getPhone())
                .email(staff.getEmail())
                .avatarUrl(staff.getAvatarUrl())
                .roles(roleNames)
                .branchId(staff.getBranch() != null ? staff.getBranch().getId() : null)
                .branchName(staff.getBranch() != null ? staff.getBranch().getName() : "")
                .startDate(startDate)
                .endDate(endDate)
                .contractBaseSalary(contractBaseSalary)
                .baseSalary(baseSalary)
                .scheduledShiftCount(scheduledShiftCount)
                .completedShiftCount(completedShiftCount)
                .extraShiftCount(extraShiftCount)
                .overtimeCommissionTotal(totalOvertimeCommission)
                .completedOrderCount(completedOrderIds.size())
                .completedStepCount(completedStepCount)
                .totalCommission(totalCommission)
                .totalPayout(totalPayout)
                .completedBookingCount(completedBookingCount)
                .requestedBookingCount(requestedBookingCount)
                .requestedStylistRate(requestedStylistRate)
                .totalIdentifiedCustomers(totalIdentifiedCustomers)
                .repeatCustomerCount(repeatCustomerCount)
                .rebookingRate(rebookingRate)
                .averageRating(safeAvgRating)
                .reviewCount(reviewCount)
                .commissionLedgers(ledgerDetails)
                .build();
    }

    private boolean isStaffInOrder(OrderEntity order, Long staffId) {
        if (order.getBooking() != null && order.getBooking().getStaff() != null
                && staffId.equals(order.getBooking().getStaff().getId())) {
            return true;
        }
        if (order.getItems() != null) {
            for (OrderItemEntity item : order.getItems()) {
                if (item.isDeleted()) continue;
                if (item.getStepAssignments() != null) {
                    for (OrderStepAssignmentEntity step : item.getStepAssignments()) {
                        if (step.getStaff() != null && staffId.equals(step.getStaff().getId())
                                && step.getStatus() == StepAssignmentStatus.COMPLETED) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    @Override
    @Transactional
    public StaffPerformanceResponse updateStaffBaseSalary(Long staffId, BigDecimal newBaseSalary) {
        UserEntity staff = userRepository.findById(staffId)
                .filter(u -> !u.isDeleted())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        branchScopeGuard.checkBranchAccess(staff.getBranch() != null ? staff.getBranch().getId() : null);

        BigDecimal salaryToSet = (newBaseSalary != null && newBaseSalary.compareTo(BigDecimal.ZERO) >= 0)
                ? newBaseSalary
                : BigDecimal.ZERO;

        staff.setBaseSalary(salaryToSet);
        userRepository.save(staff);

        List<String> roleNames = staff.getRoles() != null
                ? staff.getRoles().stream().map(RoleEntity::getName).collect(Collectors.toList())
                : Collections.emptyList();

        return StaffPerformanceResponse.builder()
                .staffId(staff.getId())
                .fullName(staff.getFullName())
                .username(staff.getUsername())
                .phone(staff.getPhone())
                .email(staff.getEmail())
                .avatarUrl(staff.getAvatarUrl())
                .roles(roleNames)
                .branchId(staff.getBranch() != null ? staff.getBranch().getId() : null)
                .branchName(staff.getBranch() != null ? staff.getBranch().getName() : "")
                .baseSalary(staff.getBaseSalary())
                .totalPayout(staff.getBaseSalary())
                .build();
    }
}
