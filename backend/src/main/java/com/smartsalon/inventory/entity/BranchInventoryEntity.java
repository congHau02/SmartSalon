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
}
