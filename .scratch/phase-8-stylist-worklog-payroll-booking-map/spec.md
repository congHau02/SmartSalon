# Specification: Phase 8 - Stylist Quick Service Ticket, Daily Worklog, Personal Payroll Portal, Customer Booking Remediation & Interactive Branch Map

Status: ready-for-agent

## Problem Statement

While SmartSalon provides an enterprise POS `Dispatch Board`, two-tier `Commission Ledger` accounting, and executive analytics for salon managers, four operational and user-experience bottlenecks currently block real-world daily operations across branches and customer touchpoints:

1. **Stylists Are Blocked When Operating Without a Receptionist (`STAFF`)**:
   - In smaller branches that do not employ a full-time receptionist (such as `SmartSalon Luxury - Quận 3`) or on days when the receptionist is off-duty, stylists (`STYLIST`) must serve customers, record completed services, and collect payment themselves. Currently, the POS `Dispatch Board` requires a multi-step receptionist workflow (Check-in $\rightarrow$ Open `Order` $\rightarrow$ Advance each `Service Step` $\rightarrow$ Open Drawer $\rightarrow$ Checkout) and provides no single-step `Quick Service Ticket` creation or end-of-day `Stylist Daily Worklog` for a stylist to tally their personal ticket count, completed steps, earned commissions, and cash-in-hand to hand over to the salon manager.
2. **Employees (`STYLIST` and `STAFF`) Cannot Track Their Own Payroll & KPIs**:
   - The payroll analytics endpoint (`GET /api/v1/analytics/staff-payroll`) is restricted exclusively to `ADMIN` and `MANAGER` roles because it returns the entire branch's compensation sheet. Neither `STYLIST` nor `STAFF` can view their own `Base Salary`, accumulated `Commission Ledger` entries, `Total Payout`, `Requested Stylist Rate`, `Re-booking Rate`, or customer `Service Review` ratings over a selected period. Furthermore, role navigation currently misroutes `STAFF` logins to `/customer` and sends `STYLIST` users clicking the header back button on `/pos` into `/admin` (resulting in a redirect to `/unauthorized`).
3. **Customer Online Booking Wizard Is Broken at Step 2 & Step 3 on the Frontend**:
   - In Step 2 (Stylist & Slot selection), the frontend slot grid expects `startTime` and `available` properties on each `Slot`, whereas the backend `Slot` DTO serializes `time` and `status`. Accessing `startTime.split(":")` throws an unhandled `TypeError` that crashes the Customer Portal error boundary immediately upon entering Step 2.
   - In Step 3 (Customer Confirmation), when an authenticated customer is logged in, the guest name and phone input elements are hidden from the DOM, causing form validation to silently block submission whenever the form state was initialized before user hydration or when the user's phone format differs from the guest input mask.
4. **Customers Lack a Visual Branch Map, Distance Calculation, and Turn-by-Turn Directions**:
   - Branch records currently store only text addresses without geographic coordinates (`latitude`, `longitude`). Customers choosing a salon in the `Booking` wizard cannot visualize branch locations on an interactive map, see which branch is physically closest to their current location, or launch one-click turn-by-turn Google Maps directions to the salon.

## Solution

Deliver an integrated upgrade across the POS, Analytics, Branch, and Customer Booking modules:

1. **Stylist `Quick Service Ticket` & `Stylist Daily Worklog` (`/pos`)**:
   - Provide a 1-step `Quick Service Ticket` workflow for both walk-in customers (`POST /api/v1/pos/stylist/quick-ticket`) and scheduled customer bookings (`POST /api/v1/pos/stylist/bookings/{bookingId}/quick-complete`). In a single atomic transaction, the system creates the `Order`, assigns 100% of the service's default `Service Steps` to the executing stylist, applies any eligible customer `Membership Tier` discount and `Retained Deposit`, deducts standard `BOM` chemical consumables and retail stock from `Branch Inventory`, records the `Payment Transaction` (`CASH`, `VIETQR`, or `CARD`, with instant VietQR preview before confirmation), writes immutable `Commission Ledger` entries, and marks the `Order` as `PAID`.
   - Provide a `Stylist Daily Worklog` view (`GET /api/v1/pos/stylist/daily-worklog`) enabling stylists to inspect their daily ticket tally (`Orders` count), completed `Service Steps` count, itemized ticket list, total personal commission earned, upcoming assigned `Bookings` for today (with 1-click quick completion), and a collector-scoped **Shift Handover Cash/Transfer Summary** that separates cash (`CASH`) and electronic payments (`VIETQR`/`CARD`) collected directly by that stylist from orders settled by a receptionist at the counter.
