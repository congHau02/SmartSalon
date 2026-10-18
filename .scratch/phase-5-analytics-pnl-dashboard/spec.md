# Specification: Phase 5 - Financial Analytics, Realized P&L, Staff Payroll & Executive Dashboard

Status: ready-for-agent

## Problem Statement

Although SmartSalon already manages online customer reservations (`Booking`), `Slot Lock` concurrency, 20% `Deposit` collection, real-time `Dispatch Board` operations, `Visual Log` chemical mixing, dual-level `Branch Inventory` deduction (`Sealed Unit` to `Opened Volume`), and two-tier `Commission Ledger` recording, salon owners and branch managers still cannot see the true financial and operational picture of their business:

1. **No Realized Profit & Loss (P&L) Visibility**: Owners cannot see how much profit each completed `Order` actually generates (`Order Net Profit`) or how profitable a branch is across a day, week, or month. Specifically, there is no engine that combines net service revenue (after pro-rating order-level discounts), `Chemical COGS` (valued per `ml`/`g` consumed), retail `Master Product` cost of goods, staff commissions from the `Commission Ledger`, and monthly fixed staff `Base Salary`. Furthermore, `Inventory Transaction` records do not currently snapshot product unit costs at the moment of stock movement, meaning any future `Stock In` that updates a product's purchase price would retroactively distort historical P&L margins.
2. **No Consolidated Staff Performance, Payroll & Loyalty Analytics**: Staff profiles lack a monthly `Base Salary` attribute, and `Booking` records do not distinguish whether a customer explicitly requested a stylist by name versus accepting an automatically load-balanced stylist. Consequently, managers cannot view a unified monthly payroll statement combining `Base Salary`, itemized `Commission Ledger` payouts per shift, `Requested Stylist Rate`, and repeat-customer `Re-booking Rate`, nor can they export end-of-month Excel (`.xlsx`) or printable Vietnamese PDF (`.pdf`) accounting statements.
3. **No Smart Inventory Depletion Alerts or `BOM Wastage` Tracking**: Managers can only view basic low-stock flags based on sealed unit counts, with no visibility into approaching-threshold warnings, daily consumption burn rates, or estimated days until stockout. More critically, owners cannot compare the standard `BOM` chemical volume expected for completed services against the actual chemical volume consumed (`SERVICE_CONSUMPTION` overrides in the `Visual Log` plus negative `Stock Adjustment` losses from spillage or audit shrinkage) to quantify `BOM Wastage` in `ml`/`g`, percentage variance, and VND monetary loss.
4. **Static Infrastructure Placeholder on the Admin Dashboard**: The main administrative landing screen still displays the Phase 1 infrastructure status banner instead of an interactive Executive Financial & Operations Command Center.

## Solution

Deliver an end-to-end Financial Analytics, Realized P&L, Staff Performance & Payroll, Smart Inventory Alerting, Enterprise Report Export (`.xlsx` & `.pdf`), and Executive Dashboard suite:

1. **Immutable Cost Snapshots, Stylist Request Tracking & Historical Operational Seeds**:
   - Extend staff profiles with a configurable monthly `Base Salary`.
   - Extend `Booking` records with an explicit `is_stylist_requested` indicator set whenever a customer chooses a specific stylist during reservation creation.
   - Extend `Inventory Transaction` records with immutable unit and total cost snapshots captured at the exact moment of `SERVICE_CONSUMPTION`, `RETAIL_SALE`, `STOCK_IN`, or `STOCK_ADJUSTMENT`, ensuring historical `Chemical COGS` and retail COGS never drift when future supplier prices change.
   - Seed a rich historical dataset of completed `Bookings`, `PAID` `Orders` (spanning services, retail items, and discounts), `Visual Log` chemical overrides, `Commission Ledger` entries, `Inventory Transactions`, and near-threshold stock balances so the Executive Dashboard and exported reports display realistic operational metrics immediately.
