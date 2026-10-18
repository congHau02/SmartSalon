package com.smartsalon.analytics;

import com.smartsalon.analytics.dto.InventoryAlertsAnalyticsResponse;
import com.smartsalon.analytics.dto.PnlAnalyticsResponse;
import com.smartsalon.analytics.dto.StaffPayrollSummaryResponse;
import com.smartsalon.analytics.dto.StaffPerformanceResponse;
import com.smartsalon.analytics.dto.UpdateBaseSalaryRequest;
import com.smartsalon.analytics.service.InventoryAlertsAnalyticsService;
import com.smartsalon.analytics.service.PnlAnalyticsService;
import com.smartsalon.analytics.service.StaffPayrollService;
import com.smartsalon.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@Tag(name = "Analytics & Reports", description = "Endpoints for Realized P&L, Staff Payroll & Inventory Intelligence")
@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final PnlAnalyticsService pnlAnalyticsService;
    private final StaffPayrollService staffPayrollService;
    private final InventoryAlertsAnalyticsService inventoryAlertsAnalyticsService;

    @Operation(summary = "Get Realized Profit & Loss (P&L) Report", description = "Calculates pro-rated revenue, Chemical COGS, Retail COGS, Commissions, Tier 1 and Tier 2 Net Profit")
    @GetMapping("/pnl")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<PnlAnalyticsResponse>> getPnlReport(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        PnlAnalyticsResponse response = pnlAnalyticsService.getPnlReport(branchId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Get Staff Performance & Payroll Report", description = "Aggregates base salaries, commissions, completed service steps, Requested Stylist Rate and Re-booking Rate")
    @GetMapping("/staff-payroll")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<StaffPayrollSummaryResponse>> getStaffPayrollReport(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        StaffPayrollSummaryResponse response = staffPayrollService.getStaffPayrollReport(branchId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Get Smart Inventory Alerts & BOM Wastage Report", description = "Evaluates 3-tier stock alert levels, burn rate days remaining, and BOM vs actual usage wastage")
    @GetMapping("/inventory-alerts")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<InventoryAlertsAnalyticsResponse>> getInventoryAlertsReport(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        InventoryAlertsAnalyticsResponse response = inventoryAlertsAnalyticsService.getInventoryAlertsReport(branchId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Update Staff Member Base Salary", description = "Allows administrators and managers to configure an employee's monthly base salary")
    @PutMapping("/staff/{staffId}/base-salary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<StaffPerformanceResponse>> updateBaseSalary(
            @PathVariable Long staffId,
            @Valid @RequestBody UpdateBaseSalaryRequest request
    ) {
        StaffPerformanceResponse response = staffPayrollService.updateStaffBaseSalary(staffId, request.getBaseSalary());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
