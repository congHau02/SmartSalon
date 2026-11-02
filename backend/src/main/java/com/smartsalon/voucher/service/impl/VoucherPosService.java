package com.smartsalon.voucher.service.impl;

import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.pos.dto.PosOrderResponse;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.pos.entity.OrderStatus;
import com.smartsalon.pos.repository.OrderRepository;
import com.smartsalon.pos.service.impl.PosOrderMapper;
import com.smartsalon.realtime.service.RealtimeNotificationService;
import com.smartsalon.security.BranchScopeGuard;
import com.smartsalon.voucher.entity.VoucherEntity;
import com.smartsalon.voucher.repository.VoucherRepository;
import com.smartsalon.voucher.validator.VoucherValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class VoucherPosService {

    private final OrderRepository orderRepository;
    private final VoucherRepository voucherRepository;
    private final VoucherValidator voucherValidator;
    private final PosOrderMapper orderMapper;
    private final RealtimeNotificationService realtimeNotificationService;
    private final BranchScopeGuard branchScopeGuard;

    @Transactional
    public PosOrderResponse applyVoucherToOrder(Long orderId, String code) {
        if (!StringUtils.hasText(code)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Mã voucher không được để trống");
        }

        OrderEntity order = orderRepository.findByIdForUpdate(orderId)
                .filter(o -> !o.isDeleted())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        branchScopeGuard.checkBranchAccess(order.getBranch() != null ? order.getBranch().getId() : null);
        order.assertEditable();

        String normalizedCode = code.trim().toUpperCase();
        VoucherEntity voucher = voucherRepository.findByCodeIgnoreCaseAndIsDeletedFalse(normalizedCode)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        voucherValidator.validate(voucher, order.getBranch(), order.getSubtotal(), order.getCustomer(), Instant.now());

        order.applyVoucher(voucher);
        OrderEntity savedOrder = orderRepository.save(order);

        if (realtimeNotificationService != null) {
            realtimeNotificationService.notifyOrderUpdated(savedOrder);
        }

        return orderMapper.toOrderResponse(savedOrder);
    }

    @Transactional
    public PosOrderResponse removeVoucherFromOrder(Long orderId) {
        OrderEntity order = orderRepository.findByIdForUpdate(orderId)
                .filter(o -> !o.isDeleted())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        branchScopeGuard.checkBranchAccess(order.getBranch() != null ? order.getBranch().getId() : null);
        order.assertEditable();

        order.removeVoucher();
        OrderEntity savedOrder = orderRepository.save(order);

        if (realtimeNotificationService != null) {
            realtimeNotificationService.notifyOrderUpdated(savedOrder);
        }

        return orderMapper.toOrderResponse(savedOrder);
    }
}