2. **Realized Profit & Loss (P&L) Engine (Per-Order & Dual-Tier Period Summary)**:
   - Pro-rate order-level discounts proportionally between service revenue and retail product revenue on every `PAID` `Order`.
   - Calculate per-order Service Net Profit (`Net Service Revenue - Chemical COGS - Staff Commissions`) alongside Retail Net Profit (`Net Retail Revenue - Retail COGS`) to produce each order's `Order Net Profit`.
   - Aggregate daily financial time-series data for trend charting and report period P&L at two distinct levels: **Tier 1 (Operational Order Net Profit)** from completed orders, and **Tier 2 (Net Profit After Fixed Payroll)** after subtracting active staff `Base Salary`.
3. **Staff Performance, Payroll & Customer Retention Engine**:
   - Provide a branch-and-period Staff Performance & Payroll report combining each employee's `Base Salary`, completed order and `Service Step` counts, total earned commissions from the `Commission Ledger`, and total compensation (`Base Salary + Total Commission`), with an interactive drill-down into every individual `Commission Ledger` entry.
   - Allow administrators and managers to update any staff member's monthly `Base Salary` directly from the report view.
   - Compute two complementary stylist loyalty KPIs: **`Requested Stylist Rate`** (percentage of a stylist's completed bookings where the customer explicitly requested that stylist) and **`Re-booking Rate`** (percentage of a stylist's identified customers who have completed two or more service visits with that same stylist).
4. **Smart Inventory Depletion Alerts & `BOM Wastage` Analysis Engine**:
   - Classify branch inventory into three actionable alert tiers (`OUT_OF_STOCK`, `LOW_STOCK`, and `NEAR_THRESHOLD`), enriched with total available volume (`Sealed Units × Volume Per Unit + Opened Volume`), average daily consumption burn rate, and estimated days remaining until depletion.
   - Quantify `BOM Wastage` per consumable product by comparing the aggregated standard `BOM` volume of all `PAID` services in the period against actual chemical volume deducted (`SERVICE_CONSUMPTION` plus negative `Stock Adjustment` audit losses), reporting variance in `ml`/`g`, percentage overrun, and VND monetary loss.
5. **Enterprise Multi-Sheet Excel (`.xlsx`) & Vietnamese Unicode PDF (`.pdf`) Exports**:
   - Generate server-side `.xlsx` workbooks with formatted currency columns and multiple sheets (Summary & KPI sheet plus Itemized per-shift detail sheet) and printable Vietnamese Unicode `.pdf` accounting documents complete with branch headers, summary tables, and signature blocks (`Người lập biểu`, `Kế toán`, `Chủ Salon`) for both Staff Payroll and Financial P&L reports.
6. **Executive Financial & Operations Command Center Dashboard**:
   - Transform the administrative dashboard into a unified command center with branch context, date-range presets (`Hôm nay`, `7 ngày qua`, `Tháng này`, `Tùy chọn ngày`), compact system health indicator, sidebar quick-links, and three deep-dive analytical tabs: **Tổng quan & P&L Thực tế**, **Hiệu suất Nhân sự & Hoa hồng**, and **Cảnh báo Kho & Hao hụt BOM**.

## User Stories

