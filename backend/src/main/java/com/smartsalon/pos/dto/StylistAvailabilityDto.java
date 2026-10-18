package com.smartsalon.pos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StylistAvailabilityDto {
    private Long stylistId;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private boolean isBusy;
    private String currentOrderCode;
    private String currentCustomerName;
    private String currentStepName;
}
