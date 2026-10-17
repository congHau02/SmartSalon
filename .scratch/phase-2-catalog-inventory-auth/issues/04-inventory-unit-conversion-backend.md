# Issue 04: Master Products, Branch Inventory, Auto-Unseal Conversion Engine & Stock Operations Backend

Status: resolved

## Description

Implement the Inventory management and dual-level conversion engine supporting:
1. Master Product CRUD under `/api/v1/products` (SKU, barcode, packaging unit, standard volume/weight, cost/retail price).
2. Branch Inventory queries under `/api/v1/branches/{branchId}/inventory` tracking sealed units (`stock_units`), partial volume (`current_volume`), and low stock alerts.
3. Dual-level auto-unseal engine: when deducting BOM ml/grams, consume available `current_volume`; auto-unseal 1 unit if current volume is depleted, preventing negative balances.
4. Stock In (`POST /api/v1/branches/{branchId}/inventory/stock-in`) and Stock Adjustment (`POST /api/v1/branches/{branchId}/inventory/adjustment`) operations.
5. Audited `inventory_transactions` capturing unit and volume deltas with running balance snapshots.

## Tasks

- [x] Create JPA entities: `ProductEntity`, `BranchInventoryEntity`, `InventoryTransactionEntity` under `com.smartsalon.inventory.entity`.
- [x] Create JPA repositories: `ProductRepository`, `BranchInventoryRepository` (with pessimistic locking for concurrent deductions), `InventoryTransactionRepository`.
- [x] Implement DTOs: `ProductRequest`, `ProductResponse`, `StockInRequest`, `StockAdjustmentRequest`, `BranchInventoryResponse`, `InventoryTransactionResponse`.
- [x] Implement `InventoryService`:
  - CRUD for Master Products.
  - Stock In transaction incrementing `stock_units` and appending audit log.
  - Stock Adjustment transaction reconciling physical volumes and logging discrepancy reasons.
  - Core method `deductConsumables(Long branchId, Long productId, BigDecimal volumeAmount, Long referenceOrderId)` with auto-unseal algorithm.
- [x] Implement `ProductController` and `BranchInventoryController`.
- [x] Add unit and slice tests verifying:
  - Unit-to-volume math during Stock In.
  - Auto-unseal calculation when deducting more than current opened volume.
  - Prevention of negative stock with `INSUFFICIENT_STOCK` exception.

## Comments

- Implemented `ProductEntity`, `BranchInventoryEntity`, and `InventoryTransactionEntity` with `InventoryTransactionType` enum (`STOCK_IN`, `STOCK_ADJUSTMENT`, `AUTO_UNSEAL`, `SERVICE_CONSUMPTION`).
- Built dual-level conversion engine in `InventoryService.deductConsumables()`:
  - Consumes available opened volume (`current_volume`).
  - Auto-unseals sealed units when deficit occurs (`unitsToUnseal = ceil(deficit / volumeOrWeightPerUnit)`).
  - Strictly prevents negative balances by throwing `INSUFFICIENT_STOCK` (3001).
  - Emits immutable audit log with running balance snapshot.
- Implemented `ProductController` (`/api/v1/products`) with public catalog browsing and `@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")` on mutating operations.
- Implemented `BranchInventoryController` (`/api/v1/branches/{branchId}/inventory`) supporting low-stock alert filtering, stock-in, stock adjustment, and transaction audit queries.
- Cleaned up architecture per parallel code review findings: decoupled branch-specific fields from Master Product DTOs, used strongly-typed transaction enums, and refined filter chain permissions.
- Test coverage:
  - `InventoryServiceTest`: 6/6 unit tests passing (unit-to-volume math, auto-unseal, multiple unseal, insufficient stock guard, adjustment reconciliation).
  - `InventoryIntegrationTest`: 5/5 integration tests passing (public catalog, admin CRUD, duplicate SKU rejection, stock-in & adjustment, RBAC enforcement).
  - Total test suite: 35/35 tests PASS.