1. As a salon owner, I want every `Inventory Transaction` (`SERVICE_CONSUMPTION`, `RETAIL_SALE`, `STOCK_ADJUSTMENT`, `STOCK_IN`) to record an immutable snapshot of the product's unit cost and total cost at the moment the transaction occurs, so that updating a product's purchase price during a future `Stock In` never alters historical P&L margins.
2. As a salon owner, I want `Chemical COGS` for consumable deductions (`ml`/`g`) to be valued automatically using the product's cost per volume unit ($\text{Cost Price} \div \text{Volume or Weight Per Unit}$) at checkout time, so that every gram of hair dye or milliliter of shampoo used in a treatment is accurately costed in VND.
3. As a salon owner, I want order-level discounts on a `PAID` `Order` to be pro-rated proportionally between its service items and retail `Master Product` items, so that mixed orders neither overstate nor understate service profitability.
4. As a salon owner, I want to see the realized net profit of each individual `PAID` `Order` (`Order Net Profit`) broken down into Net Service Revenue, `Chemical COGS`, Staff Commissions from the `Commission Ledger`, Net Retail Revenue, and Retail COGS, so that I can audit the exact margin of every customer visit.
5. As a salon owner, I want to see a two-tier P&L summary for any selected period showing **Tier 1: Operational Order Net Profit** (sum of `Order Net Profit` across all completed orders) and **Tier 2: Net Profit After Fixed Payroll** (after deducting active staff `Base Salary`), so that I know both shift-level contribution margins and true bottom-line profitability.
6. As a salon owner, I want to filter the Executive Dashboard and all financial reports by branch and by quick date presets (`Hôm nay`, `7 ngày qua`, `Tháng này`, or a custom `Từ ngày – Đến ngày` range), so that I can inspect daily performance or close monthly books effortlessly.
7. As a salon owner, I want an interactive daily revenue, cost (`Chemical COGS` + Retail COGS + Commissions), and net profit trend chart across the selected date range, so that I can visually spot revenue peaks, high-cost days, and margin trends.
8. As a salon owner, I want to see gross margin percentage and net profit margin percentage badges on the P&L summary cards, so that I can benchmark branch financial health at a glance.
9. As a salon owner or branch manager, I want to assign and update a monthly `Base Salary` for each staff member (`STYLIST`, `STAFF`, `MANAGER`), so that fixed monthly payroll is tracked alongside variable commissions.
10. As a branch manager, I want to view a consolidated Staff Performance & Payroll table listing each staff member's role, `Base Salary`, number of completed orders and `Service Steps`, total earned commission from the `Commission Ledger`, and total compensation (`Base Salary + Total Commission`).
11. As a branch manager, I want to click on any staff member in the Staff Performance & Payroll table to open a detailed modal listing all of their individual `Commission Ledger` entries for the period (including `Order` code, service name, `Service Step` name, commission rate, VND amount, timestamp, and `calculation_notes`), so that I can answer any staff payout inquiry transparently.
12. As a salon owner, I want the system to record whether a customer explicitly selected a specific stylist (`is_stylist_requested = true`) or chose "Any Available Stylist" (`is_stylist_requested = false`) when creating a `Booking`, even though both paths assign a stylist for `Slot Lock` reservation.
13. As a branch manager, I want to see each stylist's **`Requested Stylist Rate`** ($\frac{\text{Completed Bookings with } \text{is\_stylist\_requested} = \text{true}}{\text{Total Completed Bookings of Stylist}} \times 100\%$) in the Staff Performance report, so that I know which stylists are most actively requested by customers.
14. As a branch manager, I want to see each stylist's **`Re-booking Rate`** ($\frac{\text{Identified Customers with } \ge 2 \text{ Completed Orders with Stylist}}{\text{Total Identified Customers of Stylist}} \times 100\%$, excluding the anonymous `walkin.guest` profile), so that I can measure customer retention and satisfaction per stylist.
15. As a salon owner or accountant, I want to export the Staff Performance & Payroll report as a multi-sheet Excel (`.xlsx`) workbook containing a Payroll & KPI Summary sheet and an Itemized `Commission Ledger` sheet, so that I can archive or process end-of-month payroll in spreadsheet software.
16. As a salon owner or accountant, I want to export the Staff Performance & Payroll report as a printable Vietnamese Unicode PDF (`.pdf`) document featuring branch header metadata, formatted VND tables, and signature blocks (`Người lập biểu`, `Kế toán`, `Chủ Salon`), so that physical payroll vouchers can be signed at month-end.
17. As a salon owner or accountant, I want to export the Realized P&L report as either a multi-sheet Excel (`.xlsx`) workbook (Period Summary + Per-Order P&L Breakdown) or a formatted Vietnamese Unicode PDF (`.pdf`) statement, so that financial statements can be shared with stakeholders and accountants.
18. As a branch manager, I want the Smart Inventory Alert view to classify branch products into three distinct alert levels—`OUT_OF_STOCK` (zero sealed units and zero opened volume), `LOW_STOCK` (`Sealed Units <= min_stock_alert_units`), and `NEAR_THRESHOLD` (`Sealed Units == min_stock_alert_units + 1` or estimated days until depletion $\le 7$ days)—so that I can restock critical hair dyes and chemicals before services are disrupted.
19. As a branch manager, I want each Smart Inventory Alert item to display `Sealed Units`, `Opened Volume`, total available volume (`ml`/`g`), average daily consumption rate (`ml`/`g` per day), and estimated days of stock remaining, so that I can prioritize purchasing based on real consumption velocity.
20. As a branch manager, I want a one-click **"Nhập kho ngay"** button on any alerted product row in the Smart Inventory Alert tab that opens the `Stock In` modal pre-selected for that product, so that I can immediately record incoming supplier deliveries without leaving the dashboard.
21. As a salon owner, I want a `BOM Wastage` analysis table that calculates the total **Standard BOM Volume** expected across all `PAID` services in the period and compares it against **Actual Consumed Volume** (combining `SERVICE_CONSUMPTION` deductions and negative `Stock Adjustment` losses), so that I can see exact chemical over-usage per product.
22. As a salon owner, I want each row in the `BOM Wastage` table to display Standard `BOM` (`ml`/`g`), Actual Service Consumption (`ml`/`g`), Negative `Stock Adjustment` Loss (`ml`/`g`), Total Wastage Volume (`ml`/`g`), `BOM Wastage` Percentage (`%`), and Monetary Wastage Value (VND), so that I can identify which chemicals are being over-poured or lost to shrinkage and how much money that costs the salon.
23. As a salon owner or manager, I want the sidebar navigation to include direct links to the three analytical views (`Bảng điều khiển & P&L`, `Hiệu suất & Lương Nhân sự`, `Cảnh báo Kho & Hao hụt BOM`) synchronized with URL query parameters, so that I can jump directly to any report from anywhere in the admin portal.
24. As a developer or evaluator launching SmartSalon for the first time, I want the V5 database migration to seed realistic historical customers, completed `Bookings`, `PAID` `Orders`, `Visual Log` overrides, `Commission Ledger` records, `Inventory Transactions`, and low-stock/near-threshold items, so that all charts, P&L tables, retention metrics, and `.xlsx`/`.pdf` exports demonstrate rich, realistic financial numbers immediately out of the box.

