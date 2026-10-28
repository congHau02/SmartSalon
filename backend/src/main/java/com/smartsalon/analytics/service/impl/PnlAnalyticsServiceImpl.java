package com.smartsalon.analytics.service.impl;

import com.smartsalon.analytics.AnalyticsPeriod;
import com.smartsalon.analytics.dto.DailyPnlResponse;
import com.smartsalon.analytics.dto.OrderPnlResponse;
import com.smartsalon.analytics.dto.PnlAnalyticsResponse;
import com.smartsalon.analytics.service.PnlAnalyticsService;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.inventory.entity.InventoryTransactionEntity;
import com.smartsalon.inventory.entity.InventoryTransactionType;
import com.smartsalon.inventory.repository.InventoryTransactionRepository;
import com.smartsalon.pos.entity.CommissionLedgerEntity;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.pos.entity.OrderItemEntity;
import com.smartsalon.pos.entity.OrderItemType;
import com.smartsalon.pos.entity.OrderStatus;
import com.smartsalon.pos.entity.OrderStepAssignmentEntity;
import com.smartsalon.pos.repository.CommissionLedgerRepository;
import com.smartsalon.pos.repository.OrderRepository;
import com.smartsalon.pos.service.OrderBomResolver;
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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PnlAnalyticsServiceImpl implements PnlAnalyticsService {

    private final OrderRepository orderRepository;
    private final BranchRepository branchRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final CommissionLedgerRepository commissionLedgerRepository;
    private final UserRepository userRepository;
    private final OrderBomResolver orderBomResolver;
    private final StaffScheduleRepository staffScheduleRepository;
    private final StaffAttendanceRepository staffAttendanceRepository;

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Override
    @Transactional(readOnly = true)
    public PnlAnalyticsResponse getPnlReport(Long branchId, LocalDate startDate, LocalDate endDate) {
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

        List<OrderEntity> orders;
        if (branchId != null) {
            orders = orderRepository.findByBranchAndStatusAndDateRange(branchId, OrderStatus.PAID, startInstant, endInstant);
        } else {
            orders = orderRepository.findByStatusAndDateRange(OrderStatus.PAID, startInstant, endInstant);
        }

        List<Long> orderIds = orders.stream().map(OrderEntity::getId).toList();
        Map<Long, List<InventoryTransactionEntity>> txMap = orderIds.isEmpty()
                ? Collections.emptyMap()
                : inventoryTransactionRepository.findAllByReferenceOrderIdIn(orderIds).stream()
                        .filter(tx -> tx.getReferenceOrderId() != null)
                        .collect(Collectors.groupingBy(InventoryTransactionEntity::getReferenceOrderId));

        Map<Long, List<CommissionLedgerEntity>> ledgerMap = orderIds.isEmpty()
                ? Collections.emptyMap()
                : commissionLedgerRepository.findByOrderIdIn(orderIds).stream()
                        .filter(l -> l.getOrder() != null && l.getOrder().getId() != null)
                        .collect(Collectors.groupingBy(l -> l.getOrder().getId()));

        List<OrderPnlResponse> orderPnlList = new ArrayList<>();
        Map<LocalDate, DailyAccumulator> dailyMap = new TreeMap<>();

        // Initialize daily accumulator for all days in the range
        LocalDate curr = actualStart;
        while (!curr.isAfter(actualEnd)) {
            dailyMap.put(curr, new DailyAccumulator(curr));
            curr = curr.plusDays(1);
        }

        BigDecimal totalGrossService = BigDecimal.ZERO;
        BigDecimal totalGrossRetail = BigDecimal.ZERO;
        BigDecimal totalDiscounts = BigDecimal.ZERO;
        BigDecimal totalNetService = BigDecimal.ZERO;
        BigDecimal totalNetRetail = BigDecimal.ZERO;
        BigDecimal totalNetRevenue = BigDecimal.ZERO;
        BigDecimal totalChemicalCogs = BigDecimal.ZERO;
        BigDecimal totalRetailCogs = BigDecimal.ZERO;
        BigDecimal totalCommissions = BigDecimal.ZERO;
        BigDecimal totalServiceProfit = BigDecimal.ZERO;
        BigDecimal totalRetailProfit = BigDecimal.ZERO;
        BigDecimal totalOperationalProfit = BigDecimal.ZERO;

        for (OrderEntity order : orders) {
            List<InventoryTransactionEntity> transactions = txMap.getOrDefault(order.getId(), Collections.emptyList());
            List<CommissionLedgerEntity> ledgers = ledgerMap.getOrDefault(order.getId(), Collections.emptyList());
            OrderPnlResponse orderPnl = computeOrderPnl(order, transactions, ledgers);
            orderPnlList.add(orderPnl);

            totalGrossService = totalGrossService.add(orderPnl.getGrossServiceRevenue());
            totalGrossRetail = totalGrossRetail.add(orderPnl.getGrossRetailRevenue());
            totalDiscounts = totalDiscounts.add(orderPnl.getTotalDiscount());
            totalNetService = totalNetService.add(orderPnl.getNetServiceRevenue());
            totalNetRetail = totalNetRetail.add(orderPnl.getNetRetailRevenue());
            totalNetRevenue = totalNetRevenue.add(orderPnl.getTotalNetRevenue());
            totalChemicalCogs = totalChemicalCogs.add(orderPnl.getChemicalCogs());
            totalRetailCogs = totalRetailCogs.add(orderPnl.getRetailCogs());
            totalCommissions = totalCommissions.add(orderPnl.getStaffCommissions());
            totalServiceProfit = totalServiceProfit.add(orderPnl.getServiceNetProfit());
            totalRetailProfit = totalRetailProfit.add(orderPnl.getRetailNetProfit());
            totalOperationalProfit = totalOperationalProfit.add(orderPnl.getOrderNetProfit());

            Instant orderInstant = order.getSettledAt() != null ? order.getSettledAt() : order.getCreatedAt();
            LocalDate orderDate = orderInstant.atZone(DEFAULT_ZONE).toLocalDate();
            DailyAccumulator daily = dailyMap.computeIfAbsent(orderDate, DailyAccumulator::new);
            daily.add(orderPnl);
        }

        List<DailyPnlResponse> dailySeries = dailyMap.values().stream()
                .map(DailyAccumulator::toResponse)
                .toList();

        BigDecimal totalCogs = totalChemicalCogs.add(totalRetailCogs);
        BigDecimal totalCosts = totalCogs.add(totalCommissions);

        BigDecimal grossMarginPercentage = BigDecimal.ZERO;
        BigDecimal netProfitMarginPercentage = BigDecimal.ZERO;
        if (totalNetRevenue.compareTo(BigDecimal.ZERO) > 0) {
            grossMarginPercentage = totalNetRevenue.subtract(totalCogs)
                    .divide(totalNetRevenue, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"))
                    .setScale(2, RoundingMode.HALF_UP);

            netProfitMarginPercentage = totalOperationalProfit
                    .divide(totalNetRevenue, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        // Shift-Prorated Base Salary (Tier 2) from completed valid shifts vs scheduled working shifts
        List<UserEntity> activeStaff = (branchId != null)
                ? userRepository.findActiveStaffByBranchId(branchId)
                : userRepository.findAllActiveStaff();

        long daysInPeriod = ChronoUnit.DAYS.between(actualStart, actualEnd) + 1;
        BigDecimal totalBaseSalaries = BigDecimal.ZERO;

        for (UserEntity staff : activeStaff) {
            BigDecimal contractSalary = staff.getBaseSalary() != null ? staff.getBaseSalary() : BigDecimal.ZERO;
            List<StaffScheduleEntity> staffSchedules = staffScheduleRepository
                    .findByUserIdAndScheduleDateBetweenAndIsDeletedFalseOrderByScheduleDateAsc(staff.getId(), actualStart, actualEnd);

            long scheduledCount = staffSchedules.stream()
                    .filter(s -> s.getStatus() == StaffScheduleStatus.WORKING && s.getShiftTemplate() != null)
                    .count();

            BigDecimal staffProratedSalary;
            if (scheduledCount == 0) {
                // Fall back cleanly to calendar-day prorated contract base salary for periods without scheduled shifts
                staffProratedSalary = contractSalary
                        .multiply(BigDecimal.valueOf(daysInPeriod))
                        .divide(BigDecimal.valueOf(30), 0, RoundingMode.HALF_UP)
                        .setScale(2, RoundingMode.HALF_UP);
            } else {
                // Worked dates: PRESENT/COMPLETED attendance OR a completed PAID step (spec L121)
                Set<LocalDate> workedDates = staffAttendanceRepository
                        .findByUserIdAndAttendanceDateBetweenAndIsDeletedFalseOrderByAttendanceDateAsc(staff.getId(), actualStart, actualEnd)
                        .stream()
                        .filter(a -> a.getStatus() == StaffAttendanceStatus.COMPLETED
                                || a.getStatus() == StaffAttendanceStatus.PRESENT)
                        .map(a -> a.getAttendanceDate())
                        .collect(Collectors.toCollection(HashSet::new));
                for (OrderEntity o : orders) {
                    if (o.getItems() == null) continue;
                    for (OrderItemEntity item : o.getItems()) {
                        if (item.isDeleted() || item.getStepAssignments() == null) continue;
                        for (OrderStepAssignmentEntity step : item.getStepAssignments()) {
                            if (step.getStaff() != null && staff.getId().equals(step.getStaff().getId())
                                    && step.getCompletedAt() != null) {
                                workedDates.add(step.getCompletedAt().toLocalDate());
                            }
                        }
                    }
                }
                long completedCount = workedDates.size();

                staffProratedSalary = contractSalary
                        .multiply(BigDecimal.valueOf(completedCount))
                        .divide(BigDecimal.valueOf(scheduledCount), 0, RoundingMode.HALF_UP)
                        .setScale(2, RoundingMode.HALF_UP);
            }
            totalBaseSalaries = totalBaseSalaries.add(staffProratedSalary);
        }

        BigDecimal trueNetProfit = totalOperationalProfit.subtract(totalBaseSalaries);
        BigDecimal netProfitAfterPayrollMarginPercentage = BigDecimal.ZERO;
        if (totalNetRevenue.compareTo(BigDecimal.ZERO) > 0) {
            netProfitAfterPayrollMarginPercentage = trueNetProfit
                    .divide(totalNetRevenue, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        return PnlAnalyticsResponse.builder()
                .branchId(branch != null ? branch.getId() : null)
                .branchName(branch != null ? branch.getName() : "Tất cả chi nhánh")
                .startDate(actualStart)
                .endDate(actualEnd)
                .totalOrders(orders.size())
                .grossServiceRevenue(totalGrossService)
                .grossRetailRevenue(totalGrossRetail)
                .totalDiscounts(totalDiscounts)
                .netServiceRevenue(totalNetService)
                .netRetailRevenue(totalNetRetail)
                .totalNetRevenue(totalNetRevenue)
                .chemicalCogs(totalChemicalCogs)
                .retailCogs(totalRetailCogs)
                .totalCogs(totalCogs)
                .totalCommissions(totalCommissions)
                .totalCosts(totalCosts)
                .serviceNetProfit(totalServiceProfit)
                .retailNetProfit(totalRetailProfit)
                .operationalNetProfit(totalOperationalProfit)
                .grossMarginPercentage(grossMarginPercentage)
                .netProfitMarginPercentage(netProfitMarginPercentage)
                .fixedBaseSalaryCost(totalBaseSalaries)
                .totalBaseSalaries(totalBaseSalaries)
                .netProfitAfterPayroll(trueNetProfit)
                .trueNetProfit(trueNetProfit)
                .netProfitAfterPayrollMarginPercentage(netProfitAfterPayrollMarginPercentage)
                .dailySeries(dailySeries)
                .orders(orderPnlList)
                .build();
    }

    private OrderPnlResponse computeOrderPnl(OrderEntity order,
                                            List<InventoryTransactionEntity> transactions,
                                            List<CommissionLedgerEntity> ledgers) {
        OrderEntity.RevenueBreakdown rev = order.calculateRevenueBreakdown();
        BigDecimal grossServiceRevenue = rev.grossServiceRevenue();
        BigDecimal grossRetailRevenue = rev.grossRetailRevenue();
        BigDecimal serviceDiscount = rev.serviceDiscount();
        BigDecimal retailDiscount = rev.retailDiscount();
        BigDecimal effectiveDiscount = rev.totalDiscount();
        BigDecimal netServiceRevenue = rev.netServiceRevenue();
        BigDecimal netRetailRevenue = rev.netRetailRevenue();
        BigDecimal totalNetRevenue = rev.totalNetRevenue();

        // Snapshotted inventory transactions for this order (batch loaded)
        BigDecimal chemicalCogs = BigDecimal.ZERO;
        BigDecimal retailCogs = BigDecimal.ZERO;

        for (InventoryTransactionEntity tx : transactions) {
            BigDecimal cost = tx.getTotalCostAmount() != null ? tx.getTotalCostAmount() : BigDecimal.ZERO;
            if (tx.getTransactionType() == InventoryTransactionType.SERVICE_CONSUMPTION) {
                chemicalCogs = chemicalCogs.add(cost);
            } else if (tx.getTransactionType() == InventoryTransactionType.RETAIL_SALE) {
                retailCogs = retailCogs.add(cost);
            }
        }

        // Fallbacks if no inventory transactions exist
        if (chemicalCogs.compareTo(BigDecimal.ZERO) == 0 && grossServiceRevenue.compareTo(BigDecimal.ZERO) > 0) {
            chemicalCogs = orderBomResolver.calculateStandardChemicalCogs(order);
        }
        if (retailCogs.compareTo(BigDecimal.ZERO) == 0 && grossRetailRevenue.compareTo(BigDecimal.ZERO) > 0) {
            retailCogs = OrderBomResolver.calculateStandardRetailCogs(order);
        }

        BigDecimal totalCogs = chemicalCogs.add(retailCogs);

        // Commissions from Commission Ledger (batch loaded)
        BigDecimal staffCommissions = BigDecimal.ZERO;
        if (!ledgers.isEmpty()) {
            for (CommissionLedgerEntity l : ledgers) {
                staffCommissions = staffCommissions.add(l.safeAmount());
            }
        } else {
            // Fallback from step assignments
            for (OrderItemEntity item : order.getItems()) {
                if (item.isDeleted() || item.getItemType() != OrderItemType.SERVICE) continue;
                if (item.getStepAssignments() != null) {
                    for (OrderStepAssignmentEntity step : item.getStepAssignments()) {
                        if (step.getCommissionAmount() != null) {
                            staffCommissions = staffCommissions.add(step.getCommissionAmount());
                        }
                    }
                }
            }
        }

        BigDecimal serviceNetProfit = netServiceRevenue.subtract(chemicalCogs).subtract(staffCommissions);
        BigDecimal retailNetProfit = netRetailRevenue.subtract(retailCogs);
        BigDecimal orderNetProfit = serviceNetProfit.add(retailNetProfit);

        BigDecimal netProfitMarginPercentage = BigDecimal.ZERO;
        if (totalNetRevenue.compareTo(BigDecimal.ZERO) > 0) {
            netProfitMarginPercentage = orderNetProfit
                    .divide(totalNetRevenue, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        return OrderPnlResponse.builder()
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .createdAt(order.getCreatedAt())
                .customerName(order.getCustomerName() != null ? order.getCustomerName() : (order.getCustomer() != null ? order.getCustomer().getFullName() : ""))
                .customerPhone(order.getCustomerPhone() != null ? order.getCustomerPhone() : (order.getCustomer() != null ? order.getCustomer().getPhone() : ""))
                .paymentMethod(order.getPaymentMethod())
                .grossServiceRevenue(grossServiceRevenue)
                .grossRetailRevenue(grossRetailRevenue)
                .serviceDiscount(serviceDiscount)
                .retailDiscount(retailDiscount)
                .totalDiscount(effectiveDiscount)
                .netServiceRevenue(netServiceRevenue)
                .netRetailRevenue(netRetailRevenue)
                .totalNetRevenue(totalNetRevenue)
                .chemicalCogs(chemicalCogs)
                .retailCogs(retailCogs)
                .totalCogs(totalCogs)
                .staffCommissions(staffCommissions)
                .serviceNetProfit(serviceNetProfit)
                .retailNetProfit(retailNetProfit)
                .orderNetProfit(orderNetProfit)
                .netProfitMarginPercentage(netProfitMarginPercentage)
                .build();
    }

    private static class DailyAccumulator {
        private final LocalDate date;
        private BigDecimal netServiceRevenue = BigDecimal.ZERO;
        private BigDecimal netRetailRevenue = BigDecimal.ZERO;
        private BigDecimal totalNetRevenue = BigDecimal.ZERO;
        private BigDecimal chemicalCogs = BigDecimal.ZERO;
        private BigDecimal retailCogs = BigDecimal.ZERO;
        private BigDecimal totalCommissions = BigDecimal.ZERO;
        private BigDecimal operationalNetProfit = BigDecimal.ZERO;
        private int orderCount = 0;

        DailyAccumulator(LocalDate date) {
            this.date = date;
        }

        void add(OrderPnlResponse order) {
            this.netServiceRevenue = this.netServiceRevenue.add(order.getNetServiceRevenue());
            this.netRetailRevenue = this.netRetailRevenue.add(order.getNetRetailRevenue());
            this.totalNetRevenue = this.totalNetRevenue.add(order.getTotalNetRevenue());
            this.chemicalCogs = this.chemicalCogs.add(order.getChemicalCogs());
            this.retailCogs = this.retailCogs.add(order.getRetailCogs());
            this.totalCommissions = this.totalCommissions.add(order.getStaffCommissions());
            this.operationalNetProfit = this.operationalNetProfit.add(order.getOrderNetProfit());
            this.orderCount++;
        }

        DailyPnlResponse toResponse() {
            return DailyPnlResponse.builder()
                    .date(date)
                    .netServiceRevenue(netServiceRevenue)
                    .netRetailRevenue(netRetailRevenue)
                    .totalNetRevenue(totalNetRevenue)
                    .chemicalCogs(chemicalCogs)
                    .retailCogs(retailCogs)
                    .totalCommissions(totalCommissions)
                    .operationalNetProfit(operationalNetProfit)
                    .orderCount(orderCount)
                    .build();
        }
    }
}
