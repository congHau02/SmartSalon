package com.smartsalon.voucher.validator;

import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.voucher.entity.VoucherEntity;
import com.smartsalon.voucher.repository.VoucherRedemptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;

@Component
@RequiredArgsConstructor
public class VoucherValidator {

    private final VoucherRedemptionRepository redemptionRepository;

    public void validate(VoucherEntity voucher, BranchEntity branch, BigDecimal subtotal, UserEntity customer, Instant now) {
        if (voucher == null || voucher.isDeleted()) {
            throw new AppException(ErrorCode.VOUCHER_NOT_FOUND);
        }

        if (!voucher.isActive()) {
            throw new AppException(ErrorCode.VOUCHER_INACTIVE);
        }

        Instant checkTime = now != null ? now : Instant.now();
        if (voucher.getStartsAt() != null && checkTime.isBefore(voucher.getStartsAt())) {
            throw new AppException(ErrorCode.VOUCHER_NOT_STARTED);
        }

        if (voucher.getEndsAt() != null && checkTime.isAfter(voucher.getEndsAt())) {
            throw new AppException(ErrorCode.VOUCHER_EXPIRED);
        }

        if (branch != null && !voucher.isBranchAllowed(branch.getId())) {
            throw new AppException(ErrorCode.VOUCHER_BRANCH_NOT_ALLOWED);
        }

        BigDecimal safeSubtotal = subtotal != null ? subtotal : BigDecimal.ZERO;
        if (voucher.getMinOrderAmount() != null && safeSubtotal.compareTo(voucher.getMinOrderAmount()) < 0) {
            throw new AppException(ErrorCode.VOUCHER_MIN_ORDER_AMOUNT_NOT_MET);
        }

        if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
            throw new AppException(ErrorCode.VOUCHER_USAGE_LIMIT_EXCEEDED);
        }

        if (customer != null && !"walkin.guest".equalsIgnoreCase(customer.getUsername()) && customer.getId() != null) {
            if (voucher.getPerCustomerLimit() != null && voucher.getPerCustomerLimit() > 0) {
                long redemptions = redemptionRepository.countByVoucherIdAndCustomerId(voucher.getId(), customer.getId());
                if (redemptions >= voucher.getPerCustomerLimit()) {
                    throw new AppException(ErrorCode.VOUCHER_CUSTOMER_LIMIT_EXCEEDED);
                }
            }
        }
    }
}
