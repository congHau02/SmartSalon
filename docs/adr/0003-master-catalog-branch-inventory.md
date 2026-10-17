# 0003 Master Catalog and Branch Inventory Decoupling

We decoupled the system-wide product catalog from physical branch inventories by creating a separate `branch_inventories` model instead of tying stock levels directly to `products`.

## Context

Salon chains share common products (e.g., L'Oréal shampoo, Wella hair color) across all branches with unified barcodes, SKUs, and packaging specifications, but each physical salon branch manages its own local stock levels, safety alert thresholds, and replenishment orders. Storing branch foreign keys directly on `products` would force duplicated product records across branches and break global catalog analytics.

## Decision

1. **Master Catalog**: `products` stores global item definitions (`sku`, `barcode`, `name`, `unit`, `volume_or_weight_per_unit`, `volume_unit`, `cost_price`, `retail_price`) without branch stock state.
2. **Branch Inventory**: `branch_inventories` maintains the physical stock quantities (`stock_units`, `current_volume`, `min_stock_alert_units`) keyed uniquely by `(branch_id, product_id)`.
3. **Audit Trail**: Stock movements (`inventory_transactions`) reference both `branch_id` and `product_id`.

## Consequences

- SKUs remain unique system-wide across all salon branches.
- Adding a new branch automatically supports catalog provisioning without duplicating master product definitions.
- Inventory queries require joining `branch_inventories` with `products`, which is mitigated via composite indexes on `(branch_id, product_id)`.
