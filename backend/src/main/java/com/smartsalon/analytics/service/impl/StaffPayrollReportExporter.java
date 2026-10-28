package com.smartsalon.analytics.service.impl;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.PageSize;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.smartsalon.analytics.dto.CommissionLedgerDetailResponse;
import com.smartsalon.analytics.dto.StaffPayrollSummaryResponse;
import com.smartsalon.analytics.dto.StaffPerformanceResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import static com.smartsalon.analytics.service.impl.ExcelStyleFactory.*;
import static com.smartsalon.analytics.service.impl.PdfReportLayoutHelper.*;

@Slf4j
@Component
public class StaffPayrollReportExporter {

    private static final byte[] ROSE_WINE_RGB = new byte[]{(byte) 131, (byte) 24, (byte) 67};
    private static final String[] STAFF_HEADERS = {
            "STT", "Mã NV", "Tài khoản", "Họ và tên", "Số điện thoại", "Vai trò",
            "Lương cứng", "Số ca phục vụ", "Số bước thực hiện", "Tổng hoa hồng",
            "Tổng thực lĩnh", "Tỷ lệ chọn đích danh (%)", "Tỷ lệ khách quay lại (%)"
    };
    private static final String[] LEDGER_HEADERS = {
            "STT", "Thời gian ghi nhận", "Mã đơn hàng", "Tên nhân sự", "Tài khoản",
            "Dịch vụ", "Bước thực hiện", "Tỷ lệ %", "Trạng thái", "Số tiền hoa hồng", "Diễn giải công thức"
    };