## Implementation Decisions

### 1. Schema Evolution & Historical Seed Data (Flyway V5)
- **Staff `Base Salary`**:
  - Add `base_salary DECIMAL(15, 2) NOT NULL DEFAULT 0.00` to the `users` table.
- **Explicit Stylist Request Tracking**:
  - Add `is_stylist_requested TINYINT(1) NOT NULL DEFAULT 0` to the `bookings` table.
  - During `Booking` creation, set `is_stylist_requested = true` when the customer explicitly provides a `stylistId`, and `false` when the system auto-assigns a stylist via least-loaded balancing.
- **Immutable Inventory Cost Snapshots**:
  - Add `unit_cost_snapshot DECIMAL(15, 4) NOT NULL DEFAULT 0.0000` and `total_cost_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00` to `inventory_transactions`.
  - Whenever the inventory service records a transaction:
    - For volume-based movements (`SERVICE_CONSUMPTION`, `AUTO_UNSEAL`, or volume `STOCK_ADJUSTMENT`):
      $$\text{unit\_cost\_snapshot} = \begin{cases} \frac{\text{cost\_price}}{\text{volume\_or\_weight\_per\_unit}} & \text{if } \text{volume\_or\_weight\_per\_unit} > 0 \\ 0 & \text{otherwise} \end{cases}$$
      $$\text{total\_cost\_amount} = |\text{volume\_amount}| \times \text{unit\_cost\_snapshot}$$
    - For unit-based movements (`RETAIL_SALE`, `STOCK_IN`, or unit `STOCK_ADJUSTMENT`):
      $$\text{unit\_cost\_snapshot} = \text{cost\_price}, \quad \text{total\_cost\_amount} = |\text{quantity\_units}| \times \text{cost\_price}$$
