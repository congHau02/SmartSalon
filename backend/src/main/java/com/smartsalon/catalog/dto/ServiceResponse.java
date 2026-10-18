package com.smartsalon.catalog.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceResponse {
    private Long id;
    private String name;
    private String description;
    private String category;
    private BigDecimal basePrice;
    private BigDecimal commissionPoolRate;
    private Integer durationMinutes;
    @JsonProperty("isActive")
    private Boolean isActive;
    private List<ServiceBomDto> bomList;
    private List<ServiceDefaultStepDto> defaultSteps;
    private Instant createdAt;
    private Instant updatedAt;
}
