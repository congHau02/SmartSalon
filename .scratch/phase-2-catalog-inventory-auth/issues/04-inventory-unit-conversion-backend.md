# Issue 04: Master Products, Branch Inventory, Auto-Unseal Conversion Engine & Stock Operations Backend

Status: ready-for-agent

## Description

Implement the Inventory management and dual-level conversion engine supporting:
1. Master Product CRUD under `/api/v1/products` (SKU, barcode, packaging unit, standard volume/weight, cost/retail price).
2. Branch Inventory queries under `/api/v1/branches/{branchId}/inventory` tracking sealed units (`stock_units`), partial volume (`current_volume`), and low stock alerts.
3. Dual-level auto-unseal engine: when deducting BOM ml/grams, consume available `current_volume`; auto-unseal 1 unit if current volume is depleted, preventing negative balances.
4. Stock In (`POST /api/v1/branches/{branchId}/inventory/stock-in`) and Stock Adjustment (`POST /api/v1/branches/{branchId}/inventory/adjustment`) operations.
5. Audited `inventory_transactions` capturing unit and volume deltas with running balance snapshots.

## Tasks

- [ ] Create JPA entities: `ProductEntity`, `BranchInventoryEntity`, `InventoryTransactionEntity` under `com.smartsalon.inventory.entity`.
- [ ] Create JPA repositories: `ProductRepository`, `BranchInventoryRepository` (with pessimistic locking for concurrent deductions), `InventoryTransactionRepository`.
- [ ] Implement DTOs: `ProductRequest`, `ProductResponse`, `StockInRequest`, `StockAdjustmentRequest`, `BranchInventoryResponse`, `InventoryTransactionResponse`.
- [ ] Implement `InventoryService`:
  - CRUD for Master Products.
  - Stock In transaction incrementing `stock_units` and appending audit log.
  - Stock Adjustment transaction reconciling physical volumes and logging discrepancy reasons.
  - Core method `deductConsumables(Long branchId, Long productId, BigDecimal volumeAmount, Long referenceOrderId)` with auto-unseal algorithm.
- [ ] Implement `ProductController` and `BranchInventoryController`.
- [ ] Add unit and slice tests verifying:
  - Unit-to-volume math during Stock In.
  - Auto-unseal calculation when deducting more than current opened volume.
  - Prevention of negative stock with `INSUFFICIENT_STOCK` exception.

## Comments
