package com.smartsalon.shift;

import com.smartsalon.common.ApiResponse;
import com.smartsalon.shift.dto.*;
import com.smartsalon.shift.service.ShiftService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/shifts")
@RequiredArgsConstructor
@Tag(name = "Shift & Roster Management", description = "Quản lý Mẫu ca làm việc & Lịch trực tuần của nhân sự")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class ShiftController {

    private final ShiftService shiftService;

    @GetMapping("/templates")
    @Operation(summary = "Lấy danh sách mẫu ca làm việc của chi nhánh")
    public ApiResponse<List<ShiftTemplateResponse>> getTemplates(
            @RequestParam(name = "branchId", required = false) Long branchId) {
        return ApiResponse.success(shiftService.getTemplates(branchId));
    }

    @PostMapping("/templates")
    @Operation(summary = "Tạo mới mẫu ca làm việc")
    public ApiResponse<ShiftTemplateResponse> createTemplate(
            @Valid @RequestBody ShiftTemplateRequest request) {
        return ApiResponse.success("Tạo mẫu ca làm việc thành công", shiftService.createTemplate(request));
    }

    @PutMapping("/templates/{id}")
    @Operation(summary = "Cập nhật mẫu ca làm việc")
    public ApiResponse<ShiftTemplateResponse> updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody ShiftTemplateRequest request) {
        return ApiResponse.success("Cập nhật mẫu ca làm việc thành công", shiftService.updateTemplate(id, request));
    }

    @GetMapping("/roster")
    @Operation(summary = "Xem ma trận lịch trực 7 ngày của chi nhánh")
    public ApiResponse<WeeklyRosterResponse> getWeeklyRoster(
            @RequestParam(name = "branchId", required = false) Long branchId,
            @RequestParam(name = "startDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "endDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ApiResponse.success(shiftService.getWeeklyRoster(branchId, startDate, endDate));
    }

    @PutMapping("/roster")
    @Operation(summary = "Cập nhật ô lịch trực với Booking Conflict Guard")
    public ApiResponse<List<DailyScheduleCellResponse>> updateRoster(
            @Valid @RequestBody UpdateRosterRequest request) {
        return ApiResponse.success("Cập nhật lịch trực thành công", shiftService.updateRoster(request));
    }

    @PostMapping("/roster/copy-week")
    @Operation(summary = "Sao chép ma trận lịch trực từ tuần trước sang tuần chỉ định")
    public ApiResponse<Integer> copyWeekRoster(
            @Valid @RequestBody CopyWeekRosterRequest request) {
        int copiedCount = shiftService.copyWeekRoster(request);
        return ApiResponse.success("Sao chép thành công " + copiedCount + " phân công lịch trực", copiedCount);
    }
}
