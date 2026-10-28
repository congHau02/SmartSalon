package com.smartsalon.analytics.service.impl;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.PageSize;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.smartsalon.analytics.dto.DailyPnlResponse;
import com.smartsalon.analytics.dto.OrderPnlResponse;
import com.smartsalon.analytics.dto.PnlAnalyticsResponse;
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
import java.util.List;

import static com.smartsalon.analytics.service.impl.ExcelStyleFactory.*;
import static com.smartsalon.analytics.service.impl.PdfReportLayoutHelper.*;

@Slf4j
@Component
public class PnlReportExporter {

    private static final byte[] NAVY_RGB = new byte[]{(byte) 30, (byte) 58, (byte) 138};
    private static final String[] DAILY_HEADERS = {
            "STT", "Ngày", "Số đơn", "DT dịch vụ thuần", "DT bán lẻ thuần",
            "Tổng DT thuần", "COGS hóa chất", "COGS bán lẻ", "Hoa hồng", "Lợi nhuận ròng ngày"
    };
    private static final String[] ORDER_HEADERS = {
            "STT", "Mã đơn hàng", "Thời gian", "Khách hàng", "Số điện thoại", "Phương thức",
            "DT dịch vụ thuần", "DT bán lẻ thuần", "Tổng DT thuần",
            "Giá vốn hóa chất COGS", "Giá vốn bán lẻ COGS", "Hoa hồng nhân sự",
            "Lợi nhuận dịch vụ", "Lợi nhuận bán lẻ", "Lợi nhuận ròng đơn"
    };

