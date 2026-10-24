package com.smartsalon.user.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Getter
@RequiredArgsConstructor
public enum MembershipTier {
    STANDARD(0, BigDecimal.ZERO, "STANDARD", "Thành viên Tiêu chuẩn"),
    SILVER(5, new BigDecimal("2000000.00"), "SILVER", "Thành viên Bạc"),
    GOLD(10, new BigDecimal("5000000.00"), "GOLD", "Thành viên Vàng"),
    DIAMOND(15, new BigDecimal("10000000.00"), "DIAMOND", "Thành viên Kim Cương");

    private final int discountPercent;
    private final BigDecimal minSpendThreshold;
    private final String code;
    private final String displayName;

    public static MembershipTier fromTotalSpent(BigDecimal totalSpent) {
        if (totalSpent == null || totalSpent.compareTo(BigDecimal.ZERO) <= 0) {
            return STANDARD;
        }
        if (totalSpent.compareTo(DIAMOND.minSpendThreshold) >= 0) {
            return DIAMOND;
        }
        if (totalSpent.compareTo(GOLD.minSpendThreshold) >= 0) {
            return GOLD;
        }
        if (totalSpent.compareTo(SILVER.minSpendThreshold) >= 0) {
            return SILVER;
        }
        return STANDARD;
    }

    public MembershipTier getNextTier() {
        return switch (this) {
            case STANDARD -> SILVER;
            case SILVER -> GOLD;
            case GOLD -> DIAMOND;
            case DIAMOND -> null;
        };
    }

    public BigDecimal getAmountToNextTier(BigDecimal currentSpend) {
        MembershipTier next = getNextTier();
        if (next == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal safeSpend = currentSpend != null ? currentSpend.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        return next.minSpendThreshold.subtract(safeSpend).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal calculateDiscount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0 || this.discountPercent <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return amount.multiply(BigDecimal.valueOf(this.discountPercent))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }
}
