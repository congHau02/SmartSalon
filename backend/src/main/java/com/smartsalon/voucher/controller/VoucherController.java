package com.smartsalon.voucher.controller;

import com.smartsalon.common.ApiResponse;
import com.smartsalon.voucher.dto.ValidateVoucherRequest;
import com.smartsalon.voucher.dto.VoucherValidationResponse;
import com.smartsalon.voucher.service.VoucherService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/vouchers")
@RequiredArgsConstructor
@Tag(name = "Voucher Public", description = "Kiểm tra và xác thực mã giảm giá")
public class VoucherController {

    private final VoucherService voucherService;

    @PostMapping("/validate")
    @Operation(summary = "Kiểm tra tính hợp lệ và xem trước mức giảm giá của mã voucher")
    public ResponseEntity<ApiResponse<VoucherValidationResponse>> validateVoucher(
            @Valid @RequestBody ValidateVoucherRequest request) {
        VoucherValidationResponse response = voucherService.validateVoucher(request);
        return ResponseEntity.ok(ApiResponse.success("Mã giảm giá hợp lệ", response));
    }
}
