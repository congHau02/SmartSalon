package com.smartsalon.inventory.entity;

import com.smartsalon.branch.entity.BranchEntity;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "inventory_transactions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class InventoryTransactionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private ProductEntity product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private BranchEntity branch;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 30)
    private InventoryTransactionType transactionType;

    @Column(name = "quantity_units", nullable = false)
    @Builder.Default
    private int quantityUnits = 0;

    @Column(name = "volume_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal volumeAmount = BigDecimal.ZERO;

    @Column(name = "unit", nullable = false, length = 20)
    private String unit;

    @Column(name = "balance_after_volume", nullable = false, precision = 12, scale = 2)
    private BigDecimal balanceAfterVolume;

    @Column(name = "reference_order_id")
    private Long referenceOrderId;

    @Column(name = "notes", length = 255)
    private String notes;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;
}
