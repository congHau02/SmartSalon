# 0012 Provisional Customer In-Place Claim, Spend-Based Membership Tiers & Retained Deposit Offset

We upgrade auto-created `Provisional Customer` records in-place upon registration, compute `Membership Tier` discounts from `Cumulative Spend` onto `Order.discount_amount` without altering catalog item prices (`ADR-0009`), auto-offset `Retained Deposit` balances across future `Bookings` and POS `Orders`, and attribute post-visit `Service Reviews` to participating stylists weighted by step commission share.

## Context

In Phases 3–5, `CustomerIdentityService` automatically persists a `users` record (`guest_<phone>` or `<phone>`) whenever an unauthenticated customer creates a `Booking` or `Walk-in Order` with a phone number, linking all `Bookings`, `Orders`, and `Visual Logs` to that `user_id`. However, `AuthService.register` previously rejected any phone number already present in `users` with `USER_ALREADY_EXISTS`, preventing returning walk-in customers from registering an account. Additionally, introducing loyalty discounts, online cancellation credit, and stylist ratings must not break `ADR-0009` (which computes `Commission Ledger` payouts from catalog `OrderItem.total_price`) or `ADR-0010` (which pro-rates `Order.discount_amount` across service and retail revenue).

## Decision

1. **In-Place Claim of `Provisional Customer` Profiles (`users.is_provisional`)**:
   - Add `is_provisional TINYINT(1) NOT NULL DEFAULT 0` to `users` (`1` when auto-created by `CustomerIdentityService`, `0` when explicitly registered or seeded as active accounts).
   - When `POST /api/v1/auth/register` receives a phone number belonging to an existing user with `is_provisional = true`, it upgrades that `users` row in-place (updating `username`, `password_hash`, `full_name`, `email`, and setting `is_provisional = false`), preserving all existing `orders`, `bookings`, `technical_logs`, and `Cumulative Spend` without migrating foreign keys. `USER_ALREADY_EXISTS` is thrown only when `is_provisional = false`.
2. **Spend-Based `Membership Tier` & Commission-Safe Order Discounts**:
   - Track `total_spent DECIMAL(15, 2)` (`Cumulative Spend`) and `membership_tier VARCHAR(20)` (`STANDARD`: $< 2\text{M}$ / $0\%$, `SILVER`: $\ge 2\text{M}$ / $5\%$, `GOLD`: $\ge 5\text{M}$ / $10\%$, `DIAMOND`: $\ge 10\text{M}$ / $15\%$) on `users`.
   - When an `Order` transitions to `PAID` (for identified customers excluding `walkin.guest`), increment `total_spent` by `totalNetRevenue` ($\text{subtotal} - \text{effectiveDiscount} = \text{final\_amount} + \text{deposit\_deducted}$) so customers receive full spend credit for both upfront `Deposits` and POS settlements.
   - Keep `Booking.total_price` and `OrderItem.unit_price` at catalog prices so staff commissions in the `Commission Ledger` (`ADR-0009`) are never reduced by loyalty discounts. Automatically populate `Order.discount_amount` with $\text{subtotal} \times \text{tierDiscountRate}$ when creating or updating items on an unpaid `Order` unless manually overridden by staff at POS.
3. **`Retained Deposit` (`users.credit_balance`) Lifecycle**:
   - Cancelling a `Booking` at least 2 hours before `booking_time` releases its Redis `Slot Locks` and transitions `status` to `CANCELLED`. If `deposit_status == PAID` and `deposit_amount > 0`, add `deposit_amount` to `users.credit_balance` (`Retained Deposit`) and set `deposit_status = CREDITED`.
   - When creating a new `Booking` for a customer with `credit_balance > 0`, automatically apply $\min(\text{credit\_balance}, \text{deposit\_amount})$. If `credit_balance` covers the full `deposit_amount`, record a `CREDIT_BALANCE` `Payment Transaction` and create the `Booking` directly as `CONFIRMED` (`deposit_status = PAID`) without requiring a VietQR transfer. Any remaining `credit_balance` is applied to the order at POS checkout (inside `executeUnifiedSettlement`, under a pessimistic lock on the customer); order previews and VietQR show the net amount without mutating the balance.
4. **`Service Review` Attribution on Multi-Stylist `Orders`**:
   - Store one `Service Review` (`1..5` rating and comment) per `PAID` service `Order` in `service_reviews`.
   - Because `orders` has no single `staff_id`, resolve the default Primary Stylist as the stylist with the highest total earned `commission_amount` across the Order's `Step Assignments` (tie-breaking by `booking.staff`), while allowing the customer to select among all stylists who completed steps on that `Order`.

## Consequences

- Returning walk-in customers can register online with their phone number and immediately see their past visits, `Visual Logs` (excluding internal `actual_bom_json` stock data), and `Membership Tier`.
- Loyalty discounts flow cleanly through `Order.discount_amount`, keeping `ADR-0009` staff commissions and `ADR-0010` P&L discount pro-rating completely unchanged.
