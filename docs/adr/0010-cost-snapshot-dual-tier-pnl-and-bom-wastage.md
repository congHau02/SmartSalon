# 0010 Cost Snapshot in Inventory Transactions, Dual-Tier P&L & Combined BOM Wastage

We snapshot `unit_cost_snapshot` and `total_cost_amount` onto each `Inventory Transaction` at checkout/adjustment time, compute `Order Net Profit` with pro-rated discounts across service and retail streams plus a second monthly tier deducting `Base Salary`, and measure `BOM Wastage` by combining treatment chemical consumption with negative `Stock Adjustment` losses against standard `BOM` baselines.

## Context

In Phases 2–4, `products.cost_price` stores the latest unit purchase cost updated whenever `Stock In` is executed. Computing historical P&L by multiplying past `SERVICE_CONSUMPTION` or `RETAIL_SALE` movements against the current `products.cost_price` would retroactively mutate past months' profit margins whenever supplier prices change. Additionally, a single POS `Order` can mix `SERVICE` treatments and `PRODUCT` retail items with an order-level `discount_amount`, and chemical shrinkage happens both during service mixing (`Visual Log` `actual_bom_json` overrides) and during physical shelf audits (`STOCK_ADJUSTMENT`).

## Decision

1. **Immutable Cost Snapshots on `inventory_transactions`**:
   - Add `unit_cost_snapshot DECIMAL(15, 4)` (cost per `ml`/`g` for consumables, or cost per `Sealed Unit` for retail/unit movements) and `total_cost_amount DECIMAL(15, 2)` to `inventory_transactions`.
   - When `deductConsumables`, `deductRetailProduct`, or `stockAdjustment` executes, the service calculates and persists the exact cost snapshot at that moment:
     - For volume movements (`ml`/`g`): $\text{unit\_cost\_snapshot} = \frac{\text{product.cost\_price}}{\text{product.volume\_or\_weight\_per\_unit}}$.
     - For unit movements (`Sealed Unit`): $\text{unit\_cost\_snapshot} = \text{product.cost\_price}$.
2. **Pro-Rated Service vs. Retail P&L and Dual-Tier Profit Reporting**:
   - Order-level `discount_amount` is pro-rated between `SERVICE` revenue and `PRODUCT` retail revenue proportionally to their gross subtotals.
   - Per-order service net profit follows:
     $$\text{Service Net Profit} = \text{Net Service Revenue} - \text{Chemical COGS} - \text{Staff Commissions}$$
   - Retail net profit is tracked alongside as $\text{Net Retail Revenue} - \text{Retail COGS}$, summing to `Order Net Profit`.
   - Aggregate P&L reports expose two profit tiers:
     - **Tier 1 (Operational Order Net Profit)**: Sum of `Order Net Profit` across all `PAID` orders in the period.
     - **Tier 2 (Net Profit After Fixed Payroll)**: Operational Order Net Profit minus active staff `Base Salary` allocation.
3. **Combined `BOM Wastage` Formula & 3-Tier Smart Stock Alerts**:
   - Standard volume for a product in a period is the sum of `service_bom.standard_amount * order_item.quantity` across all `PAID` orders.
   - Actual volume consumed combines $|\sum \text{SERVICE\_CONSUMPTION}|$ and $|\sum \text{negative STOCK\_ADJUSTMENT}|$.
   - `BOM Wastage` volume is $\text{Actual Consumed Volume} - \text{Standard BOM Volume}$, converted to VND via `unit_cost_snapshot`.
   - Smart Inventory Alerts classify branch stock into `OUT_OF_STOCK`, `LOW_STOCK` (`stock_units <= min_stock_alert_units`), and `NEAR_THRESHOLD` (`stock_units == min_stock_alert_units + 1` or estimated days until depletion $\le 7$ based on daily burn rate).

## Consequences

- Historical P&L reports remain audit-proof even when `products.cost_price` fluctuates across subsequent `Stock In` deliveries.
- Salon owners see both per-order contribution margins and true bottom-line monthly profitability after fixed `Base Salary` commitments.
- Both over-pouring in the mixing bowl and unrecorded shelf spillage surface in the `BOM Wastage` report with an explicit VND loss value.
