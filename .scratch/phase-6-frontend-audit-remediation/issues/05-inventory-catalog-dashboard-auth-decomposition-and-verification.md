# 05: Inventory, Catalog, Dashboard, Auth Decomposition, Cleanup & E2E Verification

**What to build:** Decompose remaining oversized files in Inventory, Catalog, Dashboard, Auth, and Layout features to strictly respect $\le 250$ LOC per file. Remove unreferenced starter template assets (`react.svg`, `vite.svg`, `hero.png`). Install and configure Vitest (`npm test`) with comprehensive behavioral unit/component tests for all remediated seams. Verify zero files over 250 LOC in `frontend/src` and ensure `npm run build` succeeds cleanly.

**Blocked by:** 04-pos-and-booking-component-decomposition.md

**Status:** resolved

- [x] All remaining oversized components in Inventory (`ProductsPage`, `InventoryTransactionsPage`, `ProductFormModal`, `StockAdjustmentModal`, `StockInModal`, `BranchInventoryPage`), Catalog (`ServicesPage`, `ServiceFormModal`), Dashboard (`DownloadCenterTab`, `StaffPayrollTab`, `InventoryAlertsTab`, `OrderPnlTable`, `StockAlertsTable`, `PnlTrendChart`), Layout (`AdminHeader`, `NotificationBell`), and Auth (`RegisterPage`, `LoginPage`) are refactored so that every file has $\le 250$ LOC.
- [x] Dead assets (`frontend/src/assets/react.svg`, `frontend/src/assets/vite.svg`, `frontend/src/assets/hero.png`) are removed.
- [x] Vitest test suite (`npm test`) passes with coverage for POS financial clamping, timeline mapping, auth single-flight refresh, and error boundary/safe clipboard.
- [x] Full project `npm run build` succeeds and automated LOC check confirms 100% compliance ($\le 250$ LOC per file).
