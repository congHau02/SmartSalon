package com.smartsalon.pos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchBoardBookingDto {
    private Long id;
    private String bookingCode;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private Long staffId;
    private String staffName;
    private LocalDateTime bookingTime;
    private LocalDateTime endTime;
    private int totalDurationMinutes;
    private BigDecimal totalPrice;
    private BigDecimal depositAmount;
    private String depositStatus;
    private String status;
    private Long linkedOrderId;
    @Builder.Default
    private List<String> serviceNames = new ArrayList<>();
}