- **Historical Operational Seed Dataset**:
  - Seed monthly `base_salary` values for all seeded branch stylists and receptionists.
  - Seed repeat customers and historical `COMPLETED` `Bookings` (including both `is_stylist_requested = 1` and `is_stylist_requested = 0`), `PAID` `Orders` across recent days in the current month, `OrderItems` (both `SERVICE` and retail `PRODUCT`), completed `Step Assignments`, `Commission Ledger` entries (`status = 'EARNED'`), `Visual Log` records with `actual_bom_json` chemical overrides, and corresponding `SERVICE_CONSUMPTION`, `RETAIL_SALE`, and negative `STOCK_ADJUSTMENT` `Inventory Transactions` with cost snapshots.
  - Adjust selected `Branch Inventory` items so at least one product is in `LOW_STOCK` and one is in `NEAR_THRESHOLD` state.

### 2. Realized P&L (Profit & Loss) Module
- **Per-Order Revenue & Discount Pro-Rating**:
  - For each `PAID` `Order` within `[startDate, endDate]` at `branchId`:
    - Let $R_{\text{service}}$ be the sum of `total_price` for active `SERVICE` items and $R_{\text{retail}}$ be the sum of `total_price` for active `PRODUCT` items, with $R_{\text{gross}} = R_{\text{service}} + R_{\text{retail}}$.
    - Order discount $D = \min(\text{discount\_amount}, R_{\text{gross}})$ is pro-rated:
      $$D_{\text{service}} = D \times \frac{R_{\text{service}}}{R_{\text{gross}}}, \quad D_{\text{retail}} = D - D_{\text{service}}$$
    - Net Service Revenue: $R_{\text{service}}^{\text{net}} = R_{\text{service}} - D_{\text{service}}$.
    - Net Retail Revenue: $R_{\text{retail}}^{\text{net}} = R_{\text{retail}} - D_{\text{retail}}$.
- **Per-Order Cost & Margin Calculation**:
  - `Chemical COGS`: Sum of `total_cost_amount` from `SERVICE_CONSUMPTION` `Inventory Transactions` referencing `order.id` (falling back to standard service `BOM` $\times$ unit volume cost if no transaction rows exist).
  - `Retail COGS`: Sum of `total_cost_amount` from `RETAIL_SALE` `Inventory Transactions` referencing `order.id`.
  - `Staff Commissions`: Sum of `amount` from `Commission Ledger` entries referencing `order.id`.
  - `Service Net Profit`: $R_{\text{service}}^{\text{net}} - \text{Chemical COGS} - \text{Staff Commissions}$.
  - `Retail Net Profit`: $R_{\text{retail}}^{\text{net}} - \text{Retail COGS}$.
  - `Order Net Profit`: $\text{Service Net Profit} + \text{Retail Net Profit}$.
- **Aggregate Dual-Tier P&L & Daily Trend Series**:
  - **Tier 1 (`operationalNetProfit`)**: Sum of `Order Net Profit` across all `PAID` orders in the period.
  - **Tier 2 (`netProfitAfterPayroll`)**: $\text{operationalNetProfit} - \text{fixedBaseSalaryCost}$, where `fixedBaseSalaryCost` is the sum of active branch staff `Base Salary`.
  - **Daily Series (`dailySeries`)**: Chronological list of daily aggregates (`date`, `netServiceRevenue`, `netRetailRevenue`, `totalNetRevenue`, `chemicalCogs`, `retailCogs`, `totalCommissions`, `operationalNetProfit`, `orderCount`) for rendering trend charts.

