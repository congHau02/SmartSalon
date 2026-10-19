package com.smartsalon.payment;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public final class VietQrUrlBuilder {

    private VietQrUrlBuilder() {
    }

    public static String buildCompactQrUrl(
            String bankId,
            String accountNo,
            String accountName,
            BigDecimal amount,
            String description
    ) {
        long safeAmount = amount != null ? Math.max(0L, amount.longValue()) : 0L;
        String safeDesc = description != null ? URLEncoder.encode(description, StandardCharsets.UTF_8) : "";
        String safeAccountName = accountName != null ? URLEncoder.encode(accountName, StandardCharsets.UTF_8) : "";
        return String.format(
                "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%d&addInfo=%s&accountName=%s",
                bankId,
                accountNo,
                safeAmount,
                safeDesc,
                safeAccountName
        );
    }
}
