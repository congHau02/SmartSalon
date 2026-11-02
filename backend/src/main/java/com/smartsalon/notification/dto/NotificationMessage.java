package com.smartsalon.notification.dto;

public record NotificationMessage(
        String recipient,
        String subject,
        String htmlContent
) {}
