package com.smartsalon.pos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StylistDailyWorklogResponse {
    private Long stylistId;
    private String stylistName;
    private Long branchId;
    private String branchName;
    private LocalDate date;

    // Production Metrics
    private int totalTicketCount;
    private int totalCompletedStepCount;
    @Builder.Default
    private BigDecimal totalServiceRevenue = BigDecimal.ZERO;
    @Builder.Default
    private BigDecimal totalEarnedCommission = BigDecimal.ZERO;

    // Shift Handover Cash/Transfer Metrics (orders where settled_by_user_id == stylistId)
    private int selfSettledOrderCount;
    @Builder.Default
    private BigDecimal cashCollectedToHandover = BigDecimal.ZERO;
    @Builder.Default
    private BigDecimal transferCollectedAmount = BigDecimal.ZERO;
    @Builder.Default
    private BigDecimal totalSelfCollectedAmount = BigDecimal.ZERO;

    // Itemized tickets and upcoming bookings
    @Builder.Default
    private List<StylistWorklogTicketDto> tickets = new ArrayList<>();
    @Builder.Default
    private List<DispatchBoardBookingDto> upcomingBookings = new ArrayList<>();
}
