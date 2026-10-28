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
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final ProductRepository productRepository;
    private final BranchInventoryRepository branchInventoryRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final BranchRepository branchRepository;

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
        return products.stream().map(InventoryMapper::toProductResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        ProductEntity product = findProductOrThrow(id);
        return InventoryMapper.toProductResponse(product);
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
        return InventoryMapper.toProductResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        ProductEntity product = findProductOrThrow(id);
        if (productRepository.existsBySkuAndIdNot(request.getSku().trim(), id)) {
            throw new AppException(ErrorCode.PRODUCT_ALREADY_EXISTS);
        }
        product.setName(request.getName().trim());
        product.setSku(request.getSku().trim());
        product.setBarcode(request.getBarcode());
        product.setUnit(request.getUnit().trim());
        product.setVolumeOrWeightPerUnit(request.getVolumeOrWeightPerUnit());
        product.setVolumeUnit(request.getVolumeUnit().trim());
        if (request.getMinStockAlertUnits() != null) product.setMinStockAlertUnits(request.getMinStockAlertUnits());
        if (request.getCostPrice() != null) product.setCostPrice(request.getCostPrice());
        if (request.getRetailPrice() != null) product.setRetailPrice(request.getRetailPrice());
        product.setActive(request.isActive());
        return InventoryMapper.toProductResponse(productRepository.save(product));
    }

    @Transactional
    public void deleteProduct(Long id) {
        ProductEntity product = findProductOrThrow(id);
        product.setDeleted(true);
        productRepository.save(product);
    }

    @Transactional(readOnly = true)
    public List<BranchInventoryResponse> getBranchInventory(Long branchId, Boolean lowStockOnly) {
        validateBranchExists(branchId);
        List<BranchInventoryEntity> inventories = Boolean.TRUE.equals(lowStockOnly)
                ? branchInventoryRepository.findLowStockByBranchId(branchId)
                : branchInventoryRepository.findAllByBranchId(branchId);
        return inventories.stream().map(InventoryMapper::toBranchInventoryResponse).toList();
    }

    @Transactional(readOnly = true)
    public BranchInventoryResponse getBranchInventoryByProductId(Long branchId, Long productId) {
        validateBranchExists(branchId);
        BranchInventoryEntity inventory = branchInventoryRepository.findByBranchIdAndProductId(branchId, productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        return InventoryMapper.toBranchInventoryResponse(inventory);
    }

    @Transactional
    public BranchInventoryResponse stockIn(Long branchId, StockInRequest request) {
        BranchEntity branch = validateBranchExists(branchId);
        ProductEntity product = findProductOrThrow(request.getProductId());
        if (request.getUnitCost() != null && request.getUnitCost().compareTo(BigDecimal.ZERO) >= 0) {
            product.setCostPrice(request.getUnitCost());
            productRepository.save(product);
        }
        BranchInventoryEntity inventory = findOrInitInventoryForUpdate(branch, product);
        int incomingUnits = request.getQuantityUnits();
        inventory.setStockUnits(inventory.getStockUnits() + incomingUnits);
        inventory = branchInventoryRepository.save(inventory);

        BigDecimal incomingVolume = BigDecimal.valueOf(incomingUnits).multiply(product.getVolumeOrWeightPerUnit());
        String notes = (request.getNotes() != null && !request.getNotes().isBlank())
                ? request.getNotes()
                : "Nhập kho " + incomingUnits + " " + product.getUnit();
        recordTransaction(product, branch, InventoryTransactionType.STOCK_IN,
                incomingUnits, incomingVolume, product.getVolumeUnit(), inventory.calculateTotalAvailableVolume(), null, notes);
        return InventoryMapper.toBranchInventoryResponse(inventory);
    }

    @Transactional
    public BranchInventoryResponse stockAdjustment(Long branchId, StockAdjustmentRequest request) {
        BranchEntity branch = validateBranchExists(branchId);
        ProductEntity product = findProductOrThrow(request.getProductId());
        BranchInventoryEntity inventory = findOrInitInventoryForUpdate(branch, product);

        int deltaUnits = request.getActualStockUnits() != null ? request.getActualStockUnits() - inventory.getStockUnits() : 0;
        BigDecimal deltaVolume = request.getActualVolume() != null
                ? request.getActualVolume().subtract(inventory.getCurrentVolume())
                : BigDecimal.ZERO;

        if (request.getActualStockUnits() != null) inventory.setStockUnits(request.getActualStockUnits());
        if (request.getActualVolume() != null) inventory.setCurrentVolume(request.getActualVolume());
        inventory = branchInventoryRepository.save(inventory);

        recordTransaction(product, branch, InventoryTransactionType.STOCK_ADJUSTMENT,
                deltaUnits, deltaVolume, product.getVolumeUnit(), inventory.calculateTotalAvailableVolume(), null, request.getReason());
        return InventoryMapper.toBranchInventoryResponse(inventory);
    }

    @Transactional
    public BranchInventoryResponse deductConsumables(Long branchId, Long productId, BigDecimal volumeAmount, Long referenceOrderId) {
        if (volumeAmount == null || volumeAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }
        BranchEntity branch = validateBranchExists(branchId);
        ProductEntity product = findProductOrThrow(productId);
        BranchInventoryEntity inventory = branchInventoryRepository.findByBranchIdAndProductIdForUpdate(branchId, productId)
                .orElseThrow(() -> new AppException(ErrorCode.INSUFFICIENT_STOCK));

        BranchInventoryEntity.ConsumableDeductionResult result = inventory.deductConsumableVolume(volumeAmount);
        inventory = branchInventoryRepository.save(inventory);

        if (result.unitsUnsealed() > 0) {
            recordTransaction(product, branch, InventoryTransactionType.AUTO_UNSEAL,
                    -result.unitsUnsealed(), result.unsealedAddedVolume(), product.getVolumeUnit(),
                    result.balanceAfterUnseal(), referenceOrderId,
                    "Tự động khui " + result.unitsUnsealed() + " " + product.getUnit() + " chuyển đổi định lượng sang " + product.getVolumeUnit());
        }
        recordTransaction(product, branch, InventoryTransactionType.SERVICE_CONSUMPTION,
                0, volumeAmount.negate(), product.getVolumeUnit(),
                result.balanceAfterConsume(), referenceOrderId, "Tiêu hao định lượng kỹ thuật dịch vụ");

        return InventoryMapper.toBranchInventoryResponse(inventory);
    }

    @Transactional
    public BranchInventoryResponse deductRetailProduct(Long branchId, Long productId, int quantityUnits, Long referenceOrderId) {
        if (quantityUnits <= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }
        BranchEntity branch = validateBranchExists(branchId);
        ProductEntity product = findProductOrThrow(productId);
        BranchInventoryEntity inventory = branchInventoryRepository.findByBranchIdAndProductIdForUpdate(branchId, productId)
                .orElseThrow(() -> new AppException(ErrorCode.INSUFFICIENT_STOCK));

        if (inventory.getStockUnits() < quantityUnits) {
            throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
        }
        inventory.setStockUnits(inventory.getStockUnits() - quantityUnits);
        inventory = branchInventoryRepository.save(inventory);

        recordTransaction(product, branch, InventoryTransactionType.RETAIL_SALE,
                -quantityUnits, BigDecimal.ZERO, product.getUnit(), inventory.calculateTotalAvailableVolume(),
                referenceOrderId, "Xuất kho bán lẻ sản phẩm tại POS (Đơn hàng #" + referenceOrderId + ")");
        return InventoryMapper.toBranchInventoryResponse(inventory);
    }

    @Transactional(readOnly = true)
    public List<InventoryTransactionResponse> getInventoryTransactions(Long branchId, Long productId) {
        validateBranchExists(branchId);
        List<InventoryTransactionEntity> transactions = (productId != null)
                ? inventoryTransactionRepository.findAllByBranchIdAndProductIdOrderByCreatedAtDesc(branchId, productId)
                : inventoryTransactionRepository.findAllByBranchIdOrderByCreatedAtDesc(branchId);
        return transactions.stream().map(InventoryMapper::toTransactionResponse).toList();
    }

    private ProductEntity findProductOrThrow(Long productId) {
        return productRepository.findByIdAndIsDeletedFalse(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
    }

    private BranchEntity validateBranchExists(Long branchId) {
        return branchRepository.findByIdAndIsDeletedFalse(branchId)
                .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));
    }

    private BranchInventoryEntity findOrInitInventoryForUpdate(BranchEntity branch, ProductEntity product) {
        return branchInventoryRepository.findByBranchIdAndProductIdForUpdate(branch.getId(), product.getId())
                .orElseGet(() -> BranchInventoryEntity.builder()
                        .branch(branch)
                        .product(product)
                        .stockUnits(0)
                        .currentVolume(BigDecimal.ZERO)
                        .minStockAlertUnits(product.getMinStockAlertUnits())
                        .build());
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
        BigDecimal safeVolAmount = volumeAmount != null ? volumeAmount : BigDecimal.ZERO;
        InventoryTransactionType.CostValuation cost = type.evaluateCost(product, quantityUnits, safeVolAmount);
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
                .unitCostSnapshot(cost.unitCostSnapshot())
                .totalCostAmount(cost.totalCostAmount())
                .build();
        inventoryTransactionRepository.save(tx);
    }
}
