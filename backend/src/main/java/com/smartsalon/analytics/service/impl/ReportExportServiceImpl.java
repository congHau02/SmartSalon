package com.smartsalon.analytics.service.impl;

import com.smartsalon.analytics.AnalyticsPeriod;
import com.smartsalon.analytics.ReportFormat;
import com.smartsalon.analytics.ReportType;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.smartsalon.analytics.dto.*;
import com.smartsalon.analytics.service.PnlAnalyticsService;
import com.smartsalon.analytics.service.ReportExportService;
import com.smartsalon.analytics.service.StaffPayrollService;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.Normalizer;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportExportServiceImpl implements ReportExportService {

    private final PnlAnalyticsService pnlAnalyticsService;
    private final StaffPayrollService staffPayrollService;
    private final BranchRepository branchRepository;

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final ThreadSafeFormat CURRENCY_FMT = new ThreadSafeFormat("#,##0 ₫");
    private static final ThreadSafeFormat PERCENT_FMT = new ThreadSafeFormat("0.0'%'");

    /** DecimalFormat is not thread-safe; keep one instance per thread. */
    private static final class ThreadSafeFormat {
        private final ThreadLocal<DecimalFormat> delegate;

        ThreadSafeFormat(String pattern) {
            this.delegate = ThreadLocal.withInitial(() -> new DecimalFormat(pattern));
        }

        String format(Object number) {
            return delegate.get().format(number);
        }
    }

    @Override
    public byte[] exportReport(String reportType, String format, Long branchId, LocalDate startDate, LocalDate endDate) {
        ReportType type = ReportType.parse(reportType);
        ReportFormat fmt = ReportFormat.parse(format);

        return switch (type) {
            case PNL -> {
                PnlAnalyticsResponse pnlData = pnlAnalyticsService.getPnlReport(branchId, startDate, endDate);
                yield fmt == ReportFormat.XLSX ? generatePnlExcel(pnlData) : generatePnlPdf(pnlData);
            }
            case STAFF_PAYROLL -> {
                StaffPayrollSummaryResponse payrollData = staffPayrollService.getStaffPayrollReport(branchId, startDate, endDate);
                yield fmt == ReportFormat.XLSX ? generateStaffPayrollExcel(payrollData) : generateStaffPayrollPdf(payrollData);
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

    // =========================================================================
    // EXCEL GENERATION: P&L (.xlsx)
    // =========================================================================

    private byte[] generatePnlExcel(PnlAnalyticsResponse data) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            CreationHelper helper = workbook.getCreationHelper();

            // Cell Styles
            XSSFCellStyle titleStyle = createTitleStyle(workbook);
            XSSFCellStyle subTitleStyle = createSubTitleStyle(workbook);
            XSSFCellStyle headerStyle = createHeaderStyle(workbook, new byte[]{(byte) 30, (byte) 58, (byte) 138}); // Navy Blue
            XSSFCellStyle zebraStyle = createZebraStyle(workbook);
            XSSFCellStyle regularStyle = createRegularStyle(workbook);
            XSSFCellStyle totalStyle = createTotalStyle(workbook);

            XSSFCellStyle currencyStyle = createCurrencyStyle(workbook, helper, regularStyle);
            XSSFCellStyle currencyZebraStyle = createCurrencyStyle(workbook, helper, zebraStyle);
            XSSFCellStyle currencyTotalStyle = createCurrencyStyle(workbook, helper, totalStyle);

            // Sheet 1: Tong_Hop_Ket_Qua_Kinh_Doanh
            Sheet summarySheet = workbook.createSheet("Tong_Hop_Ket_Qua_Kinh_Doanh");
            summarySheet.setDisplayGridlines(true);

            int rowIdx = 0;
            Row r0 = summarySheet.createRow(rowIdx++);
            r0.createCell(0).setCellValue("HỆ THỐNG SALON TÓC CAO CẤP SMARTSALON");
            r0.getCell(0).setCellStyle(subTitleStyle);

            Row r1 = summarySheet.createRow(rowIdx++);
            r1.createCell(0).setCellValue("BÁO CÁO LÃI / LỖ THỰC TẾ (REALIZED PROFIT & LOSS)");
            r1.getCell(0).setCellStyle(titleStyle);

            Row r2 = summarySheet.createRow(rowIdx++);
            String branchName = data.getBranchName() != null ? data.getBranchName() : "Tất cả chi nhánh";
            r2.createCell(0).setCellValue("Chi nhánh: " + branchName + " | Kỳ báo cáo: " +
                    data.getStartDate().format(DATE_FMT) + " đến " + data.getEndDate().format(DATE_FMT));
            r2.getCell(0).setCellStyle(subTitleStyle);

            rowIdx++; // Blank row

            // KPI Overview Table
            Row kpiHeaderRow = summarySheet.createRow(rowIdx++);
            kpiHeaderRow.createCell(0).setCellValue("CHỈ SỐ TÀI CHÍNH CỐT LÕI (EXECUTIVE SUMMARY)");
            kpiHeaderRow.getCell(0).setCellStyle(headerStyle);
            kpiHeaderRow.createCell(1).setCellValue("GIÁ TRỊ (VND)");
            kpiHeaderRow.getCell(1).setCellStyle(headerStyle);

            Object[][] kpiItems = {
                    {"Tổng doanh thu Dịch vụ gộp (Gross Service Revenue)", data.getGrossServiceRevenue()},
                    {"Tổng doanh thu Bán lẻ gộp (Gross Retail Revenue)", data.getGrossRetailRevenue()},
                    {"Tổng giảm giá đã phân bổ (Pro-rated Discounts)", data.getTotalDiscounts()},
                    {"Doanh thu Dịch vụ thuần (Net Service Revenue)", data.getNetServiceRevenue()},
                    {"Doanh thu Bán lẻ thuần (Net Retail Revenue)", data.getNetRetailRevenue()},
                    {"TỔNG DOANH THU THUẦN (Total Net Revenue)", data.getTotalNetRevenue()},
                    {"Giá vốn hóa chất tiêu hao COGS (Chemical COGS)", data.getChemicalCogs()},
                    {"Giá vốn sản phẩm bán lẻ COGS (Retail COGS)", data.getRetailCogs()},
                    {"Tổng hoa hồng nhân sự (Staff Commissions)", data.getTotalCommissions()},
                    {"LỢI NHUẬN VẬN HÀNH CẤP 1 (Tier 1 Operational Net Profit)", data.getOperationalNetProfit()},
                    {"Tổng chi phí lương cứng cố định (Fixed Base Salary Cost)", data.getFixedBaseSalaryCost()},
                    {"LỢI NHUẬN RÒNG SAU LƯƠNG CẤP 2 (Tier 2 Net Profit After Payroll)", data.getNetProfitAfterPayroll()}
            };

            for (Object[] item : kpiItems) {
                Row row = summarySheet.createRow(rowIdx++);
                Cell cLabel = row.createCell(0);
                cLabel.setCellValue((String) item[0]);
                cLabel.setCellStyle(regularStyle);

                Cell cVal = row.createCell(1);
                BigDecimal val = (BigDecimal) item[1];
                cVal.setCellValue(val != null ? val.doubleValue() : 0.0);
                cVal.setCellStyle(currencyStyle);
            }

            rowIdx++; // Blank row

            // Daily Trend Table
            Row trendTitle = summarySheet.createRow(rowIdx++);
            trendTitle.createCell(0).setCellValue("BẢNG TỔNG HỢP THEO NGÀY (DAILY FINANCIAL TIME-SERIES)");
            trendTitle.getCell(0).setCellStyle(subTitleStyle);

            String[] dailyHeaders = {
                    "STT", "Ngày", "Số đơn", "DT dịch vụ thuần", "DT bán lẻ thuần",
                    "Tổng DT thuần", "COGS hóa chất", "COGS bán lẻ", "Hoa hồng", "Lợi nhuận ròng ngày"
            };
            Row dHeaderRow = summarySheet.createRow(rowIdx++);
            for (int i = 0; i < dailyHeaders.length; i++) {
                Cell c = dHeaderRow.createCell(i);
                c.setCellValue(dailyHeaders[i]);
                c.setCellStyle(headerStyle);
            }

            int dayStt = 1;
            List<DailyPnlResponse> dailyList = data.getDailySeries() != null ? data.getDailySeries() : List.of();
            for (DailyPnlResponse day : dailyList) {
                Row dRow = summarySheet.createRow(rowIdx++);
                XSSFCellStyle cs = (dayStt % 2 == 0) ? zebraStyle : regularStyle;
                XSSFCellStyle ccs = (dayStt % 2 == 0) ? currencyZebraStyle : currencyStyle;

                Cell c0 = dRow.createCell(0); c0.setCellValue(dayStt++); c0.setCellStyle(cs);
                Cell c1 = dRow.createCell(1); c1.setCellValue(day.getDate().format(DATE_FMT)); c1.setCellStyle(cs);
                Cell c2 = dRow.createCell(2); c2.setCellValue(day.getOrderCount()); c2.setCellStyle(cs);
                Cell c3 = dRow.createCell(3); c3.setCellValue(day.getNetServiceRevenue().doubleValue()); c3.setCellStyle(ccs);
                Cell c4 = dRow.createCell(4); c4.setCellValue(day.getNetRetailRevenue().doubleValue()); c4.setCellStyle(ccs);
                Cell c5 = dRow.createCell(5); c5.setCellValue(day.getTotalNetRevenue().doubleValue()); c5.setCellStyle(ccs);
                Cell c6 = dRow.createCell(6); c6.setCellValue(day.getChemicalCogs().doubleValue()); c6.setCellStyle(ccs);
                Cell c7 = dRow.createCell(7); c7.setCellValue(day.getRetailCogs().doubleValue()); c7.setCellStyle(ccs);
                Cell c8 = dRow.createCell(8); c8.setCellValue(day.getTotalCommissions().doubleValue()); c8.setCellStyle(ccs);
                Cell c9 = dRow.createCell(9); c9.setCellValue(day.getOperationalNetProfit().doubleValue()); c9.setCellStyle(ccs);
            }

            // Daily Total Row
            Row dTotalRow = summarySheet.createRow(rowIdx++);
            Cell dt0 = dTotalRow.createCell(0); dt0.setCellValue("TỔNG"); dt0.setCellStyle(totalStyle);
            Cell dt1 = dTotalRow.createCell(1); dt1.setCellValue(dailyList.size() + " ngày"); dt1.setCellStyle(totalStyle);
            Cell dt2 = dTotalRow.createCell(2); dt2.setCellValue(data.getTotalOrders()); dt2.setCellStyle(totalStyle);
            Cell dt3 = dTotalRow.createCell(3); dt3.setCellValue(data.getNetServiceRevenue().doubleValue()); dt3.setCellStyle(currencyTotalStyle);
            Cell dt4 = dTotalRow.createCell(4); dt4.setCellValue(data.getNetRetailRevenue().doubleValue()); dt4.setCellStyle(currencyTotalStyle);
            Cell dt5 = dTotalRow.createCell(5); dt5.setCellValue(data.getTotalNetRevenue().doubleValue()); dt5.setCellStyle(currencyTotalStyle);
            Cell dt6 = dTotalRow.createCell(6); dt6.setCellValue(data.getChemicalCogs().doubleValue()); dt6.setCellStyle(currencyTotalStyle);
            Cell dt7 = dTotalRow.createCell(7); dt7.setCellValue(data.getRetailCogs().doubleValue()); dt7.setCellStyle(currencyTotalStyle);
            Cell dt8 = dTotalRow.createCell(8); dt8.setCellValue(data.getTotalCommissions().doubleValue()); dt8.setCellStyle(currencyTotalStyle);
            Cell dt9 = dTotalRow.createCell(9); dt9.setCellValue(data.getOperationalNetProfit().doubleValue()); dt9.setCellStyle(currencyTotalStyle);

            for (int i = 0; i < dailyHeaders.length; i++) {
                summarySheet.autoSizeColumn(i);
            }

            // Sheet 2: Chi_Tiet_Lai_Lo_Tung_Ca
            Sheet orderSheet = workbook.createSheet("Chi_Tiet_Lai_Lo_Tung_Ca");
            orderSheet.setDisplayGridlines(true);

            int oRowIdx = 0;
            Row or0 = orderSheet.createRow(oRowIdx++);
            or0.createCell(0).setCellValue("BẢNG KÊ CHI TIẾT LÃI / LỖ TỪNG ĐƠN HÀNG (PER-ORDER P&L BREAKDOWN)");
            or0.getCell(0).setCellStyle(titleStyle);

            Row or1 = orderSheet.createRow(oRowIdx++);
            or1.createCell(0).setCellValue("Chi nhánh: " + branchName + " | Kỳ: " +
                    data.getStartDate().format(DATE_FMT) + " đến " + data.getEndDate().format(DATE_FMT));
            or1.getCell(0).setCellStyle(subTitleStyle);

            oRowIdx++; // Blank row

            String[] orderHeaders = {
                    "STT", "Mã đơn hàng", "Thời gian", "Khách hàng", "Số điện thoại", "Phương thức",
                    "DT dịch vụ thuần", "DT bán lẻ thuần", "Tổng DT thuần",
                    "Giá vốn hóa chất COGS", "Giá vốn bán lẻ COGS", "Hoa hồng nhân sự",
                    "Lợi nhuận dịch vụ", "Lợi nhuận bán lẻ", "Lợi nhuận ròng đơn"
            };
            Row oHeaderRow = orderSheet.createRow(oRowIdx++);
            for (int i = 0; i < orderHeaders.length; i++) {
                Cell c = oHeaderRow.createCell(i);
                c.setCellValue(orderHeaders[i]);
                c.setCellStyle(headerStyle);
            }

            int orderStt = 1;
            List<OrderPnlResponse> orderList = data.getOrders() != null ? data.getOrders() : List.of();
            for (OrderPnlResponse o : orderList) {
                Row oRow = orderSheet.createRow(oRowIdx++);
                XSSFCellStyle cs = (orderStt % 2 == 0) ? zebraStyle : regularStyle;
                XSSFCellStyle ccs = (orderStt % 2 == 0) ? currencyZebraStyle : currencyStyle;

                String timeStr = (o.getCreatedAt() != null)
                        ? o.getCreatedAt().atZone(DEFAULT_ZONE).format(DATETIME_FMT)
                        : "";

                Cell c0 = oRow.createCell(0); c0.setCellValue(orderStt++); c0.setCellStyle(cs);
                Cell c1 = oRow.createCell(1); c1.setCellValue(o.getOrderCode()); c1.setCellStyle(cs);
                Cell c2 = oRow.createCell(2); c2.setCellValue(timeStr); c2.setCellStyle(cs);
                Cell c3 = oRow.createCell(3); c3.setCellValue(o.getCustomerName() != null ? o.getCustomerName() : "Vãng lai"); c3.setCellStyle(cs);
                Cell c4 = oRow.createCell(4); c4.setCellValue(o.getCustomerPhone() != null ? o.getCustomerPhone() : ""); c4.setCellStyle(cs);
                Cell c5 = oRow.createCell(5); c5.setCellValue(o.getPaymentMethod() != null ? o.getPaymentMethod() : ""); c5.setCellStyle(cs);
                Cell c6 = oRow.createCell(6); c6.setCellValue(o.getNetServiceRevenue() != null ? o.getNetServiceRevenue().doubleValue() : 0.0); c6.setCellStyle(ccs);
                Cell c7 = oRow.createCell(7); c7.setCellValue(o.getNetRetailRevenue() != null ? o.getNetRetailRevenue().doubleValue() : 0.0); c7.setCellStyle(ccs);
                Cell c8 = oRow.createCell(8); c8.setCellValue(o.getTotalNetRevenue() != null ? o.getTotalNetRevenue().doubleValue() : 0.0); c8.setCellStyle(ccs);
                Cell c9 = oRow.createCell(9); c9.setCellValue(o.getChemicalCogs() != null ? o.getChemicalCogs().doubleValue() : 0.0); c9.setCellStyle(ccs);
                Cell c10 = oRow.createCell(10); c10.setCellValue(o.getRetailCogs() != null ? o.getRetailCogs().doubleValue() : 0.0); c10.setCellStyle(ccs);
                Cell c11 = oRow.createCell(11); c11.setCellValue(o.getStaffCommissions() != null ? o.getStaffCommissions().doubleValue() : 0.0); c11.setCellStyle(ccs);
                Cell c12 = oRow.createCell(12); c12.setCellValue(o.getServiceNetProfit() != null ? o.getServiceNetProfit().doubleValue() : 0.0); c12.setCellStyle(ccs);
                Cell c13 = oRow.createCell(13); c13.setCellValue(o.getRetailNetProfit() != null ? o.getRetailNetProfit().doubleValue() : 0.0); c13.setCellStyle(ccs);
                Cell c14 = oRow.createCell(14); c14.setCellValue(o.getOrderNetProfit() != null ? o.getOrderNetProfit().doubleValue() : 0.0); c14.setCellStyle(ccs);
            }

            // Order Total Row
            Row otRow = orderSheet.createRow(oRowIdx++);
            Cell ot0 = otRow.createCell(0); ot0.setCellValue("TỔNG"); ot0.setCellStyle(totalStyle);
            Cell ot1 = otRow.createCell(1); ot1.setCellValue(orderList.size() + " đơn"); ot1.setCellStyle(totalStyle);
            for (int i = 2; i <= 5; i++) {
                Cell c = otRow.createCell(i); c.setCellValue(""); c.setCellStyle(totalStyle);
            }
            Cell ot6 = otRow.createCell(6); ot6.setCellValue(data.getNetServiceRevenue().doubleValue()); ot6.setCellStyle(currencyTotalStyle);
            Cell ot7 = otRow.createCell(7); ot7.setCellValue(data.getNetRetailRevenue().doubleValue()); ot7.setCellStyle(currencyTotalStyle);
            Cell ot8 = otRow.createCell(8); ot8.setCellValue(data.getTotalNetRevenue().doubleValue()); ot8.setCellStyle(currencyTotalStyle);
            Cell ot9 = otRow.createCell(9); ot9.setCellValue(data.getChemicalCogs().doubleValue()); ot9.setCellStyle(currencyTotalStyle);
            Cell ot10 = otRow.createCell(10); ot10.setCellValue(data.getRetailCogs().doubleValue()); ot10.setCellStyle(currencyTotalStyle);
            Cell ot11 = otRow.createCell(11); ot11.setCellValue(data.getTotalCommissions().doubleValue()); ot11.setCellStyle(currencyTotalStyle);
            BigDecimal totalSvcProfit = data.getServiceNetProfit() != null ? data.getServiceNetProfit() : BigDecimal.ZERO;
            BigDecimal totalRetProfit = data.getRetailNetProfit() != null ? data.getRetailNetProfit() : BigDecimal.ZERO;
            Cell ot12 = otRow.createCell(12); ot12.setCellValue(totalSvcProfit.doubleValue()); ot12.setCellStyle(currencyTotalStyle);
            Cell ot13 = otRow.createCell(13); ot13.setCellValue(totalRetProfit.doubleValue()); ot13.setCellStyle(currencyTotalStyle);
            Cell ot14 = otRow.createCell(14); ot14.setCellValue(data.getOperationalNetProfit().doubleValue()); ot14.setCellStyle(currencyTotalStyle);

            for (int i = 0; i < orderHeaders.length; i++) {
                orderSheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Failed to generate P&L Excel workbook: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi tạo tệp Excel báo cáo P&L", e);
        }
    }

    // =========================================================================
    // EXCEL GENERATION: Staff Payroll (.xlsx)
    // =========================================================================

    private byte[] generateStaffPayrollExcel(StaffPayrollSummaryResponse data) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            CreationHelper helper = workbook.getCreationHelper();

            XSSFCellStyle titleStyle = createTitleStyle(workbook);
            XSSFCellStyle subTitleStyle = createSubTitleStyle(workbook);
            XSSFCellStyle headerStyle = createHeaderStyle(workbook, new byte[]{(byte) 131, (byte) 24, (byte) 67}); // Rose Wine
            XSSFCellStyle zebraStyle = createZebraStyle(workbook);
            XSSFCellStyle regularStyle = createRegularStyle(workbook);
            XSSFCellStyle totalStyle = createTotalStyle(workbook);

            XSSFCellStyle currencyStyle = createCurrencyStyle(workbook, helper, regularStyle);
            XSSFCellStyle currencyZebraStyle = createCurrencyStyle(workbook, helper, zebraStyle);
            XSSFCellStyle currencyTotalStyle = createCurrencyStyle(workbook, helper, totalStyle);

            XSSFCellStyle percentStyle = createPercentStyle(workbook, helper, regularStyle);
            XSSFCellStyle percentZebraStyle = createPercentStyle(workbook, helper, zebraStyle);

            // Sheet 1: Tong_Hop_Bang_Luong_KPI
            Sheet summarySheet = workbook.createSheet("Tong_Hop_Bang_Luong_KPI");
            summarySheet.setDisplayGridlines(true);

            int rowIdx = 0;
            Row r0 = summarySheet.createRow(rowIdx++);
            r0.createCell(0).setCellValue("HỆ THỐNG SALON TÓC CAO CẤP SMARTSALON");
            r0.getCell(0).setCellStyle(subTitleStyle);

            Row r1 = summarySheet.createRow(rowIdx++);
            r1.createCell(0).setCellValue("BẢNG TỔNG HỢP LƯƠNG & HIỆU SUẤT NHÂN SỰ");
            r1.getCell(0).setCellStyle(titleStyle);

            Row r2 = summarySheet.createRow(rowIdx++);
            String branchName = data.getBranchName() != null ? data.getBranchName() : "Tất cả chi nhánh";
            r2.createCell(0).setCellValue("Chi nhánh: " + branchName + " | Kỳ đối soát: " +
                    data.getStartDate().format(DATE_FMT) + " đến " + data.getEndDate().format(DATE_FMT));
            r2.getCell(0).setCellStyle(subTitleStyle);

            rowIdx++; // Blank row

            // KPI Overview Cards
            Row cardHeaderRow = summarySheet.createRow(rowIdx++);
            cardHeaderRow.createCell(0).setCellValue("TỔNG HỢP CHI PHÍ LƯƠNG & HOA HỒNG (PAYROLL SUMMARY)");
            cardHeaderRow.getCell(0).setCellStyle(headerStyle);
            cardHeaderRow.createCell(1).setCellValue("GIÁ TRỊ");
            cardHeaderRow.getCell(1).setCellStyle(headerStyle);

            Object[][] cards = {
                    {"Tổng số lượng nhân sự đang hoạt động", data.getTotalStaffCount() + " nhân sự"},
                    {"Tổng quỹ lương cứng định mức (Base Salary)", data.getTotalBaseSalary()},
                    {"Tổng tiền hoa hồng đã ghi nhận (Commission Ledger)", data.getTotalCommission()},
                    {"TỔNG CHI TRẢ THỰC LĨNH (Total Payroll Payout)", data.getTotalPayrollPayout()},
                    {"Tỷ lệ khách hàng yêu cầu Stylist đích danh TB", data.getAverageRequestedStylistRate() != null ? data.getAverageRequestedStylistRate() + "%" : "0.0%"},
                    {"Tỷ lệ khách hàng trung thành quay lại TB (Re-booking)", data.getAverageRebookingRate() != null ? data.getAverageRebookingRate() + "%" : "0.0%"}
            };

            for (Object[] card : cards) {
                Row row = summarySheet.createRow(rowIdx++);
                Cell c0 = row.createCell(0); c0.setCellValue((String) card[0]); c0.setCellStyle(regularStyle);
                Cell c1 = row.createCell(1);
                if (card[1] instanceof BigDecimal bd) {
                    c1.setCellValue(bd.doubleValue());
                    c1.setCellStyle(currencyStyle);
                } else {
                    c1.setCellValue((String) card[1]);
                    c1.setCellStyle(regularStyle);
                }
            }

            rowIdx++; // Blank row

            // Staff Table
            Row tblTitle = summarySheet.createRow(rowIdx++);
            tblTitle.createCell(0).setCellValue("DANH SÁCH CHI TIẾT LƯƠNG & HOA HỒNG TỪNG NHÂN SỰ");
            tblTitle.getCell(0).setCellStyle(subTitleStyle);

            String[] staffHeaders = {
                    "STT", "Mã NV", "Tài khoản", "Họ và tên", "Số điện thoại", "Vai trò",
                    "Lương cứng", "Số ca phục vụ", "Số bước thực hiện", "Tổng hoa hồng",
                    "Tổng thực lĩnh", "Tỷ lệ chọn đích danh (%)", "Tỷ lệ khách quay lại (%)"
            };
            Row sHeaderRow = summarySheet.createRow(rowIdx++);
            for (int i = 0; i < staffHeaders.length; i++) {
                Cell c = sHeaderRow.createCell(i);
                c.setCellValue(staffHeaders[i]);
                c.setCellStyle(headerStyle);
            }

            int staffStt = 1;
            List<StaffPerformanceResponse> staffList = data.getStaffMembers() != null ? data.getStaffMembers() : List.of();
            for (StaffPerformanceResponse s : staffList) {
                Row sRow = summarySheet.createRow(rowIdx++);
                XSSFCellStyle cs = (staffStt % 2 == 0) ? zebraStyle : regularStyle;
                XSSFCellStyle ccs = (staffStt % 2 == 0) ? currencyZebraStyle : currencyStyle;
                XSSFCellStyle pcs = (staffStt % 2 == 0) ? percentZebraStyle : percentStyle;

                Cell c0 = sRow.createCell(0); c0.setCellValue(staffStt++); c0.setCellStyle(cs);
                Cell c1 = sRow.createCell(1); c1.setCellValue("NV-" + s.getStaffId()); c1.setCellStyle(cs);
                Cell c2 = sRow.createCell(2); c2.setCellValue(s.getUsername()); c2.setCellStyle(cs);
                Cell c3 = sRow.createCell(3); c3.setCellValue(s.getFullName()); c3.setCellStyle(cs);
                Cell c4 = sRow.createCell(4); c4.setCellValue(s.getPhone() != null ? s.getPhone() : ""); c4.setCellStyle(cs);
                Cell c5 = sRow.createCell(5); c5.setCellValue(s.getRoles() != null ? String.join(", ", s.getRoles()) : ""); c5.setCellStyle(cs);
                Cell c6 = sRow.createCell(6); c6.setCellValue(s.getBaseSalary() != null ? s.getBaseSalary().doubleValue() : 0.0); c6.setCellStyle(ccs);
                Cell c7 = sRow.createCell(7); c7.setCellValue(s.getCompletedOrderCount()); c7.setCellStyle(cs);
                Cell c8 = sRow.createCell(8); c8.setCellValue(s.getCompletedStepCount()); c8.setCellStyle(cs);
                Cell c9 = sRow.createCell(9); c9.setCellValue(s.getTotalCommission() != null ? s.getTotalCommission().doubleValue() : 0.0); c9.setCellStyle(ccs);
                Cell c10 = sRow.createCell(10); c10.setCellValue(s.getTotalPayout() != null ? s.getTotalPayout().doubleValue() : 0.0); c10.setCellStyle(ccs);
                Cell c11 = sRow.createCell(11); c11.setCellValue(s.getRequestedStylistRate() != null ? s.getRequestedStylistRate().doubleValue() : 0.0); c11.setCellStyle(pcs);
                Cell c12 = sRow.createCell(12); c12.setCellValue(s.getRebookingRate() != null ? s.getRebookingRate().doubleValue() : 0.0); c12.setCellStyle(pcs);
            }

            // Totals row
            Row sTotalRow = summarySheet.createRow(rowIdx++);
            Cell st0 = sTotalRow.createCell(0); st0.setCellValue("TỔNG CỘNG"); st0.setCellStyle(totalStyle);
            Cell st1 = sTotalRow.createCell(1); st1.setCellValue(staffList.size() + " NV"); st1.setCellStyle(totalStyle);
            for (int i = 2; i <= 5; i++) {
                Cell c = sTotalRow.createCell(i); c.setCellValue(""); c.setCellStyle(totalStyle);
            }
            Cell st6 = sTotalRow.createCell(6); st6.setCellValue(data.getTotalBaseSalary() != null ? data.getTotalBaseSalary().doubleValue() : 0.0); st6.setCellStyle(currencyTotalStyle);
            Cell st7 = sTotalRow.createCell(7); st7.setCellValue(data.getTotalCompletedOrders()); st7.setCellStyle(totalStyle);
            Cell st8 = sTotalRow.createCell(8); st8.setCellValue(data.getTotalCompletedSteps()); st8.setCellStyle(totalStyle);
            Cell st9 = sTotalRow.createCell(9); st9.setCellValue(data.getTotalCommission() != null ? data.getTotalCommission().doubleValue() : 0.0); st9.setCellStyle(currencyTotalStyle);
            Cell st10 = sTotalRow.createCell(10); st10.setCellValue(data.getTotalPayrollPayout() != null ? data.getTotalPayrollPayout().doubleValue() : 0.0); st10.setCellStyle(currencyTotalStyle);
            Cell st11 = sTotalRow.createCell(11); st11.setCellValue(data.getAverageRequestedStylistRate() != null ? data.getAverageRequestedStylistRate().doubleValue() : 0.0); st11.setCellStyle(percentStyle);
            Cell st12 = sTotalRow.createCell(12); st12.setCellValue(data.getAverageRebookingRate() != null ? data.getAverageRebookingRate().doubleValue() : 0.0); st12.setCellStyle(percentStyle);

            for (int i = 0; i < staffHeaders.length; i++) {
                summarySheet.autoSizeColumn(i);
            }

            // Sheet 2: Chi_Tiet_Hoa_Hong_Tung_Ca
            Sheet ledgerSheet = workbook.createSheet("Chi_Tiet_Hoa_Hong_Tung_Ca");
            ledgerSheet.setDisplayGridlines(true);

            int lRowIdx = 0;
            Row lr0 = ledgerSheet.createRow(lRowIdx++);
            lr0.createCell(0).setCellValue("BẢNG KÊ CHI TIẾT HOA HỒNG TỪNG BƯỚC PHỤC VỤ (COMMISSION LEDGER)");
            lr0.getCell(0).setCellStyle(titleStyle);

            Row lr1 = ledgerSheet.createRow(lRowIdx++);
            lr1.createCell(0).setCellValue("Chi nhánh: " + branchName + " | Kỳ: " +
                    data.getStartDate().format(DATE_FMT) + " đến " + data.getEndDate().format(DATE_FMT));
            lr1.getCell(0).setCellStyle(subTitleStyle);

            lRowIdx++; // Blank row

            String[] ledgerHeaders = {
                    "STT", "Thời gian ghi nhận", "Mã đơn hàng", "Tên nhân sự", "Tài khoản",
                    "Dịch vụ", "Bước thực hiện", "Tỷ lệ %", "Trạng thái", "Số tiền hoa hồng", "Diễn giải công thức"
            };
            Row lHeaderRow = ledgerSheet.createRow(lRowIdx++);
            for (int i = 0; i < ledgerHeaders.length; i++) {
                Cell c = lHeaderRow.createCell(i);
                c.setCellValue(ledgerHeaders[i]);
                c.setCellStyle(headerStyle);
            }

            int ledgerStt = 1;

            for (StaffPerformanceResponse staff : staffList) {
                if (staff.getCommissionLedgers() != null) {
                    for (CommissionLedgerDetailResponse ledger : staff.getCommissionLedgers()) {
                        Row lRow = ledgerSheet.createRow(lRowIdx++);
                        XSSFCellStyle cs = (ledgerStt % 2 == 0) ? zebraStyle : regularStyle;
                        XSSFCellStyle ccs = (ledgerStt % 2 == 0) ? currencyZebraStyle : currencyStyle;

                        String timeStr = (ledger.getCreatedAt() != null)
                                ? ledger.getCreatedAt().atZone(DEFAULT_ZONE).format(DATETIME_FMT)
                                : "";

                        Cell c0 = lRow.createCell(0); c0.setCellValue(ledgerStt++); c0.setCellStyle(cs);
                        Cell c1 = lRow.createCell(1); c1.setCellValue(timeStr); c1.setCellStyle(cs);
                        Cell c2 = lRow.createCell(2); c2.setCellValue(ledger.getOrderCode()); c2.setCellStyle(cs);
                        Cell c3 = lRow.createCell(3); c3.setCellValue(staff.getFullName()); c3.setCellStyle(cs);
                        Cell c4 = lRow.createCell(4); c4.setCellValue(staff.getUsername()); c4.setCellStyle(cs);
                        Cell c5 = lRow.createCell(5); c5.setCellValue(ledger.getServiceName() != null ? ledger.getServiceName() : ""); c5.setCellStyle(cs);
                        Cell c6 = lRow.createCell(6); c6.setCellValue(ledger.getStepName() != null ? ledger.getStepName() : ""); c6.setCellStyle(cs);
                        Cell c7 = lRow.createCell(7);
                        c7.setCellValue(ledger.getCommissionRate() != null ? ledger.getCommissionRate().stripTrailingZeros().toPlainString() + "%" : "");
                        c7.setCellStyle(cs);
                        Cell c8 = lRow.createCell(8); c8.setCellValue(ledger.getStatus() != null ? ledger.getStatus() : "EARNED"); c8.setCellStyle(cs);
                        Cell c9 = lRow.createCell(9);
                        double amt = ledger.getAmount() != null ? ledger.getAmount().doubleValue() : 0.0;
                        c9.setCellValue(amt);
                        c9.setCellStyle(ccs);
                        Cell c10 = lRow.createCell(10); c10.setCellValue(ledger.getCalculationNotes() != null ? ledger.getCalculationNotes() : ""); c10.setCellStyle(cs);
                    }
                }
            }

            // Totals Row for Ledgers
            Row ltRow = ledgerSheet.createRow(lRowIdx++);
            Cell lt0 = ltRow.createCell(0); lt0.setCellValue("TỔNG HOA HỒNG CHI TRẢ"); lt0.setCellStyle(totalStyle);
            Cell lt1 = ltRow.createCell(1); lt1.setCellValue((ledgerStt - 1) + " giao dịch"); lt1.setCellStyle(totalStyle);
            for (int i = 2; i <= 8; i++) {
                Cell c = ltRow.createCell(i); c.setCellValue(""); c.setCellStyle(totalStyle);
            }
            BigDecimal totalLedgerCommission = data.getTotalCommission() != null ? data.getTotalCommission() : BigDecimal.ZERO;
            Cell lt9 = ltRow.createCell(9); lt9.setCellValue(totalLedgerCommission.doubleValue()); lt9.setCellStyle(currencyTotalStyle);
            Cell lt10 = ltRow.createCell(10); lt10.setCellValue(""); lt10.setCellStyle(totalStyle);

            for (int i = 0; i < ledgerHeaders.length; i++) {
                ledgerSheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Failed to generate Staff Payroll Excel workbook: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi tạo tệp Excel bảng lương nhân sự", e);
        }
    }

    // =========================================================================
    // PDF GENERATION: Realized P&L (.pdf)
    // =========================================================================

    private byte[] generatePnlPdf(PnlAnalyticsResponse data) {
        Document document = new Document(PageSize.A4, 28, 28, 30, 30);
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfWriter.getInstance(document, out);
            document.open();

            FontHolder fonts = loadVietnameseFonts();

            String branchName = data.getBranchName() != null ? data.getBranchName() : "Tất cả chi nhánh";
            String periodStr = "Kỳ báo cáo: Từ ngày " + data.getStartDate().format(DATE_FMT) +
                    " đến ngày " + data.getEndDate().format(DATE_FMT);

            // Document Header
            addDocumentHeader(document, fonts, "BÁO CÁO LÃI / LỖ THỰC TẾ (REALIZED P&L)", branchName, periodStr);

            // Executive Summary Table (2 columns, 6 KPI boxes)
            Paragraph summaryTitle = new Paragraph("I. TỔNG QUAN TÀI CHÍNH & LỢI NHUẬN THỰC TẾ", fonts.sectionFont);
            summaryTitle.setSpacingBefore(12f);
            summaryTitle.setSpacingAfter(6f);
            document.add(summaryTitle);

            PdfPTable kpiTable = new PdfPTable(2);
            kpiTable.setWidthPercentage(100);
            kpiTable.setWidths(new float[]{1f, 1f});

            addKpiCell(kpiTable, fonts, "TỔNG DOANH THU THUẦN", CURRENCY_FMT.format(data.getTotalNetRevenue()),
                    "DV thuần: " + CURRENCY_FMT.format(data.getNetServiceRevenue()) + " | Bán lẻ: " + CURRENCY_FMT.format(data.getNetRetailRevenue()),
                    new Color(239, 246, 255), new Color(29, 78, 216)); // Blue

            BigDecimal totalDirectCosts = data.getTotalCosts() != null ? data.getTotalCosts() : BigDecimal.ZERO;
            addKpiCell(kpiTable, fonts, "TỔNG GIÁ VỐN & HOA HỒNG (COGS + COMMISSIONS)",
                    CURRENCY_FMT.format(totalDirectCosts),
                    "Hóa chất: " + CURRENCY_FMT.format(data.getChemicalCogs()) + " | Bán lẻ: " + CURRENCY_FMT.format(data.getRetailCogs()) + " | Hoa hồng: " + CURRENCY_FMT.format(data.getTotalCommissions()),
                    new Color(254, 242, 242), new Color(185, 28, 28)); // Red

            addKpiCell(kpiTable, fonts, "LỢI NHUẬN VẬN HÀNH CẤP 1 (OPERATIONAL NET PROFIT)",
                    CURRENCY_FMT.format(data.getOperationalNetProfit()),
                    "Lợi nhuận gộp dịch vụ & bán lẻ sau khi trừ COGS và hoa hồng thợ",
                    new Color(236, 253, 245), new Color(4, 120, 87)); // Emerald Green

            addKpiCell(kpiTable, fonts, "LỢI NHUẬN RÒNG SAU LƯƠNG CẤP 2 (POST-PAYROLL PROFIT)",
                    CURRENCY_FMT.format(data.getNetProfitAfterPayroll()),
                    "Lợi nhuận ròng cuối cùng sau khi khấu trừ chi phí lương cứng (" + CURRENCY_FMT.format(data.getFixedBaseSalaryCost()) + ")",
                    new Color(253, 242, 248), new Color(190, 24, 93)); // Pink

            document.add(kpiTable);

            // Daily Financial Table
            Paragraph tableTitle = new Paragraph("II. CHI TIẾT KẾT QUẢ KINH DOANH THEO NGÀY", fonts.sectionFont);
            tableTitle.setSpacingBefore(14f);
            tableTitle.setSpacingAfter(6f);
            document.add(tableTitle);

            PdfPTable dailyTable = new PdfPTable(7);
            dailyTable.setWidthPercentage(100);
            dailyTable.setWidths(new float[]{1.5f, 0.8f, 1.8f, 1.6f, 1.6f, 1.6f, 2.0f});

            String[] tableHeaders = {"Ngày", "Số đơn", "Tổng DT thuần", "COGS H.Chất", "COGS B.Lẻ", "Hoa hồng", "LN ròng ngày"};
            for (String h : tableHeaders) {
                PdfPCell cell = new PdfPCell(new Phrase(h, fonts.tableHeaderFont));
                cell.setBackgroundColor(new Color(30, 41, 59)); // Slate 800
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(5f);
                dailyTable.addCell(cell);
            }

            int stt = 0;
            List<DailyPnlResponse> days = data.getDailySeries() != null ? data.getDailySeries() : List.of();
            for (DailyPnlResponse day : days) {
                Color rowBg = (stt++ % 2 == 0) ? Color.WHITE : new Color(248, 250, 252);

                addTableCell(dailyTable, day.getDate().format(DATE_FMT), fonts.tableBodyFont, Element.ALIGN_CENTER, rowBg);
                addTableCell(dailyTable, String.valueOf(day.getOrderCount()), fonts.tableBodyFont, Element.ALIGN_CENTER, rowBg);
                addTableCell(dailyTable, CURRENCY_FMT.format(day.getTotalNetRevenue()), fonts.tableBodyFont, Element.ALIGN_RIGHT, rowBg);
                addTableCell(dailyTable, CURRENCY_FMT.format(day.getChemicalCogs()), fonts.tableBodyFont, Element.ALIGN_RIGHT, rowBg);
                addTableCell(dailyTable, CURRENCY_FMT.format(day.getRetailCogs()), fonts.tableBodyFont, Element.ALIGN_RIGHT, rowBg);
                addTableCell(dailyTable, CURRENCY_FMT.format(day.getTotalCommissions()), fonts.tableBodyFont, Element.ALIGN_RIGHT, rowBg);
                addTableCell(dailyTable, CURRENCY_FMT.format(day.getOperationalNetProfit()), fonts.tableBoldFont, Element.ALIGN_RIGHT, rowBg);
            }

            // Totals Row
            Color totalBg = new Color(241, 245, 249);
            addTableCell(dailyTable, "TỔNG CỘNG", fonts.tableBoldFont, Element.ALIGN_CENTER, totalBg);
            addTableCell(dailyTable, String.valueOf(data.getTotalOrders()), fonts.tableBoldFont, Element.ALIGN_CENTER, totalBg);
            addTableCell(dailyTable, CURRENCY_FMT.format(data.getTotalNetRevenue()), fonts.tableBoldFont, Element.ALIGN_RIGHT, totalBg);
            addTableCell(dailyTable, CURRENCY_FMT.format(data.getChemicalCogs()), fonts.tableBoldFont, Element.ALIGN_RIGHT, totalBg);
            addTableCell(dailyTable, CURRENCY_FMT.format(data.getRetailCogs()), fonts.tableBoldFont, Element.ALIGN_RIGHT, totalBg);
            addTableCell(dailyTable, CURRENCY_FMT.format(data.getTotalCommissions()), fonts.tableBoldFont, Element.ALIGN_RIGHT, totalBg);
            addTableCell(dailyTable, CURRENCY_FMT.format(data.getOperationalNetProfit()), fonts.tableBoldFont, Element.ALIGN_RIGHT, totalBg);

            document.add(dailyTable);

            // 3-Column Accounting Signature Block
            addAccountingSignatures(document, fonts);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate P&L PDF document: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi tạo tệp PDF báo cáo P&L", e);
        }
    }

    // =========================================================================
    // PDF GENERATION: Staff Payroll (.pdf)
    // =========================================================================

    private byte[] generateStaffPayrollPdf(StaffPayrollSummaryResponse data) {
        Document document = new Document(PageSize.A4, 28, 28, 30, 30);
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfWriter.getInstance(document, out);
            document.open();

            FontHolder fonts = loadVietnameseFonts();

            String branchName = data.getBranchName() != null ? data.getBranchName() : "Tất cả chi nhánh";
            String periodStr = "Kỳ đối soát: Từ ngày " + data.getStartDate().format(DATE_FMT) +
                    " đến ngày " + data.getEndDate().format(DATE_FMT);

            // Document Header
            addDocumentHeader(document, fonts, "BẢNG LƯƠNG & HOA HỒNG NHÂN SỰ", branchName, periodStr);

            // Summary Table (2 columns, 4 KPI boxes)
            Paragraph summaryTitle = new Paragraph("I. TỔNG HỢP QUỸ LƯƠNG & HIỆU SUẤT ĐỐI SOÁT", fonts.sectionFont);
            summaryTitle.setSpacingBefore(12f);
            summaryTitle.setSpacingAfter(6f);
            document.add(summaryTitle);

            PdfPTable kpiTable = new PdfPTable(2);
            kpiTable.setWidthPercentage(100);
            kpiTable.setWidths(new float[]{1f, 1f});

            addKpiCell(kpiTable, fonts, "TỔNG QUỸ LƯƠNG CỨNG (BASE SALARY)",
                    CURRENCY_FMT.format(data.getTotalBaseSalary()),
                    "Tổng định mức chi phí cố định cho " + data.getTotalStaffCount() + " nhân sự chi nhánh",
                    new Color(239, 246, 255), new Color(29, 78, 216));

            addKpiCell(kpiTable, fonts, "TỔNG HOA HỒNG DỊCH VỤ (COMMISSION)",
                    "+" + CURRENCY_FMT.format(data.getTotalCommission()),
                    "Tổng tiền hoa hồng đã trích theo Commission Ledger các ca hoàn thành",
                    new Color(236, 253, 245), new Color(4, 120, 87));

            addKpiCell(kpiTable, fonts, "TỔNG CHI TRẢ LƯƠNG THỰC LĨNH (PAYOUT)",
                    CURRENCY_FMT.format(data.getTotalPayrollPayout()),
                    "Tổng số tiền chuyển khoản hoặc chi trả = Lương cứng + Hoa hồng",
                    new Color(253, 242, 248), new Color(190, 24, 93));

            String loyaltyStr = "Chỉ định thợ TB: " +
                    (data.getAverageRequestedStylistRate() != null ? data.getAverageRequestedStylistRate() : "0.0") +
                    "% | Khách quay lại TB: " +
                    (data.getAverageRebookingRate() != null ? data.getAverageRebookingRate() : "0.0") + "%";
            addKpiCell(kpiTable, fonts, "CHỈ SỐ TRUNG THÀNH KHÁCH HÀNG (LOYALTY KPIs)",
                    loyaltyStr,
                    "Đo lường mức độ yêu thích stylist và tỷ lệ khách hàng lặp lại (≥2 đơn)",
                    new Color(254, 243, 199), new Color(180, 83, 9));

            document.add(kpiTable);

            // Staff Table
            Paragraph tableTitle = new Paragraph("II. CHI TIẾT LƯƠNG & HOA HỒNG TỪNG NHÂN SỰ", fonts.sectionFont);
            tableTitle.setSpacingBefore(14f);
            tableTitle.setSpacingAfter(6f);
            document.add(tableTitle);

            PdfPTable staffTable = new PdfPTable(10);
            staffTable.setWidthPercentage(100);
            staffTable.setWidths(new float[]{0.6f, 1.1f, 2.0f, 1.1f, 1.7f, 0.8f, 1.7f, 1.8f, 1.1f, 1.2f});

            String[] tableHeaders = {"STT", "Mã NV", "Họ và tên", "Vai trò", "Lương cứng", "Số ca", "Hoa hồng", "Thực lĩnh", "Chỉ định %", "Quay lại %"};
            for (String h : tableHeaders) {
                PdfPCell cell = new PdfPCell(new Phrase(h, fonts.tableHeaderFont));
                cell.setBackgroundColor(new Color(131, 24, 67)); // Rose Wine
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(5f);
                staffTable.addCell(cell);
            }

            int stt = 1;
            List<StaffPerformanceResponse> staffList = data.getStaffMembers() != null ? data.getStaffMembers() : List.of();
            for (StaffPerformanceResponse s : staffList) {
                Color rowBg = (stt % 2 == 0) ? Color.WHITE : new Color(253, 244, 247);

                addTableCell(staffTable, String.valueOf(stt++), fonts.tableBodyFont, Element.ALIGN_CENTER, rowBg);
                addTableCell(staffTable, "NV-" + s.getStaffId(), fonts.tableBodyFont, Element.ALIGN_CENTER, rowBg);
                addTableCell(staffTable, s.getFullName(), fonts.tableBoldFont, Element.ALIGN_LEFT, rowBg);
                String roleStr = (s.getRoles() != null && !s.getRoles().isEmpty()) ? s.getRoles().get(0) : "STAFF";
                addTableCell(staffTable, roleStr, fonts.tableBodyFont, Element.ALIGN_CENTER, rowBg);
                addTableCell(staffTable, CURRENCY_FMT.format(s.getBaseSalary()), fonts.tableBodyFont, Element.ALIGN_RIGHT, rowBg);
                addTableCell(staffTable, String.valueOf(s.getCompletedOrderCount()), fonts.tableBodyFont, Element.ALIGN_CENTER, rowBg);
                addTableCell(staffTable, CURRENCY_FMT.format(s.getTotalCommission()), fonts.tableBodyFont, Element.ALIGN_RIGHT, rowBg);
                addTableCell(staffTable, CURRENCY_FMT.format(s.getTotalPayout()), fonts.tableBoldFont, Element.ALIGN_RIGHT, rowBg);
                String reqStr = s.getRequestedStylistRate() != null ? s.getRequestedStylistRate().setScale(1, java.math.RoundingMode.HALF_UP) + "%" : "0.0%";
                addTableCell(staffTable, reqStr, fonts.tableBodyFont, Element.ALIGN_CENTER, rowBg);
                String rebookStr = s.getRebookingRate() != null ? s.getRebookingRate().setScale(1, java.math.RoundingMode.HALF_UP) + "%" : "0.0%";
                addTableCell(staffTable, rebookStr, fonts.tableBodyFont, Element.ALIGN_CENTER, rowBg);
            }

            // Totals Row
            Color totalBg = new Color(241, 245, 249);
            addTableCell(staffTable, "TỔNG", fonts.tableBoldFont, Element.ALIGN_CENTER, totalBg);
            addTableCell(staffTable, staffList.size() + " NV", fonts.tableBoldFont, Element.ALIGN_CENTER, totalBg);
            addTableCell(staffTable, "TỔNG CỘNG TOÀN CHI NHÁNH", fonts.tableBoldFont, Element.ALIGN_LEFT, totalBg);
            addTableCell(staffTable, "", fonts.tableBoldFont, Element.ALIGN_CENTER, totalBg);
            addTableCell(staffTable, CURRENCY_FMT.format(data.getTotalBaseSalary()), fonts.tableBoldFont, Element.ALIGN_RIGHT, totalBg);
            int totalBookings = staffList.stream().mapToInt(StaffPerformanceResponse::getCompletedOrderCount).sum();
            addTableCell(staffTable, String.valueOf(totalBookings), fonts.tableBoldFont, Element.ALIGN_CENTER, totalBg);
            addTableCell(staffTable, CURRENCY_FMT.format(data.getTotalCommission()), fonts.tableBoldFont, Element.ALIGN_RIGHT, totalBg);
            addTableCell(staffTable, CURRENCY_FMT.format(data.getTotalPayrollPayout()), fonts.tableBoldFont, Element.ALIGN_RIGHT, totalBg);
            String avgReq = (data.getAverageRequestedStylistRate() != null) ? data.getAverageRequestedStylistRate() + "%" : "0.0%";
            addTableCell(staffTable, avgReq, fonts.tableBoldFont, Element.ALIGN_CENTER, totalBg);
            String avgRebook = (data.getAverageRebookingRate() != null) ? data.getAverageRebookingRate() + "%" : "0.0%";
            addTableCell(staffTable, avgRebook, fonts.tableBoldFont, Element.ALIGN_CENTER, totalBg);

            document.add(staffTable);

            // 3-Column Accounting Signature Block
            addAccountingSignatures(document, fonts);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate Staff Payroll PDF document: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi tạo tệp PDF bảng lương nhân sự", e);
        }
    }

    // =========================================================================
    // PDF HELPER METHODS & TRUE-TYPE FONT LOADING
    // =========================================================================

    private record FontHolder(
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

    private FontHolder loadVietnameseFonts() throws IOException {
        byte[] regularBytes = loadResourceBytes("/fonts/Roboto-Regular.ttf");
        byte[] boldBytes = loadResourceBytes("/fonts/Roboto-Bold.ttf");

        BaseFont regularBase = BaseFont.createFont("Roboto-Regular.ttf", BaseFont.IDENTITY_H, true, true, regularBytes, null);
        BaseFont boldBase = BaseFont.createFont("Roboto-Bold.ttf", BaseFont.IDENTITY_H, true, true, boldBytes, null);

        return new FontHolder(
                new Font(boldBase, 11, Font.BOLD, new Color(100, 116, 139)),
                new Font(boldBase, 16, Font.BOLD, new Color(15, 23, 42)),
                new Font(regularBase, 9, Font.NORMAL, new Color(71, 85, 105)),
                new Font(boldBase, 10, Font.BOLD, new Color(30, 41, 59)),
                new Font(boldBase, 8, Font.BOLD, new Color(100, 116, 139)),
                new Font(boldBase, 13, Font.BOLD, new Color(15, 23, 42)),
                new Font(regularBase, 7, Font.NORMAL, new Color(100, 116, 139)),
                new Font(boldBase, 8, Font.BOLD, Color.WHITE),
                new Font(regularBase, 8, Font.NORMAL, new Color(30, 41, 59)),
                new Font(boldBase, 8, Font.BOLD, new Color(15, 23, 42)),
                new Font(boldBase, 9, Font.BOLD, new Color(15, 23, 42)),
                new Font(regularBase, 8, Font.ITALIC, new Color(100, 116, 139))
        );
    }

    private byte[] loadResourceBytes(String path) throws IOException {
        try (InputStream is = getClass().getResourceAsStream(path)) {
            if (is == null) {
                log.warn("Classpath resource '{}' not found, falling back to embedded Arial", path);
                // Fallback to system font if classpath fails
                return new byte[0];
            }
            return is.readAllBytes();
        }
    }

    private void addDocumentHeader(Document doc, FontHolder fonts, String title, String branchName, String periodStr) throws DocumentException {
        Paragraph brand = new Paragraph("HỆ THỐNG SALON TÓC CAO CẤP SMARTSALON", fonts.brandFont);
        brand.setAlignment(Element.ALIGN_CENTER);
        doc.add(brand);

        Paragraph docTitle = new Paragraph(title, fonts.titleFont);
        docTitle.setAlignment(Element.ALIGN_CENTER);
        docTitle.setSpacingBefore(3f);
        docTitle.setSpacingAfter(3f);
        docTitle.getFont().setColor(new Color(219, 39, 119)); // SmartSalon Pink
        doc.add(docTitle);

        Paragraph branchPara = new Paragraph("Chi nhánh: " + branchName, fonts.subTitleFont);
        branchPara.setAlignment(Element.ALIGN_CENTER);
        doc.add(branchPara);

        Paragraph periodPara = new Paragraph(periodStr + " | Xuất ngày: " + Instant.now().atZone(DEFAULT_ZONE).format(DATETIME_FMT), fonts.subTitleFont);
        periodPara.setAlignment(Element.ALIGN_CENTER);
        periodPara.setSpacingAfter(10f);
        doc.add(periodPara);
    }

    private void addKpiCell(PdfPTable table, FontHolder fonts, String label, String value, String desc, Color bgColor, Color valColor) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(bgColor);
        cell.setPadding(8f);
        cell.setBorderColor(new Color(226, 232, 240));
        cell.setBorderWidth(1f);

        Paragraph pLabel = new Paragraph(label, fonts.cardTitleFont);
        Paragraph pValue = new Paragraph(value, fonts.cardValueFont);
        pValue.getFont().setColor(valColor);
        pValue.setSpacingBefore(2f);
        pValue.setSpacingAfter(2f);

        Paragraph pDesc = new Paragraph(desc, fonts.cardDescFont);

        cell.addElement(pLabel);
        cell.addElement(pValue);
        cell.addElement(pDesc);

        table.addCell(cell);
    }

    private void addTableCell(PdfPTable table, String text, Font font, int alignment, Color bgColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", font));
        cell.setBackgroundColor(bgColor);
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(5f);
        cell.setBorderColor(new Color(226, 232, 240));
        cell.setBorderWidth(0.5f);
        table.addCell(cell);
    }

    private void addAccountingSignatures(Document doc, FontHolder fonts) throws DocumentException {
        Paragraph space = new Paragraph(" ", fonts.subTitleFont);
        space.setSpacingBefore(24f);
        doc.add(space);

        PdfPTable sigTable = new PdfPTable(3);
        sigTable.setWidthPercentage(100);
        sigTable.setWidths(new float[]{1f, 1f, 1f});

        addSignatureCell(sigTable, fonts, "Người lập biểu", "(Ký, ghi rõ họ tên)");
        addSignatureCell(sigTable, fonts, "Kế toán trưởng", "(Ký, ghi rõ họ tên)");
        addSignatureCell(sigTable, fonts, "Chủ Salon / Giám đốc", "(Ký, đóng dấu)");

        doc.add(sigTable);
    }

    private void addSignatureCell(PdfPTable table, FontHolder fonts, String title, String subtitle) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);

        Paragraph pTitle = new Paragraph(title, fonts.signatureTitleFont);
        pTitle.setAlignment(Element.ALIGN_CENTER);
        Paragraph pSub = new Paragraph(subtitle, fonts.signatureDescFont);
        pSub.setAlignment(Element.ALIGN_CENTER);
        pSub.setSpacingAfter(45f); // Signature blank space

        cell.addElement(pTitle);
        cell.addElement(pSub);

        table.addCell(cell);
    }

    // =========================================================================
    // EXCEL STYLES HELPER METHODS
    // =========================================================================

    private XSSFCellStyle createTitleStyle(XSSFWorkbook wb) {
        XSSFCellStyle style = wb.createCellStyle();
        XSSFFont font = wb.createFont();
        font.setFontHeightInPoints((short) 15);
        font.setBold(true);
        font.setColor(new XSSFColor(new byte[]{(byte) 15, (byte) 23, (byte) 42}, null));
        style.setFont(font);
        return style;
    }

    private XSSFCellStyle createSubTitleStyle(XSSFWorkbook wb) {
        XSSFCellStyle style = wb.createCellStyle();
        XSSFFont font = wb.createFont();
        font.setFontHeightInPoints((short) 10);
        font.setColor(new XSSFColor(new byte[]{(byte) 71, (byte) 85, (byte) 105}, null));
        style.setFont(font);
        return style;
    }

    private XSSFCellStyle createHeaderStyle(XSSFWorkbook wb, byte[] rgbColor) {
        XSSFCellStyle style = wb.createCellStyle();
        XSSFFont font = wb.createFont();
        font.setFontHeightInPoints((short) 10);
        font.setBold(true);
        font.setColor(new XSSFColor(new byte[]{(byte) 255, (byte) 255, (byte) 255}, null));
        style.setFont(font);
        style.setFillForegroundColor(new XSSFColor(rgbColor, null));
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private XSSFCellStyle createRegularStyle(XSSFWorkbook wb) {
        XSSFCellStyle style = wb.createCellStyle();
        XSSFFont font = wb.createFont();
        font.setFontHeightInPoints((short) 9);
        style.setFont(font);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBottomBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setBorderTop(BorderStyle.THIN);
        style.setTopBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setBorderLeft(BorderStyle.THIN);
        style.setLeftBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setBorderRight(BorderStyle.THIN);
        style.setRightBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        return style;
    }

    private XSSFCellStyle createZebraStyle(XSSFWorkbook wb) {
        XSSFCellStyle style = createRegularStyle(wb);
        style.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 248, (byte) 250, (byte) 252}, null));
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private XSSFCellStyle createTotalStyle(XSSFWorkbook wb) {
        XSSFCellStyle style = wb.createCellStyle();
        XSSFFont font = wb.createFont();
        font.setFontHeightInPoints((short) 10);
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 241, (byte) 245, (byte) 249}, null));
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.DOUBLE);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private XSSFCellStyle createCurrencyStyle(XSSFWorkbook wb, CreationHelper helper, XSSFCellStyle baseStyle) {
        XSSFCellStyle style = wb.createCellStyle();
        style.cloneStyleFrom(baseStyle);
        style.setDataFormat(helper.createDataFormat().getFormat("#,##0 \"₫\""));
        style.setAlignment(HorizontalAlignment.RIGHT);
        return style;
    }

    private XSSFCellStyle createPercentStyle(XSSFWorkbook wb, CreationHelper helper, XSSFCellStyle baseStyle) {
        XSSFCellStyle style = wb.createCellStyle();
        style.cloneStyleFrom(baseStyle);
        style.setDataFormat(helper.createDataFormat().getFormat("0.0\"%\""));
        style.setAlignment(HorizontalAlignment.RIGHT);
        return style;
    }

    private String toAsciiSlug(String input) {
        if (input == null) return "Report";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        String withoutDiacritics = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return withoutDiacritics.replaceAll("[^a-zA-Z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
    }
}
