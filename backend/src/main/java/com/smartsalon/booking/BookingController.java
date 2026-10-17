package com.smartsalon.booking;

import com.smartsalon.booking.dto.AvailableSlotsResponse;
import com.smartsalon.booking.dto.BookingResponse;
import com.smartsalon.booking.dto.CreateBookingRequest;
import com.smartsalon.booking.dto.StylistDto;
import com.smartsalon.booking.dto.UpdateBookingStatusRequest;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.service.BookingService;
import com.smartsalon.booking.service.SlotCalculationService;
import com.smartsalon.common.ApiResponse;
import com.smartsalon.payment.dto.PaymentQrInfo;
import com.smartsalon.payment.service.PayOSService;
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
import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
@Tag(name = "Booking & Slots", description = "Tính toán khung giờ trống, khóa giữ chỗ Redis và đặt lịch")
public class BookingController {

    private final SlotCalculationService slotCalculationService;
    private final BookingService bookingService;
    private final PayOSService payOSService;

    @GetMapping("/stylists")
    @Operation(summary = "Lấy danh sách Stylist đang hoạt động theo chi nhánh")
    public ResponseEntity<ApiResponse<List<StylistDto>>> getStylists(@RequestParam(required = false) Long branchId) {
        List<StylistDto> stylists = slotCalculationService.getActiveStylists(branchId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách Stylist thành công", stylists));
    }

    @GetMapping("/available-slots")
    @Operation(summary = "Tính toán danh sách khung giờ trống (Slot 30 phút) theo chi nhánh, ngày và dịch vụ")
    public ResponseEntity<ApiResponse<AvailableSlotsResponse>> getAvailableSlots(
            @RequestParam Long branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam List<Long> serviceIds,
            @RequestParam(required = false) Long stylistId) {
        AvailableSlotsResponse response = slotCalculationService.calculateAvailableSlots(branchId, date, serviceIds, stylistId);
        return ResponseEntity.ok(ApiResponse.success("Tính toán khung giờ trống thành công", response));
    }

    @PostMapping
    @Operation(summary = "Giữ chỗ lịch hẹn 5 phút (Redis Multi-Bucket Lock) và tạo đơn đặt chỗ")
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        BookingResponse response = bookingService.holdSlotAndCreate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Giữ chỗ thành công trong 5 phút", response));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Tra cứu thông tin chi tiết lịch hẹn bằng mã đặt hẹn")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingByCode(@PathVariable String code) {
        BookingResponse response = bookingService.getBookingByCode(code);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin lịch hẹn thành công", response));
    }

    @GetMapping("/{code}/payment-info")
    @Operation(summary = "Lấy thông tin VietQR và link thanh toán cọc PayOS cho lịch hẹn")
    public ResponseEntity<ApiResponse<PaymentQrInfo>> getPaymentInfo(@PathVariable String code) {
        PaymentQrInfo info = payOSService.generateDepositPaymentInfo(code);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin thanh toán thành công", info));
    }

    @GetMapping("/lookup")
    @Operation(summary = "Tra cứu danh sách lịch hẹn của khách hàng theo số điện thoại")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> lookupBookings(@RequestParam String phone) {
        List<BookingResponse> response = bookingService.lookupBookingsByPhone(phone);
        return ResponseEntity.ok(ApiResponse.success("Tra cứu lịch hẹn thành công", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF', 'STYLIST')")
    @Operation(summary = "Lấy danh sách lịch hẹn theo bộ lọc quản lý")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getBookings(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String search) {
        List<BookingResponse> response = bookingService.getBookings(branchId, status, date, search);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách lịch hẹn thành công", response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF', 'STYLIST')")
    @Operation(summary = "Cập nhật trạng thái lịch hẹn")
    public ResponseEntity<ApiResponse<BookingResponse>> updateBookingStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateBookingStatusRequest request) {
        BookingResponse response = bookingService.updateBookingStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái lịch hẹn thành công", response));
    }
}