2. **Privacy-Scoped `Personal Payroll Statement` & Role Navigation Normalization**:
   - Expose `GET /api/v1/analytics/my-payroll` for all authenticated staff roles (`STYLIST`, `STAFF`, `MANAGER`, `ADMIN`), resolving the caller's identity from the JWT security principal and returning only their personal `Personal Payroll Statement` (`Base Salary`, earned `Commission Ledger` breakdown, `Total Payout`, completed `Orders` and `Service Steps`, `Requested Stylist Rate`, `Re-booking Rate`, and `Service Review` average rating) for any selected date range (*Tháng này*, *Tháng trước*, *7 ngày qua*, or custom `startDate`/`endDate`).
   - Standardize login and header routing so both `STYLIST` and `STAFF` land directly on `/pos` after login, see dedicated header actions for **"Phiếu cắt & Tổng kết ngày"** and **"Lương & Thu nhập của tôi"**, and never encounter broken links to `/unauthorized`.
3. **End-to-End Customer `Booking` Wizard Remediation**:
   - Normalize slot property resolution (`s.time || s.startTime` and `s.status === "AVAILABLE"`) so Step 2 renders Morning, Afternoon, and Evening 30-minute `Slots` without runtime errors.
   - Synchronize authenticated user profile fields (`fullName`, `phone`) into Step 3 confirmation handling so logged-in customers can confirm their `Booking` and transition smoothly to the 5-minute Redis `Slot Lock` and VietQR `Deposit` step (Step 4).
4. **Geolocated Branch Schema & Interactive Leaflet/OpenStreetMap Branch Discovery**:
   - Add `latitude` and `longitude` (`DECIMAL(10, 7)`) to the `branches` schema via Flyway V7 migration and seed accurate Ho Chi Minh City coordinates for all active branches.
   - Embed an interactive Leaflet/OpenStreetMap map in Step 1 of the Customer `Booking` wizard with custom salon markers, bidirectional selection sync (`flyTo` animation when clicking a branch card or marker), browser geolocation Haversine distance calculation (**"Gần tôi nhất"** sorting and `km` badge), and one-click **"Chỉ đường"** links opening Google Maps turn-by-turn directions (`https://www.google.com/maps/dir/?api=1&destination=...`).

## User Stories

