# Issue 08: Master Products & Branch Inventory UI with Dual-Level Indicators (Sealed + In-use), Stock-In & Adjustment Modals

Status: ready-for-agent

## Description

Implement the Inventory and Product management frontend at `/admin/products` and `/admin/inventory` adhering to `ui-ux-pro-max`:
1. Master Products view (`/admin/products`): Table of master items (SKU, barcode, packaging unit, volume per unit, cost/retail price) with create/edit modal.
2. Branch Inventory view (`/admin/inventory`): Scoped to the currently selected branch from the header switcher.
   - Dual-level stock display: Sealed units badge (e.g. "5 chai") and current in-use volume progress bar (e.g. "350 / 1000 ml").
   - Low stock warning pills when sealed units <= `min_stock_alert_units`.
3. Stock In Modal: Select product, enter number of commercial units received, supplier/batch note, and submit to update branch inventory.
4. Stock Adjustment Modal: Select product, adjust physical volume/units with required reason (Hao hụt tự nhiên, Đổ vỡ, Hết hạn).
5. Inventory Transactions Audit view (`/admin/inventory/transactions`): Filterable log of stock receipts, consumption, and adjustments.

## Tasks

- [ ] Create `src/features/inventory/ProductsPage.jsx` for Master Catalog management.
- [ ] Create `src/features/inventory/BranchInventoryPage.jsx` displaying branch-scoped stock cards/table.
- [ ] Implement `StockInModal.jsx` connected to `POST /api/v1/branches/{branchId}/inventory/stock-in`.
- [ ] Implement `StockAdjustmentModal.jsx` connected to `POST /api/v1/branches/{branchId}/inventory/adjustment`.
- [ ] Implement `InventoryTransactionsPage.jsx` displaying historical audit movements.
- [ ] Connect TanStack Query hooks for inventory data fetching and cache invalidation.
- [ ] Apply dual-level indicators with clear visual feedback (badges and progress bars).

## Comments
