package com.smartsalon.inventory.service;

import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.inventory.dto.*;
import com.smartsalon.inventory.entity.BranchInventoryEntity;
import com.smartsalon.inventory.entity.InventoryTransactionEntity;
import com.smartsalon.inventory.entity.InventoryTransactionType;
import com.smartsalon.inventory.entity.ProductEntity;
import com.smartsalon.inventory.repository.BranchInventoryRepository;
import com.smartsalon.inventory.repository.InventoryTransactionRepository;
import com.smartsalon.inventory.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final ProductRepository productRepository;
    private final BranchInventoryRepository branchInventoryRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final BranchRepository branchRepository;

    // =========================================================================
    // Master Products CRUD
    // =========================================================================

    @Transactional(readOnly = true)
    public List<ProductResponse> getProducts(String keyword, Boolean activeOnly) {
        List<ProductEntity> products;
        if (keyword != null && !keyword.isBlank()) {
            products = productRepository.findByNameContainingIgnoreCaseAndIsDeletedFalse(keyword.trim());
        } else if (Boolean.TRUE.equals(activeOnly)) {
            products = productRepository.findAllByIsDeletedFalseAndIsActiveTrue();
        } else {
            products = productRepository.findAllByIsDeletedFalse();
        }
        return products.stream().map(this::mapToProductResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        ProductEntity product = productRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        return mapToProductResponse(product);
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        if (productRepository.existsBySku(request.getSku().trim())) {
            throw new AppException(ErrorCode.PRODUCT_ALREADY_EXISTS);
        }

        ProductEntity product = ProductEntity.builder()
                .name(request.getName().trim())
                .sku(request.getSku().trim())
                .barcode(request.getBarcode())
                .unit(request.getUnit().trim())
                .volumeOrWeightPerUnit(request.getVolumeOrWeightPerUnit())
                .volumeUnit(request.getVolumeUnit().trim())
                .minStockAlertUnits(request.getMinStockAlertUnits() != null ? request.getMinStockAlertUnits() : 5)
                .costPrice(request.getCostPrice() != null ? request.getCostPrice() : BigDecimal.ZERO)
                .retailPrice(request.getRetailPrice() != null ? request.getRetailPrice() : BigDecimal.ZERO)
                .isActive(request.isActive())
                .build();

        product = productRepository.save(product);
        return mapToProductResponse(product);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        ProductEntity product = productRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        if (productRepository.existsBySkuAndIdNot(request.getSku().trim(), id)) {
            throw new AppException(ErrorCode.PRODUCT_ALREADY_EXISTS);
        }

        product.setName(request.getName().trim());
        product.setSku(request.getSku().trim());
        product.setBarcode(request.getBarcode());
        product.setUnit(request.getUnit().trim());
        product.setVolumeOrWeightPerUnit(request.getVolumeOrWeightPerUnit());
        product.setVolumeUnit(request.getVolumeUnit().trim());
        if (request.getMinStockAlertUnits() != null) {
            product.setMinStockAlertUnits(request.getMinStockAlertUnits());
        }
        if (request.getCostPrice() != null) {
            product.setCostPrice(request.getCostPrice());
        }
        if (request.getRetailPrice() != null) {
            product.setRetailPrice(request.getRetailPrice());
        }
        product.setActive(request.isActive());

        product = productRepository.save(product);
        return mapToProductResponse(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        ProductEntity product = productRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        product.setDeleted(true);
        productRepository.save(product);
    }

    // =========================================================================
    // Branch Inventory Queries & Operations
    // =========================================================================

    @Transactional(readOnly = true)
    public List<BranchInventoryResponse> getBranchInventory(Long branchId, Boolean lowStockOnly) {
        validateBranchExists(branchId);
        List<BranchInventoryEntity> inventories;
        if (Boolean.TRUE.equals(lowStockOnly)) {
            inventories = branchInventoryRepository.findLowStockByBranchId(branchId);
        } else {
            inventories = branchInventoryRepository.findAllByBranchId(branchId);
        }
        return inventories.stream().map(this::mapToBranchInventoryResponse).toList();
    }

    @Transactional(readOnly = true)
    public BranchInventoryResponse getBranchInventoryByProductId(Long branchId, Long productId) {
        validateBranchExists(branchId);
        BranchInventoryEntity inventory = branchInventoryRepository.findByBranchIdAndProductId(branchId, productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        return mapToBranchInventoryResponse(inventory);
    }

    @Transactional
    public BranchInventoryResponse stockIn(Long branchId, StockInRequest request) {
        BranchEntity branch = validateBranchExists(branchId);
        ProductEntity product = productRepository.findByIdAndIsDeletedFalse(request.getProductId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        if (request.getUnitCost() != null && request.getUnitCost().compareTo(BigDecimal.ZERO) >= 0) {
            product.setCostPrice(request.getUnitCost());
            productRepository.save(product);
        }

        BranchInventoryEntity inventory = branchInventoryRepository.findByBranchIdAndProductIdForUpdate(branchId, request.getProductId())
                .orElseGet(() -> BranchInventoryEntity.builder()
                        .branch(branch)
                        .product(product)
                        .stockUnits(0)
                        .currentVolume(BigDecimal.ZERO)
                        .minStockAlertUnits(product.getMinStockAlertUnits())
                        .build());

        int incomingUnits = request.getQuantityUnits();
        inventory.setStockUnits(inventory.getStockUnits() + incomingUnits);
        inventory = branchInventoryRepository.save(inventory);

        BigDecimal incomingVolume = BigDecimal.valueOf(incomingUnits).multiply(product.getVolumeOrWeightPerUnit());
        BigDecimal totalAvailableVolume = inventory.calculateTotalAvailableVolume();

        recordTransaction(
                product,
                branch,
                InventoryTransactionType.STOCK_IN,
                incomingUnits,
                incomingVolume,
                product.getVolumeUnit(),
                totalAvailableVolume,
                null,
                request.getNotes() != null && !request.getNotes().isBlank()
                        ? request.getNotes()
                        : "Nhập kho " + incomingUnits + " " + product.getUnit()
        );

        return mapToBranchInventoryResponse(inventory);
    }

    @Transactional
    public BranchInventoryResponse stockAdjustment(Long branchId, StockAdjustmentRequest request) {
        BranchEntity branch = validateBranchExists(branchId);
        ProductEntity product = productRepository.findByIdAndIsDeletedFalse(request.getProductId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        BranchInventoryEntity inventory = branchInventoryRepository.findByBranchIdAndProductIdForUpdate(branchId, request.getProductId())
                .orElseGet(() -> BranchInventoryEntity.builder()
                        .branch(branch)
                        .product(product)
                        .stockUnits(0)
                        .currentVolume(BigDecimal.ZERO)
                        .minStockAlertUnits(product.getMinStockAlertUnits())
                        .build());

        int deltaUnits = request.getActualStockUnits() != null
                ? request.getActualStockUnits() - inventory.getStockUnits()
                : 0;

        BigDecimal deltaVolume = request.getActualVolume() != null
                ? request.getActualVolume().subtract(inventory.getCurrentVolume())
                : BigDecimal.ZERO;

        if (request.getActualStockUnits() != null) {
            inventory.setStockUnits(request.getActualStockUnits());
        }
        if (request.getActualVolume() != null) {
            inventory.setCurrentVolume(request.getActualVolume());
        }

        inventory = branchInventoryRepository.save(inventory);

        BigDecimal totalAvailableVolume = inventory.calculateTotalAvailableVolume();

        recordTransaction(
                product,
                branch,
                InventoryTransactionType.STOCK_ADJUSTMENT,
                deltaUnits,
                deltaVolume,
                product.getVolumeUnit(),
                totalAvailableVolume,
                null,
                request.getReason()
        );

        return mapToBranchInventoryResponse(inventory);
    }

    @Transactional
    public BranchInventoryResponse deductConsumables(Long branchId, Long productId, BigDecimal volumeAmount, Long referenceOrderId) {
        if (volumeAmount == null || volumeAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        BranchEntity branch = validateBranchExists(branchId);
        ProductEntity product = productRepository.findByIdAndIsDeletedFalse(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        BranchInventoryEntity inventory = branchInventoryRepository.findByBranchIdAndProductIdForUpdate(branchId, productId)
                .orElseThrow(() -> new AppException(ErrorCode.INSUFFICIENT_STOCK));

        BigDecimal openedVolume = inventory.getCurrentVolume();
        BigDecimal unitVolume = product.getVolumeOrWeightPerUnit();

        if (openedVolume.compareTo(volumeAmount) >= 0) {
            // Trường hợp 1: Thể tích dở dang đã đủ dùng
            BigDecimal remainingVolume = openedVolume.subtract(volumeAmount);
            inventory.setCurrentVolume(remainingVolume);
            inventory = branchInventoryRepository.save(inventory);

            BigDecimal totalAvailable = inventory.calculateTotalAvailableVolume();

            recordTransaction(
                    product,
                    branch,
                    InventoryTransactionType.SERVICE_CONSUMPTION,
                    0,
                    volumeAmount.negate(),
                    product.getVolumeUnit(),
                    totalAvailable,
                    referenceOrderId,
                    "Tiêu hao định lượng kỹ thuật dịch vụ"
            );
        } else {
            // Trường hợp 2: Thể tích dở dang không đủ, kích hoạt Auto-Unseal
            if (!product.hasMeasurableVolume()) {
                throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
            }

            BigDecimal deficit = volumeAmount.subtract(openedVolume);
            BigDecimal[] divAndRem = deficit.divideAndRemainder(unitVolume);
            int unitsToUnseal = divAndRem[0].intValue();
            if (divAndRem[1].compareTo(BigDecimal.ZERO) > 0) {
                unitsToUnseal += 1;
            }

            if (inventory.getStockUnits() < unitsToUnseal) {
                throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
            }

            // Thực hiện khui nắp nguyên seal
            inventory.setStockUnits(inventory.getStockUnits() - unitsToUnseal);
            BigDecimal unsealedAddedVolume = BigDecimal.valueOf(unitsToUnseal).multiply(unitVolume);
            BigDecimal totalAvailableBeforeConsume = openedVolume.add(unsealedAddedVolume);
            BigDecimal remainingVolume = totalAvailableBeforeConsume.subtract(volumeAmount);
            inventory.setCurrentVolume(remainingVolume);
            inventory = branchInventoryRepository.save(inventory);

            BigDecimal totalAvailableAfterConsume = inventory.calculateTotalAvailableVolume();

            // Audit transaction: Auto-Unseal
            recordTransaction(
                    product,
                    branch,
                    InventoryTransactionType.AUTO_UNSEAL,
                    -unitsToUnseal,
                    unsealedAddedVolume,
                    product.getVolumeUnit(),
                    totalAvailableBeforeConsume.add(BigDecimal.valueOf(inventory.getStockUnits()).multiply(unitVolume)),
                    referenceOrderId,
                    "Tự động khui " + unitsToUnseal + " " + product.getUnit() + " chuyển đổi định lượng sang " + product.getVolumeUnit()
            );

            // Audit transaction: Service Consumption
            recordTransaction(
                    product,
                    branch,
                    InventoryTransactionType.SERVICE_CONSUMPTION,
                    0,
                    volumeAmount.negate(),
                    product.getVolumeUnit(),
                    totalAvailableAfterConsume,
                    referenceOrderId,
                    "Tiêu hao định lượng kỹ thuật dịch vụ"
            );
        }

        return mapToBranchInventoryResponse(inventory);
    }

    @Transactional
    public BranchInventoryResponse deductRetailProduct(Long branchId, Long productId, int quantityUnits, Long referenceOrderId) {
        if (quantityUnits <= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        BranchEntity branch = validateBranchExists(branchId);
        ProductEntity product = productRepository.findByIdAndIsDeletedFalse(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        BranchInventoryEntity inventory = branchInventoryRepository.findByBranchIdAndProductIdForUpdate(branchId, productId)
                .orElseThrow(() -> new AppException(ErrorCode.INSUFFICIENT_STOCK));

        if (inventory.getStockUnits() < quantityUnits) {
            throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
        }

        inventory.setStockUnits(inventory.getStockUnits() - quantityUnits);
        inventory = branchInventoryRepository.save(inventory);

        BigDecimal totalAvailable = inventory.calculateTotalAvailableVolume();

        recordTransaction(
                product,
                branch,
                InventoryTransactionType.RETAIL_SALE,
                -quantityUnits,
                BigDecimal.ZERO,
                product.getUnit(),
                totalAvailable,
                referenceOrderId,
                "Xuất kho bán lẻ sản phẩm tại POS (Đơn hàng #" + referenceOrderId + ")"
        );

        return mapToBranchInventoryResponse(inventory);
    }

    @Transactional(readOnly = true)
    public List<InventoryTransactionResponse> getInventoryTransactions(Long branchId, Long productId) {
        validateBranchExists(branchId);
        List<InventoryTransactionEntity> transactions;
        if (productId != null) {
            transactions = inventoryTransactionRepository.findAllByBranchIdAndProductIdOrderByCreatedAtDesc(branchId, productId);
        } else {
            transactions = inventoryTransactionRepository.findAllByBranchIdOrderByCreatedAtDesc(branchId);
        }
        return transactions.stream().map(this::mapToTransactionResponse).toList();
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    private BranchEntity validateBranchExists(Long branchId) {
        return branchRepository.findByIdAndIsDeletedFalse(branchId)
                .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));
    }

    private void recordTransaction(
            ProductEntity product,
            BranchEntity branch,
            InventoryTransactionType type,
            int quantityUnits,
            BigDecimal volumeAmount,
            String unit,
            BigDecimal balanceAfterVolume,
            Long referenceOrderId,
            String notes
    ) {
        BigDecimal unitCostSnapshot = BigDecimal.ZERO;
        BigDecimal totalCostAmount = BigDecimal.ZERO;
        BigDecimal safeVolAmount = volumeAmount != null ? volumeAmount : BigDecimal.ZERO;

        if (type == InventoryTransactionType.SERVICE_CONSUMPTION || type == InventoryTransactionType.AUTO_UNSEAL) {
            unitCostSnapshot = product.calculateVolumeUnitCostSnapshot();
            totalCostAmount = product.calculateVolumeCostAmount(safeVolAmount);
        } else if (type == InventoryTransactionType.RETAIL_SALE || type == InventoryTransactionType.STOCK_IN) {
            unitCostSnapshot = product.calculateRetailUnitCostSnapshot();
            totalCostAmount = product.calculateRetailCostAmount(quantityUnits);
        } else if (type == InventoryTransactionType.STOCK_ADJUSTMENT) {
            if (quantityUnits != 0 && safeVolAmount.compareTo(BigDecimal.ZERO) == 0) {
                unitCostSnapshot = product.calculateRetailUnitCostSnapshot();
                totalCostAmount = product.calculateRetailCostAmount(quantityUnits);
            } else if (safeVolAmount.compareTo(BigDecimal.ZERO) != 0 && quantityUnits == 0) {
                unitCostSnapshot = product.calculateVolumeUnitCostSnapshot();
                totalCostAmount = product.calculateVolumeCostAmount(safeVolAmount);
            } else {
                unitCostSnapshot = product.hasMeasurableVolume()
                        ? product.calculateVolumeUnitCostSnapshot()
                        : product.calculateRetailUnitCostSnapshot();
                BigDecimal unitCost = product.calculateRetailCostAmount(quantityUnits);
                BigDecimal volCost = product.calculateVolumeCostAmount(safeVolAmount);
                totalCostAmount = unitCost.add(volCost).setScale(2, RoundingMode.HALF_UP);
            }
        }

        InventoryTransactionEntity tx = InventoryTransactionEntity.builder()
                .product(product)
                .branch(branch)
                .transactionType(type)
                .quantityUnits(quantityUnits)
                .volumeAmount(safeVolAmount)
                .unit(unit)
                .balanceAfterVolume(balanceAfterVolume)
                .referenceOrderId(referenceOrderId)
                .notes(notes)
                .unitCostSnapshot(unitCostSnapshot)
                .totalCostAmount(totalCostAmount)
                .build();
        inventoryTransactionRepository.save(tx);
    }

    private ProductResponse mapToProductResponse(ProductEntity product) {
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

    private BranchInventoryResponse mapToBranchInventoryResponse(BranchInventoryEntity bi) {
        ProductEntity p = bi.getProduct();
        BigDecimal totalVolume = bi.calculateTotalAvailableVolume();

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
                .totalAvailableVolume(totalVolume)
                .minStockAlertUnits(bi.getMinStockAlertUnits())
                .isLowStock(bi.isLowStock())
                .createdAt(bi.getCreatedAt())
                .updatedAt(bi.getUpdatedAt())
                .build();
    }

    private InventoryTransactionResponse mapToTransactionResponse(InventoryTransactionEntity tx) {
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