1. As a stylist working at a branch without a receptionist (or on a day the receptionist is off), I want to open the **"Phiếu cắt & Tổng kết ngày"** workspace on `/pos` and create a `Quick Service Ticket` in one modal, so that I can record my completed haircut/service and settle payment without clicking through four separate Kanban stages.
2. As a stylist creating a `Quick Service Ticket` for a walk-in customer, I want all `Service Steps` of the selected services to be automatically assigned to me (or a selected stylist) and marked `COMPLETED` upon submission, so that 100% of the `Service Commission Pool` for those steps is credited to my `Commission Ledger`.
3. As a stylist creating a `Quick Service Ticket` for an identified returning customer (by phone number) or a quick walk-in guest, I want the system to automatically apply any eligible `Membership Tier` discount and `Retained Deposit` credit, so that the customer receives their full loyalty benefits even when no receptionist is at the counter.
4. As a stylist settling a `Quick Service Ticket` via bank transfer (`VIETQR`), I want to preview a dynamic VietQR code with the exact net payable amount right inside the quick-ticket modal before clicking confirm, so that the customer can scan and pay at my styling chair.
5. As a stylist with scheduled customer `Bookings` assigned to me today, I want to see my upcoming `Bookings` listed inside my `Stylist Daily Worklog` with a one-click **"Nhận khách & Chốt phiếu"** action that checks in the `Booking`, deducts any paid 20% `Deposit`, and settles the remaining balance in a single step, so that I can process booked clients effortlessly when the receptionist is away.
6. As a salon owner, I want every `Quick Service Ticket` completed by a stylist to execute the exact same atomic transaction as a full POS checkout—deducting standard `BOM` chemical consumables and retail units from `Branch Inventory`, recording a `Payment Transaction`, updating customer `Cumulative Spend`, and writing `Commission Ledger` entries—so that inventory and P&L reports never drift out of sync.
7. As a stylist reviewing my `Stylist Daily Worklog` at the end of my shift, I want to see my total completed ticket count (`Orders`), total completed `Service Steps`, total service revenue performed, and total personal commission earned for the selected date, so that I can verify my daily output at a glance.
8. As a stylist handing over cash at the end of a receptionist-free shift, I want my `Stylist Daily Worklog` to display a dedicated **Đối soát tiền thu hộ cuối ca** breakdown showing the exact `CASH` amount and `VIETQR`/`CARD` amount from orders that *I personally settled*, distinct from orders where a receptionist collected payment at the counter, so that I hand over the exact cash in my pocket without confusion.
9. As a stylist or receptionist (`STYLIST` or `STAFF`), I want to click **"Lương & Thu nhập của tôi"** in the `/pos` header to open my `Personal Payroll Statement`, so that I can track my monthly `Base Salary`, accumulated commission, and `Total Payout` at any time.
10. As an employee viewing my `Personal Payroll Statement`, I want to filter my statement by preset periods (*Tháng này*, *Tháng trước*, *7 ngày qua*) or custom `startDate` and `endDate`, so that I can inspect both current-month earnings and historical pay periods.
11. As an employee viewing my `Personal Payroll Statement`, I want to see an itemized table of every `Commission Ledger` entry I earned during the period (with `Order` code, service name, `Service Step` name, commission formula note, timestamp, and amount) along with my personal KPIs (`Requested Stylist Rate`, `Re-booking Rate`, and average `Service Review` star rating), so that I understand exactly how my pay and performance are calculated.
12. As a salon manager or owner, I want `GET /api/v1/analytics/my-payroll` to strictly scope its response to the authenticated user from the JWT token while keeping `GET /api/v1/analytics/staff-payroll` restricted to `ADMIN` and `MANAGER`, so that employees can never view or tamper with another colleague's `Base Salary` or payout.
13. As a receptionist (`STAFF`) logging in on the login page, I want to be redirected directly to `/pos` rather than `/customer`, so that I immediately enter my operational workspace.
14. As a stylist (`STYLIST`) working on `/pos`, I want the header navigation to link safely to the Customer Portal (`/customer/booking`) instead of `/admin` when I do not hold `ADMIN` or `MANAGER` roles, so that clicking the header navigation link never traps me on the `/unauthorized` screen.
15. As a customer on Step 2 (Chọn giờ & Stylist) of the online `Booking` wizard, I want all 30-minute `Slots` returned by `/api/v1/bookings/available-slots` to render properly across Morning, Afternoon, and Evening groups with accurate `AVAILABLE`, `LOCKED`, `BOOKED`, and `PAST` states, so that I can select an appointment time without the page crashing.
16. As a logged-in customer on Step 3 (Xác nhận thông tin) of the online `Booking` wizard, I want my account's `fullName` and `phone` to be submitted seamlessly when I click **"Xác nhận & Giữ chỗ 5 phút"**, so that my reservation is created and advances to Step 4 (VietQR Deposit) without silent form validation failures.
17. As a customer on Step 1 (Chọn Chi nhánh & Dịch vụ) of the online `Booking` wizard, I want to see an interactive map displaying pins for all active SmartSalon branches alongside the branch cards, so that I can visually locate each salon in the city.
18. As a customer interacting with the branch map or branch cards in Step 1, I want clicking a branch card to smoothly pan/zoom the map (`flyTo`) to that branch's marker and open its info popup—and clicking a map marker to select that branch for my `Booking`—so that the map and branch selector stay synchronized.
19. As a customer choosing a branch in Step 1, I want to click **"Gần tôi nhất"** to share my browser geolocation, see the distance in kilometers (`km`) from my position to each salon branch, and automatically select or sort the nearest branch, so that I can pick the most convenient location.
20. As a customer viewing a branch card or map popup, I want to click **"Chỉ đường"** to open Google Maps turn-by-turn directions (`google.com/maps/dir`) pre-populated with that branch's coordinates/address, so that I can navigate to the salon easily on my phone or computer.
21. As a developer or evaluator running SmartSalon, I want the V7 Flyway migration to add `latitude` and `longitude` to `branches`, populate accurate coordinates for existing branches, and add a column recording the settling user (`settled_by_user_id` or `created_by` audit tracking) on `orders`, so that branch maps and stylist shift handovers work out of the box.

