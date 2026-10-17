package com.smartsalon.inventory.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String sku;
    private String barcode;
    private String unit;
    private BigDecimal volumeOrWeightPerUnit;
    private String volumeUnit;
    private Integer minStockAlertUnits;
    private BigDecimal costPrice;
    private BigDecimal retailPrice;
    @JsonProperty("isActive")
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
}
