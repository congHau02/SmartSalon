package com.smartsalon.pos;

import com.smartsalon.common.ApiResponse;
import com.smartsalon.pos.dto.*;
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

import org.springframework.http.MediaType;
import com.smartsalon.pos.service.MediaStorageService;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/pos")
@RequiredArgsConstructor
@Tag(name = "POS & Dispatch Board", description = "Quản lý điều phối bàn/ghế, check-in lịch hẹn và tạo đơn khách vãng lai")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF', 'STYLIST')")
public class PosController {

    private final PosOrderService posOrderService;
    private final MediaStorageService mediaStorageService;

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

    @PostMapping("/orders/{orderId}/items/service")
    @Operation(summary = "Thêm dịch vụ vào đơn hàng POS và sinh các bước kỹ thuật mặc định")
    public ResponseEntity<ApiResponse<PosOrderResponse>> addServiceItem(
            @PathVariable Long orderId,
            @Valid @RequestBody AddServiceItemRequest request) {
        PosOrderResponse response = posOrderService.addServiceItem(orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Thêm dịch vụ vào đơn hàng thành công", response));
    }

    @PostMapping("/orders/{orderId}/items/product")
    @Operation(summary = "Thêm sản phẩm bán lẻ vào đơn hàng POS")
    public ResponseEntity<ApiResponse<PosOrderResponse>> addProductItem(
            @PathVariable Long orderId,
            @Valid @RequestBody AddProductItemRequest request) {
        PosOrderResponse response = posOrderService.addProductItem(orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Thêm sản phẩm vào đơn hàng thành công", response));
    }

    @PatchMapping("/orders/{orderId}")
    @Operation(summary = "Cập nhật giảm giá và ghi chú đơn hàng POS")
    public ResponseEntity<ApiResponse<PosOrderResponse>> updateOrder(
            @PathVariable Long orderId,
            @Valid @RequestBody UpdateOrderRequest request) {
        PosOrderResponse response = posOrderService.updateOrder(orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật đơn hàng thành công", response));
    }

    @DeleteMapping("/orders/{orderId}/items/{itemId}")
    @Operation(summary = "Xóa dịch vụ hoặc sản phẩm khỏi đơn hàng POS")
    public ResponseEntity<ApiResponse<PosOrderResponse>> removeOrderItem(
            @PathVariable Long orderId,
            @PathVariable Long itemId) {
        PosOrderResponse response = posOrderService.removeOrderItem(orderId, itemId);
        return ResponseEntity.ok(ApiResponse.success("Xóa mục hàng khỏi đơn thành công", response));
    }

    @PatchMapping("/orders/{orderId}/steps/{stepId}")
    @Operation(summary = "Phân công lại nhân sự và điều chỉnh tỷ lệ hoa hồng bước kỹ thuật")
    public ResponseEntity<ApiResponse<PosStepAssignmentResponse>> updateStepAssignment(
            @PathVariable Long orderId,
            @PathVariable Long stepId,
            @Valid @RequestBody UpdateStepAssignmentRequest request) {
        PosStepAssignmentResponse response = posOrderService.updateStepAssignment(orderId, stepId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật phân công bước thành công", response));
    }

    @PatchMapping("/orders/{orderId}/steps/{stepId}/status")
    @Operation(summary = "Chuyển trạng thái bước kỹ thuật (PENDING -> IN_PROGRESS -> COMPLETED)")
    public ResponseEntity<ApiResponse<PosStepAssignmentResponse>> updateStepStatus(
            @PathVariable Long orderId,
            @PathVariable Long stepId,
            @Valid @RequestBody UpdateStepStatusRequest request) {
        PosStepAssignmentResponse response = posOrderService.updateStepStatus(orderId, stepId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái bước thành công", response));
    }

    @GetMapping("/orders/{orderId}/visual-log")
    @Operation(summary = "Lấy thông tin Visual Log (tổng hợp định mức hóa chất tiêu chuẩn hoặc thực tế đã lưu)")
    public ResponseEntity<ApiResponse<TechnicalLogResponse>> getVisualLog(@PathVariable Long orderId) {
        TechnicalLogResponse response = posOrderService.getVisualLog(orderId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin Visual Log thành công", response));
    }

    @PutMapping("/orders/{orderId}/visual-log")
    @Operation(summary = "Lưu thông tin Visual Log (ghi chú công thức, tình trạng tóc, ảnh trước/sau và định mức thực tế)")
    public ResponseEntity<ApiResponse<TechnicalLogResponse>> saveVisualLog(
            @PathVariable Long orderId,
            @Valid @RequestBody SaveTechnicalLogRequest request) {
        TechnicalLogResponse response = posOrderService.saveVisualLog(orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Lưu Visual Log thành công", response));
    }

    @PostMapping(value = "/media/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Tải ảnh Trước/Sau xử lý hóa chất (Cloudinary Hybrid với Local Static Fallback)")
    public ResponseEntity<ApiResponse<MediaUploadResponse>> uploadVisualLogMedia(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        MediaUploadResponse response = mediaStorageService.uploadVisualLogImage(file);
        return ResponseEntity.ok(ApiResponse.success("Tải tệp ảnh thành công", response));
    }
}
