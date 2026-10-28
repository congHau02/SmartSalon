package com.smartsalon.pos.entity;

import com.smartsalon.user.entity.UserEntity;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "commission_ledgers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class CommissionLedgerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false)
    private UserEntity staff;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private OrderEntity order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "step_assignment_id")
    private OrderStepAssignmentEntity stepAssignment;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "calculation_notes")
    private String calculationNotes;

    @Column(name = "overtime", nullable = false)
    @Builder.Default
    private boolean overtime = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    public BigDecimal safeAmount() {
        return amount != null ? amount : BigDecimal.ZERO;
    }

    public String resolveServiceName() {
        if (stepAssignment != null
                && stepAssignment.getOrderItem() != null
                && stepAssignment.getOrderItem().getService() != null) {
            return stepAssignment.getOrderItem().getService().getName();
        }
        return null;
    }

    public String resolveStepName() {
        return stepAssignment != null ? stepAssignment.getStepName() : null;
    }

    public BigDecimal resolveCommissionRate() {
        return stepAssignment != null ? stepAssignment.getCommissionRate() : null;
    }
}
