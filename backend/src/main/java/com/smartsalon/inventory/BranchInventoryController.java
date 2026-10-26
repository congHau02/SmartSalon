package com.smartsalon.inventory;

import com.smartsalon.common.ApiResponse;
import com.smartsalon.inventory.dto.*;
import com.smartsalon.inventory.service.InventoryService;
import com.smartsalon.security.BranchScopeGuard;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/branches/{branchId}/inventory")
@RequiredArgsConstructor
@Tag(name = "Branch Inventory", description = "Quản lý tồn kho chi nhánh, nhập kho, kiểm kê và lịch sử biến động")
public class BranchInventoryController {

    private final InventoryService inventoryService;
    private final BranchScopeGuard branchScopeGuard;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    @Operation(summary = "Xem danh sách tồn kho chi nhánh (có hỗ trợ lọc theo cảnh báo sắp hết hàng)")
    public ResponseEntity<ApiResponse<List<BranchInventoryResponse>>> getBranchInventory(
            @PathVariable Long branchId,
            @RequestParam(required = false) Boolean lowStockOnly) {
        branchScopeGuard.checkBranchAccess(branchId);
        List<BranchInventoryResponse> inventories = inventoryService.getBranchInventory(branchId, lowStockOnly);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin tồn kho chi nhánh thành công", inventories));
    }

    @GetMapping("/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    @Operation(summary = "Xem chi tiết tồn kho của một sản phẩm tại chi nhánh")
    public ResponseEntity<ApiResponse<BranchInventoryResponse>> getBranchInventoryByProductId(
            @PathVariable Long branchId,
            @PathVariable Long productId) {
        branchScopeGuard.checkBranchAccess(branchId);
        BranchInventoryResponse inventory = inventoryService.getBranchInventoryByProductId(branchId, productId);
        return ResponseEntity.ok(ApiResponse.success("Lấy tồn kho sản phẩm thành công", inventory));
    }

    @PostMapping("/stock-in")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Nhập thêm hàng/vật tư nguyên seal vào kho chi nhánh")
    public ResponseEntity<ApiResponse<BranchInventoryResponse>> stockIn(
            @PathVariable Long branchId,
            @Valid @RequestBody StockInRequest request) {
        branchScopeGuard.checkBranchAccess(branchId);
        BranchInventoryResponse inventory = inventoryService.stockIn(branchId, request);
        return ResponseEntity.ok(ApiResponse.success("Nhập kho thành công", inventory));
    }

    @PostMapping("/adjustment")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Điều chỉnh / kiểm kê tồn kho thực tế (đối soát seal nguyên hoặc ml/gram dở dang)")
    public ResponseEntity<ApiResponse<BranchInventoryResponse>> stockAdjustment(
            @PathVariable Long branchId,
            @Valid @RequestBody StockAdjustmentRequest request) {
        branchScopeGuard.checkBranchAccess(branchId);
        BranchInventoryResponse inventory = inventoryService.stockAdjustment(branchId, request);
        return ResponseEntity.ok(ApiResponse.success("Điều chỉnh tồn kho thành công", inventory));
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    @Operation(summary = "Xem lịch sử giao dịch và biến động xuất/nhập/khui nắp kho")
    public ResponseEntity<ApiResponse<List<InventoryTransactionResponse>>> getTransactions(
            @PathVariable Long branchId,
            @RequestParam(required = false) Long productId) {
        branchScopeGuard.checkBranchAccess(branchId);
        List<InventoryTransactionResponse> transactions = inventoryService.getInventoryTransactions(branchId, productId);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử giao dịch kho thành công", transactions));
    }
}
