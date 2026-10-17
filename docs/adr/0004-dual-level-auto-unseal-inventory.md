# 0004 Dual-Level Auto-Unseal Inventory Conversion Model

We designed an automated dual-level stock conversion model that balances commercial sealed units (`stock_units`) with operational partial volumes (`current_volume` in ml or grams) for salon services.

## Context

Salon products are purchased and received in whole units (bottles, tubes, tubs), but consumable chemical formulations (bleach, developer, dye, keratin) are deducted in fractional quantities (e.g., 30ml dye + 45ml developer) according to service Bill of Materials (BOM). Requiring technicians to manually record "unseal transfer" slips creates friction and leads to untracked stock divergence, while tracking only raw milliliters obscures physical shelf counts during warehouse stocktakes.

## Decision

1. **Dual-Level Tracking**: Each branch inventory record maintains:
   - `stock_units`: Number of intact, unopened commercial containers.
   - `current_volume`: Remaining volume (ml/g) inside the currently opened container.
2. **Auto-Unseal Mechanism**:
   - Stock in operations increment `stock_units`.
   - BOM deductions reduce `current_volume`.
   - When `current_volume` is insufficient for a service deduction, the engine automatically unseals 1 unit (`stock_units--`), replenishes `current_volume += volume_or_weight_per_unit`, and completes the deduction.
3. **Immutable Logging**: All stock-in, consumption, and adjustment operations append an immutable `inventory_transactions` record capturing unit deltas, volume deltas, and resulting balances.

## Consequences

- Stylists do not need to pause service workflows to perform manual container transfer slips.
- Salon managers can perform quick visual stocktakes (counting sealed boxes/bottles) while maintaining granular chemical cost accounting.
- In edge cases where a deduction exceeds `current_volume + (stock_units * volume_or_weight_per_unit)`, the transaction throws an `INSUFFICIENT_STOCK` domain exception and prevents negative stock.