### 3. Staff Performance, Payroll & Retention Module
- **Staff Scope & Payroll Aggregation**:
  - Evaluates all active non-customer staff members (`STYLIST`, `STAFF`, `MANAGER`) assigned to `branchId`.
  - For each staff member over `[startDate, endDate]`:
    - `baseSalary`: Current configured monthly `Base Salary`.
    - `completedSteps`: Count of `Commission Ledger` entries (or completed `Step Assignments` on `PAID` orders) in the period.
    - `completedOrders`: Count of distinct `PAID` orders where the staff member performed at least one step.
    - `totalCommission`: Sum of `Commission Ledger.amount` in the period.
    - `totalCompensation`: $\text{baseSalary} + \text{totalCommission}$.
    - `entries`: Itemized list of `Commission Ledger` entries for drill-down inspection.
- **Stylist Loyalty & Retention KPIs**:
  - **`Requested Stylist Rate`**:
    - Across all `COMPLETED` (or `CHECKED_IN` / `IN_PROGRESS` / `COMPLETED`) `Bookings` assigned to the stylist in the period, computes:
      $$\text{Requested Stylist Rate (\%)} = \frac{\text{Count of Bookings with } \text{is\_stylist\_requested} = \text{true}}{\text{Total Bookings of Stylist}} \times 100\%$$
  - **`Re-booking Rate`**:
    - Across all `PAID` `Orders` (excluding the anonymous `walkin.guest` user) where the stylist performed a service step or was the booked stylist, counts distinct identified customers (`uniqueCustomerCount`) and distinct customers who have $\ge 2$ `PAID` orders with that stylist (`repeatCustomerCount`):
      $$\text{Re-booking Rate (\%)} = \frac{\text{repeatCustomerCount}}{\text{uniqueCustomerCount}} \times 100\%$$
- **Base Salary Update Contract**:
  - `PATCH /api/v1/analytics/staff/{staffId}/base-salary` accepts `{ "baseSalary": <non-negative decimal> }`, restricted to `ADMIN` and `MANAGER` roles, and updates the staff member's `Base Salary`.

### 4. Smart Inventory Alerts & `BOM Wastage` Module
- **3-Tier Smart Depletion Classification**:
  - For each product in `Branch Inventory` at `branchId`:
    - `totalAvailableVolume` = $\text{stock\_units} \times \text{volume\_or\_weight\_per\_unit} + \text{current\_volume}$.
    - `avgDailyConsumptionVolume`: Total `SERVICE_CONSUMPTION` volume over the lookback window divided by the number of days in the window.
    - `estimatedDaysRemaining`: $\lfloor \text{totalAvailableVolume} \div \text{avgDailyConsumptionVolume} \rfloor$ when `avgDailyConsumptionVolume > 0` (or `null` if zero consumption).
    - `alertLevel`:
      - `OUT_OF_STOCK`: `stock_units == 0` and `current_volume == 0`.
      - `LOW_STOCK`: `stock_units <= min_stock_alert_units` (and not `OUT_OF_STOCK`).
      - `NEAR_THRESHOLD`: `stock_units == min_stock_alert_units + 1` OR (`estimatedDaysRemaining != null && estimatedDaysRemaining <= 7`).
      - `HEALTHY`: All other products.
- **`BOM Wastage` Calculation**:
  - For each consumable product referenced in `service_bom` or `inventory_transactions` at `branchId` during `[startDate, endDate]`:
    - `standardBomVolume`: Sum of `service_bom.standard_amount * order_item.quantity` across all `SERVICE` items belonging to `PAID` `Orders` in the period.
    - `serviceConsumptionVolume`: Sum of $|\text{volume\_amount}|$ from `SERVICE_CONSUMPTION` `Inventory Transactions` in the period.
    - `adjustmentLossVolume`: Sum of $|\text{volume\_amount}| + |\text{quantity\_units}| \times \text{volume\_or\_weight\_per\_unit}$ from negative `STOCK_ADJUSTMENT` `Inventory Transactions` in the period.
    - `actualTotalVolume`: $\text{serviceConsumptionVolume} + \text{adjustmentLossVolume}$.
    - `wastageVolume`: $\max(0,\ \text{actualTotalVolume} - \text{standardBomVolume})$ (also reporting raw signed variance `varianceVolume = actualTotalVolume - standardBomVolume`).
    - `wastagePercentage`: $\frac{\text{varianceVolume}}{\text{standardBomVolume}} \times 100\%$ when `standardBomVolume > 0`.
    - `wastageCostAmount`: $\text{wastageVolume} \times \text{unitVolumeCost}$ in VND.

