package com.smartsalon.inventory.entity;

import java.math.BigDecimal;
import java.math.RoundingMode;

public enum InventoryTransactionType {
    STOCK_IN,
    STOCK_ADJUSTMENT,
    AUTO_UNSEAL,
    SERVICE_CONSUMPTION,
    RETAIL_SALE;

    public CostValuation evaluateCost(ProductEntity product, int quantityUnits, BigDecimal volumeAmount) {
        BigDecimal safeVol = volumeAmount != null ? volumeAmount : BigDecimal.ZERO;
        return switch (this) {
            case SERVICE_CONSUMPTION, AUTO_UNSEAL -> new CostValuation(
                    product.calculateVolumeUnitCostSnapshot(),
                    product.calculateVolumeCostAmount(safeVol)
            );
            case RETAIL_SALE, STOCK_IN -> new CostValuation(
                    product.calculateRetailUnitCostSnapshot(),
                    product.calculateRetailCostAmount(quantityUnits)
            );
            case STOCK_ADJUSTMENT -> evaluateAdjustmentCost(product, quantityUnits, safeVol);
        };
    }

    private CostValuation evaluateAdjustmentCost(ProductEntity product, int quantityUnits, BigDecimal safeVol) {
        if (quantityUnits != 0 && safeVol.compareTo(BigDecimal.ZERO) == 0) {
            return new CostValuation(product.calculateRetailUnitCostSnapshot(), product.calculateRetailCostAmount(quantityUnits));
        }
        if (safeVol.compareTo(BigDecimal.ZERO) != 0 && quantityUnits == 0) {
            return new CostValuation(product.calculateVolumeUnitCostSnapshot(), product.calculateVolumeCostAmount(safeVol));
        }
        BigDecimal snapshot = product.hasMeasurableVolume()
                ? product.calculateVolumeUnitCostSnapshot()
                : product.calculateRetailUnitCostSnapshot();
        BigDecimal total = product.calculateRetailCostAmount(quantityUnits)
                .add(product.calculateVolumeCostAmount(safeVol))
                .setScale(2, RoundingMode.HALF_UP);
        return new CostValuation(snapshot, total);
    }

    public record CostValuation(BigDecimal unitCostSnapshot, BigDecimal totalCostAmount) {}
}
