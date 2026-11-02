package com.smartsalon.voucher.controller;

import com.smartsalon.common.ApiResponse;
import com.smartsalon.voucher.dto.CreateVoucherRequest;
import com.smartsalon.voucher.dto.ToggleVoucherActiveRequest;
import com.smartsalon.voucher.dto.UpdateVoucherRequest;
import com.smartsalon.voucher.dto.VoucherResponse;
import com.smartsalon.voucher.service.VoucherService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/vouchers")
@RequiredArgsConstructor
@Tag(name = "Voucher Management", description = "Quản lý mã giảm giá, khuyến mãi chuỗi và chi nhánh")
public class VoucherAdminController {

    private final VoucherService voucherService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Tạo mã giảm giá mới (ADMIN)")
    public ResponseEntity<ApiResponse<VoucherResponse>> createVoucher(
            @Valid @RequestBody CreateVoucherRequest request) {
        VoucherResponse response = voucherService.createVoucher(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo mã giảm giá thành công", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cập nhật mã giảm giá (ADMIN)")
    public ResponseEntity<ApiResponse<VoucherResponse>> updateVoucher(
            @PathVariable Long id,
            @Valid @RequestBody UpdateVoucherRequest request) {
        VoucherResponse response = voucherService.updateVoucher(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật mã giảm giá thành công", response));
    }

    @PatchMapping("/{id}/active")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Kích hoạt hoặc tạm ngưng mã giảm giá (ADMIN)")
    public ResponseEntity<ApiResponse<VoucherResponse>> toggleActive(
            @PathVariable Long id,
            @Valid @RequestBody ToggleVoucherActiveRequest request) {
        VoucherResponse response = voucherService.toggleActive(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái mã giảm giá thành công", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Danh sách mã giảm giá (ADMIN xem tất cả, MANAGER xem mã áp dụng tại chi nhánh)")
    public ResponseEntity<ApiResponse<List<VoucherResponse>>> getVouchers() {
        List<VoucherResponse> response = voucherService.getVouchers();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách mã giảm giá thành công", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Xem chi tiết mã giảm giá (ADMIN hoặc MANAGER chi nhánh)")
    public ResponseEntity<ApiResponse<VoucherResponse>> getVoucherById(@PathVariable Long id) {
        VoucherResponse response = voucherService.getVoucherById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết mã giảm giá thành công", response));
    }
}
