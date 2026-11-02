package com.smartsalon.notification.service.impl;

import com.smartsalon.notification.dto.NotificationMessage;
import com.smartsalon.notification.service.NotificationSender;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

// shortcut: email is the only channel, add SMS/Zalo behind the same seam when a paid provider is chosen
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailNotificationSender implements NotificationSender {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@smartsalon.vn}")
    private String fromAddress;

    @Override
    public void send(NotificationMessage message) {
        if (message == null || message.recipient() == null || message.recipient().isBlank()) {
            log.warn("Cannot send email: empty recipient or null message");
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(message.recipient().trim());
            helper.setSubject(message.subject() != null ? message.subject() : "Thông báo từ SmartSalon");
            helper.setText(message.htmlContent() != null ? message.htmlContent() : "", true);

            mailSender.send(mimeMessage);
            log.info("Email sent successfully to {}", message.recipient());
        } catch (Exception ex) {
            log.error("Failed to send email to {}: {}", message.recipient(), ex.getMessage(), ex);
            // Email errors are caught and logged; must never fail the calling transaction
        }
    }
}