## Implementation Decisions

### 1. Schema Evolution & Geolocation Seed Data (Flyway V7)
- **Branch Geolocation Coordinates (`branches`)**:
  - Add `latitude DECIMAL(10, 7) NULL` and `longitude DECIMAL(10, 7) NULL` to `branches`.
  - Backfill coordinates for seeded branches:
    - Branch 1 (`SmartSalon Flagship - Quận 1`, 123 Nguyễn Huệ, Quận 1, TP.HCM): `latitude = 10.7745000`, `longitude = 106.7036000`.
    - Branch 2 (`SmartSalon Luxury - Quận 3`, 456 Lê Văn Sỹ, Quận 3, TP.HCM): `latitude = 10.7882000`, `longitude = 106.6789000`.
- **Order Settlement Collector Tracking (`orders`)**:
  - Add `settled_by_user_id BIGINT NULL` (foreign key to `users.id`) and `settled_at DATETIME(6) NULL` on `orders` (backfilling existing `PAID` orders from `created_by` where matching a staff username). Whenever `checkoutOrder` or a stylist `Quick Service Ticket` settles an `Order` to `PAID`, record the authenticated staff/stylist user ID in `settled_by_user_id` and current timestamp in `settled_at`. This provides an exact, indexed relational link for end-of-day cash/transfer handover reconciliation per stylist without fragile string matching on `created_by`.
- **Branch DTO Contract**:
  - Enrich `BranchDto` (`GET /api/v1/branches` and `GET /api/v1/branches/{id}`) with `latitude` (`BigDecimal`) and `longitude` (`BigDecimal`).

