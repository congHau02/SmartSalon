package com.smartsalon.pos.entity;

import com.smartsalon.user.entity.MembershipTier;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.voucher.entity.VoucherEntity;
import com.smartsalon.voucher.entity.VoucherType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class OrderVoucherDiscountDomainTest {

    @Test
    @DisplayName("Non-stacking: Voucher wins when voucher discount is strictly greater than membership tier discount")
    void voucherWins_whenGreaterThanTierDiscount() {
        // Customer SILVER (5% discount)
        UserEntity customer = UserEntity.builder()
                .username("cust.silver")
                .membershipTier(MembershipTier.SILVER)
                .build();

        OrderEntity order = OrderEntity.builder()
                .customer(customer)
                .subtotal(new BigDecimal("1000000.00")) // 1,000,000
                .build();

        // Tier discount: 1,000,000 * 5% = 50,000 VND
        // Voucher 100k fixed discount
        VoucherEntity voucher = VoucherEntity.builder()
                .code("GIAM100K")
                .type(VoucherType.FIXED)
                .value(new BigDecimal("100000.00"))
                .minOrderAmount(new BigDecimal("500000.00"))
                .build();

        order.applyVoucher(voucher);

        assertThat(order.getVoucher()).isEqualTo(voucher);
        assertThat(order.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("100000.00"));
        assertThat(order.getFinalAmount()).isEqualByComparingTo(new BigDecimal("900000.00"));
    }

    @Test
    @DisplayName("Non-stacking: Tier wins and voucher_id remains null when tier discount is greater than or equal to voucher")
    void tierWins_whenTierDiscountIsGreaterOrEqualToVoucher() {
        // Customer GOLD (10% discount)
        UserEntity customer = UserEntity.builder()
                .username("cust.gold")
                .membershipTier(MembershipTier.GOLD)
                .build();

        OrderEntity order = OrderEntity.builder()
                .customer(customer)
                .subtotal(new BigDecimal("1000000.00")) // 1,000,000
                .build();

        // Tier discount: 1,000,000 * 10% = 100,000 VND
        // Voucher 50k fixed discount
        VoucherEntity voucher = VoucherEntity.builder()
                .code("GIAM50K")
                .type(VoucherType.FIXED)
                .value(new BigDecimal("50000.00"))
                .build();

        order.applyVoucher(voucher);

        // Tier won: voucher_id is null, discount is tier discount
        assertThat(order.getVoucher()).isNull();
        assertThat(order.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("100000.00"));
        assertThat(order.getFinalAmount()).isEqualByComparingTo(new BigDecimal("900000.00"));
    }

    @Test
    @DisplayName("Manual override takes precedence over voucher and clears voucher association")
    void manualDiscount_takesPrecedence_andClearsVoucher() {
        UserEntity customer = UserEntity.builder()
                .username("cust.regular")
                .membershipTier(MembershipTier.STANDARD)
                .build();

        OrderEntity order = OrderEntity.builder()
                .customer(customer)
                .subtotal(new BigDecimal("500000.00"))
                .build();

        VoucherEntity voucher = VoucherEntity.builder()
                .code("GIAM50K")
                .type(VoucherType.FIXED)
                .value(new BigDecimal("50000.00"))
                .build();

        order.applyVoucher(voucher);
        assertThat(order.getVoucher()).isEqualTo(voucher);

        // Cashier manually overrides with 70,000 VND discount
        order.applyManualDiscount(new BigDecimal("70000.00"));

        assertThat(order.isDiscountManual()).isTrue();
        assertThat(order.getVoucher()).isNull();
        assertThat(order.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("70000.00"));
        assertThat(order.getFinalAmount()).isEqualByComparingTo(new BigDecimal("430000.00"));
    }

    @Test
    @DisplayName("Removing voucher restores automatic membership tier discount")
    void removeVoucher_restoresMembershipTierDiscount() {
        UserEntity customer = UserEntity.builder()
                .username("cust.silver")
                .membershipTier(MembershipTier.SILVER)
                .build();

        OrderEntity order = OrderEntity.builder()
                .customer(customer)
                .subtotal(new BigDecimal("1000000.00"))
                .build();

        VoucherEntity voucher = VoucherEntity.builder()
                .code("GIAM150K")
                .type(VoucherType.FIXED)
                .value(new BigDecimal("150000.00"))
                .build();

        order.applyVoucher(voucher);
        assertThat(order.getVoucher()).isEqualTo(voucher);
        assertThat(order.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("150000.00"));

        order.removeVoucher();
        assertThat(order.getVoucher()).isNull();
        // Reverts to SILVER 5% = 50,000 VND
        assertThat(order.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("50000.00"));
        assertThat(order.getFinalAmount()).isEqualByComparingTo(new BigDecimal("950000.00"));
    }
}
