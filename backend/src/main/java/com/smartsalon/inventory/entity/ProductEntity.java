package com.smartsalon.inventory.entity;

import com.smartsalon.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "products")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductEntity extends BaseEntity {

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "sku", nullable = false, unique = true, length = 100)
    private String sku;

    @Column(name = "barcode", length = 100)
    private String barcode;

    @Column(name = "unit", nullable = false, length = 50)
    private String unit;

    @Column(name = "volume_or_weight_per_unit", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal volumeOrWeightPerUnit = BigDecimal.ZERO;

    @Column(name = "volume_unit", nullable = false, length = 20)
    @Builder.Default
    private String volumeUnit = "ml";

    @Column(name = "min_stock_alert_units", nullable = false)
    @Builder.Default
    private int minStockAlertUnits = 5;

    @Column(name = "cost_price", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal costPrice = BigDecimal.ZERO;

    @Column(name = "retail_price", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal retailPrice = BigDecimal.ZERO;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    public boolean hasMeasurableVolume() {
        return volumeOrWeightPerUnit != null && volumeOrWeightPerUnit.compareTo(BigDecimal.ZERO) > 0;
    }

    public BigDecimal calculateVolumeUnitCostSnapshot() {
        BigDecimal safeCost = costPrice != null ? costPrice : BigDecimal.ZERO;
        if (!hasMeasurableVolume()) {
            return BigDecimal.ZERO;
        }
        return safeCost.divide(volumeOrWeightPerUnit, 4, java.math.RoundingMode.HALF_UP);
    }

    public BigDecimal calculateRetailUnitCostSnapshot() {
        BigDecimal safeCost = costPrice != null ? costPrice : BigDecimal.ZERO;
        return safeCost.setScale(4, java.math.RoundingMode.HALF_UP);
    }

    public BigDecimal calculateVolumeCostAmount(BigDecimal volumeAmount) {
        if (volumeAmount == null || volumeAmount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO.setScale(2, java.math.RoundingMode.HALF_UP);
        }
        return volumeAmount.abs()
                .multiply(calculateVolumeUnitCostSnapshot())
                .setScale(2, java.math.RoundingMode.HALF_UP);
    }

    public BigDecimal calculateRetailCostAmount(int quantityUnits) {
        BigDecimal safeCost = costPrice != null ? costPrice : BigDecimal.ZERO;
        return BigDecimal.valueOf(Math.abs(quantityUnits))
                .multiply(safeCost)
                .setScale(2, java.math.RoundingMode.HALF_UP);
    }
}