### 2. Stylist `Quick Service Ticket` & `Stylist Daily Worklog` Module
- **Walk-in `Quick Service Ticket` (`POST /api/v1/pos/stylist/quick-ticket`)**:
  - Accessible to `STYLIST`, `STAFF`, `MANAGER`, `ADMIN`.
  - Request payload (`QuickServiceTicketRequest`):
    - `branchId` (`Long`, required)
    - `stylistId` (`Long`, optional — defaults to the authenticated user if they have role `STYLIST`, or the branch's primary stylist)
    - `serviceIds` (`List<Long>`, required, `@NotEmpty`)
    - `productItems` (`List<ProductItemRequest>`, optional)
    - `quickGuest` (`boolean`, default `true`)
    - `customerPhone` (`String`, optional)
    - `customerName` (`String`, optional)
    - `paymentMethod` (`String`, required: `CASH`, `VIETQR`, or `CARD`)
    - `discountAmount` (`BigDecimal`, optional manual override)
    - `notes` (`String`, optional)
  - Execution within a single `@Transactional` method:
    1. Create the walk-in `Order` using `CustomerIdentityService.resolveForWalkIn(...)` and assign all default `Service Steps` of the requested `serviceIds` to the target `stylist`.
    2. Apply automatic `Membership Tier` discount (unless manual `discountAmount` is provided) and available `Retained Deposit` (`creditBalance`).
    3. Immediately execute the checkout pipeline on that `Order` (`deductChemicalConsumables` using standard `BOM`, `deductRetailProducts`, `completeStepsAndRecordCommission`, record `PaymentTransactionEntity`, update identified customer `Cumulative Spend` and `Membership Tier`, set `settledBy = currentUser`, `settledAt = now`, and `status = PAID`).
    4. Broadcast real-time WebSocket update and return `PosOrderResponse`.
- **Scheduled Booking Quick Complete (`POST /api/v1/pos/stylist/bookings/{bookingId}/quick-complete`)**:
  - Accessible to `STYLIST`, `STAFF`, `MANAGER`, `ADMIN`.
  - Request payload (`QuickCompleteBookingRequest`):
    - `paymentMethod` (`String`, default `CASH`: `CASH`, `VIETQR`, `CARD`)
    - `serviceIds` (`List<Long>`, optional override if additional services were performed; defaults to the booking's existing services)
    - `discountAmount` (`BigDecimal`, optional)
    - `notes` (`String`, optional)
  - Execution within a single `@Transactional` method:
    1. If the `Booking` has not been checked in yet (`CONFIRMED` or `PENDING_PAYMENT`), check it in to create the linked `Order` (or reuse the existing active unpaid `Order` if already `CHECKED_IN`/`IN_PROGRESS`).
    2. Ensure all `Service Steps` on the `Order` are assigned to the booking's stylist (or authenticated stylist) and run the full checkout settlement pipeline (`status = PAID`, `booking.status = COMPLETED`, `settledBy = currentUser`, `settledAt = now`).
- **`Stylist Daily Worklog` (`GET /api/v1/pos/stylist/daily-worklog`)**:
  - Query parameters:
    - `branchId` (`Long`, optional — defaults to the authenticated user's branch)
    - `stylistId` (`Long`, optional — if caller is `STYLIST`, defaults to their own `user.id`; `ADMIN`/`MANAGER`/`STAFF` can inspect any stylist in the branch)
    - `date` (`LocalDate`, optional — defaults to `LocalDate.now()`)
  - Response contract (`StylistDailyWorklogResponse`):
    - `stylistId`, `stylistName`, `branchId`, `branchName`, `date`
    - **Production Metrics (all `PAID` orders on `date` where this stylist completed $\ge 1$ `Service Step`)**:
      - `totalTicketCount` (`int`: distinct `PAID` orders served by this stylist)
      - `totalCompletedStepCount` (`int`: completed steps by this stylist)
      - `totalServiceRevenue` (`BigDecimal`: sum of service item prices attributed to this stylist's orders)
      - `totalEarnedCommission` (`BigDecimal`: sum of `Commission Ledger` entries earned by this stylist on `date`)
    - **Shift Handover Cash/Transfer Metrics (`PAID` orders on `date` where `settled_by_user_id == stylistId`)**:
      - `selfSettledOrderCount` (`int`)
      - `cashCollectedToHandover` (`BigDecimal`: sum of `finalAmount` where `paymentMethod == 'CASH'`)
      - `transferCollectedAmount` (`BigDecimal`: sum of `finalAmount` where `paymentMethod` in `VIETQR`, `CARD`, `PAYOS`)
      - `totalSelfCollectedAmount` (`BigDecimal`: `cashCollectedToHandover + transferCollectedAmount`)
    - `tickets` (`List<StylistWorklogTicketDto>`): Each completed ticket with `orderId`, `orderCode`, `bookingCode`, `customerName`, `customerPhone`, `serviceNames`, `stepNames`, `orderFinalAmount`, `paymentMethod`, `settledByMe` (`boolean`), `earnedCommission` (`BigDecimal`), and `completedAt`.
    - `upcomingBookings` (`List<DispatchBoardBookingDto>`): Active `CONFIRMED` or `PENDING_PAYMENT` bookings for `date` assigned to this stylist (or unassigned at the branch) that have not yet been completed, ready for 1-click **"Nhận khách & Chốt phiếu"**.

### 3. Privacy-Scoped `Personal Payroll Statement` (`GET /api/v1/analytics/my-payroll`)
- **Endpoint & Authorization**:
  - `GET /api/v1/analytics/my-payroll` with `@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF', 'STYLIST')")`.
  - Query parameters: `startDate` (`LocalDate`, optional) and `endDate` (`LocalDate`, optional), defaulting to the current month (`AnalyticsPeriod.of(startDate, endDate)`).
  - Service method `StaffPayrollService.getMyPayrollReport(String usernameOrPhone, LocalDate startDate, LocalDate endDate)`:
    - Resolves the authenticated `UserEntity` from `SecurityContextHolder`.
    - Computes and returns `StaffPerformanceResponse` for *only* that single user (including `baseSalary`, `totalCommission`, `totalPayout`, `completedOrderCount`, `completedStepCount`, `requestedStylistRate`, `rebookingRate`, `averageRating`, `reviewCount`, and itemized `commissionLedgers`), plus `startDate` and `endDate` period metadata.
- **Role Navigation & Workspace Access**:
  - In `LoginPage`, route `STAFF` and `STYLIST` users to `/pos` by default after login.
  - In `PosLayout`, replace the unconditional `<Link to="/">Quay lại</Link>` with role-aware navigation: show a link to `/admin` ("Quản trị") only when the user holds `ADMIN` or `MANAGER`, and provide a link to `/customer/booking` ("Trang Khách hàng") plus user profile/logout controls for all staff roles.
  - Add two prominent action buttons in the `/pos` header / toolbar:
    - **"Phiếu cắt & Tổng kết ngày"**: Opens the `StylistDailyWorklogModal` (with embedded `QuickServiceTicketModal` trigger and 1-click booking completion).
    - **"Lương & Thu nhập của tôi"**: Opens the `PersonalPayrollModal` displaying the authenticated employee's `Personal Payroll Statement` with period presets (*Tháng này*, *Tháng trước*, *7 ngày qua*, custom range), KPI cards, and itemized `Commission Ledger` table.

### 4. Customer Booking Wizard Bug Fixes & Interactive Branch Map
- **Step 2 (`SlotPicker`) & Step 3 (`CustomerConfirmStep`) Fixes**:
  - In `SlotPicker`, normalize slot time via `const slotTime = s.time || s.startTime || ""` and determine availability via `const isAvailable = (s.available ?? true) && s.status === "AVAILABLE"`. Ensure `selectedSlotTime === slotTime` and `onSelectSlot(slotTime)` use the normalized `slotTime`.
  - In `CustomerConfirmStep`, use `useEffect` to `reset` or `setValue` `customerName` and `customerPhone` whenever `user` finishes loading, and when `user` is authenticated, bypass guest-only input errors by falling back to `user.fullName` and `user.phone` cleanly on form submission.
- **Interactive Branch Map (`BranchMapSection` in Step 1)**:
  - Render an interactive OpenStreetMap view (using `leaflet` / `react-leaflet` or a lightweight self-contained Leaflet integration with OpenStreetMap tiles) alongside the branch selection cards in `BookingBranchPicker`:
    - Plot markers for all active branches that have `latitude` and `longitude`.
    - Clicking a branch card or marker selects `selectedBranchId`, pans/zooms the map to `[branch.latitude, branch.longitude]`, and displays a popup with branch name, address, phone, distance badge (if user location is active), and a **"Chỉ đường Google Maps"** external link (`https://www.google.com/maps/dir/?api=1&destination=${branch.latitude},${branch.longitude}`).
    - Provide a **"Tìm cơ sở gần tôi"** button that invokes `navigator.geolocation.getCurrentPosition`, computes Haversine distance in `km` to each branch, displays `Cách bạn X.X km` on each branch card, and selects the closest branch.

## Testing Decisions

### What Makes a Good Test
- **Test observable behavior at public HTTP and UI contracts**: Tests must exercise the REST API endpoints (`MockMvc`) and frontend business logic against real domain state transitions, verifying HTTP status codes, database persistence, inventory deductions, commission math, role-based access boundaries, and slot/map data transformations without mocking internal private methods.

### Highest-Level Seams to Test
1. **Flyway V7 Schema & Coordinate/Collector Backfill Seam (`FlywayMigrationTest`)**:
   - Verify `V7__branch_coordinates_and_stylist_worklog.sql` applies cleanly on top of V1–V6, populates `latitude` and `longitude` on `branches`, and adds `settled_by_user_id` and `settled_at` on `orders`.
2. **Stylist `Quick Service Ticket` & `Stylist Daily Worklog` HTTP Integration Seam (`PosControllerIntegrationTest`)**:
   - Authenticate as a `STYLIST` (`stylist.thao` or `stylist.minh`) and execute `POST /api/v1/pos/stylist/quick-ticket` for a walk-in visit and `POST /api/v1/pos/stylist/bookings/{id}/quick-complete` for a scheduled booking.
   - Assert that in a single call, the `Order` is created and transitioned to `PAID`, `Branch Inventory` chemical `BOM` volume is deducted, `Commission Ledger` entries are recorded for the stylist, `settled_by_user_id` is set to the stylist, and `GET /api/v1/pos/stylist/daily-worklog` returns accurate `totalTicketCount`, `totalCompletedStepCount`, `totalEarnedCommission`, `cashCollectedToHandover`, and `transferCollectedAmount`.
3. **Privacy-Scoped `Personal Payroll Statement` HTTP Integration Seam (`StaffPayrollIntegrationTest`)**:
   - Authenticate as a `STYLIST` and as a `STAFF` user and call `GET /api/v1/analytics/my-payroll`.
   - Assert HTTP 200 and verify the response contains only the authenticated employee's own `Base Salary`, `totalCommission`, `totalPayout`, KPI rates, and `commissionLedgers` list, while confirming `GET /api/v1/analytics/staff-payroll` still returns HTTP 403 Forbidden for `STYLIST` and `STAFF`.
4. **Branch Geolocation & Customer Booking Slot Contract Seam (`BookingIntegrationTest` & Frontend Vitest Suite)**:
   - Verify `GET /api/v1/branches` returns non-null `latitude` and `longitude` for active branches.
   - Add frontend unit tests (`vitest run`) verifying `SlotDto` (`time`, `status`) normalization in `SlotPicker`, Haversine distance calculation and Google Maps direction URL generation for branches, and clean production build (`vite build`) with all components $\le 250$ LOC.

### Prior Art in the Codebase
- `FlywayMigrationTest`: Validates schema migrations and seeded data integrity across V1–V6.
- `PosControllerIntegrationTest`: Tests POS order lifecycle, step assignments, checkout, and commission ledger via `MockMvc`.
- `StaffPayrollIntegrationTest`: Tests staff payroll and KPI calculation endpoints via `MockMvc`.
- `frontend/src/__tests__/`: Vitest suites for POS calculations, timeline mapping, and customer portal helpers.

## Out of Scope

- Paid third-party map API keys (Google Maps JavaScript SDK billing or Mapbox tokens); the interactive map uses free OpenStreetMap tiles with Leaflet and deep-links to Google Maps URLs for turn-by-turn navigation.
- Multi-currency payroll tax withholding or bank-API automated salary disbursement.
- Offline-first IndexedDB POS synchronization when the salon has zero internet connectivity.

## Further Notes

- Architectural trade-offs and decisions are recorded in `ADR-0013` (`docs/adr/0013-stylist-quick-ticket-daily-worklog-and-personal-payroll.md`).
- Canonical domain terms (`Quick Service Ticket`, `Stylist Daily Worklog`, `Personal Payroll Statement`) are defined in `GLOSSARY.md`.