### 5. Enterprise Excel (`.xlsx`) & PDF (`.pdf`) Export Module
- **Export Endpoint Contract**:
  - `GET /api/v1/analytics/export/{reportType}/{format}?branchId={id}&startDate={yyyy-MM-dd}&endDate={yyyy-MM-dd}`
  - Supported `reportType`: `staff-payroll`, `pnl`.
  - Supported `format`: `xlsx`, `pdf`.
- **Excel Generation (Apache POI)**:
  - `staff-payroll.xlsx`:
    - Sheet 1 (`Tong_Hop_Bang_Luong_KPI`): Branch header, period metadata, staff payroll rows (`Mã NV`, `Họ tên`, `Vai trò`, `Lương cứng`, `Số ca`, `Số bước`, `Tổng hoa hồng`, `Tổng thực lĩnh`, `Tỷ lệ khách chọn đích danh %`, `Tỷ lệ khách quay lại %`), and bold totals row.
    - Sheet 2 (`Chi_Tiet_Hoa_Hong_Tung_Ca`): Itemized `Commission Ledger` rows (`Thời gian`, `Mã đơn`, `Nhân sự`, `Dịch vụ`, `Bước thực hiện`, `Tỷ lệ %`, `Số tiền hoa hồng`, `Diễn giải công thức`).
  - `pnl.xlsx`:
    - Sheet 1 (`Tong_Hop_P_L`): Period KPI summary (Tier 1 & Tier 2 profit) and daily revenue/cost/profit table.
    - Sheet 2 (`Chi_Tiet_Lai_Lo_Tung_Ca`): Per-order P&L breakdown (`Mã đơn`, `Thời gian`, `Khách hàng`, `Doanh thu DV thuần`, `Giá vốn hóa chất COGS`, `Hoa hồng nhân sự`, `Lợi nhuận DV`, `Lợi nhuận bán lẻ`, `Lợi nhuận ròng ca`).
- **PDF Generation (OpenPDF with Embedded Unicode Vietnamese Font)**:
  - Streams an A4 document rendered with a bundled Unicode TrueType font (`Roboto`/`DejaVuSans`) so all Vietnamese characters render accurately.
  - Includes salon & branch title header, report period, executive summary boxes, styled data table, and a 3-column signature footer (`Người lập biểu`, `Kế toán trưởng`, `Chủ Salon / Giám đốc`).

### 6. Frontend Executive Command Center UI
- **Unified Dashboard & Deep-Dive Tabs**:
  - Upgrade the `/admin` dashboard view to render:
    - Top Command Header: Active Branch indicator, compact live System Health badge, Date-Range preset selector (`Hôm nay`, `7 ngày qua`, `Tháng này`, `Tùy chọn`), and quick export triggers.
    - Tab 1 (`?tab=pnl`): Executive P&L KPI cards, interactive SVG Bar/Area trend chart (Revenue vs. COGS/Commissions vs. Net Profit), per-order P&L breakdown table, and `.xlsx`/`.pdf` export buttons.
    - Tab 2 (`?tab=staff`): Staff Payroll & Performance summary cards, interactive payroll table with inline/modal `Base Salary` editing, visual progress bars for `Requested Stylist Rate` and `Re-booking Rate`, itemized `Commission Ledger` drill-down modal per staff member, and `.xlsx`/`.pdf` export buttons.
    - Tab 3 (`?tab=inventory`): 3-tier Smart Inventory Alert cards and table with estimated days remaining and one-click `Stock In` modal integration, paired with the `BOM Wastage` comparison table showing standard vs. actual `ml`/`g` consumption, wastage `%`, and VND loss value.

