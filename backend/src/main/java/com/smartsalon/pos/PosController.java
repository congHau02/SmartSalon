package com.smartsalon.pos;

import com.smartsalon.common.ApiResponse;
import com.smartsalon.pos.dto.DispatchBoardResponse;
import com.smartsalon.pos.dto.PosOrderResponse;
import com.smartsalon.pos.dto.WalkInOrderRequest;
import com.smartsalon.pos.service.PosOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/pos")
@RequiredArgsConstructor
@Tag(name = "POS & Dispatch Board", description = "Quản lý điều phối bàn/ghế, check-in lịch hẹn và tạo đơn khách vãng lai")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF', 'STYLIST')")
public class PosController {

    private final PosOrderService posOrderService;

    @PostMapping("/bookings/{bookingId}/check-in")
    @Operation(summary = "Check-in lịch hẹn và tự động mở đơn hàng POS")
    public ResponseEntity<ApiResponse<PosOrderResponse>> checkInBooking(@PathVariable Long bookingId) {
        PosOrderResponse response = posOrderService.checkInBooking(bookingId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Check-in lịch hẹn thành công", response));
    }

    @PostMapping("/orders/walk-in")
    @Operation(summary = "Tạo đơn hàng cho khách vãng lai / khách lẻ nhanh")
    public ResponseEntity<ApiResponse<PosOrderResponse>> createWalkInOrder(
            @Valid @RequestBody WalkInOrderRequest request) {
        PosOrderResponse response = posOrderService.createWalkInOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo đơn hàng khách vãng lai thành công", response));
    }

    @GetMapping("/dispatch-board")
    @Operation(summary = "Lấy dữ liệu bảng điều phối ghế (Kanban & Timeline) và trạng thái kỹ thuật viên")
    public ResponseEntity<ApiResponse<DispatchBoardResponse>> getDispatchBoard(
            @RequestParam Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        DispatchBoardResponse response = posOrderService.getDispatchBoard(branchId, date);
        return ResponseEntity.ok(ApiResponse.success("Lấy dữ liệu bảng điều phối thành công", response));
    }

    @GetMapping("/orders/{orderId}")
    @Operation(summary = "Lấy thông tin chi tiết đơn hàng POS theo ID")
    public ResponseEntity<ApiResponse<PosOrderResponse>> getOrderById(@PathVariable Long orderId) {
        PosOrderResponse response = posOrderService.getOrderById(orderId);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết đơn hàng thành công", response));
    }
}
