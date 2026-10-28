package com.smartsalon.pos.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

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
    private String shiftCode;
    private String shiftName;
    @JsonFormat(pattern = "HH:mm")
    private LocalTime shiftStartTime;
    @JsonFormat(pattern = "HH:mm")
    private LocalTime shiftEndTime;
    private Boolean isWorking;
}
