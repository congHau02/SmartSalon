package com.smartsalon.analytics.service.impl;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

final class ExcelStyleFactory {

    static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private ExcelStyleFactory() {
    }

    record StylePalette(
            XSSFCellStyle title,
            XSSFCellStyle subTitle,
            XSSFCellStyle header,
            XSSFCellStyle regular,
            XSSFCellStyle zebra,
            XSSFCellStyle total,
            XSSFCellStyle currency,
            XSSFCellStyle currencyZebra,
            XSSFCellStyle currencyTotal,
            XSSFCellStyle percent,
            XSSFCellStyle percentZebra
    ) {
        XSSFCellStyle rowText(int stt) {
            return (stt % 2 == 0) ? zebra : regular;
        }

        XSSFCellStyle rowCurrency(int stt) {
            return (stt % 2 == 0) ? currencyZebra : currency;
        }

        XSSFCellStyle rowPercent(int stt) {
            return (stt % 2 == 0) ? percentZebra : percent;
        }
    }

    static StylePalette createPalette(XSSFWorkbook wb, byte[] headerRgb) {
        CreationHelper helper = wb.getCreationHelper();
        XSSFCellStyle title = createTitleStyle(wb);
        XSSFCellStyle subTitle = createSubTitleStyle(wb);
        XSSFCellStyle header = createHeaderStyle(wb, headerRgb);
        XSSFCellStyle regular = createRegularStyle(wb);
        XSSFCellStyle zebra = createZebraStyle(wb);
        XSSFCellStyle total = createTotalStyle(wb);
        return new StylePalette(
                title, subTitle, header, regular, zebra, total,
                createCurrencyStyle(wb, helper, regular),
                createCurrencyStyle(wb, helper, zebra),
                createCurrencyStyle(wb, helper, total),
                createPercentStyle(wb, helper, regular),
                createPercentStyle(wb, helper, zebra)
        );
    }

    static void setText(Row row, int col, String val, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(val != null ? val : "");
        cell.setCellStyle(style);
    }

    static void setInt(Row row, int col, long val, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(val);
        cell.setCellStyle(style);
    }

    static void setAmount(Row row, int col, BigDecimal val, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(val != null ? val.doubleValue() : 0.0);
        cell.setCellStyle(style);
    }

    static void writeHeaders(Row row, String[] headers, CellStyle headerStyle) {
        for (int i = 0; i < headers.length; i++) {
            setText(row, i, headers[i], headerStyle);
        }
    }

    static void autoSizeColumns(Sheet sheet, int columnCount) {
        for (int i = 0; i < columnCount; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    static String formatInstant(Instant instant) {
        return instant != null ? instant.atZone(DEFAULT_ZONE).format(DATETIME_FMT) : "";
    }

    private static XSSFCellStyle createTitleStyle(XSSFWorkbook wb) {
        XSSFCellStyle style = wb.createCellStyle();
        XSSFFont font = wb.createFont();
        font.setFontHeightInPoints((short) 15);
        font.setBold(true);
        font.setColor(new XSSFColor(new byte[]{(byte) 15, (byte) 23, (byte) 42}, null));
        style.setFont(font);
        return style;
    }

    private static XSSFCellStyle createSubTitleStyle(XSSFWorkbook wb) {
        XSSFCellStyle style = wb.createCellStyle();
        XSSFFont font = wb.createFont();
        font.setFontHeightInPoints((short) 10);
        font.setColor(new XSSFColor(new byte[]{(byte) 71, (byte) 85, (byte) 105}, null));
        style.setFont(font);
        return style;
    }

    private static XSSFCellStyle createHeaderStyle(XSSFWorkbook wb, byte[] rgbColor) {
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
        setThinBorders(style);
        return style;
    }

    private static XSSFCellStyle createRegularStyle(XSSFWorkbook wb) {
        XSSFCellStyle style = wb.createCellStyle();
        XSSFFont font = wb.createFont();
        font.setFontHeightInPoints((short) 9);
        style.setFont(font);
        setThinBorders(style);
        short grey = IndexedColors.GREY_25_PERCENT.getIndex();
        style.setBottomBorderColor(grey);
        style.setTopBorderColor(grey);
        style.setLeftBorderColor(grey);
        style.setRightBorderColor(grey);
        return style;
    }

    private static XSSFCellStyle createZebraStyle(XSSFWorkbook wb) {
        XSSFCellStyle style = createRegularStyle(wb);
        style.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 248, (byte) 250, (byte) 252}, null));
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private static XSSFCellStyle createTotalStyle(XSSFWorkbook wb) {
        XSSFCellStyle style = wb.createCellStyle();
        XSSFFont font = wb.createFont();
        font.setFontHeightInPoints((short) 10);
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 241, (byte) 245, (byte) 249}, null));
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        setThinBorders(style);
        style.setBorderBottom(BorderStyle.DOUBLE);
        return style;
    }

    private static XSSFCellStyle createCurrencyStyle(XSSFWorkbook wb, CreationHelper helper, XSSFCellStyle baseStyle) {
        XSSFCellStyle style = wb.createCellStyle();
        style.cloneStyleFrom(baseStyle);
        style.setDataFormat(helper.createDataFormat().getFormat("#,##0 \"₫\""));
        style.setAlignment(HorizontalAlignment.RIGHT);
        return style;
    }

    private static XSSFCellStyle createPercentStyle(XSSFWorkbook wb, CreationHelper helper, XSSFCellStyle baseStyle) {
        XSSFCellStyle style = wb.createCellStyle();
        style.cloneStyleFrom(baseStyle);
        style.setDataFormat(helper.createDataFormat().getFormat("0.0\"%\""));
        style.setAlignment(HorizontalAlignment.RIGHT);
        return style;
    }

    private static void setThinBorders(XSSFCellStyle style) {
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
    }
}
