# 0009 Two-Tier Service Commission Pool, Transactional POS Checkout & Hybrid Cloudinary Visual Log

We structured POS checkout around an atomic transaction that settles payment, deducts actual or standard `BOM` consumables plus retail units, and records immutable `Commission Ledger` entries computed via a two-tier `Service Commission Pool` formula, paired with a hybrid Cloudinary/Local storage provider for `Visual Log` photographs.

## Context

In `V2__catalog_inventory_auth.sql`, `service_default_steps.commission_rate` values represent relative step weights summing to `100.00%` (e.g., `15% + 65% + 20% = 100%`). Multiplying `commission_rate` directly against the service price would pay out 100% of service revenue as commission. Furthermore, during active treatments, technicians may adjust chemical amounts from the standard `BOM` and attach `Before/After` photographs in the `Visual Log`, requiring both accurate stock deduction at checkout and reliable image uploads in both cloud and local environments.

## Decision

1. **Two-Tier Service Commission Pool (`services.commission_pool_rate`)**:
   - Each service defines a `commission_pool_rate` (default `20.00%` of the service price).
   - Each `Step Assignment` receives its share of that pool:
     $$\text{commission\_amount} = \text{order\_item.total\_price} \times \frac{\text{service.commission\_pool\_rate}}{100} \times \frac{\text{step.commission\_rate}}{100}$$
   - Upon `Order` checkout (`PAID`), the system writes immutable records to `commission_ledgers` with a human-readable `calculation_notes` breakdown.
2. **Actual BOM Override in `Visual Log` & Atomic Checkout Deduction**:
   - `technical_logs` stores `actual_bom_json` capturing the actual `ml`/`g` chemical quantities mixed for the order (pre-populated from the service's standard `BOM`).
   - Executing POS Checkout runs inside a single `@Transactional` boundary:
     - Deducts chemical volumes via `InventoryService.deductConsumables(...)` using `actual_bom_json` if recorded, or falling back to the standard `BOM` of all service items in the order.
     - Deducts sealed `stock_units` in `BranchInventory` for any retail `PRODUCT` items sold on the order.
     - Deducts any paid `Booking` `Deposit` from the order total, records the final `Payment Transaction`, and transitions `Order` to `PAID` and the originating `Booking` (if any) to `COMPLETED`.
3. **Hybrid Cloudinary + Local Static Fallback**:
   - Image uploads for `Visual Log` (`before_image_url`, `after_image_url`) go through a backend multipart endpoint (`POST /api/v1/pos/media/upload`).
   - When `app.cloudinary.{cloud-name,api-key,api-secret}` are configured, the backend uploads directly to Cloudinary (`smartsalon/visual-logs`) and returns the `secure_url`.
   - When Cloudinary credentials are absent in local/CI environments, the backend stores the uploaded file under `uploads/visual-logs/` and serves it via `/uploads/visual-logs/**`.

## Consequences

- Existing V2 step weights (`15% / 65% / 20%`) remain valid while keeping total staff commission payouts financially realistic (`20%` of service revenue by default).
- Inventory deduction, commission accounting, and order settlement never drift out of sync because they commit or roll back together at checkout.
- Developers and testers can upload and preview `Before/After` treatment photos out of the box locally while production uses Cloudinary CDN.
