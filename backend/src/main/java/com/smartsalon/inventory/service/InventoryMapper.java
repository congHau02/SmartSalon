package com.smartsalon.inventory.service;

import com.smartsalon.inventory.dto.BranchInventoryResponse;
import com.smartsalon.inventory.dto.InventoryTransactionResponse;
import com.smartsalon.inventory.dto.ProductResponse;
import com.smartsalon.inventory.entity.BranchInventoryEntity;
import com.smartsalon.inventory.entity.InventoryTransactionEntity;
import com.smartsalon.inventory.entity.ProductEntity;

public final class InventoryMapper {

    private InventoryMapper() {}

    public static ProductResponse toProductResponse(ProductEntity product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .sku(product.getSku())
                .barcode(product.getBarcode())
                .unit(product.getUnit())
                .volumeOrWeightPerUnit(product.getVolumeOrWeightPerUnit())
                .volumeUnit(product.getVolumeUnit())
                .minStockAlertUnits(product.getMinStockAlertUnits())
                .costPrice(product.getCostPrice())
                .retailPrice(product.getRetailPrice())
                .isActive(product.isActive())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    public static BranchInventoryResponse toBranchInventoryResponse(BranchInventoryEntity bi) {
        ProductEntity p = bi.getProduct();
        return BranchInventoryResponse.builder()
                .id(bi.getId())
                .branchId(bi.getBranch().getId())
                .branchName(bi.getBranch().getName())
                .productId(p.getId())
                .productName(p.getName())
                .productSku(p.getSku())
                .barcode(p.getBarcode())
                .packagingUnit(p.getUnit())
                .volumeOrWeightPerUnit(p.getVolumeOrWeightPerUnit())
                .volumeUnit(p.getVolumeUnit())
                .stockUnits(bi.getStockUnits())
                .currentVolume(bi.getCurrentVolume())
                .totalAvailableVolume(bi.calculateTotalAvailableVolume())
                .minStockAlertUnits(bi.getMinStockAlertUnits())
                .isLowStock(bi.isLowStock())
                .createdAt(bi.getCreatedAt())
                .updatedAt(bi.getUpdatedAt())
                .build();
    }

    public static InventoryTransactionResponse toTransactionResponse(InventoryTransactionEntity tx) {
        return InventoryTransactionResponse.builder()
                .id(tx.getId())
                .productId(tx.getProduct().getId())
                .productName(tx.getProduct().getName())
                .productSku(tx.getProduct().getSku())
                .branchId(tx.getBranch().getId())
                .branchName(tx.getBranch().getName())
                .transactionType(tx.getTransactionType().name())
                .quantityUnits(tx.getQuantityUnits())
                .volumeAmount(tx.getVolumeAmount())
                .unit(tx.getUnit())
                .balanceAfterVolume(tx.getBalanceAfterVolume())
                .referenceOrderId(tx.getReferenceOrderId())
                .unitCostSnapshot(tx.getUnitCostSnapshot())
                .totalCostAmount(tx.getTotalCostAmount())
                .notes(tx.getNotes())
                .createdAt(tx.getCreatedAt())
                .createdBy(tx.getCreatedBy())
                .build();
    }
}
