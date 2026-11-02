package com.smartsalon.voucher.service;

import com.smartsalon.pos.dto.PosOrderResponse;
import com.smartsalon.voucher.dto.CreateVoucherRequest;
import com.smartsalon.voucher.dto.ToggleVoucherActiveRequest;
import com.smartsalon.voucher.dto.UpdateVoucherRequest;
import com.smartsalon.voucher.dto.VoucherResponse;

import java.util.List;

public interface VoucherService {

    VoucherResponse createVoucher(CreateVoucherRequest request);

    VoucherResponse updateVoucher(Long id, UpdateVoucherRequest request);

    VoucherResponse toggleActive(Long id, ToggleVoucherActiveRequest request);

    List<VoucherResponse> getVouchers();

    VoucherResponse getVoucherById(Long id);

    PosOrderResponse applyVoucherToOrder(Long orderId, String code);

    PosOrderResponse removeVoucherFromOrder(Long orderId);
}
