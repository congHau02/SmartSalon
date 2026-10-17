package com.smartsalon.payment.dto;

public record PayOSWebhookPayload(
        String code,
        String desc,
        PayOSWebhookData data,
        String signature
) {
    public record PayOSWebhookData(
            Long orderCode,
            Long amount,
            String description,
            String accountNumber,
            String reference,
            String transactionDateTime,
            String currency,
            String paymentLinkId,
            String code,
            String desc
    ) {}
}
