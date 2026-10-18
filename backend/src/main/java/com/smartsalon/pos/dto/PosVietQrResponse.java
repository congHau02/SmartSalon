package com.smartsalon.pos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PosVietQrResponse {
    private Long orderId;
    private String orderCode;
    private BigDecimal finalAmount;
    private String bankId;
    private String accountNo;
    private String accountName;
    private String qrCodeUrl;
    private String description;
}
