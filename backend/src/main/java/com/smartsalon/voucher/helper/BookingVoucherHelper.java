package com.smartsalon.voucher.helper;

import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.UserRepository;
import com.smartsalon.voucher.dto.ValidateVoucherRequest;
import com.smartsalon.voucher.dto.VoucherValidationResponse;
import com.smartsalon.voucher.entity.VoucherEntity;
import com.smartsalon.voucher.repository.VoucherRepository;
import com.smartsalon.voucher.validator.VoucherValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingVoucherHelper {

    private final VoucherRepository voucherRepository;
    private final VoucherValidator voucherValidator;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;

    public VoucherValidationResponse validateVoucher(ValidateVoucherRequest request) {
        if (!StringUtils.hasText(request.code())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Mã voucher không được để trống");
        }

        String normalizedCode = request.code().trim().toUpperCase();
        VoucherEntity voucher = voucherRepository.findByCodeIgnoreCaseAndIsDeletedFalse(normalizedCode)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        BranchEntity branch = branchRepository.findByIdAndIsDeletedFalse(request.branchId())
                .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));

        UserEntity customer = null;
        if (StringUtils.hasText(request.phone())) {
            customer = userRepository.findByPhoneAndIsDeletedFalse(request.phone().trim()).orElse(null);
        }

        Instant now = Instant.now();
        voucherValidator.validate(voucher, branch, request.subtotal(), customer, now);

        BigDecimal discountAmount = voucher.calculateDiscount(request.subtotal());

        return new VoucherValidationResponse(
                voucher.getCode(),
                voucher.getType(),
                voucher.getValue(),
                voucher.getMaxDiscount(),
                voucher.getMinOrderAmount(),
                discountAmount,
                true
        );
    }

    public String validateAndNormalizeBookingVoucher(
            String code,
            BranchEntity branch,
            BigDecimal subtotal,
            UserEntity customer) {

        if (!StringUtils.hasText(code)) {
            return null;
        }

        String normalizedCode = code.trim().toUpperCase();
        VoucherEntity voucher = voucherRepository.findByCodeIgnoreCaseAndIsDeletedFalse(normalizedCode)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        voucherValidator.validate(voucher, branch, subtotal, customer, Instant.now());
        return normalizedCode;
    }

    public void preApplyBookingVoucherToOrder(OrderEntity order, String bookingVoucherCode) {
        if (!StringUtils.hasText(bookingVoucherCode)) {
            return;
        }

        String normalizedCode = bookingVoucherCode.trim().toUpperCase();
        try {
            VoucherEntity voucher = voucherRepository.findByCodeIgnoreCaseAndIsDeletedFalse(normalizedCode)
                    .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

            voucherValidator.validate(voucher, order.getBranch(), order.getSubtotal(), order.getCustomer(), Instant.now());
            order.applyVoucher(voucher);
        } catch (AppException e) {
            String reason = (e.getMessage() != null && !e.getMessage().isBlank()) ? e.getMessage() : e.getErrorCode().getMessage();
            order.setVoucherNotice("Mã giảm giá " + normalizedCode + " từ lịch hẹn không còn khả dụng (" + reason + ") và đã được bỏ qua.");
        } catch (Exception e) {
            order.setVoucherNotice("Mã giảm giá " + normalizedCode + " từ lịch hẹn không thể áp dụng và đã được bỏ qua.");
        }
    }
}
