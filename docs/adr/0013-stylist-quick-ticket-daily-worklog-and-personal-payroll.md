# 0013 Unified Stylist Quick Service Ticket, Daily Worklog Reconciliation & Personal Payroll Boundary

We implemented receptionist-free stylist ticket creation (`Quick Service Ticket`) and daily shift reconciliation (`Stylist Daily Worklog`) directly on top of the canonical POS `Order`, `OrderStepAssignment`, `InventoryTransaction`, and `Commission Ledger` domain entities, paired with a privacy-scoped `Personal Payroll Statement` endpoint (`GET /api/v1/analytics/my-payroll`) and database-backed branch geolocation coordinates (`latitude`, `longitude`) for interactive OpenStreetMap/Leaflet discovery.

## Context

In branches without a dedicated receptionist (`STAFF`) or on days when the receptionist is off-duty (such as `SmartSalon Luxury - Quận 3`), stylists (`STYLIST`) must record completed services, collect cash or VietQR payments at the chair, and reconcile their daily ticket count and cash-in-hand at shift end. Creating a separate "stylist ticket tally" table outside the POS `Order` pipeline would desynchronize `Branch Inventory` chemical `BOM` deductions (`ADR-0009`), realized P&L analytics (`ADR-0010`), customer `Cumulative Spend` progression (`ADR-0012`), and the immutable `Commission Ledger`. At the same time, staff members (`STYLIST` and `STAFF`) need self-service visibility into their own `Base Salary`, earned commissions, and retention KPIs without exposing peer compensation data (`GET /api/v1/analytics/staff-payroll` is restricted to `ADMIN` and `MANAGER`).

## Decision

1. **Atomic `Quick Service Ticket` on the Canonical `Order` Pipeline**:
   - Provide streamlined POS endpoints (`POST /api/v1/pos/stylist/quick-ticket` for walk-in visits and `POST /api/v1/pos/stylist/bookings/{bookingId}/quick-complete` for scheduled bookings) that execute creation, 100% step attribution to the executing stylist, standard `BOM` chemical inventory deduction, retail stock deduction, `Payment Transaction` recording, and `Commission Ledger` settlement in a single `@Transactional` boundary, immediately transitioning the `Order` to `PAID`.
2. **`Stylist Daily Worklog` & Collector-Scoped Shift Handover**:
   - `GET /api/v1/pos/stylist/daily-worklog` aggregates a stylist's daily completed `Orders`, `Service Steps`, item details, and earned `Commission Ledger` entries.
   - To prevent end-of-day cash handover confusion between receptionist-collected orders and stylist-collected orders, the worklog separates **Personal Service Production** (all orders/steps performed by the stylist) from **Collected Funds for Shift Handover** (cash `CASH` vs. electronic `VIETQR`/`CARD` on orders settled directly by that stylist).
3. **Privacy-Scoped `Personal Payroll Statement` (`GET /api/v1/analytics/my-payroll`)**:
   - Expose a dedicated endpoint accessible to `STYLIST`, `STAFF`, `MANAGER`, and `ADMIN` that resolves the authenticated user from the security context and computes only their own `StaffPerformanceResponse` (`Base Salary`, `Commission Ledger` history, `Total Payout`, `Requested Stylist Rate`, `Re-booking Rate`, and `Service Review` rating) for the requested date range.
4. **Branch Geolocation Coordinates & Keyless Interactive Map**:
   - Add `latitude` and `longitude` (`DECIMAL(10, 7)`) to `branches` (`V7__branch_coordinates_and_stylist_worklog.sql`) and render an interactive Leaflet/OpenStreetMap map with Haversine distance sorting and direct Google Maps turn-by-turn directions (`google.com/maps/dir`) in Step 1 of the Customer Booking Wizard.

## Consequences

- Every `Quick Service Ticket` logged by a stylist automatically updates `Branch Inventory`, `Commission Ledger`, customer loyalty spend, and executive P&L reports with zero duplicate data entry or reconciliation drift.
- `STYLIST` and `STAFF` users can track their personal earnings and daily ticket tallies transparently while peer base salaries remain strictly confidential to `ADMIN` and `MANAGER`.
