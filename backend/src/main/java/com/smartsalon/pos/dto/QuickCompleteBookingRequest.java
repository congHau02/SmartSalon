package com.smartsalon.pos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuickCompleteBookingRequest {

    @Builder.Default
    private String paymentMethod = "CASH";

    @Builder.Default
    private List<Long> serviceIds = new ArrayList<>();

    private BigDecimal discountAmount;

    private String notes;
}
