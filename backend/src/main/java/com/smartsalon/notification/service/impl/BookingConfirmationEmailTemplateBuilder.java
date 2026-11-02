package com.smartsalon.notification.service.impl;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingServiceItemEntity;
import com.smartsalon.notification.dto.NotificationMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Component
public class BookingConfirmationEmailTemplateBuilder {

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public NotificationMessage buildConfirmationMessage(BookingEntity booking, String recipientEmail) {
        String bookingCode = booking.getBookingCode();
        String subject = String.format("[SmartSalon] Xác nhận đặt lịch hẹn thành công - %s", bookingCode);
        String headerSubtitle = "Xác Nhận Đặt Lịch Hẹn Thành Công";
        String introMessage = "Cảm ơn bạn đã lựa chọn dịch vụ của SmartSalon. Lịch hẹn của bạn đã được xác nhận với thông tin chi tiết dưới đây:";
        return buildMessage(booking, recipientEmail, subject, headerSubtitle, introMessage);
    }

    public NotificationMessage buildReminderMessage(BookingEntity booking, String recipientEmail) {
        String bookingCode = booking.getBookingCode();
        String subject = String.format("[SmartSalon] Nhắc lịch hẹn ngày mai - %s", bookingCode);
        String headerSubtitle = "Nhắc Nhở Lịch Hẹn Ngày Mai (24h)";
        String introMessage = "SmartSalon xin nhắc bạn về lịch hẹn làm đẹp vào ngày mai. Quý khách vui lòng lưu ý thông tin chi tiết lịch hẹn dưới đây:";
        return buildMessage(booking, recipientEmail, subject, headerSubtitle, introMessage);
    }

    public NotificationMessage buildRescheduledMessage(BookingEntity booking, String recipientEmail) {
        String bookingCode = booking.getBookingCode();
        String subject = String.format("[SmartSalon] Cập nhật lịch hẹn thành công (Dời lịch) - %s", bookingCode);
        String headerSubtitle = "Xác Nhận Dời Lịch Hẹn Thành Công";
        String introMessage = "Lịch hẹn làm đẹp của bạn tại SmartSalon đã được chuyển sang thời gian mới thành công. Thông tin chi tiết cập nhật dưới đây:";
        return buildMessage(booking, recipientEmail, subject, headerSubtitle, introMessage);
    }

    private NotificationMessage buildMessage(BookingEntity booking, String recipientEmail, String subject,
                                            String headerSubtitle, String introMessage) {
        String bookingCode = booking.getBookingCode();
        String customerName = booking.resolvedCustomerName();
        String branchName = booking.getBranch() != null ? booking.getBranch().getName() : "SmartSalon";
        String branchAddress = booking.getBranch() != null && booking.getBranch().getAddress() != null
                ? booking.getBranch().getAddress() : "";
        String branchPhone = booking.getBranch() != null && booking.getBranch().getPhone() != null
                ? booking.getBranch().getPhone() : "";

        String timeRange = String.format("%s - %s",
                booking.getBookingTime().format(TIME_FORMATTER),
                booking.getEndTime().format(TIME_FORMATTER));
        String dateFormatted = booking.getBookingTime().format(DATE_FORMATTER);

        String stylistName = booking.getStaff() != null && booking.getStaff().getFullName() != null
                ? booking.getStaff().getFullName()
                : "SmartSalon điều phối chuyên viên";

        String servicesRows = renderServiceRows(booking);
        String totalPriceFormatted = formatCurrency(booking.getTotalPrice());
        String depositFormatted = formatCurrency(booking.getDepositAmount());
        String lookupUrl = String.format("%s/customer/booking?code=%s&step=4", frontendUrl, bookingCode);

        String html = HTML_TEMPLATE.formatted(
                escapeHtml(headerSubtitle), escapeHtml(customerName), escapeHtml(introMessage),
                escapeHtml(bookingCode), escapeHtml(branchName), escapeHtml(branchAddress),
                escapeHtml(branchPhone), timeRange, dateFormatted, escapeHtml(stylistName),
                servicesRows, totalPriceFormatted, depositFormatted, lookupUrl
        );

        return new NotificationMessage(recipientEmail, subject, html);
    }

