package com.smartsalon.booking;

import com.smartsalon.booking.dto.AvailableSlotsResponse;
import com.smartsalon.booking.dto.StylistDto;
import com.smartsalon.booking.service.SlotCalculationService;
import com.smartsalon.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
@Tag(name = "Booking & Slots", description = "Tính toán khung giờ trống, khóa giữ chỗ Redis và đặt lịch")
public class BookingController {

    private final SlotCalculationService slotCalculationService;

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
}
