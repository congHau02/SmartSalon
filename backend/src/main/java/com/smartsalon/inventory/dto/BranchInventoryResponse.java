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
public class BranchInventoryResponse {
    private Long id;
    private Long branchId;
    private String branchName;
    private Long productId;
    private String productName;
    private String productSku;
    private String barcode;
    private String packagingUnit;
    private BigDecimal volumeOrWeightPerUnit;
    private String volumeUnit;
    private Integer stockUnits;
    private BigDecimal currentVolume;
    private BigDecimal totalAvailableVolume;
    private Integer minStockAlertUnits;
    @JsonProperty("isLowStock")
    private Boolean isLowStock;
    private Instant createdAt;
    private Instant updatedAt;
}