    private String renderServiceRows(BookingEntity booking) {
        if (booking.getItems() == null || booking.getItems().isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (BookingServiceItemEntity item : booking.getItems()) {
            String svcName = item.getService() != null ? item.getService().getName() : "Dịch vụ làm đẹp";
            sb.append(String.format(
                    "<tr><td style=\"padding: 8px 0; color: #334155; border-bottom: 1px solid #f1f5f9;\">%s</td>" +
                    "<td style=\"padding: 8px 0; color: #64748b; text-align: center; border-bottom: 1px solid #f1f5f9;\">%d phút</td>" +
                    "<td style=\"padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;\">%s</td></tr>",
                    escapeHtml(svcName), item.getDurationMinutes(), formatCurrency(item.getPrice())
            ));
        }
        return sb.toString();
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "0 đ";
        return String.format(Locale.GERMAN, "%,d đ", amount.longValue());
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private static final String HTML_TEMPLATE = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Xác nhận đặt lịch hẹn</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                    <div style="background: linear-gradient(135deg, #be185d 0%%, #9d174d 100%%); padding: 28px 24px; text-align: center; color: #ffffff;">
                        <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">SmartSalon</h1>
                        <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9;">%s</p>
                    </div>
                    <div style="padding: 24px;">
                        <p style="margin: 0 0 16px; font-size: 15px; color: #334155;">Xin chào <strong>%s</strong>,</p>
                        <p style="margin: 0 0 20px; font-size: 14px; color: #64748b; line-height: 1.5;">
                            %s
                        </p>
                        
                        <div style="background-color: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center;">
                            <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #9d174d; letter-spacing: 0.5px;">Mã đặt hẹn</div>
                            <div style="font-size: 24px; font-weight: 800; color: #831843; letter-spacing: 1px; margin-top: 4px;">%s</div>
                        </div>

                        <table style="width: 100%%; font-size: 14px; border-collapse: collapse; margin-bottom: 20px;">
                            <tr>
                                <td style="padding: 6px 0; color: #64748b; width: 140px;">Chi nhánh:</td>
                                <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #64748b;">Địa chỉ:</td>
                                <td style="padding: 6px 0; color: #334155;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #64748b;">Hotline chi nhánh:</td>
                                <td style="padding: 6px 0; color: #334155;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #64748b;">Thời gian:</td>
                                <td style="padding: 6px 0; color: #be185d; font-weight: 700;">%s ngày %s</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #64748b;">Chuyên viên:</td>
                                <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">%s</td>
                            </tr>
                        </table>

                        <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin: 16px 0 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">Dịch vụ đã chọn</h3>
                        <table style="width: 100%%; font-size: 13px; border-collapse: collapse; margin-bottom: 16px;">
                            <thead>
                                <tr style="color: #94a3b8; text-align: left; border-bottom: 1px solid #e2e8f0;">
                                    <th style="padding-bottom: 6px; font-weight: 600;">Dịch vụ</th>
                                    <th style="padding-bottom: 6px; font-weight: 600; text-align: center;">Thời lượng</th>
                                    <th style="padding-bottom: 6px; font-weight: 600; text-align: right;">Đơn giá</th>
                                </tr>
                            </thead>
                            <tbody>
                                %s
                            </tbody>
                        </table>

                        <div style="background-color: #f8fafc; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 14px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                <span style="color: #64748b;">Tổng giá trị dịch vụ:</span>
                                <span style="font-weight: 600; color: #0f172a;">%s</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                <span style="color: #64748b;">Khoản cọc giữ chỗ:</span>
                                <span style="font-weight: 700; color: #059669;">%s (ĐÃ THANH TOÁN)</span>
                            </div>
                        </div>

                        <div style="text-align: center; margin: 24px 0 16px;">
                            <a href="%s" style="display: inline-block; background-color: #be185d; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 10px;">Tra Cứu Lịch Hẹn Trực Tuyến</a>
                        </div>

                        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 20px 0 0; line-height: 1.5;">
                            Quý khách vui lòng đến trước 10 phút để được phục vụ tốt nhất.<br>
                            Cần hỗ trợ hoặc thay đổi lịch hẹn, vui lòng liên hệ hotline chi nhánh.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """;
}
