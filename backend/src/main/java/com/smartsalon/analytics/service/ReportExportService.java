package com.smartsalon.analytics.service;

import java.time.LocalDate;

public interface ReportExportService {

    /**
     * Exports an analytical report in either Excel (.xlsx) or PDF (.pdf) binary stream.
     *
     * @param reportType "pnl" or "staff-payroll"
     * @param format     "xlsx" or "pdf"
     * @param branchId   optional branch filter
     * @param startDate  start of period
     * @param endDate    end of period
     * @return binary byte array of the generated report document
     */
    byte[] exportReport(String reportType, String format, Long branchId, LocalDate startDate, LocalDate endDate);

    /**
     * Generates a descriptive filename for the downloaded report.
     */
    String generateFilename(String reportType, String format, Long branchId, LocalDate startDate, LocalDate endDate);
}
