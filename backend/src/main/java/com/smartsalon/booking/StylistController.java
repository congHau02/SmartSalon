package com.smartsalon.booking;

import com.smartsalon.booking.dto.StylistDto;
import com.smartsalon.booking.service.SlotCalculationService;
import com.smartsalon.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/stylists")
@RequiredArgsConstructor
@Tag(name = "Stylist Catalog", description = "Xem danh sách kỹ thuật viên / Stylist cho khách hàng đặt lịch")
public class StylistController {

    private final SlotCalculationService slotCalculationService;

    @GetMapping
    @Operation(summary = "Lấy danh sách Stylist theo chi nhánh")
    public ResponseEntity<ApiResponse<List<StylistDto>>> getStylists(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<StylistDto> stylists = slotCalculationService.getActiveStylists(branchId, date);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách Stylist thành công", stylists));
    }
}
