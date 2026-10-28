package com.smartsalon.analytics.service.impl;

import com.lowagie.text.Font;
import com.smartsalon.analytics.AnalyticsPeriod;
import com.smartsalon.analytics.ReportFormat;
import com.smartsalon.analytics.ReportType;
import com.smartsalon.analytics.dto.PnlAnalyticsResponse;
import com.smartsalon.analytics.dto.StaffPayrollSummaryResponse;
import com.smartsalon.analytics.service.PnlAnalyticsService;
import com.smartsalon.analytics.service.ReportExportService;
import com.smartsalon.analytics.service.StaffPayrollService;
import com.smartsalon.branch.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.text.Normalizer;
import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportExportServiceImpl implements ReportExportService {

    private final PnlAnalyticsService pnlAnalyticsService;
    private final StaffPayrollService staffPayrollService;
    private final BranchRepository branchRepository;
    private final PnlReportExporter pnlReportExporter;
    private final StaffPayrollReportExporter staffPayrollReportExporter;

    @Override
    public byte[] exportReport(String reportType, String format, Long branchId, LocalDate startDate, LocalDate endDate) {
        ReportType type = ReportType.parse(reportType);
        ReportFormat fmt = ReportFormat.parse(format);

        return switch (type) {
            case PNL -> {
                PnlAnalyticsResponse pnlData = pnlAnalyticsService.getPnlReport(branchId, startDate, endDate);
                yield fmt == ReportFormat.XLSX
                        ? pnlReportExporter.generateExcel(pnlData)
                        : pnlReportExporter.generatePdf(pnlData);
            }
            case STAFF_PAYROLL -> {
                StaffPayrollSummaryResponse payrollData = staffPayrollService.getStaffPayrollReport(branchId, startDate, endDate);
                yield fmt == ReportFormat.XLSX
                        ? staffPayrollReportExporter.generateExcel(payrollData)
                        : staffPayrollReportExporter.generatePdf(payrollData);
            }
        };
    }

    @Override
    public String generateFilename(String reportType, String format, Long branchId, LocalDate startDate, LocalDate endDate) {
        String branchSlug = "Tat_Ca_Chi_Nhanh";
        if (branchId != null) {
            branchSlug = branchRepository.findByIdAndIsDeletedFalse(branchId)
                    .map(b -> toAsciiSlug(b.getName()))
                    .orElse("Chi_Nhanh_" + branchId);
        }

        AnalyticsPeriod period = AnalyticsPeriod.of(startDate, endDate);
        return ReportType.parse(reportType).filenamePrefix() + branchSlug + "_" + period.start() + "_" + period.end()
                + "." + ReportFormat.parse(format).extension();
    }

    record FontHolder(
            Font brandFont,
            Font titleFont,
            Font subTitleFont,
            Font sectionFont,
            Font cardTitleFont,
            Font cardValueFont,
            Font cardDescFont,
            Font tableHeaderFont,
            Font tableBodyFont,
            Font tableBoldFont,
            Font signatureTitleFont,
            Font signatureDescFont
    ) {}

    static FontHolder buildFontHolder(byte[] regularBytes, byte[] boldBytes) throws IOException {
        return PdfReportLayoutHelper.buildFontHolder(regularBytes, boldBytes);
    }

    private String toAsciiSlug(String input) {
        if (input == null) return "Report";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        String withoutDiacritics = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return withoutDiacritics.replaceAll("[^a-zA-Z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
    }
}
