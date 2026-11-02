package com.smartsalon.voucher.service.impl;

import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.voucher.entity.VoucherEntity;
import com.smartsalon.voucher.entity.VoucherRedemptionEntity;
import com.smartsalon.voucher.repository.VoucherRedemptionRepository;
import com.smartsalon.voucher.repository.VoucherRepository;
import com.smartsalon.voucher.validator.VoucherValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoucherSettlementService {

    private final VoucherRepository voucherRepository;
    private final VoucherRedemptionRepository redemptionRepository;
    private final VoucherValidator voucherValidator;

    @Transactional
    public void redeemVoucherForOrder(OrderEntity order) {
        if (order.getVoucher() == null) {
            return;
        }

        Long voucherId = order.getVoucher().getId();
        VoucherEntity lockedVoucher = voucherRepository.findByIdForUpdate(voucherId)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NO_LONGER_VALID, "Mã giảm giá không tồn tại"));

        Instant now = Instant.now();
        try {
            voucherValidator.validate(lockedVoucher, order.getBranch(), order.getSubtotal(), order.getCustomer(), now);
        } catch (AppException ex) {
            log.warn("Voucher validation failed during settlement for order {}: {}", order.getId(), ex.getMessage());
            throw new AppException(ErrorCode.VOUCHER_NO_LONGER_VALID, "Mã giảm giá không còn hiệu lực tại thời điểm thanh toán: " + ex.getMessage());
        }

        lockedVoucher.setUsedCount(lockedVoucher.getUsedCount() + 1);
        voucherRepository.save(lockedVoucher);

        UserEntity customer = order.getCustomer();
        boolean isWalkin = customer == null || "walkin.guest".equalsIgnoreCase(customer.getUsername());
        VoucherRedemptionEntity redemption = VoucherRedemptionEntity.builder()
                .voucher(lockedVoucher)
                .order(order)
                .customer(isWalkin ? null : customer)
                .discountAmount(order.getDiscountAmount())
                .redeemedAt(now)
                .build();
        redemptionRepository.save(redemption);
    }
}
