package com.smartsalon.inventory.dto;

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
public class InventoryTransactionResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String productSku;
    private Long branchId;
    private String branchName;
    private String transactionType;
    private Integer quantityUnits;
    private BigDecimal volumeAmount;
    private String unit;
    private BigDecimal balanceAfterVolume;
    private Long referenceOrderId;
    private BigDecimal unitCostSnapshot;
    private BigDecimal totalCostAmount;
    private String notes;
    private Instant createdAt;
    private String createdBy;
}