    public byte[] generateExcel(StaffPayrollSummaryResponse data) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            StylePalette styles = createPalette(workbook, ROSE_WINE_RGB);
            buildSummarySheet(workbook, data, styles);
            buildLedgerSheet(workbook, data, styles);
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Failed to generate Staff Payroll Excel workbook: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi tạo tệp Excel bảng lương nhân sự", e);
        }
    }

    public byte[] generatePdf(StaffPayrollSummaryResponse data) {
        Document document = new Document(PageSize.A4, 28, 28, 30, 30);
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfWriter.getInstance(document, out);
            document.open();
            ReportExportServiceImpl.FontHolder fonts = loadVietnameseFonts();
            String branchName = data.getBranchName() != null ? data.getBranchName() : "Tất cả chi nhánh";
            String periodStr = "Kỳ đối soát: Từ ngày " + data.getStartDate().format(ExcelStyleFactory.DATE_FMT)
                    + " đến ngày " + data.getEndDate().format(ExcelStyleFactory.DATE_FMT);

            addDocumentHeader(document, fonts, "BẢNG LƯƠNG & HOA HỒNG NHÂN SỰ", branchName, periodStr);
            addSectionHeading(document, fonts, "I. TỔNG HỢP QUỸ LƯƠNG & HIỆU SUẤT ĐỐI SOÁT", 12f);
            document.add(buildPdfKpiTable(data, fonts));
            addSectionHeading(document, fonts, "II. CHI TIẾT LƯƠNG & HOA HỒNG TỪNG NHÂN SỰ", 14f);
            document.add(buildPdfStaffTable(data, fonts));
            addAccountingSignatures(document, fonts);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate Staff Payroll PDF document: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi tạo tệp PDF bảng lương nhân sự", e);
        }
    }

    private void buildSummarySheet(XSSFWorkbook workbook, StaffPayrollSummaryResponse data, StylePalette styles) {
        Sheet sheet = workbook.createSheet("Tong_Hop_Bang_Luong_KPI");
        sheet.setDisplayGridlines(true);
        String branchName = data.getBranchName() != null ? data.getBranchName() : "Tất cả chi nhánh";

        int rowIdx = 0;
        setText(sheet.createRow(rowIdx++), 0, "HỆ THỐNG SALON TÓC CAO CẤP SMARTSALON", styles.subTitle());
        setText(sheet.createRow(rowIdx++), 0, "BẢNG TỔNG HỢP LƯƠNG & HIỆU SUẤT NHÂN SỰ", styles.title());
        setText(sheet.createRow(rowIdx++), 0, "Chi nhánh: " + branchName + " | Kỳ đối soát: "
                + data.getStartDate().format(ExcelStyleFactory.DATE_FMT) + " đến " + data.getEndDate().format(ExcelStyleFactory.DATE_FMT), styles.subTitle());
        rowIdx++;

        rowIdx = writeCardsSection(sheet, rowIdx, data, styles);
        rowIdx++;
        writeStaffTableSection(sheet, rowIdx, data, styles);
        autoSizeColumns(sheet, STAFF_HEADERS.length);
    }

    private int writeCardsSection(Sheet sheet, int rowIdx, StaffPayrollSummaryResponse data, StylePalette styles) {
        Row cardHeaderRow = sheet.createRow(rowIdx++);
        setText(cardHeaderRow, 0, "TỔNG HỢP CHI PHÍ LƯƠNG & HOA HỒNG (PAYROLL SUMMARY)", styles.header());
        setText(cardHeaderRow, 1, "GIÁ TRỊ", styles.header());

        Object[][] cards = {
                {"Tổng số lượng nhân sự đang hoạt động", data.getTotalStaffCount() + " nhân sự"},
                {"Tổng quỹ lương cứng định mức (Base Salary)", data.getTotalBaseSalary()},
                {"Tổng tiền hoa hồng đã ghi nhận (Commission Ledger)", data.getTotalCommission()},
                {"TỔNG CHI TRẢ THỰC LĨNH (Total Payroll Payout)", data.getTotalPayrollPayout()},
                {"Tỷ lệ khách hàng yêu cầu Stylist đích danh TB", data.getAverageRequestedStylistRate() != null ? data.getAverageRequestedStylistRate() + "%" : "0.0%"},
                {"Tỷ lệ khách hàng trung thành quay lại TB (Re-booking)", data.getAverageRebookingRate() != null ? data.getAverageRebookingRate() + "%" : "0.0%"}
        };
        for (Object[] card : cards) {
            Row row = sheet.createRow(rowIdx++);
            setText(row, 0, (String) card[0], styles.regular());
            if (card[1] instanceof BigDecimal bd) {
                setAmount(row, 1, bd, styles.currency());
            } else {
                setText(row, 1, (String) card[1], styles.regular());
            }
        }
        return rowIdx;
    }

    private void writeStaffTableSection(Sheet sheet, int rowIdx, StaffPayrollSummaryResponse data, StylePalette styles) {
        setText(sheet.createRow(rowIdx++), 0, "DANH SÁCH CHI TIẾT LƯƠNG & HOA HỒNG TỪNG NHÂN SỰ", styles.subTitle());
        writeHeaders(sheet.createRow(rowIdx++), STAFF_HEADERS, styles.header());

        List<StaffPerformanceResponse> staffList = data.getStaffMembers() != null ? data.getStaffMembers() : List.of();
        int staffStt = 1;
        for (StaffPerformanceResponse s : staffList) {
            writeStaffRow(sheet.createRow(rowIdx++), staffStt++, s, styles);
        }
        writeStaffTotalRow(sheet.createRow(rowIdx), staffList.size(), data, styles);
    }

    private void writeStaffRow(Row row, int stt, StaffPerformanceResponse s, StylePalette styles) {
        XSSFCellStyle cs = styles.rowText(stt);
        XSSFCellStyle ccs = styles.rowCurrency(stt);
        XSSFCellStyle pcs = styles.rowPercent(stt);
        setInt(row, 0, stt, cs);
        setText(row, 1, "NV-" + s.getStaffId(), cs);
        setText(row, 2, s.getUsername(), cs);
        setText(row, 3, s.getFullName(), cs);
        setText(row, 4, s.getPhone(), cs);
        setText(row, 5, s.getRoles() != null ? String.join(", ", s.getRoles()) : "", cs);
        setAmount(row, 6, s.getBaseSalary(), ccs);
        setInt(row, 7, s.getCompletedOrderCount(), cs);
        setInt(row, 8, s.getCompletedStepCount(), cs);
        setAmount(row, 9, s.getTotalCommission(), ccs);
        setAmount(row, 10, s.getTotalPayout(), ccs);
        setAmount(row, 11, s.getRequestedStylistRate(), pcs);
        setAmount(row, 12, s.getRebookingRate(), pcs);
    }

    private void writeStaffTotalRow(Row row, int staffCount, StaffPayrollSummaryResponse data, StylePalette styles) {
        setText(row, 0, "TỔNG CỘNG", styles.total());
        setText(row, 1, staffCount + " NV", styles.total());
        for (int i = 2; i <= 5; i++) setText(row, i, "", styles.total());
        setAmount(row, 6, data.getTotalBaseSalary(), styles.currencyTotal());
        setInt(row, 7, data.getTotalCompletedOrders(), styles.total());
        setInt(row, 8, data.getTotalCompletedSteps(), styles.total());
        setAmount(row, 9, data.getTotalCommission(), styles.currencyTotal());
        setAmount(row, 10, data.getTotalPayrollPayout(), styles.currencyTotal());
        setAmount(row, 11, data.getAverageRequestedStylistRate(), styles.percent());
        setAmount(row, 12, data.getAverageRebookingRate(), styles.percent());
    }

    private void buildLedgerSheet(XSSFWorkbook workbook, StaffPayrollSummaryResponse data, StylePalette styles) {
        Sheet sheet = workbook.createSheet("Chi_Tiet_Hoa_Hong_Tung_Ca");
        sheet.setDisplayGridlines(true);
        String branchName = data.getBranchName() != null ? data.getBranchName() : "Tất cả chi nhánh";

        int rowIdx = 0;
        setText(sheet.createRow(rowIdx++), 0, "BẢNG KÊ CHI TIẾT HOA HỒNG TỪNG BƯỚC PHỤC VỤ (COMMISSION LEDGER)", styles.title());
        setText(sheet.createRow(rowIdx++), 0, "Chi nhánh: " + branchName + " | Kỳ: "
                + data.getStartDate().format(ExcelStyleFactory.DATE_FMT) + " đến " + data.getEndDate().format(ExcelStyleFactory.DATE_FMT), styles.subTitle());
        rowIdx++;

        writeHeaders(sheet.createRow(rowIdx++), LEDGER_HEADERS, styles.header());
        List<StaffPerformanceResponse> staffList = data.getStaffMembers() != null ? data.getStaffMembers() : List.of();
        int ledgerStt = 1;
        for (StaffPerformanceResponse staff : staffList) {
            if (staff.getCommissionLedgers() == null) continue;
            for (CommissionLedgerDetailResponse ledger : staff.getCommissionLedgers()) {
                writeLedgerRow(sheet.createRow(rowIdx++), ledgerStt++, staff, ledger, styles);
            }
        }
        writeLedgerTotalRow(sheet.createRow(rowIdx), ledgerStt - 1, data, styles);
        autoSizeColumns(sheet, LEDGER_HEADERS.length);
    }

    private void writeLedgerRow(Row row, int stt, StaffPerformanceResponse staff, CommissionLedgerDetailResponse ledger, StylePalette styles) {
        XSSFCellStyle cs = styles.rowText(stt);
        XSSFCellStyle ccs = styles.rowCurrency(stt);
        setInt(row, 0, stt, cs);
        setText(row, 1, formatInstant(ledger.getCreatedAt()), cs);
        setText(row, 2, ledger.getOrderCode(), cs);
        setText(row, 3, staff.getFullName(), cs);
        setText(row, 4, staff.getUsername(), cs);
        setText(row, 5, ledger.getServiceName(), cs);
        setText(row, 6, ledger.getStepName(), cs);
        setText(row, 7, ledger.getCommissionRate() != null ? ledger.getCommissionRate().stripTrailingZeros().toPlainString() + "%" : "", cs);
        setText(row, 8, ledger.getStatus() != null ? ledger.getStatus() : "EARNED", cs);
        setAmount(row, 9, ledger.getAmount(), ccs);
        setText(row, 10, ledger.getCalculationNotes(), cs);
    }

    private void writeLedgerTotalRow(Row row, int count, StaffPayrollSummaryResponse data, StylePalette styles) {
        setText(row, 0, "TỔNG HOA HỒNG CHI TRẢ", styles.total());
        setText(row, 1, count + " giao dịch", styles.total());
        for (int i = 2; i <= 8; i++) setText(row, i, "", styles.total());
        setAmount(row, 9, data.getTotalCommission(), styles.currencyTotal());
        setText(row, 10, "", styles.total());
    }

    private PdfPTable buildPdfKpiTable(StaffPayrollSummaryResponse data, ReportExportServiceImpl.FontHolder fonts) throws DocumentException {
        PdfPTable kpiTable = new PdfPTable(2);
        kpiTable.setWidthPercentage(100);
        kpiTable.setWidths(new float[]{1f, 1f});

        addKpiCell(kpiTable, fonts, "TỔNG QUỸ LƯƠNG CỨNG (BASE SALARY)", formatCurrency(data.getTotalBaseSalary()),
                "Tổng định mức chi phí cố định cho " + data.getTotalStaffCount() + " nhân sự chi nhánh",
                new Color(239, 246, 255), new Color(29, 78, 216));

        addKpiCell(kpiTable, fonts, "TỔNG HOA HỒNG DỊCH VỤ (COMMISSION)", "+" + formatCurrency(data.getTotalCommission()),
                "Tổng tiền hoa hồng đã trích theo Commission Ledger các ca hoàn thành",
                new Color(236, 253, 245), new Color(4, 120, 87));

        addKpiCell(kpiTable, fonts, "TỔNG CHI TRẢ LƯƠNG THỰC LĨNH (PAYOUT)", formatCurrency(data.getTotalPayrollPayout()),
                "Tổng số tiền chuyển khoản hoặc chi trả = Lương cứng + Hoa hồng",
                new Color(253, 242, 248), new Color(190, 24, 93));

        String loyaltyStr = "Chỉ định thợ TB: "
                + (data.getAverageRequestedStylistRate() != null ? data.getAverageRequestedStylistRate() : "0.0")
                + "% | Khách quay lại TB: "
                + (data.getAverageRebookingRate() != null ? data.getAverageRebookingRate() : "0.0") + "%";
        addKpiCell(kpiTable, fonts, "CHỈ SỐ TRUNG THÀNH KHÁCH HÀNG (LOYALTY KPIs)", loyaltyStr,
                "Đo lường mức độ yêu thích stylist và tỷ lệ khách hàng lặp lại (≥2 đơn)",
                new Color(254, 243, 199), new Color(180, 83, 9));
        return kpiTable;
    }

    private PdfPTable buildPdfStaffTable(StaffPayrollSummaryResponse data, ReportExportServiceImpl.FontHolder fonts) throws DocumentException {
        PdfPTable staffTable = new PdfPTable(10);
        staffTable.setWidthPercentage(100);
        staffTable.setWidths(new float[]{0.6f, 1.1f, 2.0f, 1.1f, 1.7f, 0.8f, 1.7f, 1.8f, 1.1f, 1.2f});

        String[] tableHeaders = {"STT", "Mã NV", "Họ và tên", "Vai trò", "Lương cứng", "Số ca", "Hoa hồng", "Thực lĩnh", "Chỉ định %", "Quay lại %"};
        addTableHeaders(staffTable, tableHeaders, fonts.tableHeaderFont(), new Color(131, 24, 67));

        int stt = 1;
        List<StaffPerformanceResponse> staffList = data.getStaffMembers() != null ? data.getStaffMembers() : List.of();
        for (StaffPerformanceResponse s : staffList) {
            writePdfStaffRow(staffTable, stt++, s, fonts);
        }
        writePdfStaffTotals(staffTable, staffList, data, fonts);
        return staffTable;
    }

    private void writePdfStaffRow(PdfPTable table, int stt, StaffPerformanceResponse s, ReportExportServiceImpl.FontHolder fonts) {
        Color rowBg = (stt % 2 == 0) ? Color.WHITE : new Color(253, 244, 247);
        String roleStr = (s.getRoles() != null && !s.getRoles().isEmpty()) ? s.getRoles().get(0) : "STAFF";
        String reqStr = s.getRequestedStylistRate() != null ? s.getRequestedStylistRate().setScale(1, RoundingMode.HALF_UP) + "%" : "0.0%";
        String rebookStr = s.getRebookingRate() != null ? s.getRebookingRate().setScale(1, RoundingMode.HALF_UP) + "%" : "0.0%";

        addTableCell(table, String.valueOf(stt), fonts.tableBodyFont(), Element.ALIGN_CENTER, rowBg);
        addTableCell(table, "NV-" + s.getStaffId(), fonts.tableBodyFont(), Element.ALIGN_CENTER, rowBg);
        addTableCell(table, s.getFullName(), fonts.tableBoldFont(), Element.ALIGN_LEFT, rowBg);
        addTableCell(table, roleStr, fonts.tableBodyFont(), Element.ALIGN_CENTER, rowBg);
        addTableCell(table, formatCurrency(s.getBaseSalary()), fonts.tableBodyFont(), Element.ALIGN_RIGHT, rowBg);
        addTableCell(table, String.valueOf(s.getCompletedOrderCount()), fonts.tableBodyFont(), Element.ALIGN_CENTER, rowBg);
        addTableCell(table, formatCurrency(s.getTotalCommission()), fonts.tableBodyFont(), Element.ALIGN_RIGHT, rowBg);
        addTableCell(table, formatCurrency(s.getTotalPayout()), fonts.tableBoldFont(), Element.ALIGN_RIGHT, rowBg);
        addTableCell(table, reqStr, fonts.tableBodyFont(), Element.ALIGN_CENTER, rowBg);
        addTableCell(table, rebookStr, fonts.tableBodyFont(), Element.ALIGN_CENTER, rowBg);
    }

    private void writePdfStaffTotals(PdfPTable table, List<StaffPerformanceResponse> staffList, StaffPayrollSummaryResponse data, ReportExportServiceImpl.FontHolder fonts) {
        Color totalBg = new Color(241, 245, 249);
        int totalBookings = staffList.stream().mapToInt(StaffPerformanceResponse::getCompletedOrderCount).sum();
        String avgReq = (data.getAverageRequestedStylistRate() != null) ? data.getAverageRequestedStylistRate() + "%" : "0.0%";
        String avgRebook = (data.getAverageRebookingRate() != null) ? data.getAverageRebookingRate() + "%" : "0.0%";

        addTableCell(table, "TỔNG", fonts.tableBoldFont(), Element.ALIGN_CENTER, totalBg);
        addTableCell(table, staffList.size() + " NV", fonts.tableBoldFont(), Element.ALIGN_CENTER, totalBg);
        addTableCell(table, "TỔNG CỘNG TOÀN CHI NHÁNH", fonts.tableBoldFont(), Element.ALIGN_LEFT, totalBg);
        addTableCell(table, "", fonts.tableBoldFont(), Element.ALIGN_CENTER, totalBg);
        addTableCell(table, formatCurrency(data.getTotalBaseSalary()), fonts.tableBoldFont(), Element.ALIGN_RIGHT, totalBg);
        addTableCell(table, String.valueOf(totalBookings), fonts.tableBoldFont(), Element.ALIGN_CENTER, totalBg);
        addTableCell(table, formatCurrency(data.getTotalCommission()), fonts.tableBoldFont(), Element.ALIGN_RIGHT, totalBg);
        addTableCell(table, formatCurrency(data.getTotalPayrollPayout()), fonts.tableBoldFont(), Element.ALIGN_RIGHT, totalBg);
        addTableCell(table, avgReq, fonts.tableBoldFont(), Element.ALIGN_CENTER, totalBg);
        addTableCell(table, avgRebook, fonts.tableBoldFont(), Element.ALIGN_CENTER, totalBg);
    }
}
