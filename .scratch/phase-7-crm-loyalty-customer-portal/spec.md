# Specification: Phase 7 - Customer Portal, Spend-Based Membership Tiers, Retained Deposit & Service Reviews

Status: done

## Problem Statement

Although SmartSalon already provides end-to-end support for online `Booking` with Redis `Slot Lock` and 20% PayOS `Deposit`, real-time POS `Dispatch Board` coordination, `Visual Log` before/after documentation, dual-level `Branch Inventory` (`Sealed Unit` to `Opened Volume`), two-tier `Commission Ledger` accounting, and realized P&L analytics, the platform currently treats customer engagement as a one-way transaction and leaves critical gaps in customer retention and self-service:

1. **Provisional Walk-in & Booking Profiles Cannot Be Claimed on Registration**:
   - Whenever an unauthenticated customer creates a `Booking` or a receptionist creates a `Walk-in Order` with a phone number, the system automatically creates a `Provisional Customer` profile bound to that phone number and links all `Bookings`, `Orders`, and `Visual Logs` to it. However, the registration flow currently rejects any phone number that already exists in the user table with a duplicate-user error, making it impossible for returning walk-in or unauthenticated customers to register login credentials and claim their historical visits.
2. **No Spend-Based Loyalty (`Membership Tier`) or Automatic Member Discounts**:
   - Customers who repeatedly visit the salon receive no recognition or automatic loyalty pricing based on their `Cumulative Spend`. Receptionists must manually calculate and type ad-hoc discounts at POS without visibility into a customer's lifetime spend or tier status (`STANDARD`, `SILVER`, `GOLD`, `DIAMOND`), and online bookers see no preview of their member discount during reservation checkout.
3. **No Self-Service Customer Portal for Appointments, Beauty History, or `Retained Deposit` Cancellation**:
   - Authenticated customers have no personal workspace to inspect their upcoming `Bookings`, review past completed `Orders`, or view their personal `Visual Log` hair/skin transformation gallery (before/after photos and stylist care notes).
   - Furthermore, customers cannot cancel an upcoming `Booking` online even when cancelling well in advance ($\ge 2$ hours before the scheduled time), nor is there a mechanism to preserve their paid 20% `Deposit` as a `Retained Deposit` credit that automatically offsets their next `Booking` or POS `Order`.
4. **No Post-Visit `Service Review` & Stylist Rating Loop**:
   - Customers cannot rate or review the stylist who served them after an `Order` is completed. Consequently, prospective customers choosing a stylist in the `Booking` wizard cannot see average star ratings or review counts per stylist, and salon managers evaluating staff KPIs in the Staff Performance dashboard lack customer satisfaction ratings alongside `Requested Stylist Rate` and `Re-booking Rate`.

## Solution

Deliver an integrated Customer Relationship Management (CRM), Spend-Based `Membership Tier` Engine, `Retained Deposit` Credit Lifecycle, Post-Visit `Service Review` System, and Self-Service Customer Portal:

1. **In-Place Claim of `Provisional Customer` Accounts**:
   - Distinguish `Provisional Customer` records (auto-created via phone lookup during unauthenticated `Bookings` or `Walk-in Orders`) from formally registered accounts.
   - When a customer registers with a phone number matching an existing `Provisional Customer`, upgrade that profile in-place with the customer's chosen username, password, full name, and email, immediately preserving all historical `Bookings`, `Orders`, `Visual Logs`, `Cumulative Spend`, and `Membership Tier` status.
2. **Spend-Based `Membership Tier` Engine & Commission-Safe Automatic Discounts**:
   - Track each identified customer's `Cumulative Spend` across all `PAID` `Orders` (using net order revenue $\text{subtotal} - \text{effectiveDiscount}$ so upfront `Deposits` are fully counted) and automatically assign one of four `Membership Tiers`:
     - `STANDARD`: `Cumulative Spend` $< 2,000,000\text{ VND}$ ($0\%$ discount)
     - `SILVER`: `Cumulative Spend` $\ge 2,000,000\text{ VND}$ ($5\%$ discount)
     - `GOLD`: `Cumulative Spend` $\ge 5,000,000\text{ VND}$ ($10\%$ discount)
     - `DIAMOND`: `Cumulative Spend` $\ge 10,000,000\text{ VND}$ ($15\%$ discount)
   - Keep catalog prices on `Booking` items and `Order` items untouched (preserving 100% of staff commissions in the `Commission Ledger` under `ADR-0009`), while displaying expected member savings in the `Booking` wizard and automatically pre-filling `Order` discount amounts at POS check-in, walk-in creation, and item updates (with manual receptionist override support).
