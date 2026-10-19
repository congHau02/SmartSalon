package com.smartsalon.pos.entity;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.common.BaseEntity;
import com.smartsalon.user.entity.UserEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private BranchEntity branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private UserEntity customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private BookingEntity booking;

    @Column(name = "order_code", nullable = false, unique = true, length = 50)
    private String orderCode;

    @Column(name = "subtotal", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "discount_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "deposit_deducted", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal depositDeducted = BigDecimal.ZERO;

    @Column(name = "final_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal finalAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private OrderStatus status = OrderStatus.CHECKED_IN;

    @Column(name = "customer_name", length = 150)
    private String customerName;

    @Column(name = "customer_phone", length = 20)
    private String customerPhone;

    @Column(name = "payment_method", length = 30)
    private String paymentMethod;

    @Column(name = "notes", length = 500)
    private String notes;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItemEntity> items = new ArrayList<>();

    public void addItem(OrderItemEntity item) {
        items.add(item);
        item.setOrder(this);
    }

    public void removeItem(OrderItemEntity item) {
        items.remove(item);
        item.setOrder(null);
    }

    public void recalculateTotals() {
        BigDecimal computedSubtotal = BigDecimal.ZERO;
        if (items != null) {
            for (OrderItemEntity item : items) {
                if (!item.isDeleted() && item.getTotalPrice() != null) {
                    computedSubtotal = computedSubtotal.add(item.getTotalPrice());
                }
            }
        }
        this.subtotal = computedSubtotal;
        this.finalAmount = calculateFinalAmountWithDraftDiscount(this.discountAmount);
    }

    public BigDecimal calculateFinalAmountWithDraftDiscount(BigDecimal draftDiscount) {
        BigDecimal safeSubtotal = this.subtotal != null ? this.subtotal : BigDecimal.ZERO;
        BigDecimal safeDiscount = draftDiscount != null ? draftDiscount.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        BigDecimal safeDeposit = this.depositDeducted != null ? this.depositDeducted : BigDecimal.ZERO;
        return safeSubtotal.subtract(safeDiscount).subtract(safeDeposit).max(BigDecimal.ZERO);
    }

    public RevenueBreakdown calculateRevenueBreakdown() {
        BigDecimal grossServiceRevenue = BigDecimal.ZERO;
        BigDecimal grossRetailRevenue = BigDecimal.ZERO;

        if (items != null) {
            for (OrderItemEntity item : items) {
                if (item.isDeleted()) continue;
                BigDecimal price = item.getTotalPrice() != null ? item.getTotalPrice() : BigDecimal.ZERO;
                if (item.getItemType() == OrderItemType.SERVICE) {
                    grossServiceRevenue = grossServiceRevenue.add(price);
                } else if (item.getItemType() == OrderItemType.PRODUCT) {
                    grossRetailRevenue = grossRetailRevenue.add(price);
                }
            }
        }

        BigDecimal grossTotal = grossServiceRevenue.add(grossRetailRevenue);
        BigDecimal rawDiscount = this.discountAmount != null ? this.discountAmount.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        BigDecimal effectiveDiscount = rawDiscount.min(grossTotal);

        BigDecimal serviceDiscount = BigDecimal.ZERO;
        BigDecimal retailDiscount = BigDecimal.ZERO;

        if (grossTotal.compareTo(BigDecimal.ZERO) > 0) {
            serviceDiscount = effectiveDiscount.multiply(grossServiceRevenue)
                    .divide(grossTotal, 2, java.math.RoundingMode.HALF_UP);
            retailDiscount = effectiveDiscount.subtract(serviceDiscount);
        }

        BigDecimal netServiceRevenue = grossServiceRevenue.subtract(serviceDiscount);
        BigDecimal netRetailRevenue = grossRetailRevenue.subtract(retailDiscount);
        BigDecimal totalNetRevenue = netServiceRevenue.add(netRetailRevenue);

        return new RevenueBreakdown(
                grossServiceRevenue,
                grossRetailRevenue,
                serviceDiscount,
                retailDiscount,
                effectiveDiscount,
                netServiceRevenue,
                netRetailRevenue,
                totalNetRevenue
        );
    }

    public record RevenueBreakdown(
            BigDecimal grossServiceRevenue,
            BigDecimal grossRetailRevenue,
            BigDecimal serviceDiscount,
            BigDecimal retailDiscount,
            BigDecimal totalDiscount,
            BigDecimal netServiceRevenue,
            BigDecimal netRetailRevenue,
            BigDecimal totalNetRevenue
    ) {}
}