## Testing Decisions

### What Makes a Good Test
- **Test observable behavior through public contracts, never internal implementation details**: Tests must invoke public HTTP endpoints (via `MockMvc`) or public service contracts against a real transactional relational database and assert observable outputs (JSON response payloads, persisted database records, exact financial/percentage math, and valid binary file streams for `.xlsx` and `.pdf`).

### Highest-Level Seams to Test
1. **Flyway Migration Seam (`FlywayMigrationTest`)**:
   - Extend the existing migration test to execute `V5__analytics_pnl_and_payroll.sql` and verify the new schema columns (`users.base_salary`, `bookings.is_stylist_requested`, `inventory_transactions.unit_cost_snapshot`, `total_cost_amount`) as well as the seeded historical orders, commission ledgers, and inventory transactions.
2. **Analytics & Report Export HTTP Integration Seam (`AnalyticsControllerIntegrationTest`)**:
   - A full-stack `@SpringBootTest` + `@AutoConfigureMockMvc` integration test suite verifying:
     - Cost snapshots are automatically persisted on `inventory_transactions` when `deductConsumables`, `deductRetailProduct`, and `stockAdjustment` execute during POS checkout and inventory operations.
     - `GET /api/v1/analytics/pnl` accurately pro-rates order discounts, computes `Chemical COGS`, `Retail COGS`, `Staff Commissions`, per-order `Order Net Profit`, daily trend series, Tier 1 `operationalNetProfit`, and Tier 2 `netProfitAfterPayroll`.
     - `GET /api/v1/analytics/staff-performance` and `PATCH /api/v1/analytics/staff/{staffId}/base-salary` accurately compute `Base Salary + Commission` totals, `Requested Stylist Rate`, and `Re-booking Rate`, and persist salary updates.
     - `GET /api/v1/analytics/inventory-alerts` accurately classifies `OUT_OF_STOCK`, `LOW_STOCK`, and `NEAR_THRESHOLD` products with burn-rate days remaining and calculates `BOM Wastage` (`Standard BOM` vs. `SERVICE_CONSUMPTION + negative STOCK_ADJUSTMENT`) in `ml`/`g`, `%`, and VND.
     - `GET /api/v1/analytics/export/{reportType}/{format}` returns HTTP 200 with valid OOXML (`.xlsx` magic bytes `PK\x03\x04` readable by Apache POI `WorkbookFactory`) and PDF (`.pdf` header `%PDF-`) binary payloads for both `staff-payroll` and `pnl`.
3. **Frontend Build & Static Verification Seam**:
   - Execute `npm run build` to verify all React 19 components, charts, modals, and API integrations compile cleanly with zero errors.

### Prior Art in the Codebase
- `FlywayMigrationTest`: Validates Flyway migrations V1–V4 and baseline seeds against the relational schema.
- `PosControllerIntegrationTest`: Full-stack `@SpringBootTest` + `@AutoConfigureMockMvc` integration test verifying POS check-in, `Visual Log` BOM overrides, atomic checkout, inventory deduction, and `Commission Ledger` creation.
- `InventoryServiceTest`: Tests unit-to-volume conversion, auto-unseal consumption, and stock adjustment behavior.

## Out of Scope

- Direct bank API integration for automated monthly payroll wire transfers.
- Multi-currency accounting (all financial metrics and exports operate in VND).
- Supplier purchase order (PO) approval workflows and automated email/SMS supplier reordering.

## Further Notes

- Architectural decisions are documented in `ADR-0010` (Cost Snapshot in Inventory Transactions, Dual-Tier P&L & Combined BOM Wastage) and `ADR-0011` (Explicit Requested-Stylist Flag, Dual Retention Metrics & Server-Side Report Exports).
- All domain terminology strictly adheres to `GLOSSARY.md`.
