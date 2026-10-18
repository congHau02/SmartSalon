package com.smartsalon.pos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchBoardResponse {
    private Long branchId;
    private String branchName;
    private String date;

    @Builder.Default
    private List<DispatchBoardBookingDto> upcomingBookings = new ArrayList<>();

    @Builder.Default
    private List<PosOrderResponse> checkedInOrders = new ArrayList<>();

    @Builder.Default
    private List<PosOrderResponse> inProgressOrders = new ArrayList<>();

    @Builder.Default
    private List<PosOrderResponse> readyOrPaidOrders = new ArrayList<>();

    @Builder.Default
    private List<StylistAvailabilityDto> stylists = new ArrayList<>();
}
