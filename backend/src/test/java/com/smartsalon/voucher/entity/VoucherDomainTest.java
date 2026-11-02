package com.smartsalon.voucher.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class VoucherDomainTest {

    @Test
    @DisplayName("PERCENT discount calculates proportional amount without cap when maxDiscount is null")
    void percentDiscount_withoutCap() {
        VoucherEntity voucher = VoucherEntity.builder()
                .type(VoucherType.PERCENT)
                .value(new BigDecimal("10.00")) // 10%
                .maxDiscount(null)
                .build();

        BigDecimal subtotal = new BigDecimal("350000.00");
        BigDecimal discount = voucher.calculateDiscount(subtotal);

        // 350,000 * 10% = 35,000.00
        assertThat(discount).isEqualByComparingTo(new BigDecimal("35000.00"));
    }

    @Test
    @DisplayName("PERCENT discount is capped by maxDiscount when computed amount exceeds cap")
    void percentDiscount_cappedByMaxDiscount() {
        VoucherEntity voucher = VoucherEntity.builder()
                .type(VoucherType.PERCENT)
                .value(new BigDecimal("20.00")) // 20%
                .maxDiscount(new BigDecimal("50000.00")) // Cap 50k
                .build();

        BigDecimal subtotal = new BigDecimal("500000.00");
        // 500,000 * 20% = 100,000 > 50,000 cap -> 50,000
        BigDecimal discount = voucher.calculateDiscount(subtotal);

        assertThat(discount).isEqualByComparingTo(new BigDecimal("50000.00"));
    }

    @Test
    @DisplayName("PERCENT discount remains uncapped when computed amount is less than maxDiscount")
    void percentDiscount_belowMaxDiscount() {
        VoucherEntity voucher = VoucherEntity.builder()
                .type(VoucherType.PERCENT)
                .value(new BigDecimal("10.00"))
                .maxDiscount(new BigDecimal("50000.00"))
                .build();

        BigDecimal subtotal = new BigDecimal("200000.00");
        // 200,000 * 10% = 20,000 < 50,000 cap -> 20,000
        BigDecimal discount = voucher.calculateDiscount(subtotal);

        assertThat(discount).isEqualByComparingTo(new BigDecimal("20000.00"));
    }

    @Test
    @DisplayName("FIXED discount returns exact fixed value")
    void fixedDiscount_returnsValue() {
        VoucherEntity voucher = VoucherEntity.builder()
                .type(VoucherType.FIXED)
                .value(new BigDecimal("50000.00"))
                .build();

        BigDecimal subtotal = new BigDecimal("300000.00");
        BigDecimal discount = voucher.calculateDiscount(subtotal);

        assertThat(discount).isEqualByComparingTo(new BigDecimal("50000.00"));
    }

    @Test
    @DisplayName("FIXED discount is clamped to subtotal when fixed value exceeds subtotal")
    void fixedDiscount_clampedToSubtotal() {
        VoucherEntity voucher = VoucherEntity.builder()
                .type(VoucherType.FIXED)
                .value(new BigDecimal("200000.00"))
                .build();

        BigDecimal subtotal = new BigDecimal("150000.00");
        // Fixed 200k > subtotal 150k -> clamped to 150,000
        BigDecimal discount = voucher.calculateDiscount(subtotal);

        assertThat(discount).isEqualByComparingTo(new BigDecimal("150000.00"));
    }

    @Test
    @DisplayName("Discount is clamped to zero when subtotal is zero, negative, or null")
    void discount_clampedToZeroOnInvalidSubtotal() {
        VoucherEntity voucher = VoucherEntity.builder()
                .type(VoucherType.PERCENT)
                .value(new BigDecimal("50.00"))
                .build();

        assertThat(voucher.calculateDiscount(BigDecimal.ZERO)).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(voucher.calculateDiscount(new BigDecimal("-10000.00"))).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(voucher.calculateDiscount(null)).isEqualByComparingTo(BigDecimal.ZERO);
    }
}