3. **Self-Service Online Cancellation & Automatic `Retained Deposit` Offset**:
   - Allow customers to cancel their own `PENDING_PAYMENT` or `CONFIRMED` `Bookings` from the Customer Portal when at least 2 hours remain before the scheduled appointment time, immediately releasing any active Redis `Slot Locks` and freeing the stylist's schedule.
   - When a `CONFIRMED` `Booking` with a paid `Deposit` is cancelled $\ge 2$ hours in advance, credit the paid `Deposit` amount into the customer's `Retained Deposit` balance and mark the booking's deposit state as `CREDITED`.
   - Automatically apply available `Retained Deposit` funds toward the customer's next `Booking` `Deposit` (confirming the `Booking` immediately without requiring a VietQR transfer if the credit covers the full 20% `Deposit`) and toward remaining balances upon POS `Order` check-in or walk-in creation.
4. **Post-Visit `Service Review` & Stylist Rating Integration**:
   - Enable customers to submit one `Service Review` (1-to-5 star rating and comment) per `PAID` service `Order`, defaulting attribution to the Primary Stylist (the technician with the highest earned commission share across the Order's `Step Assignments`) while allowing selection among any stylist who participated in that `Order`.
   - Surface each stylist's average star rating and review count on the stylist selection cards in the `Booking` wizard and as dedicated KPI columns in the Admin Staff Performance & Payroll report.
5. **Customer Personal Portal (`/customer/profile`)**:
   - Provide a dedicated authenticated workspace under the Customer Portal layout featuring three tabs:
     - **Lịch hẹn của tôi (My Bookings)**: Upcoming and past `Bookings` with status badges, stylist details, `Deposit` information, and one-click online cancellation ($\ge 2$ hours before start time).
     - **Hịch sử Làm đẹp & Hồ sơ Kỹ thuật (Beauty History & `Visual Log` Gallery)**: Completed `PAID` `Orders` showing performed services, net amount paid, before/after photographs, hair condition notes, and care/formula summaries from the `Visual Log` (with internal chemical `BOM` inventory data stripped for privacy), plus an interactive **"Đánh giá dịch vụ"** modal.
     - **Hạng Thành viên & Quyền lợi (`Membership Tier` & Benefits)**: Interactive VIP membership card displaying current `Membership Tier`, discount percentage, `Cumulative Spend`, progress bar toward the next tier, and available `Retained Deposit` balance.

## User Stories

1. As a returning walk-in customer who previously gave my phone number at the salon counter, I want to register an online account using my phone number without receiving a "user already exists" error, so that my past `Orders`, `Visual Logs`, and `Cumulative Spend` are automatically linked to my new login.
2. As an already-registered customer, I want the system to reject any new registration attempt that uses my registered phone number or username, so that no one else can hijack my claimed account.
3. As an identified customer completing a `PAID` `Order` at POS, I want my `Cumulative Spend` to increase by the full net revenue of my visit ($\text{subtotal} - \text{effectiveDiscount}$, including any `Deposit` I paid upfront), so that my upfront `Deposit` still counts toward my loyalty progression.
4. As a customer whose `Cumulative Spend` reaches $2,000,000\text{ VND}$, $5,000,000\text{ VND}$, or $10,000,000\text{ VND}$, I want my `Membership Tier` to automatically upgrade to `SILVER` ($5\%$), `GOLD` ($10\%$), or `DIAMOND` ($15\%$) within the same checkout transaction, so that I immediately unlock higher benefits for future visits.
5. As a logged-in customer browsing the Customer Portal, I want to see my name, current `Membership Tier` badge, and quick navigation link to my personal profile in the portal header, so that I always know my loyalty status and can access my history in one click.
6. As a logged-in customer or a returning customer identified by phone in the `Booking` wizard, I want the booking summary step to display my `Membership Tier` badge and estimated member discount alongside the catalog service total and 20% `Deposit`, so that I have full transparency into the final price I will pay at the salon.
7. As a stylist performing a `Service Step` on a discounted member `Order`, I want my commission in the `Commission Ledger` to still be calculated from the catalog service price rather than the discounted net price, so that salon loyalty promotions never reduce my earned pay.
8. As a receptionist checking in a `Booking` or creating a `Walk-in Order` for an identified customer, I want the system to automatically pre-fill the `Order`'s discount amount with the customer's `Membership Tier` percentage ($\text{subtotal} \times \text{tierDiscountRate}$), so that member benefits are applied consistently without manual mental math.
9. As a receptionist adding or removing services or retail products on an active unpaid `Order`, I want the automatic `Membership Tier` discount to recalculate proportionally unless I have manually overridden the discount amount at POS, so that the bill stays accurate as items change while still allowing custom promotional overrides.
10. As a receptionist viewing the POS `Order` drawer, I want to see the customer's `Membership Tier` badge, discount rate, and `Retained Deposit` balance clearly next to their name and phone number, so that I can greet VIP members appropriately and verify their applied benefits.
11. As a logged-in customer viewing the **Lịch hẹn của tôi** tab on the Customer Portal, I want to see all of my upcoming and historical `Bookings` ordered from newest to oldest with branch name, stylist name, scheduled time window, service list, `Deposit` amount, and status badge.
12. As a logged-in customer with an upcoming `PENDING_PAYMENT` or `CONFIRMED` `Booking` that starts at least 2 hours from now, I want to click **"Hủy lịch hẹn"** to cancel my reservation online, so that I do not have to call the salon when my schedule changes.
13. As a branch manager or stylist, I want any active Redis `Slot Locks` and stylist time buckets associated with a customer-cancelled `Booking` to be released immediately upon cancellation, so that other customers can book that time window right away.
14. As a logged-in customer cancelling a `CONFIRMED` `Booking` (with a paid 20% `Deposit`) at least 2 hours before the appointment start time, I want my paid `Deposit` to be automatically preserved in my `Retained Deposit` balance (`credit_balance`) and the booking's deposit status marked as `CREDITED`, so that I do not lose my money when cancelling on time.
15. As a logged-in customer whose `Booking` is less than 2 hours away, I want the online **"Hủy lịch hẹn"** button to be disabled with a clear notice explaining the 2-hour cancellation policy and hotline contact, so that last-minute cancellations do not leave stylists with unfillable gaps.
16. As a customer with a positive `Retained Deposit` balance creating a new `Booking`, I want the system to automatically apply my `Retained Deposit` toward the new 20% `Deposit` requirement—and if my `Retained Deposit` covers the entire required `Deposit`, immediately confirm my `Booking` (`CONFIRMED`, `deposit_status = PAID`) without showing a VietQR payment screen—so that re-booking after a cancellation is frictionless.
17. As a customer whose `Retained Deposit` only partially covers the new `Booking`'s 20% `Deposit` (or who still has leftover `Retained Deposit` when checking in or walking into the salon), I want the remaining `Retained Deposit` balance to be automatically applied to `deposit_deducted` on my POS `Order` (or reduce the remaining VietQR deposit amount), so that every VND of my preserved credit is honored.
18. As a logged-in customer viewing the **Lịch sử Làm đẹp & Hồ sơ Kỹ thuật** tab on the Customer Portal, I want to see all of my `PAID` `Orders` along with a before/after photo comparison, hair/skin condition notes, and care summary from each visit's `Visual Log`, so that I can track my hair transformation over time.
19. As a salon owner, I want customer-facing `Visual Log` responses on the Customer Portal to exclude the internal `actual_bom_json` chemical inventory array, so that internal gram/milliliter stock consumption and supplier SKU data remain confidential to salon staff.
20. As a logged-in customer viewing a completed `PAID` `Order` that included at least one salon service, I want to click **"Đánh giá dịch vụ"** and submit a 1-to-5 star rating and comment for my stylist, so that I can share feedback on my experience.
21. As a logged-in customer reviewing an `Order` in which multiple stylists performed different `Service Steps`, I want the review modal to pre-select the Primary Stylist (the stylist with the highest commission weight on the `Order`) while allowing me to choose any of the stylists who worked on my `Order`, so that my rating goes to the right technician.
22. As a logged-in customer who has already submitted a `Service Review` for an `Order`, I want to see my submitted star rating, comment, and reviewed stylist name directly on that order card instead of the review button, and I want the backend to reject duplicate reviews for the same `Order`.
23. As a customer choosing a stylist in the `Booking` wizard, I want each stylist card to display their average star rating (e.g., `4.9 ★`) and total review count alongside their specialty, so that I can confidently pick a highly rated stylist.
24. As a salon owner or branch manager viewing the Staff Performance & Payroll tab on the Executive Dashboard, I want to see each stylist's average star rating and total `Service Review` count alongside their `Requested Stylist Rate` and `Re-booking Rate`, so that I can evaluate service quality alongside revenue and retention KPIs.
25. As a logged-in customer viewing the **Hạng Thành viên & Quyền lợi** tab on the Customer Portal, I want to see a visual membership card showing my current `Membership Tier` (`STANDARD`, `SILVER`, `GOLD`, or `DIAMOND`), my automatic discount rate ($0\%$, $5\%$, $10\%$, or $15\%$), my `Cumulative Spend`, a progress bar showing how much more spend is needed for the next tier, my `Retained Deposit` balance, and a table of all four tier benefits.
26. As a developer or evaluator launching SmartSalon, I want the V6 database migration to backfill `Cumulative Spend` and `Membership Tiers` for seeded customers from historical `PAID` `Orders` and seed realistic `Service Reviews` across branch stylists, so that member badges, stylist star ratings, and Customer Portal history work out of the box.

## Implementation Decisions

### 1. Schema Evolution & Seed Data Backfill (Flyway V6)
- **Customer Loyalty & Provisional Profile Columns on `users`**:
  - `total_spent DECIMAL(15, 2) NOT NULL DEFAULT 0.00`: Tracks the customer's `Cumulative Spend` across all `PAID` `Orders`.
  - `membership_tier VARCHAR(20) NOT NULL DEFAULT 'STANDARD'`: Stores the customer's current `Membership Tier` (`STANDARD`, `SILVER`, `GOLD`, `DIAMOND`).
  - `credit_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00`: Tracks the customer's available `Retained Deposit` balance in VND.
  - `is_provisional TINYINT(1) NOT NULL DEFAULT 0`: Marks whether the customer profile was auto-created from a phone number (`1`) versus explicitly registered or seeded as an active account (`0`).
  - `is_discount_manual TINYINT(1) NOT NULL DEFAULT 0` on `orders`: Tracks whether a receptionist manually overrode `discount_amount` on a POS `Order` so subsequent item additions do not overwrite a custom manual discount.
- **`Service Review` Table (`service_reviews`)**:
  - Columns: `id` (PK), `order_id` (`BIGINT NOT NULL UNIQUE` referencing `orders`), `customer_id` (`BIGINT NOT NULL` referencing `users`), `stylist_id` (`BIGINT NOT NULL` referencing `users`), `branch_id` (`BIGINT NOT NULL` referencing `branches`), `rating` (`INT NOT NULL` constrained to `1..5`), `comment` (`TEXT NULL`), `created_at`, `updated_at`, `is_deleted` (`TINYINT(1) NOT NULL DEFAULT 0`).
  - Indexes on `(stylist_id, is_deleted)` and `(customer_id, is_deleted)` for fast rating aggregation and customer history lookup.
- **V6 Seed & Backfill**:
  - Recompute and backfill `users.total_spent` and `users.membership_tier` from existing V4/V5 `PAID` `Orders` for all identified customers (excluding `walkin.guest`), promoting seeded loyal customers (`cust.ha`, `cust.tri`, etc.) to their corresponding `Membership Tiers`.
  - Seed representative `Service Reviews` (`4` and `5` stars with Vietnamese feedback comments) linked to historical `PAID` `Orders` so stylists immediately display realistic average ratings and review counts in the `Booking` wizard and Admin Staff Performance report.

### 2. `Provisional Customer` Claim & Loyalty Tier Engine
- **In-Place Profile Claim on Registration**:
  - When `CustomerIdentityService` auto-creates a new `users` record for an unauthenticated `Booking` or `Walk-in Order` phone number, it sets `is_provisional = true`.
  - When `AuthService.register` is called with `username`, `phone`, `password`, `fullName`, and `email`:
    - If a user with `phone` already exists and has `is_provisional == true`:
      - Verify that the requested `username` (and `email`, if provided) does not collide with any *other* user record.
      - Update the existing `users` record in-place: set `username`, `passwordHash`, `fullName`, `email`, `branch`, and `is_provisional = false`.
      - Recalculate `total_spent` and `membership_tier` from all `PAID` `Orders` linked to that `user.id`.
    - If a user with `phone` or `username` already exists with `is_provisional == false`, reject with `USER_ALREADY_EXISTS`.
- **`Membership Tier` Thresholds & Discount Rates**:
  - Define a canonical `MembershipTier` enum:
    $$\text{Tier}(S) = \begin{cases} \text{DIAMOND } (15\%) & \text{if } S \ge 10,000,000 \\ \text{GOLD } (10\%) & \text{if } 5,000,000 \le S < 10,000,000 \\ \text{SILVER } (5\%) & \text{if } 2,000,000 \le S < 5,000,000 \\ \text{STANDARD } (0\%) & \text{if } S < 2,000,000 \end{cases}$$
- **Automatic Tier Discount Application & `Cumulative Spend` Progression**:
  - For any identified customer (excluding `walkin.guest`), when an `Order` is created (`checkInBooking` or `createWalkInOrder`) or when items are added/removed on an unpaid `Order` where `is_discount_manual == false`:
    $$\text{discount\_amount} = \text{ round}\!\left(\text{subtotal} \times \frac{\text{customer.membershipTier.discountPercent}}{100}\right)$$
  - When a receptionist explicitly updates `discount_amount` via `PATCH /api/v1/pos/orders/{orderId}` or provides a custom discount at checkout that differs from the automatic tier discount, set `is_discount_manual = true` and clamp the discount to $[0, \max(0, \text{subtotal} - \text{deposit\_deducted})]$.
  - When an `Order` transitions to `PAID` during POS checkout for an identified customer:
    - Compute realized net order spend: $\Delta S = \text{order.calculateRevenueBreakdown().totalNetRevenue()} = \text{subtotal} - \text{effectiveDiscount}$.
    - Update `customer.totalSpent = customer.totalSpent + \Delta S` and `customer.membershipTier = MembershipTier.fromTotalSpent(customer.totalSpent)`.
- **Customer Benefit Preview in Booking Wizard**:
  - Add a public/authenticated lookup endpoint `GET /api/v1/customers/loyalty-preview?phone={phone}` (or include loyalty fields on `/api/v1/auth/me` and booking responses) returning `membershipTier`, `discountPercent`, `totalSpent`, `nextTier`, `amountToNextTier`, and `creditBalance` so the `Booking` wizard can display the customer's tier badge, estimated member discount, and available `Retained Deposit` before confirming the reservation.

### 3. Self-Service Cancellation & `Retained Deposit` Lifecycle
- **2-Hour Online Cancellation Policy (`POST /api/v1/customer/bookings/{id}/cancel` or `PATCH /api/v1/bookings/{id}/status`)**:
  - Customers may cancel their own `Booking` only when `status` is `PENDING_PAYMENT` or `CONFIRMED` and $\text{bookingTime} - \text{now} \ge 2\text{ hours}$ (120 minutes). Attempting to cancel within 2 hours of `bookingTime` as a customer returns a domain validation error (`BOOKING_CANCELLATION_WINDOW_EXPIRED`). Staff/Admin users retain full status management permissions.
  - Upon cancellation:
    - Release any active Redis `Slot Locks` for the assigned stylist across `[bookingTime, endTime)`.
    - Transition `booking.status` to `CANCELLED`.
    - If `booking.depositStatus == DepositStatus.PAID` and `booking.depositAmount > 0` and the customer is an identified customer:
      - Add `booking.depositAmount` to `customer.creditBalance`.
      - Transition `booking.depositStatus` to `DepositStatus.CREDITED`.
- **Automatic `Retained Deposit` Offset on Next `Booking` or `Order`**:
  - **During `Booking` creation (`holdSlotAndCreate`)**:
    - For an identified customer with `creditBalance > 0` and required `depositAmount > 0`:
      - Let $\text{appliedCredit} = \min(\text{customer.creditBalance}, \text{depositAmount})$.
      - Deduct `appliedCredit` from `customer.creditBalance`.
      - If `appliedCredit == depositAmount` (full 20% `Deposit` covered by `Retained Deposit`):
        - Set `booking.status = BookingStatus.CONFIRMED`, `booking.depositStatus = DepositStatus.PAID`, and `booking.slotLockExpiresAt = null`.
        - Release temporary Redis `Slot Locks` (since the `CONFIRMED` DB record now guards the slot permanently).
        - Persist a `SUCCESS` `Payment Transaction` with `paymentMethod = 'CREDIT_BALANCE'` and `amount = appliedCredit`.
      - If $0 < \text{appliedCredit} < \text{depositAmount}$, deduct `appliedCredit` from the remaining amount requested via PayOS/VietQR (`remainingDeposit = depositAmount - appliedCredit`), or hold `creditBalance` to be applied at POS check-in. To keep `Booking.deposit_amount` accounting atomic and single-transaction, if `creditBalance >= depositAmount`, auto-confirm immediately via `CREDIT_BALANCE`; if `creditBalance < depositAmount`, apply `creditBalance` automatically into `Order.deposit_deducted` when the `Booking` is checked in (or on the next `Walk-in Order`).
  - **During POS `checkInBooking` and `createWalkInOrder`**:
    - If the identified customer has `creditBalance > 0`, automatically apply $\text{appliedOrderCredit} = \min(\text{customer.creditBalance}, \max(0, \text{subtotal} - \text{discountAmount} - \text{depositDeducted}))$, add `appliedOrderCredit` to `order.depositDeducted`, and subtract `appliedOrderCredit` from `customer.creditBalance`.

### 4. `Service Review` & Stylist Rating Module
- **Review Eligibility & Stylist Attribution**:
  - An `Order` is eligible for a `Service Review` if and only if `order.status == OrderStatus.PAID`, the order contains at least one non-deleted `SERVICE` `OrderItem`, and no `Service Review` exists yet for `order.id`.
  - Participating stylists on an `Order` are collected from all `OrderStepAssignments` (plus `booking.staff` and `technicalLog.staff` if present), ranked by their total earned commission on that `Order` descending. The top-ranked stylist is the default **Primary Stylist**.
- **Review API Contracts**:
  - `POST /api/v1/customer/orders/{orderId}/review` (authenticated `CUSTOMER` who owns the `Order`):
    - Request body: `{ "stylistId": <optional Long, defaults to Primary Stylist>, "rating": <1..5>, "comment": "<optional string>" }`.
    - Validates ownership, `PAID` status, service eligibility, single-review uniqueness, and that `stylistId` (if provided) is an active stylist (preferring participating stylists on the `Order`).
    - Persists `ServiceReviewEntity` and returns the created review DTO.
- **Stylist Rating Aggregation Across Booking & Analytics**:
  - Enrich `StylistResponse` (`GET /api/v1/bookings/stylists` and `GET /api/v1/stylists`) with `averageRating` (`BigDecimal`, scale 1, e.g., `4.9`) and `reviewCount` (`long`).
  - Enrich `StaffPerformanceResponse` and `StaffPayrollSummaryResponse` (`GET /api/v1/analytics/staff-performance`) with `averageRating` and `reviewCount` per stylist and overall branch average rating.

### 5. Customer Portal Endpoints & Frontend Architecture
- **Customer Portal API (`/api/v1/customer/me/*`)**:
  - `GET /api/v1/customer/me/summary`: Returns customer profile, `membershipTier`, `discountPercent`, `totalSpent`, `nextTier`, `amountToNextTier`, `creditBalance`, total completed visits, and upcoming booking count.
  - `GET /api/v1/customer/me/bookings`: Returns the authenticated customer's `Bookings` with branch, stylist, items, `depositAmount`, `depositStatus`, `status`, and a computed `canCancelOnline` boolean (`true` when `status` is `PENDING_PAYMENT` or `CONFIRMED` and `bookingTime` is $\ge 2$ hours in the future).
  - `POST /api/v1/customer/me/bookings/{bookingId}/cancel`: Cancels the customer's booking under the 2-hour rule, releases Redis `Slot Locks`, and credits `Retained Deposit` if eligible.
  - `GET /api/v1/customer/me/orders`: Returns the authenticated customer's `PAID` `Orders` enriched with:
    - Performed service and product items, net paid amount, discount applied, and `depositDeducted`.
    - Participating stylists and resolved Primary Stylist.
    - Customer-safe `Visual Log` summary (`beforeImageUrl`, `afterImageUrl`, `hairConditionNotes`, `formulaNotes` — excluding `actualBomJson`).
    - Existing `Service Review` (if already rated) or `canReview = true`.
  - `POST /api/v1/customer/me/orders/{orderId}/review`: Submits the customer's `Service Review`.
- **Frontend Components (Strictly $\le 250$ LOC per file per `AGENTS.md`)**:
  - Update `CustomerLayout` header to show the logged-in customer's name, `Membership Tier` badge, `Retained Deposit` pill (if $> 0$), and navigation link to `/customer/profile` (`Hồ sơ & Thành viên`).
  - Create modular Customer Portal page and sub-components under `src/features/customer/`:
    - `CustomerPortalPage.jsx`: Tabbed container (`Lịch hẹn của tôi`, `Lịch sử & Visual Log`, `Hạng thành viên VIP`).
    - `CustomerBookingsTab.jsx`: Upcoming and past bookings list with 2-hour cancellation action and confirmation modal.
    - `CustomerOrdersTab.jsx`: Completed visits timeline with expandable `Visual Log` before/after photo viewer, care notes, and review trigger.
    - `ServiceReviewModal.jsx`: Interactive 1-to-5 star selector, stylist selector (pre-selecting Primary Stylist), and comment form.
    - `MembershipTierCard.jsx`: VIP card visualization with progress bar to next tier, `Retained Deposit` callout, and 4-tier benefit matrix.
  - Update `BookingWizardPage` / `SlotPicker` / `DepositQrStep` to display stylist star ratings (`★ 4.9`), member discount previews, and immediate confirmation when covered by `Retained Deposit`.
  - Update `PosOrderDrawer` / `PosCheckoutTab` and `StaffPayrollTab` to display customer `Membership Tier` badges and stylist rating KPIs.

## Testing Decisions

### What Makes a Good Test
- **Test observable behavior at public HTTP and service boundaries**: Every test must exercise public REST endpoints (`MockMvc`) or public service interfaces against a transactional database and Redis lock store, asserting HTTP status codes, JSON contract fields, database state transitions, financial math, and role-based access control rather than mocking internal private helpers.

### Highest-Level Seams to Test
1. **Flyway V6 Schema & Seed Backfill Seam (`FlywayMigrationTest`)**:
   - Verify `V6__customer_crm_loyalty_and_reviews.sql` applies cleanly on top of V1–V5, adds the loyalty/credit/provisional columns on `users`, creates `service_reviews`, backfills `total_spent` and `membership_tier` for seeded customers from historical `PAID` orders, and seeds initial `Service Reviews`.
2. **End-to-End Customer CRM, Loyalty, `Retained Deposit` & `Service Review` HTTP Integration Seam (`CustomerCrmIntegrationTest`)**:
   - A comprehensive `@SpringBootTest` + `@AutoConfigureMockMvc` integration suite covering all six domain flows through public REST endpoints:
     - **Flow 1 (`Provisional Customer` In-Place Claim)**: Create a `Walk-in Order` with a new phone number (creating a `Provisional Customer`), complete POS checkout so `total_spent` accumulates, then call `POST /api/v1/auth/register` with that same phone number and assert the existing `user.id`, historical `Orders`, `Cumulative Spend`, and `Membership Tier` are claimed in-place (`is_provisional = false`), while a second `/register` call with the same phone is rejected with `USER_ALREADY_EXISTS`.
     - **Flow 2 (`Cumulative Spend` & Commission-Safe `Membership Tier` Discounts)**: Complete `Orders` that cross the `SILVER` ($2\text{M}$), `GOLD` ($5\text{M}$), and `DIAMOND` ($10\text{M}$) thresholds (verifying that `total_spent` includes upfront `Deposit` amounts via `totalNetRevenue`), then verify that a new `Order` for that customer automatically pre-fills `discount_amount` at $5\% / 10\% / 15\%$ while `Commission Ledger` entries remain calculated on 100% of catalog `OrderItem` prices.
     - **Flow 3 (2-Hour Online Cancellation & `Retained Deposit` Auto-Offset)**: Create and confirm a `Booking` with a paid 20% `Deposit` scheduled $> 2$ hours in the future, cancel it via `POST /api/v1/customer/me/bookings/{id}/cancel`, assert Redis `Slot Locks` are freed and `users.credit_balance` increases by `deposit_amount` (`deposit_status = CREDITED`), then create a new `Booking` whose required `Deposit` is $\le \text{credit\_balance}$ and assert it immediately transitions to `CONFIRMED` (`deposit_status = PAID`) via `CREDIT_BALANCE` without requiring VietQR payment. Also verify that cancelling a booking $< 2$ hours before start time is rejected.
     - **Flow 4 (`Service Review` Submission & Stylist Rating Aggregation)**: Submit a 1-to-5 star review via `POST /api/v1/customer/me/orders/{orderId}/review`, verify duplicate reviews on the same `Order` are rejected, and assert that the stylist's `averageRating` and `reviewCount` update accurately in both `GET /api/v1/bookings/stylists` and `GET /api/v1/analytics/staff-performance`.
     - **Flow 5 (`Visual Log` Customer Privacy Guard)**: Save a `Visual Log` containing before/after image URLs, hair condition notes, and `actual_bom_json` chemical consumption, then fetch `GET /api/v1/customer/me/orders` as the customer and assert that photos and notes are returned while `actual_bom_json` is never exposed.
3. **Frontend Unit & Production Build Seam (`vitest run` & `vite build`)**:
   - Verify all new and updated React components obey the $\le 250$ LOC hard limit in `AGENTS.md`, pass `vitest run`, and compile cleanly with `npm run build`.

### Prior Art in the Codebase
- `FlywayMigrationTest`: Validates schema migrations and seeded data integrity across V1–V5.
- `AuthIntegrationTest`: Tests `/api/v1/auth/register`, `/login`, `/refresh`, and `/me` via `MockMvc`.
- `BookingIntegrationTest`: Tests slot locking, booking creation, and status transitions.
- `PosControllerIntegrationTest`: Tests POS check-in, walk-in creation, `Visual Log` persistence, atomic checkout, and `Commission Ledger` recording.
- `StaffPayrollIntegrationTest`: Tests `/api/v1/analytics/staff-performance` KPI calculations.

## Out of Scope

- Redeemable points-per-VND wallets or expiring promo/coupon codes (per domain decision, loyalty uses automatic spend-based `Membership Tiers` only).
- Automated external SMS or Zalo ZNS push notifications on tier upgrades or cancellations.
- Automated bank reversal/refund payouts for `Retained Deposit` balances (`Retained Deposit` is redeemed strictly against future salon `Bookings` or POS `Orders`).
- Public unauthenticated customer review walls or multi-photo customer review uploads.

## Further Notes

- Architectural trade-offs and decisions are recorded in `ADR-0012` (`docs/adr/0012-provisional-customer-claim-tier-discounts-and-retained-deposit.md`).
- Canonical domain terms (`Provisional Customer`, `Cumulative Spend`, `Membership Tier`, `Retained Deposit`, `Service Review`) are defined in `GLOSSARY.md`.
