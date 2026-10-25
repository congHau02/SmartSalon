package com.smartsalon.analytics.service;

import com.smartsalon.analytics.dto.StaffPayrollSummaryResponse;
import com.smartsalon.analytics.dto.StaffPerformanceResponse;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface StaffPayrollService {

    StaffPayrollSummaryResponse getStaffPayrollReport(Long branchId, LocalDate startDate, LocalDate endDate);

    StaffPerformanceResponse getMyPayrollReport(String username, LocalDate startDate, LocalDate endDate);

    StaffPerformanceResponse updateStaffBaseSalary(Long staffId, BigDecimal newBaseSalary);
}
