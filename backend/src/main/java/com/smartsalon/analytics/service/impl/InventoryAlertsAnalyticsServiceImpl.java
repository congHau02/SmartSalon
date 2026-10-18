package com.smartsalon.analytics.service.impl;

import com.smartsalon.analytics.dto.BomWastageItemResponse;
import com.smartsalon.analytics.dto.InventoryAlertsAnalyticsResponse;
import com.smartsalon.analytics.dto.StockAlertItemResponse;
import com.smartsalon.analytics.dto.StockAlertLevel;
import com.smartsalon.analytics.service.InventoryAlertsAnalyticsService;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceBomEntity;
import com.smartsalon.catalog.repository.ServiceBomRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.inventory.entity.BranchInventoryEntity;
import com.smartsalon.inventory.entity.InventoryTransactionEntity;
import com.smartsalon.inventory.entity.InventoryTransactionType;
import com.smartsalon.inventory.entity.ProductEntity;
import com.smartsalon.inventory.repository.BranchInventoryRepository;
import com.smartsalon.inventory.repository.InventoryTransactionRepository;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.pos.entity.OrderItemEntity;
import com.smartsalon.pos.entity.OrderItemType;
import com.smartsalon.pos.entity.OrderStatus;
import com.smartsalon.pos.repository.OrderRepository;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryAlertsAnalyticsServiceImpl implements InventoryAlertsAnalyticsService {

    private final BranchRepository branchRepository;
    private final BranchInventoryRepository branchInventoryRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final OrderRepository orderRepository;
    private final ServiceBomRepository serviceBomRepository;

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Override
    @Transactional(readOnly = true)
    public InventoryAlertsAnalyticsResponse getInventoryAlertsReport(Long branchId, LocalDate startDate, LocalDate endDate) {
        LocalDate actualStart = (startDate != null) ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate actualEnd = (endDate != null) ? endDate : LocalDate.now();

        if (actualStart.isAfter(actualEnd)) {
            LocalDate temp = actualStart;
            actualStart = actualEnd;
            actualEnd = temp;
        }

        BranchEntity branch = null;
        if (branchId != null) {
            branch = branchRepository.findByIdAndIsDeletedFalse(branchId)
                    .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));
        }

        Instant startInstant = actualStart.atStartOfDay(DEFAULT_ZONE).toInstant();
        Instant endInstant = actualEnd.plusDays(1).atStartOfDay(DEFAULT_ZONE).toInstant();
        long daysInWindow = Math.max(1, ChronoUnit.DAYS.between(actualStart, actualEnd) + 1);

        // 1. Fetch branch inventories
        List<BranchInventoryEntity> inventories;
        if (branchId != null) {
            inventories = branchInventoryRepository.findAllByBranchId(branchId);
        } else {
            inventories = branchInventoryRepository.findAll();
        }

        // 2. Fetch inventory transactions within range
        List<InventoryTransactionEntity> transactions;
        if (branchId != null) {
            transactions = inventoryTransactionRepository.findByBranchIdAndDateRange(branchId, startInstant, endInstant);
        } else {
            transactions = inventoryTransactionRepository.findByDateRange(startInstant, endInstant);
        }

        // Aggregate service consumption, negative stock adjustments, and track immutable cost snapshots
        Map<Long, BigDecimal> serviceConsumptionMap = new HashMap<>();
        Map<Long, BigDecimal> adjustmentLossMap = new HashMap<>();
        Map<Long, BigDecimal> transactionUnitCostMap = new HashMap<>();

        for (InventoryTransactionEntity tx : transactions) {
            if (tx.getProduct() == null) continue;
            Long prodId = tx.getProduct().getId();

            if (tx.getUnitCostSnapshot() != null && tx.getUnitCostSnapshot().compareTo(BigDecimal.ZERO) > 0) {
                transactionUnitCostMap.put(prodId, tx.getUnitCostSnapshot());
            }

            if (tx.getTransactionType() == InventoryTransactionType.SERVICE_CONSUMPTION) {
                BigDecimal vol = tx.getVolumeAmount() != null ? tx.getVolumeAmount().abs() : BigDecimal.ZERO;
                serviceConsumptionMap.merge(prodId, vol, BigDecimal::add);
            } else if (tx.getTransactionType() == InventoryTransactionType.STOCK_ADJUSTMENT) {
                BigDecimal lossFromVol = BigDecimal.ZERO;
                if (tx.getVolumeAmount() != null && tx.getVolumeAmount().compareTo(BigDecimal.ZERO) < 0) {
                    lossFromVol = tx.getVolumeAmount().abs();
                }

                BigDecimal lossFromUnits = BigDecimal.ZERO;
                if (tx.getQuantityUnits() < 0) {
                    BigDecimal unitVol = tx.getProduct().getVolumeOrWeightPerUnit() != null
                            ? tx.getProduct().getVolumeOrWeightPerUnit()
                            : BigDecimal.ZERO;
                    lossFromUnits = BigDecimal.valueOf(Math.abs(tx.getQuantityUnits())).multiply(unitVol);
                }

                BigDecimal totalLoss = lossFromVol.add(lossFromUnits);
                if (totalLoss.compareTo(BigDecimal.ZERO) > 0) {
                    adjustmentLossMap.merge(prodId, totalLoss, BigDecimal::add);
                }
            }
        }

        // 3. Process Stock Alerts
        List<StockAlertItemResponse> alerts = new ArrayList<>();
        int outOfStockCount = 0;
        int lowStockCount = 0;
        int nearThresholdCount = 0;
        int healthyCount = 0;

        for (BranchInventoryEntity inv : inventories) {
            ProductEntity product = inv.getProduct();
            if (product == null || product.isDeleted()) continue;

            int stockUnits = inv.getStockUnits();
            BigDecimal currentVolume = inv.getCurrentVolume() != null ? inv.getCurrentVolume() : BigDecimal.ZERO;
            int minStockAlert = inv.getMinStockAlertUnits() > 0 ? inv.getMinStockAlertUnits() : product.getMinStockAlertUnits();
            BigDecimal volPerUnit = product.getVolumeOrWeightPerUnit() != null ? product.getVolumeOrWeightPerUnit() : BigDecimal.ZERO;

            BigDecimal totalAvailableVolume = BigDecimal.valueOf(stockUnits)
                    .multiply(volPerUnit)
                    .add(currentVolume)
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal consumptionInWindow = serviceConsumptionMap.getOrDefault(product.getId(), BigDecimal.ZERO);
            BigDecimal avgDailyConsumptionVolume = consumptionInWindow
                    .divide(BigDecimal.valueOf(daysInWindow), 2, RoundingMode.HALF_UP);

            Integer estimatedDaysRemaining = null;
            if (avgDailyConsumptionVolume.compareTo(BigDecimal.ZERO) > 0) {
                if (totalAvailableVolume.compareTo(BigDecimal.ZERO) <= 0) {
                    estimatedDaysRemaining = 0;
                } else {
                    estimatedDaysRemaining = totalAvailableVolume
                            .divide(avgDailyConsumptionVolume, 0, RoundingMode.FLOOR)
                            .intValue();
                }
            }

            // 3-Tier Classification Logic:
            // OUT_OF_STOCK: zero sealed units and zero opened volume
            // LOW_STOCK: stockUnits <= minStockAlertUnits (and not OUT_OF_STOCK)
            // NEAR_THRESHOLD: stockUnits == minStockAlertUnits + 1 OR estimatedDaysRemaining <= 7
            // HEALTHY: all other products
            StockAlertLevel alertLevel;
            if (stockUnits == 0 && currentVolume.compareTo(BigDecimal.ZERO) <= 0) {
                alertLevel = StockAlertLevel.OUT_OF_STOCK;
                outOfStockCount++;
            } else if (stockUnits <= minStockAlert) {
                alertLevel = StockAlertLevel.LOW_STOCK;
                lowStockCount++;
            } else if (stockUnits == minStockAlert + 1 || (estimatedDaysRemaining != null && estimatedDaysRemaining <= 7)) {
                alertLevel = StockAlertLevel.NEAR_THRESHOLD;
                nearThresholdCount++;
            } else {
                alertLevel = StockAlertLevel.HEALTHY;
                healthyCount++;
            }

            BigDecimal unitCost = product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO;
            Long invBranchId = inv.getBranch() != null ? inv.getBranch().getId() : (branch != null ? branch.getId() : null);
            String invBranchName = inv.getBranch() != null ? inv.getBranch().getName() : (branch != null ? branch.getName() : null);

            alerts.add(StockAlertItemResponse.builder()
                    .branchId(invBranchId)
                    .branchName(invBranchName)
                    .productId(product.getId())
                    .productName(product.getName())
                    .sku(product.getSku())
                    .unit(product.getUnit())
                    .volumeUnit(product.getVolumeUnit())
                    .volumeOrWeightPerUnit(volPerUnit)
                    .stockUnits(stockUnits)
                    .currentVolume(currentVolume)
                    .minStockAlertUnits(minStockAlert)
                    .totalAvailableVolume(totalAvailableVolume)
                    .avgDailyConsumptionVolume(avgDailyConsumptionVolume)
                    .estimatedDaysRemaining(estimatedDaysRemaining)
                    .alertLevel(alertLevel)
                    .unitCost(unitCost)
                    .build());
        }

        // Sort alerts by criticality priority ASC (1=OUT_OF_STOCK, 2=LOW_STOCK, 3=NEAR_THRESHOLD, 4=HEALTHY), then product name
        alerts.sort(Comparator.comparingInt((StockAlertItemResponse a) -> a.getAlertLevel().getPriority())
                .thenComparing(StockAlertItemResponse::getProductName, String.CASE_INSENSITIVE_ORDER));

        // 4. Calculate Standard BOM across all PAID orders in the period (with batch query to prevent N+1)
        List<OrderEntity> orders;
        if (branchId != null) {
            orders = orderRepository.findByBranchAndStatusAndDateRange(branchId, OrderStatus.PAID, startInstant, endInstant);
        } else {
            orders = orderRepository.findByStatusAndDateRange(OrderStatus.PAID, startInstant, endInstant);
        }

        Set<Long> serviceIds = new HashSet<>();
        for (OrderEntity order : orders) {
            if (order.getItems() == null) continue;
            for (OrderItemEntity item : order.getItems()) {
                if (!item.isDeleted() && item.getItemType() == OrderItemType.SERVICE && item.getService() != null) {
                    serviceIds.add(item.getService().getId());
                }
            }
        }

        Map<Long, List<ServiceBomEntity>> bomsByServiceId = new HashMap<>();
        if (!serviceIds.isEmpty()) {
            List<ServiceBomEntity> allBoms = serviceBomRepository.findAllByServiceIdInAndIsDeletedFalse(serviceIds);
            for (ServiceBomEntity bom : allBoms) {
                if (bom.getService() != null) {
                    bomsByServiceId.computeIfAbsent(bom.getService().getId(), k -> new ArrayList<>()).add(bom);
                }
            }
        }

        Map<Long, BigDecimal> standardBomMap = new HashMap<>();
        Map<Long, ProductEntity> consumableProductMap = new HashMap<>();

        for (OrderEntity order : orders) {
            if (order.getItems() == null) continue;
            for (OrderItemEntity item : order.getItems()) {
                if (item.isDeleted() || item.getItemType() != OrderItemType.SERVICE || item.getService() == null) continue;
                List<ServiceBomEntity> boms = bomsByServiceId.getOrDefault(item.getService().getId(), Collections.emptyList());
                for (ServiceBomEntity bom : boms) {
                    if (bom.getProduct() != null && bom.getStandardAmount() != null) {
                        Long pId = bom.getProduct().getId();
                        BigDecimal standardVolume = bom.getStandardAmount().multiply(BigDecimal.valueOf(item.getQuantity()));
                        standardBomMap.merge(pId, standardVolume, BigDecimal::add);
                        consumableProductMap.putIfAbsent(pId, bom.getProduct());
                    }
                }
            }
        }

        // Include consumable products with actual service consumption or negative stock adjustments
        Map<Long, ProductEntity> productByIdFromInventory = new HashMap<>();
        for (BranchInventoryEntity inv : inventories) {
            if (inv.getProduct() != null) {
                productByIdFromInventory.put(inv.getProduct().getId(), inv.getProduct());
            }
        }

        Set<Long> actualMovementProductIds = new HashSet<>();
        actualMovementProductIds.addAll(serviceConsumptionMap.keySet());
        actualMovementProductIds.addAll(adjustmentLossMap.keySet());

        for (Long pId : actualMovementProductIds) {
            if (!consumableProductMap.containsKey(pId)) {
                ProductEntity prod = productByIdFromInventory.get(pId);
                // Ensure only consumable / chemical products with measurable volume are audited in BOM Wastage
                if (prod != null && prod.getVolumeOrWeightPerUnit() != null && prod.getVolumeOrWeightPerUnit().compareTo(BigDecimal.ZERO) > 0) {
                    consumableProductMap.put(pId, prod);
                }
            }
        }

        // 5. Compile BOM Wastage Items with Immutable Cost Snapshots
        List<BomWastageItemResponse> bomWastages = new ArrayList<>();
        BigDecimal totalWastageCostAmount = BigDecimal.ZERO;

        for (ProductEntity product : consumableProductMap.values()) {
            if (product.isDeleted()) continue;
            Long pId = product.getId();

            BigDecimal standardBomVolume = standardBomMap.getOrDefault(pId, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            BigDecimal serviceConsumptionVolume = serviceConsumptionMap.getOrDefault(pId, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            BigDecimal adjustmentLossVolume = adjustmentLossMap.getOrDefault(pId, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

            BigDecimal actualTotalVolume = serviceConsumptionVolume.add(adjustmentLossVolume).setScale(2, RoundingMode.HALF_UP);
            BigDecimal varianceVolume = actualTotalVolume.subtract(standardBomVolume).setScale(2, RoundingMode.HALF_UP);
            BigDecimal wastageVolume = varianceVolume.compareTo(BigDecimal.ZERO) > 0 ? varianceVolume : BigDecimal.ZERO;

            // Percentage overrun (%): only non-negative when usage exceeds standard BOM baseline
            BigDecimal wastagePercentage = BigDecimal.ZERO;
            if (varianceVolume.compareTo(BigDecimal.ZERO) > 0) {
                if (standardBomVolume.compareTo(BigDecimal.ZERO) > 0) {
                    wastagePercentage = varianceVolume
                            .divide(standardBomVolume, 4, RoundingMode.HALF_UP)
                            .multiply(new BigDecimal("100"))
                            .setScale(2, RoundingMode.HALF_UP);
                } else if (actualTotalVolume.compareTo(BigDecimal.ZERO) > 0) {
                    wastagePercentage = new BigDecimal("100.00");
                }
            }

            // Prefer immutable unit cost snapshot from transactions in period; fall back to catalog price / volume
            BigDecimal unitCostSnapshot = transactionUnitCostMap.get(pId);
            if (unitCostSnapshot == null || unitCostSnapshot.compareTo(BigDecimal.ZERO) <= 0) {
                BigDecimal costPrice = product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO;
                BigDecimal volPerUnit = product.getVolumeOrWeightPerUnit() != null ? product.getVolumeOrWeightPerUnit() : BigDecimal.ZERO;
                if (volPerUnit.compareTo(BigDecimal.ZERO) > 0) {
                    unitCostSnapshot = costPrice.divide(volPerUnit, 4, RoundingMode.HALF_UP);
                } else {
                    unitCostSnapshot = BigDecimal.ZERO;
                }
            }

            BigDecimal wastageCostAmount = wastageVolume.multiply(unitCostSnapshot).setScale(2, RoundingMode.HALF_UP);
            totalWastageCostAmount = totalWastageCostAmount.add(wastageCostAmount);

            bomWastages.add(BomWastageItemResponse.builder()
                    .productId(pId)
                    .productName(product.getName())
                    .sku(product.getSku())
                    .volumeUnit(product.getVolumeUnit())
                    .unitCostSnapshot(unitCostSnapshot)
                    .standardBomVolume(standardBomVolume)
                    .serviceConsumptionVolume(serviceConsumptionVolume)
                    .adjustmentLossVolume(adjustmentLossVolume)
                    .actualTotalVolume(actualTotalVolume)
                    .varianceVolume(varianceVolume)
                    .wastageVolume(wastageVolume)
                    .wastagePercentage(wastagePercentage)
                    .wastageCostAmount(wastageCostAmount)
                    .build());
        }

        // Sort BOM Wastage by monetary loss DESC, then wastageVolume DESC
        bomWastages.sort((a, b) -> {
            int cmp = b.getWastageCostAmount().compareTo(a.getWastageCostAmount());
            if (cmp != 0) return cmp;
            return b.getWastageVolume().compareTo(a.getWastageVolume());
        });

        return InventoryAlertsAnalyticsResponse.builder()
                .branchId(branch != null ? branch.getId() : branchId)
                .branchName(branch != null ? branch.getName() : "Tất cả chi nhánh")
                .startDate(actualStart)
                .endDate(actualEnd)
                .totalProducts(alerts.size())
                .outOfStockCount(outOfStockCount)
                .lowStockCount(lowStockCount)
                .nearThresholdCount(nearThresholdCount)
                .healthyCount(healthyCount)
                .totalWastageCostAmount(totalWastageCostAmount)
                .alerts(alerts)
                .bomWastages(bomWastages)
                .build();
    }
}
