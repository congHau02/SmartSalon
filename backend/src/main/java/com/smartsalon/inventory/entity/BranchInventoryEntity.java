package com.smartsalon.inventory.entity;

import com.smartsalon.branch.entity.BranchEntity;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "branch_inventories", uniqueConstraints = {
        @UniqueConstraint(name = "uk_branch_product", columnNames = {"branch_id", "product_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class BranchInventoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private BranchEntity branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private ProductEntity product;

    @Column(name = "stock_units", nullable = false)
    @Builder.Default
    private int stockUnits = 0;

    @Column(name = "current_volume", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal currentVolume = BigDecimal.ZERO;

    @Column(name = "min_stock_alert_units", nullable = false)
    @Builder.Default
    private int minStockAlertUnits = 5;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;

    public BigDecimal calculateTotalAvailableVolume() {
        BigDecimal unitVolume = (product != null && product.getVolumeOrWeightPerUnit() != null)
                ? product.getVolumeOrWeightPerUnit()
                : BigDecimal.ZERO;
        BigDecimal safeCurrentVolume = currentVolume != null ? currentVolume : BigDecimal.ZERO;
        return BigDecimal.valueOf(stockUnits).multiply(unitVolume).add(safeCurrentVolume);
    }

    public int effectiveMinStockAlertUnits() {
        if (minStockAlertUnits > 0) {
            return minStockAlertUnits;
        }
        return product != null ? product.getMinStockAlertUnits() : 0;
    }

    public boolean isLowStock() {
        return stockUnits <= effectiveMinStockAlertUnits();
    }

    public Integer calculateEstimatedDaysRemaining(BigDecimal avgDailyConsumptionVolume) {
        if (avgDailyConsumptionVolume == null || avgDailyConsumptionVolume.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        BigDecimal totalAvailable = calculateTotalAvailableVolume();
        if (totalAvailable.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }
        return totalAvailable.divide(avgDailyConsumptionVolume, 0, java.math.RoundingMode.FLOOR).intValue();
    }

    public com.smartsalon.analytics.dto.StockAlertLevel classifyStockAlertLevel(BigDecimal avgDailyConsumptionVolume) {
        BigDecimal safeCurrentVolume = currentVolume != null ? currentVolume : BigDecimal.ZERO;
        int minAlert = effectiveMinStockAlertUnits();
        Integer estimatedDays = calculateEstimatedDaysRemaining(avgDailyConsumptionVolume);

        if (stockUnits == 0 && safeCurrentVolume.compareTo(BigDecimal.ZERO) <= 0) {
            return com.smartsalon.analytics.dto.StockAlertLevel.OUT_OF_STOCK;
        }
        if (stockUnits <= minAlert) {
            return com.smartsalon.analytics.dto.StockAlertLevel.LOW_STOCK;
        }
        if (stockUnits == minAlert + 1 || (estimatedDays != null && estimatedDays <= 7)) {
            return com.smartsalon.analytics.dto.StockAlertLevel.NEAR_THRESHOLD;
        }
        return com.smartsalon.analytics.dto.StockAlertLevel.HEALTHY;
    }

    public ConsumableDeductionResult deductConsumableVolume(BigDecimal volumeAmount) {
        BigDecimal openedVolume = this.currentVolume != null ? this.currentVolume : BigDecimal.ZERO;
        BigDecimal unitVolume = product.getVolumeOrWeightPerUnit();

        if (openedVolume.compareTo(volumeAmount) >= 0) {
            this.currentVolume = openedVolume.subtract(volumeAmount);
            return new ConsumableDeductionResult(0, BigDecimal.ZERO, BigDecimal.ZERO, calculateTotalAvailableVolume());
        }

        if (!product.hasMeasurableVolume()) {
            throw new com.smartsalon.exception.AppException(com.smartsalon.exception.ErrorCode.INSUFFICIENT_STOCK);
        }

        BigDecimal deficit = volumeAmount.subtract(openedVolume);
        BigDecimal[] divAndRem = deficit.divideAndRemainder(unitVolume);
        int unitsToUnseal = divAndRem[0].intValue() + (divAndRem[1].compareTo(BigDecimal.ZERO) > 0 ? 1 : 0);

        if (this.stockUnits < unitsToUnseal) {
            throw new com.smartsalon.exception.AppException(com.smartsalon.exception.ErrorCode.INSUFFICIENT_STOCK);
        }

        this.stockUnits -= unitsToUnseal;
        BigDecimal unsealedAddedVolume = BigDecimal.valueOf(unitsToUnseal).multiply(unitVolume);
        BigDecimal totalAvailableBeforeConsume = openedVolume.add(unsealedAddedVolume);
        this.currentVolume = totalAvailableBeforeConsume.subtract(volumeAmount);
        BigDecimal balanceAfterUnseal = totalAvailableBeforeConsume.add(BigDecimal.valueOf(this.stockUnits).multiply(unitVolume));

        return new ConsumableDeductionResult(unitsToUnseal, unsealedAddedVolume, balanceAfterUnseal, calculateTotalAvailableVolume());
    }

    public record ConsumableDeductionResult(
            int unitsUnsealed,
            BigDecimal unsealedAddedVolume,
            BigDecimal balanceAfterUnseal,
            BigDecimal balanceAfterConsume
    ) {}
}