    public byte[] generateExcel(PnlAnalyticsResponse data) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            StylePalette styles = createPalette(workbook, NAVY_RGB);
            buildSummarySheet(workbook, data, styles);
            buildOrderSheet(workbook, data, styles);
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Failed to generate P&L Excel workbook: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi tạo tệp Excel báo cáo P&L", e);
        }
    }

    public byte[] generatePdf(PnlAnalyticsResponse data) {
        Document document = new Document(PageSize.A4, 28, 28, 30, 30);
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfWriter.getInstance(document, out);
            document.open();
            ReportExportServiceImpl.FontHolder fonts = loadVietnameseFonts();
            String branchName = data.getBranchName() != null ? data.getBranchName() : "Tất cả chi nhánh";
            String periodStr = "Kỳ báo cáo: Từ ngày " + data.getStartDate().format(ExcelStyleFactory.DATE_FMT)
                    + " đến ngày " + data.getEndDate().format(ExcelStyleFactory.DATE_FMT);

            addDocumentHeader(document, fonts, "BÁO CÁO LÃI / LỖ THỰC TẾ (REALIZED P&L)", branchName, periodStr);
            addSectionHeading(document, fonts, "I. TỔNG QUAN TÀI CHÍNH & LỢI NHUẬN THỰC TẾ", 12f);
            document.add(buildPdfKpiTable(data, fonts));
            addSectionHeading(document, fonts, "II. CHI TIẾT KẾT QUẢ KINH DOANH THEO NGÀY", 14f);
            document.add(buildPdfDailyTable(data, fonts));
            addAccountingSignatures(document, fonts);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate P&L PDF document: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi tạo tệp PDF báo cáo P&L", e);
        }
    }

    private void buildSummarySheet(XSSFWorkbook workbook, PnlAnalyticsResponse data, StylePalette styles) {
        Sheet sheet = workbook.createSheet("Tong_Hop_Ket_Qua_Kinh_Doanh");
        sheet.setDisplayGridlines(true);
        String branchName = data.getBranchName() != null ? data.getBranchName() : "Tất cả chi nhánh";

        int rowIdx = 0;
        setText(sheet.createRow(rowIdx++), 0, "HỆ THỐNG SALON TÓC CAO CẤP SMARTSALON", styles.subTitle());
        setText(sheet.createRow(rowIdx++), 0, "BÁO CÁO LÃI / LỖ THỰC TẾ (REALIZED PROFIT & LOSS)", styles.title());
        setText(sheet.createRow(rowIdx++), 0, "Chi nhánh: " + branchName + " | Kỳ báo cáo: "
                + data.getStartDate().format(ExcelStyleFactory.DATE_FMT) + " đến " + data.getEndDate().format(ExcelStyleFactory.DATE_FMT), styles.subTitle());
        rowIdx++;

        rowIdx = writeKpiOverviewSection(sheet, rowIdx, data, styles);
        rowIdx++;
        writeDailyTrendSection(sheet, rowIdx, data, styles);
        autoSizeColumns(sheet, DAILY_HEADERS.length);
    }

    private int writeKpiOverviewSection(Sheet sheet, int rowIdx, PnlAnalyticsResponse data, StylePalette styles) {
        Row kpiHeaderRow = sheet.createRow(rowIdx++);
        setText(kpiHeaderRow, 0, "CHỈ SỐ TÀI CHÍNH CỐT LÕI (EXECUTIVE SUMMARY)", styles.header());
        setText(kpiHeaderRow, 1, "GIÁ TRỊ (VND)", styles.header());

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
            Row row = sheet.createRow(rowIdx++);
            setText(row, 0, (String) item[0], styles.regular());
            setAmount(row, 1, (BigDecimal) item[1], styles.currency());
        }
        return rowIdx;
    }

    private void writeDailyTrendSection(Sheet sheet, int rowIdx, PnlAnalyticsResponse data, StylePalette styles) {
        setText(sheet.createRow(rowIdx++), 0, "BẢNG TỔNG HỢP THEO NGÀY (DAILY FINANCIAL TIME-SERIES)", styles.subTitle());
        writeHeaders(sheet.createRow(rowIdx++), DAILY_HEADERS, styles.header());

        List<DailyPnlResponse> dailyList = data.getDailySeries() != null ? data.getDailySeries() : List.of();
        int dayStt = 1;
        for (DailyPnlResponse day : dailyList) {
            writeDailyRow(sheet.createRow(rowIdx++), dayStt++, day, styles);
        }
        writeDailyTotalRow(sheet.createRow(rowIdx), dailyList.size(), data, styles);
    }

    private void writeDailyRow(Row row, int stt, DailyPnlResponse day, StylePalette styles) {
        XSSFCellStyle cs = styles.rowText(stt);
        XSSFCellStyle ccs = styles.rowCurrency(stt);
        setInt(row, 0, stt, cs);
        setText(row, 1, day.getDate().format(ExcelStyleFactory.DATE_FMT), cs);
        setInt(row, 2, day.getOrderCount(), cs);
        setAmount(row, 3, day.getNetServiceRevenue(), ccs);
        setAmount(row, 4, day.getNetRetailRevenue(), ccs);
        setAmount(row, 5, day.getTotalNetRevenue(), ccs);
        setAmount(row, 6, day.getChemicalCogs(), ccs);
        setAmount(row, 7, day.getRetailCogs(), ccs);
        setAmount(row, 8, day.getTotalCommissions(), ccs);
        setAmount(row, 9, day.getOperationalNetProfit(), ccs);
    }

    private void writeDailyTotalRow(Row row, int dayCount, PnlAnalyticsResponse data, StylePalette styles) {
        setText(row, 0, "TỔNG", styles.total());
        setText(row, 1, dayCount + " ngày", styles.total());
        setInt(row, 2, data.getTotalOrders(), styles.total());
        setAmount(row, 3, data.getNetServiceRevenue(), styles.currencyTotal());
        setAmount(row, 4, data.getNetRetailRevenue(), styles.currencyTotal());
        setAmount(row, 5, data.getTotalNetRevenue(), styles.currencyTotal());
        setAmount(row, 6, data.getChemicalCogs(), styles.currencyTotal());
        setAmount(row, 7, data.getRetailCogs(), styles.currencyTotal());
        setAmount(row, 8, data.getTotalCommissions(), styles.currencyTotal());
        setAmount(row, 9, data.getOperationalNetProfit(), styles.currencyTotal());
    }

    private void buildOrderSheet(XSSFWorkbook workbook, PnlAnalyticsResponse data, StylePalette styles) {
        Sheet sheet = workbook.createSheet("Chi_Tiet_Lai_Lo_Tung_Ca");
        sheet.setDisplayGridlines(true);
        String branchName = data.getBranchName() != null ? data.getBranchName() : "Tất cả chi nhánh";

        int rowIdx = 0;
        setText(sheet.createRow(rowIdx++), 0, "BẢNG KÊ CHI TIẾT LÃI / LỖ TỪNG ĐƠN HÀNG (PER-ORDER P&L BREAKDOWN)", styles.title());
        setText(sheet.createRow(rowIdx++), 0, "Chi nhánh: " + branchName + " | Kỳ: "
                + data.getStartDate().format(ExcelStyleFactory.DATE_FMT) + " đến " + data.getEndDate().format(ExcelStyleFactory.DATE_FMT), styles.subTitle());
        rowIdx++;

        writeHeaders(sheet.createRow(rowIdx++), ORDER_HEADERS, styles.header());
        List<OrderPnlResponse> orderList = data.getOrders() != null ? data.getOrders() : List.of();
        int orderStt = 1;
        for (OrderPnlResponse o : orderList) {
            writeOrderRow(sheet.createRow(rowIdx++), orderStt++, o, styles);
        }
        writeOrderTotalRow(sheet.createRow(rowIdx), orderList.size(), data, styles);
        autoSizeColumns(sheet, ORDER_HEADERS.length);
    }

    private void writeOrderRow(Row row, int stt, OrderPnlResponse o, StylePalette styles) {
        XSSFCellStyle cs = styles.rowText(stt);
        XSSFCellStyle ccs = styles.rowCurrency(stt);
        setInt(row, 0, stt, cs);
        setText(row, 1, o.getOrderCode(), cs);
        setText(row, 2, formatInstant(o.getCreatedAt()), cs);
        setText(row, 3, o.getCustomerName() != null ? o.getCustomerName() : "Vãng lai", cs);
        setText(row, 4, o.getCustomerPhone(), cs);
        setText(row, 5, o.getPaymentMethod(), cs);
        setAmount(row, 6, o.getNetServiceRevenue(), ccs);
        setAmount(row, 7, o.getNetRetailRevenue(), ccs);
        setAmount(row, 8, o.getTotalNetRevenue(), ccs);
        setAmount(row, 9, o.getChemicalCogs(), ccs);
        setAmount(row, 10, o.getRetailCogs(), ccs);
        setAmount(row, 11, o.getStaffCommissions(), ccs);
        setAmount(row, 12, o.getServiceNetProfit(), ccs);
        setAmount(row, 13, o.getRetailNetProfit(), ccs);
        setAmount(row, 14, o.getOrderNetProfit(), ccs);
    }

    private void writeOrderTotalRow(Row row, int orderCount, PnlAnalyticsResponse data, StylePalette styles) {
        setText(row, 0, "TỔNG", styles.total());
        setText(row, 1, orderCount + " đơn", styles.total());
        for (int i = 2; i <= 5; i++) setText(row, i, "", styles.total());
        setAmount(row, 6, data.getNetServiceRevenue(), styles.currencyTotal());
        setAmount(row, 7, data.getNetRetailRevenue(), styles.currencyTotal());
        setAmount(row, 8, data.getTotalNetRevenue(), styles.currencyTotal());
        setAmount(row, 9, data.getChemicalCogs(), styles.currencyTotal());
        setAmount(row, 10, data.getRetailCogs(), styles.currencyTotal());
        setAmount(row, 11, data.getTotalCommissions(), styles.currencyTotal());
        setAmount(row, 12, data.getServiceNetProfit(), styles.currencyTotal());
        setAmount(row, 13, data.getRetailNetProfit(), styles.currencyTotal());
        setAmount(row, 14, data.getOperationalNetProfit(), styles.currencyTotal());
    }

    private PdfPTable buildPdfKpiTable(PnlAnalyticsResponse data, ReportExportServiceImpl.FontHolder fonts) throws DocumentException {
        PdfPTable kpiTable = new PdfPTable(2);
        kpiTable.setWidthPercentage(100);
        kpiTable.setWidths(new float[]{1f, 1f});

        addKpiCell(kpiTable, fonts, "TỔNG DOANH THU THUẦN", formatCurrency(data.getTotalNetRevenue()),
                "DV thuần: " + formatCurrency(data.getNetServiceRevenue()) + " | Bán lẻ: " + formatCurrency(data.getNetRetailRevenue()),
                new Color(239, 246, 255), new Color(29, 78, 216));

        BigDecimal totalDirectCosts = data.getTotalCosts() != null ? data.getTotalCosts() : BigDecimal.ZERO;
        addKpiCell(kpiTable, fonts, "TỔNG GIÁ VỐN & HOA HỒNG (COGS + COMMISSIONS)", formatCurrency(totalDirectCosts),
                "Hóa chất: " + formatCurrency(data.getChemicalCogs()) + " | Bán lẻ: " + formatCurrency(data.getRetailCogs()) + " | Hoa hồng: " + formatCurrency(data.getTotalCommissions()),
                new Color(254, 242, 242), new Color(185, 28, 28));

        addKpiCell(kpiTable, fonts, "LỢI NHUẬN VẬN HÀNH CẤP 1 (OPERATIONAL NET PROFIT)", formatCurrency(data.getOperationalNetProfit()),
                "Lợi nhuận gộp dịch vụ & bán lẻ sau khi trừ COGS và hoa hồng thợ",
                new Color(236, 253, 245), new Color(4, 120, 87));

        addKpiCell(kpiTable, fonts, "LỢI NHUẬN RÒNG SAU LƯƠNG CẤP 2 (POST-PAYROLL PROFIT)", formatCurrency(data.getNetProfitAfterPayroll()),
                "Lợi nhuận ròng cuối cùng sau khi khấu trừ chi phí lương cứng (" + formatCurrency(data.getFixedBaseSalaryCost()) + ")",
                new Color(253, 242, 248), new Color(190, 24, 93));
        return kpiTable;
    }

    private PdfPTable buildPdfDailyTable(PnlAnalyticsResponse data, ReportExportServiceImpl.FontHolder fonts) throws DocumentException {
        PdfPTable dailyTable = new PdfPTable(7);
        dailyTable.setWidthPercentage(100);
        dailyTable.setWidths(new float[]{1.5f, 0.8f, 1.8f, 1.6f, 1.6f, 1.6f, 2.0f});

        String[] tableHeaders = {"Ngày", "Số đơn", "Tổng DT thuần", "COGS H.Chất", "COGS B.Lẻ", "Hoa hồng", "LN ròng ngày"};
        addTableHeaders(dailyTable, tableHeaders, fonts.tableHeaderFont(), new Color(30, 41, 59));

        int stt = 0;
        List<DailyPnlResponse> days = data.getDailySeries() != null ? data.getDailySeries() : List.of();
        for (DailyPnlResponse day : days) {
            Color rowBg = (stt++ % 2 == 0) ? Color.WHITE : new Color(248, 250, 252);
            addTableCell(dailyTable, day.getDate().format(ExcelStyleFactory.DATE_FMT), fonts.tableBodyFont(), Element.ALIGN_CENTER, rowBg);
            addTableCell(dailyTable, String.valueOf(day.getOrderCount()), fonts.tableBodyFont(), Element.ALIGN_CENTER, rowBg);
            addTableCell(dailyTable, formatCurrency(day.getTotalNetRevenue()), fonts.tableBodyFont(), Element.ALIGN_RIGHT, rowBg);
            addTableCell(dailyTable, formatCurrency(day.getChemicalCogs()), fonts.tableBodyFont(), Element.ALIGN_RIGHT, rowBg);
            addTableCell(dailyTable, formatCurrency(day.getRetailCogs()), fonts.tableBodyFont(), Element.ALIGN_RIGHT, rowBg);
            addTableCell(dailyTable, formatCurrency(day.getTotalCommissions()), fonts.tableBodyFont(), Element.ALIGN_RIGHT, rowBg);
            addTableCell(dailyTable, formatCurrency(day.getOperationalNetProfit()), fonts.tableBoldFont(), Element.ALIGN_RIGHT, rowBg);
        }

        Color totalBg = new Color(241, 245, 249);
        addTableCell(dailyTable, "TỔNG CỘNG", fonts.tableBoldFont(), Element.ALIGN_CENTER, totalBg);
        addTableCell(dailyTable, String.valueOf(data.getTotalOrders()), fonts.tableBoldFont(), Element.ALIGN_CENTER, totalBg);
        addTableCell(dailyTable, formatCurrency(data.getTotalNetRevenue()), fonts.tableBoldFont(), Element.ALIGN_RIGHT, totalBg);
        addTableCell(dailyTable, formatCurrency(data.getChemicalCogs()), fonts.tableBoldFont(), Element.ALIGN_RIGHT, totalBg);
        addTableCell(dailyTable, formatCurrency(data.getRetailCogs()), fonts.tableBoldFont(), Element.ALIGN_RIGHT, totalBg);
        addTableCell(dailyTable, formatCurrency(data.getTotalCommissions()), fonts.tableBoldFont(), Element.ALIGN_RIGHT, totalBg);
        addTableCell(dailyTable, formatCurrency(data.getOperationalNetProfit()), fonts.tableBoldFont(), Element.ALIGN_RIGHT, totalBg);
        return dailyTable;
    }
}
