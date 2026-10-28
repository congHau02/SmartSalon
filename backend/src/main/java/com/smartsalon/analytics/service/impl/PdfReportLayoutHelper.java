package com.smartsalon.analytics.service.impl;

import com.lowagie.text.*;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import lombok.extern.slf4j.Slf4j;

import java.awt.Color;
import java.io.IOException;
import java.io.InputStream;
import java.text.DecimalFormat;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Slf4j
final class PdfReportLayoutHelper {

    static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private static final ThreadLocal<DecimalFormat> CURRENCY_FMT =
            ThreadLocal.withInitial(() -> new DecimalFormat("#,##0 ₫"));

    private static final byte[] CACHED_ROBOTO_REGULAR_BYTES = readClasspathFontQuietly("/fonts/Roboto-Regular.ttf");
    private static final byte[] CACHED_ROBOTO_BOLD_BYTES = readClasspathFontQuietly("/fonts/Roboto-Bold.ttf");

    private PdfReportLayoutHelper() {
    }

    static String formatCurrency(Object number) {
        return CURRENCY_FMT.get().format(number != null ? number : 0);
    }

    static ReportExportServiceImpl.FontHolder loadVietnameseFonts() throws IOException {
        return buildFontHolder(CACHED_ROBOTO_REGULAR_BYTES, CACHED_ROBOTO_BOLD_BYTES);
    }

    static ReportExportServiceImpl.FontHolder buildFontHolder(byte[] regularBytes, byte[] boldBytes) throws IOException {
        BaseFont regularBase = null;
        BaseFont boldBase = null;

        if (regularBytes != null && regularBytes.length > 0 && boldBytes != null && boldBytes.length > 0) {
            try {
                regularBase = BaseFont.createFont("Roboto-Regular.ttf", BaseFont.IDENTITY_H, true, true, regularBytes, null);
                boldBase = BaseFont.createFont("Roboto-Bold.ttf", BaseFont.IDENTITY_H, true, true, boldBytes, null);
            } catch (Exception e) {
                log.warn("Failed to create Roboto TrueType fonts from cached bytes, falling back to Helvetica: {}", e.getMessage());
            }
        }

        if (regularBase == null || boldBase == null) {
            regularBase = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
            boldBase = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
        }

        return new ReportExportServiceImpl.FontHolder(
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

    static void addDocumentHeader(Document doc, ReportExportServiceImpl.FontHolder fonts, String title, String branchName, String periodStr) throws DocumentException {
        Paragraph brand = new Paragraph("HỆ THỐNG SALON TÓC CAO CẤP SMARTSALON", fonts.brandFont());
        brand.setAlignment(Element.ALIGN_CENTER);
        doc.add(brand);

        Paragraph docTitle = new Paragraph(title, fonts.titleFont());
        docTitle.setAlignment(Element.ALIGN_CENTER);
        docTitle.setSpacingBefore(3f);
        docTitle.setSpacingAfter(3f);
        docTitle.getFont().setColor(new Color(219, 39, 119));
        doc.add(docTitle);

        Paragraph branchPara = new Paragraph("Chi nhánh: " + branchName, fonts.subTitleFont());
        branchPara.setAlignment(Element.ALIGN_CENTER);
        doc.add(branchPara);

        Paragraph periodPara = new Paragraph(periodStr + " | Xuất ngày: " + Instant.now().atZone(DEFAULT_ZONE).format(DATETIME_FMT), fonts.subTitleFont());
        periodPara.setAlignment(Element.ALIGN_CENTER);
        periodPara.setSpacingAfter(10f);
        doc.add(periodPara);
    }

    static void addSectionHeading(Document doc, ReportExportServiceImpl.FontHolder fonts, String text, float spacingBefore) throws DocumentException {
        Paragraph heading = new Paragraph(text, fonts.sectionFont());
        heading.setSpacingBefore(spacingBefore);
        heading.setSpacingAfter(6f);
        doc.add(heading);
    }

    static void addKpiCell(PdfPTable table, ReportExportServiceImpl.FontHolder fonts, String label, String value, String desc, Color bgColor, Color valColor) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(bgColor);
        cell.setPadding(8f);
        cell.setBorderColor(new Color(226, 232, 240));
        cell.setBorderWidth(1f);

        Paragraph pLabel = new Paragraph(label, fonts.cardTitleFont());
        Paragraph pValue = new Paragraph(value, fonts.cardValueFont());
        pValue.getFont().setColor(valColor);
        pValue.setSpacingBefore(2f);
        pValue.setSpacingAfter(2f);

        cell.addElement(pLabel);
        cell.addElement(pValue);
        cell.addElement(new Paragraph(desc, fonts.cardDescFont()));
        table.addCell(cell);
    }

    static void addTableHeaders(PdfPTable table, String[] headers, Font headerFont, Color bgColor) {
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
            cell.setBackgroundColor(bgColor);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setPadding(5f);
            table.addCell(cell);
        }
    }

    static void addTableCell(PdfPTable table, String text, Font font, int alignment, Color bgColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", font));
        cell.setBackgroundColor(bgColor);
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(5f);
        cell.setBorderColor(new Color(226, 232, 240));
        cell.setBorderWidth(0.5f);
        table.addCell(cell);
    }

    static void addAccountingSignatures(Document doc, ReportExportServiceImpl.FontHolder fonts) throws DocumentException {
        Paragraph space = new Paragraph(" ", fonts.subTitleFont());
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

    private static void addSignatureCell(PdfPTable table, ReportExportServiceImpl.FontHolder fonts, String title, String subtitle) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);

        Paragraph pTitle = new Paragraph(title, fonts.signatureTitleFont());
        pTitle.setAlignment(Element.ALIGN_CENTER);
        Paragraph pSub = new Paragraph(subtitle, fonts.signatureDescFont());
        pSub.setAlignment(Element.ALIGN_CENTER);
        pSub.setSpacingAfter(45f);

        cell.addElement(pTitle);
        cell.addElement(pSub);
        table.addCell(cell);
    }

    private static byte[] readClasspathFontQuietly(String path) {
        try (InputStream is = ReportExportServiceImpl.class.getResourceAsStream(path)) {
            return is != null ? is.readAllBytes() : null;
        } catch (Exception e) {
            return null;
        }
    }
}
