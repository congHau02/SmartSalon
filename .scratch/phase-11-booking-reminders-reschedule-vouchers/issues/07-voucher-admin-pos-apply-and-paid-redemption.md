# 07: Vouchers — Admin Management, POS Apply & Redemption on PAID

**What to build:** An ADMIN opens a **"Voucher"** page in the Admin Portal (minimalist-ui) to create, edit and activate/deactivate chain-wide vouchers, optionally restricted to specific branches, and sees each voucher's used count; a MANAGER can view vouchers valid at their branch. At the POS checkout tab a cashier types or removes a voucher code on an unpaid `Order`. The system validates it and sets `Order.discount_amount` to whichever is larger, the voucher discount or the `Membership Tier` discount — never both (extends ADR-0012). The discount line shows which one won. A manual staff discount override still takes precedence as today. Usage is counted only when the `Order` becomes `PAID`, inside the existing unified settlement transaction, with a pessimistic lock on the voucher row and a `voucher_redemptions` row whose UNIQUE `order_id` blocks double counting. `OrderItem.unit_price` stays at catalog price, so the `Commission Ledger` (ADR-0009) and P&L discount pro-rating (ADR-0010) are unchanged. See the spec (`../spec.md`, "Vouchers").

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] New Flyway migration (next free version) creates `vouchers`, `voucher_branches`, `voucher_redemptions` (UNIQUE `order_id`) and adds nullable `voucher_id` to `orders`.
- [ ] Voucher module (entity, repository, service, controller, mapper, validator) following existing package conventions; codes stored upper-case and matched case-insensitively.
- [ ] `VoucherValidator` checks, each with a distinct error code: exists, active, within `starts_at`/`ends_at`, branch allowed (empty set = all), subtotal ≥ `min_order_amount`, `used_count < usage_limit` (null = unlimited), customer redemptions < `per_customer_limit` (skipped for `walkin.guest`).
- [ ] Discount: `PERCENT` → `subtotal × value / 100` capped by `max_discount`; `FIXED` → `value`; both clamped to `[0, subtotal]`. Domain unit tests cover cap and clamp.
- [ ] Admin API: create/update/list (ADMIN write; ADMIN + branch-scoped MANAGER read) and activate/deactivate; POS API: apply/remove a voucher on an unpaid order.
- [ ] Auto-computed discount is `max(tier, voucher)`; `orders.voucher_id` set only when the voucher wins; manual override unchanged.
- [ ] On `PAID`: lock the voucher, re-validate, increment `used_count`, insert redemption; invalid now → `VOUCHER_NO_LONGER_VALID`, settlement rolls back.
- [ ] Admin vouchers page (table + form dialog, query hooks, columns/options in `*.constants`) and POS checkout voucher input with rejection messages.
- [ ] MockMvc tests: every validator rejection; tier vs voucher picks the larger and never sums; commission ledger identical with and without voucher; redemption only on `PAID`; per-customer limit; branch restriction; concurrent checkout of the last usage → exactly one succeeds (prior art: POS concurrency integration test).
- [ ] Frontend vitest for tier-vs-voucher display logic (prior art: POS calculations test).
- [ ] ADR-0015 records non-stacking + redemption-at-`PAID`; `GLOSSARY.md` gains **Voucher** and **Voucher Redemption**.
