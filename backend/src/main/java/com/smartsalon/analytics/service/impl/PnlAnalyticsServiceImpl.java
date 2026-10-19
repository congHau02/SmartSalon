package com.smartsalon.analytics.service.impl;

import com.smartsalon.analytics.AnalyticsPeriod;
import com.smartsalon.analytics.dto.DailyPnlResponse;
import com.smartsalon.analytics.dto.OrderPnlResponse;
import com.smartsalon.analytics.dto.PnlAnalyticsResponse;
import com.smartsalon.analytics.service.PnlAnalyticsService;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceBomEntity;
import com.smartsalon.catalog.repository.ServiceBomRepository;
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
    private final ServiceBomRepository serviceBomRepository;

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
        BigDecimal totalOperationalProfit = BigDecimal.ZERO;

        for (OrderEntity order : orders) {
            OrderPnlResponse orderPnl = computeOrderPnl(order);
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
            totalOperationalProfit = totalOperationalProfit.add(orderPnl.getOrderNetProfit());

            LocalDate orderDate = order.getCreatedAt().atZone(DEFAULT_ZONE).toLocalDate();
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

        // Fixed base salary cost (Tier 2)
        List<UserEntity> activeStaff = (branchId != null)
                ? userRepository.findActiveStaffByBranchId(branchId)
                : userRepository.findAllActiveStaff();

        BigDecimal fixedBaseSalaryCost = activeStaff.stream()
                .map(u -> u.getBaseSalary() != null ? u.getBaseSalary() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netProfitAfterPayroll = totalOperationalProfit.subtract(fixedBaseSalaryCost);
        BigDecimal netProfitAfterPayrollMarginPercentage = BigDecimal.ZERO;
        if (totalNetRevenue.compareTo(BigDecimal.ZERO) > 0) {
            netProfitAfterPayrollMarginPercentage = netProfitAfterPayroll
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
                .operationalNetProfit(totalOperationalProfit)
                .grossMarginPercentage(grossMarginPercentage)
                .netProfitMarginPercentage(netProfitMarginPercentage)
                .fixedBaseSalaryCost(fixedBaseSalaryCost)
                .netProfitAfterPayroll(netProfitAfterPayroll)
                .netProfitAfterPayrollMarginPercentage(netProfitAfterPayrollMarginPercentage)
                .dailySeries(dailySeries)
                .orders(orderPnlList)
                .build();
    }

    private OrderPnlResponse computeOrderPnl(OrderEntity order) {
        BigDecimal grossServiceRevenue = BigDecimal.ZERO;
        BigDecimal grossRetailRevenue = BigDecimal.ZERO;

        for (OrderItemEntity item : order.getItems()) {
            if (item.isDeleted()) continue;
            BigDecimal price = item.getTotalPrice() != null ? item.getTotalPrice() : BigDecimal.ZERO;
            if (item.getItemType() == OrderItemType.SERVICE) {
                grossServiceRevenue = grossServiceRevenue.add(price);
            } else if (item.getItemType() == OrderItemType.PRODUCT) {
                grossRetailRevenue = grossRetailRevenue.add(price);
            }
        }

        BigDecimal grossTotal = grossServiceRevenue.add(grossRetailRevenue);
        BigDecimal orderDiscount = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal effectiveDiscount = orderDiscount.min(grossTotal);

        BigDecimal serviceDiscount = BigDecimal.ZERO;
        BigDecimal retailDiscount = BigDecimal.ZERO;

        if (grossTotal.compareTo(BigDecimal.ZERO) > 0) {
            serviceDiscount = effectiveDiscount.multiply(grossServiceRevenue)
                    .divide(grossTotal, 2, RoundingMode.HALF_UP);
            retailDiscount = effectiveDiscount.subtract(serviceDiscount);
        }

        BigDecimal netServiceRevenue = grossServiceRevenue.subtract(serviceDiscount);
        BigDecimal netRetailRevenue = grossRetailRevenue.subtract(retailDiscount);
        BigDecimal totalNetRevenue = netServiceRevenue.add(netRetailRevenue);

        // Fetch snapshotted inventory transactions for this order
        List<InventoryTransactionEntity> transactions = inventoryTransactionRepository.findAllByReferenceOrderId(order.getId());

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
            chemicalCogs = calculateFallbackChemicalCogs(order);
        }
        if (retailCogs.compareTo(BigDecimal.ZERO) == 0 && grossRetailRevenue.compareTo(BigDecimal.ZERO) > 0) {
            retailCogs = calculateFallbackRetailCogs(order);
        }

        BigDecimal totalCogs = chemicalCogs.add(retailCogs);

        // Commissions from Commission Ledger
        List<CommissionLedgerEntity> ledgers = commissionLedgerRepository.findByOrderId(order.getId());
        BigDecimal staffCommissions = BigDecimal.ZERO;
        if (!ledgers.isEmpty()) {
            for (CommissionLedgerEntity l : ledgers) {
                if (l.getAmount() != null) {
                    staffCommissions = staffCommissions.add(l.getAmount());
                }
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

    private BigDecimal calculateFallbackChemicalCogs(OrderEntity order) {
        BigDecimal sum = BigDecimal.ZERO;
        for (OrderItemEntity item : order.getItems()) {
            if (item.isDeleted() || item.getItemType() != OrderItemType.SERVICE || item.getService() == null) continue;
            List<ServiceBomEntity> boms = serviceBomRepository.findAllByServiceIdAndIsDeletedFalse(item.getService().getId());
            for (ServiceBomEntity bom : boms) {
                if (bom.getProduct() != null && bom.getStandardAmount() != null) {
                    BigDecimal totalAmount = bom.getStandardAmount().multiply(BigDecimal.valueOf(item.getQuantity()));
                    BigDecimal costPrice = bom.getProduct().getCostPrice() != null ? bom.getProduct().getCostPrice() : BigDecimal.ZERO;
                    BigDecimal volPerUnit = bom.getProduct().getVolumeOrWeightPerUnit() != null ? bom.getProduct().getVolumeOrWeightPerUnit() : BigDecimal.ZERO;
                    if (volPerUnit.compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal unitCost = costPrice.divide(volPerUnit, 4, RoundingMode.HALF_UP);
                        BigDecimal lineCost = totalAmount.multiply(unitCost).setScale(2, RoundingMode.HALF_UP);
                        sum = sum.add(lineCost);
                    }
                }
            }
        }
        return sum;
    }

    private BigDecimal calculateFallbackRetailCogs(OrderEntity order) {
        BigDecimal sum = BigDecimal.ZERO;
        for (OrderItemEntity item : order.getItems()) {
            if (item.isDeleted() || item.getItemType() != OrderItemType.PRODUCT || item.getProduct() == null) continue;
            BigDecimal costPrice = item.getProduct().getCostPrice() != null ? item.getProduct().getCostPrice() : BigDecimal.ZERO;
            BigDecimal lineCost = costPrice.multiply(BigDecimal.valueOf(item.getQuantity())).setScale(2, RoundingMode.HALF_UP);
            sum = sum.add(lineCost);
        }
        return sum;
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
