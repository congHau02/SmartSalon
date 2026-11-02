package com.smartsalon.voucher.entity;

import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "vouchers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherEntity extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", length = 255)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "`type`", nullable = false, length = 20)
    private VoucherType type;

    @Column(name = "`value`", nullable = false, precision = 15, scale = 2)
    private BigDecimal value;

    @Column(name = "max_discount", precision = 15, scale = 2)
    private BigDecimal maxDiscount;

    @Column(name = "min_order_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @Column(name = "starts_at")
    private Instant startsAt;

    @Column(name = "ends_at")
    private Instant endsAt;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "per_customer_limit", nullable = false)
    @Builder.Default
    private Integer perCustomerLimit = 1;

    @Column(name = "used_count", nullable = false)
    @Builder.Default
    private Integer usedCount = 0;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "voucher_branches",
            joinColumns = @JoinColumn(name = "voucher_id"),
            inverseJoinColumns = @JoinColumn(name = "branch_id")
    )
    @Builder.Default
    private Set<BranchEntity> branches = new HashSet<>();

    public BigDecimal calculateDiscount(BigDecimal subtotal) {
        if (subtotal == null || subtotal.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal discount;
        if (this.type == VoucherType.PERCENT) {
            BigDecimal safeVal = this.value != null ? this.value : BigDecimal.ZERO;
            discount = subtotal.multiply(safeVal).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (this.maxDiscount != null && this.maxDiscount.compareTo(BigDecimal.ZERO) > 0) {
                discount = discount.min(this.maxDiscount);
            }
        } else {
            discount = this.value != null ? this.value : BigDecimal.ZERO;
        }

        return discount.max(BigDecimal.ZERO).min(subtotal);
    }

    public boolean isBranchAllowed(Long branchId) {
        if (branches == null || branches.isEmpty()) {
            return true; // Chain-wide
        }
        if (branchId == null) {
            return false;
        }
        return branches.stream().anyMatch(b -> branchId.equals(b.getId()));
    }
}
