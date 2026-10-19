package com.smartsalon.pos.entity;

import com.smartsalon.user.entity.UserEntity;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_step_assignments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class OrderStepAssignmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItemEntity orderItem;

    @Column(name = "step_name", nullable = false, length = 100)
    private String stepName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false)
    private UserEntity staff;

    @Column(name = "commission_rate", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal commissionRate = BigDecimal.ZERO;

    @Column(name = "commission_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal commissionAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private StepAssignmentStatus status = StepAssignmentStatus.PENDING;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    public static final BigDecimal DEFAULT_COMMISSION_POOL_RATE = new BigDecimal("20.00");

    public static BigDecimal calculateCommissionAmount(BigDecimal itemPrice, BigDecimal poolRate, BigDecimal stepRate) {
        if (itemPrice == null || poolRate == null || stepRate == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal poolAmount = itemPrice.multiply(poolRate).divide(new BigDecimal("100"), 4, java.math.RoundingMode.HALF_UP);
        return poolAmount.multiply(stepRate).divide(new BigDecimal("100"), 0, java.math.RoundingMode.HALF_UP);
    }

    public BigDecimal recalculateCommissionAmount() {
        BigDecimal itemPrice = (orderItem != null && orderItem.getTotalPrice() != null)
                ? orderItem.getTotalPrice()
                : BigDecimal.ZERO;
        BigDecimal poolRate = (orderItem != null)
                ? orderItem.resolveCommissionPoolRate()
                : DEFAULT_COMMISSION_POOL_RATE;
        BigDecimal stepRate = this.commissionRate != null ? this.commissionRate : BigDecimal.ZERO;
        this.commissionAmount = calculateCommissionAmount(itemPrice, poolRate, stepRate);
        return this.commissionAmount;
    }

    public String formatCalculationNotes() {
        BigDecimal itemPrice = (orderItem != null && orderItem.getTotalPrice() != null)
                ? orderItem.getTotalPrice()
                : BigDecimal.ZERO;
        BigDecimal poolRate = (orderItem != null)
                ? orderItem.resolveCommissionPoolRate()
                : DEFAULT_COMMISSION_POOL_RATE;
        BigDecimal stepRate = this.commissionRate != null ? this.commissionRate : BigDecimal.ZERO;
        String serviceName = (orderItem != null && orderItem.getService() != null)
                ? orderItem.getService().getName()
                : "";
        return String.format(
                "Hoa hồng bước '%s' - Dịch vụ '%s' (%s x Pool %.1f%% x Bước %.1f%%)",
                this.stepName,
                serviceName,
                itemPrice.stripTrailingZeros().toPlainString(),
                poolRate.doubleValue(),
                stepRate.doubleValue()
        );
    }
}
