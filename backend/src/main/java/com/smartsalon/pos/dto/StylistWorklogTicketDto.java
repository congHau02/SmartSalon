package com.smartsalon.pos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StylistWorklogTicketDto {
    private Long orderId;
    private String orderCode;
    private String bookingCode;
    private String customerName;
    private String customerPhone;
    @Builder.Default
    private List<String> serviceNames = new ArrayList<>();
    @Builder.Default
    private List<String> stepNames = new ArrayList<>();
    private BigDecimal orderFinalAmount;
    private String paymentMethod;
    private boolean settledByMe;
    private BigDecimal earnedCommission;
    private Instant completedAt;
}
