package com.smartsalon.voucher.service.impl;

import com.smartsalon.pos.dto.PosOrderResponse;
import com.smartsalon.voucher.dto.CreateVoucherRequest;
import com.smartsalon.voucher.dto.ToggleVoucherActiveRequest;
import com.smartsalon.voucher.dto.UpdateVoucherRequest;
import com.smartsalon.voucher.dto.VoucherResponse;
import com.smartsalon.voucher.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private final VoucherAdminService adminService;
    private final VoucherPosService posService;

    @Override
    public VoucherResponse createVoucher(CreateVoucherRequest request) {
        return adminService.createVoucher(request);
    }

    @Override
    public VoucherResponse updateVoucher(Long id, UpdateVoucherRequest request) {
        return adminService.updateVoucher(id, request);
    }

    @Override
    public VoucherResponse toggleActive(Long id, ToggleVoucherActiveRequest request) {
        return adminService.toggleActive(id, request);
    }

    @Override
    public List<VoucherResponse> getVouchers() {
        return adminService.getVouchers();
    }

    @Override
    public VoucherResponse getVoucherById(Long id) {
        return adminService.getVoucherById(id);
    }

    @Override
    public PosOrderResponse applyVoucherToOrder(Long orderId, String code) {
        return posService.applyVoucherToOrder(orderId, code);
    }

    @Override
    public PosOrderResponse removeVoucherFromOrder(Long orderId) {
        return posService.removeVoucherFromOrder(orderId);
    }
}
