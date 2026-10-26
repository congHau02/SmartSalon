# Specification: Phase 9 - Backend Audit Remediation, Concurrency Locking, Multi-Branch Authorization & Query Optimization

Status: ready-for-agent

## Problem Statement

Following the full `/ponytail-audit` quality review of the SmartSalon Spring Boot backend, several critical financial concurrency races, privilege-escalation and data-exposure vulnerabilities, P&L and shift-handover accounting discrepancies, severe `N+1` database/Redis query storms, and duplicated/dead code were identified across the backend modules:

1. **Concurrent `Retained Deposit` Double-Spend & Premature Deduction Loss**:
   - When a customer creates a `Booking`, cancels a `Booking`, or checks into an `Order` at the POS counter, the customer's user record is read and mutated without a database row lock (`PESSIMISTIC_WRITE`). Two simultaneous `Booking` requests for a customer with a positive `Retained Deposit` (`creditBalance`) read the same balance and apply the same credit twice.
   - Worse, during `Booking` check-in or `Walk-in Order` creation on the POS `Dispatch Board`, any available `Retained Deposit` is immediately deducted from the customer's balance and added to the draft `Order`'s `depositDeducted`. If the receptionist subsequently removes a service item, increases the discount so the payable subtotal drops below `depositDeducted`, or leaves the draft `Order` unsettled, the deducted `Retained Deposit` is never refunded—permanently destroying the customer's credit balance.
2. **Concurrent POS Checkout Race Deducting `Branch Inventory` and Paying `Commission Ledger` Twice**:
   - Neither standard POS `Order` checkout nor stylist `Quick Service Ticket` completion acquires a pessimistic write lock on the `Order` row before checking whether the `Order` status is already `PAID`. When a cashier double-clicks checkout or two tabs submit settlement simultaneously, both transactions pass the status check, sequentially lock and deduct `Branch Inventory` (`Opened Volume` and `Sealed Units`) twice, record duplicate `Payment Transaction` entries, pay double `Commission Ledger` entries to technicians, and double-count `Cumulative Spend`.
3. **`Order` Code Collision Under Concurrent Check-In or After 27.7 Hours**:
   - POS `Order` code generation derives an 8-digit suffix from `System.currentTimeMillis() % 100000000` on a database `UNIQUE` column. Two check-ins or `Walk-in Orders` created in the same millisecond—or created 27.7 hours apart when the modulo wraps around—produce colliding `order_code` values and fail with an unhandled database constraint violation (`HTTP 500`).
4. **Privilege Escalation (`MANAGER` $\rightarrow$ `ADMIN`), Cross-Branch Data Tampering & Production Security Leaks**:
   - In staff account creation, a branch `MANAGER` can pass `"roles": ["ADMIN"]` in the request payload to create a global `ADMIN` account for themselves, and can create or update staff accounts assigned to other branches.
   - Across POS, `Branch Inventory`, Analytics, and User management endpoints, controllers verify role membership (`MANAGER`, `STAFF`, `STYLIST`) but do not enforce that non-`ADMIN` callers can only read or mutate resources belonging to their own assigned branch (`branchId`).
   - The global fallback exception handler returns raw internal `Exception.getMessage()` strings (exposing SQL/JPA/Redis internals) to clients on `HTTP 500` errors without logging the server stack trace.
   - The PayOS sandbox simulation flag defaults to `true` when the configuration property is omitted, leaving the unauthenticated simulation webhook open if deployed without an explicit override.
   - Public endpoints for phone-based `Booking` lookup, `Membership Tier` loyalty preview, and unauthenticated STOMP WebSocket topics allow anyone to enumerate customer phone numbers to harvest full names, `Cumulative Spend`, `Retained Deposit` balances, and real-time booking notifications.
5. **Carry-Over `Order` Settlement Date Mismatch & Un-Prorated `Base Salary` in P&L Reports**:
   - Both the `Stylist Daily Worklog` and the P&L Analytics engine filter `PAID` `Orders` by creation timestamp (`createdAt`) rather than settlement timestamp (`settledAt`). Carry-over `Orders` checked in the previous evening and settled the next morning vanish from the settling day's shift handover cash reconciliation and revenue totals, even though their `Inventory Transaction` (`Chemical COGS`) and `Commission Ledger` records are timestamped on the settlement day.
   - Tier-2 P&L (Net Profit After Fixed Payroll) subtracts 100% of every active staff member's monthly `Base Salary` regardless of the selected date range, causing a 1-day or 7-day P&L report to deduct an entire 30-day payroll and report a massive artificial loss.
6. **Severe `N+1` Database/Redis Query Storms & Full-Table User Scans**:
   - Calculating available `Slots` executes one SQL overlap query and one Redis `MGET` call inside a nested loop of `24 slots × N stylists` (240 SQL queries + 240 Redis round-trips per page view), plus two review aggregation queries per stylist when listing active stylists.
   - Generating a P&L report executes per-order queries for `Inventory Transactions`, `Commission Ledgers`, and lazy-loaded order items inside a loop (`3N + 1` queries per report), despite a batch repository method already existing for `Inventory Transactions`.
   - Listing branch staff loads the entire `users` table (including thousands of `Provisional Customers`) into JVM memory via `findAll().stream().filter(...)` and leaks `CUSTOMER` accounts into the staff response.
7. **Non-Atomic Redis `Slot Lock` TTL, Duplicate Settlement/Cancellation Logic & Dead Code**:
   - Redis `Slot Lock` acquisition sets keys with `MSETNX` and then loops over each key to set its 5-minute TTL (`EXPIRE`). A crash or network drop between those steps leaves permanent lock keys (`TTL = -1`) that block a stylist's `Slot` indefinitely. Meanwhile, refresh token revocation contains an unused `KEYS` scan method that blocks the single-threaded Redis loop.
   - The 50-line `Order` settlement pipeline is copy-pasted across three methods in the 1,661-line POS service, and `Booking` cancellation with `Retained Deposit` crediting is duplicated between the Booking and Customer services (where the Customer service unconditionally unlocks Redis `Slots` even for already-confirmed bookings).
   - Unused `mapstruct` annotation processors, three unreferenced Spring Data repository interfaces, dead repository methods, legacy duplicate stock fields on `Master Product`, eight pass-through single-implementation service interfaces, and per-request `.ttf` font disk reads in PDF export add avoidable build and maintenance overhead.

## Solution

Deliver a focused, high-leverage backend remediation and lean cleanup across all affected domain modules:

1. **Pessimistic Row Locking & Settlement-Time `Retained Deposit` Accounting**:
   - Lock customer rows (`PESSIMISTIC_WRITE`) whenever mutating `Retained Deposit` (`creditBalance`) or `Cumulative Spend` (`totalSpent`).
   - Lock `Order` rows (`PESSIMISTIC_WRITE`) at the start of POS checkout and `Quick Service Ticket` completion so concurrent settlement requests serialize and reject duplicates cleanly.
   - Stop deducting `Retained Deposit` from the customer's balance during draft `Order` check-in or `Walk-in Order` creation; keep `order.depositDeducted` during active service strictly for the originating `Booking`'s paid 20% `Deposit`, and apply/deduct available `Retained Deposit` atomically inside the unified settlement helper at final checkout.
2. **Collision-Proof `Order` Codes & Atomic Redis `Slot Lock` Expiration**:
   - Generate POS `Order` codes using a date prefix and cryptographic/UUID random suffix (`ORD-yyyyMMdd-XXXXXX`) with collision retry safety, matching the `Booking` code strategy.
   - Acquire multi-bucket Redis `Slot Locks` and set their 5-minute TTL atomically via a single Redis Lua script (or self-heal any key with `TTL < 0` during lock inspection), and remove the unused blocking `KEYS`-based refresh token method.
3. **Branch-Scoped Authorization, Privilege-Escalation Prevention & Privacy/Security Hardening**:
   - Enforce a centralized branch-scope guard so `MANAGER`, `STAFF`, and `STYLIST` callers can only access or mutate `Orders`, `Branch Inventory`, `Bookings`, staff records, and analytics belonging to their own `branchId`, while `ADMIN` retains cross-branch access.
   - Prevent `MANAGER` callers from assigning the `ADMIN` role or managing users outside their own branch.
   - Log full server stack traces in the fallback exception handler while returning a generic safe error message to clients; default PayOS simulation to `false` in code unless explicitly enabled in development/test configuration.
   - Protect customer PII by masking customer names in public `Membership Tier` loyalty previews, requiring matching `bookingCode` (or an authenticated session) on phone-based `Booking` lookup, and validating JWT authentication on STOMP WebSocket connection/subscription headers.
4. **Settlement-Date (`settledAt`) Financial Alignment & Pro-Rated Tier-2 P&L Payroll**:
   - Filter `PAID` `Orders` in P&L Analytics, `BOM Wastage`, and `Stylist Daily Worklog` using `COALESCE(settledAt, createdAt)` so carry-over orders align revenue, cash handover, `Chemical COGS`, and `Commission Ledger` entries on the exact day of settlement.
   - Pro-rate fixed monthly `Base Salary` in Tier-2 P&L reports proportionally to the number of days in the requested reporting period ($\text{Monthly Base Salary} \times \frac{\text{daysInPeriod}}{30}$) so daily and weekly P&L reports reflect realistic fixed-payroll allocation.
5. **Batch Query Optimization (Eliminating `N+1` Loops & Full-Table Scans)**:
   - Refactor `Slot` availability calculation to load all active branch `Bookings` for the target date in a single SQL query and check all candidate Redis `Slot Lock` keys in a single `multiGet` call, evaluating overlaps in memory; batch-load stylist review aggregates in one grouped query.
   - Refactor P&L reporting to batch-fetch `Inventory Transactions`, `Commission Ledgers`, and `Order` items across all `Order` IDs in the period (`WHERE order_id IN (...)`) and group them in memory.
   - Replace `findAll().stream().filter(...)` in staff listing with the indexed branch staff repository query that excludes `CUSTOMER` accounts.
6. **Unified `Order` Settlement, Deduplicated `Booking` Cancellation & Lean Codebase Cleanup**:
   - Consolidate the three duplicated POS settlement blocks into a single private settlement pipeline, and unify `Booking` cancellation + `Retained Deposit` crediting so Redis `Slot Locks` are only released when cancelling a `PENDING_PAYMENT` reservation.
   - Remove the unused `mapstruct` dependency from Maven, delete the three unused repository interfaces and dead methods, remove legacy stock columns from `Master Product` entity mapping, collapse pass-through single-implementation service interfaces where no test seam is needed, and cache PDF TrueType fonts in memory once at startup.

## User Stories

1. As a customer with a `Retained Deposit` (`creditBalance`) in my account, I want concurrent `Booking` submissions to lock my customer row in the database, so that two rapid clicks can never spend the same `Retained Deposit` twice.
2. As a customer checking in at the salon or visiting as a walk-in, I want my `Retained Deposit` (`creditBalance`) to be deducted only when my `Order` is actually settled (`PAID`)—never while the `Order` is still a draft in progress—so that adding/removing services or adjusting discounts on the POS `Dispatch Board` never destroys my credit balance.
3. As a receptionist or stylist settling an `Order` or `Quick Service Ticket`, I want the backend to acquire a pessimistic write lock on the `Order` record before executing checkout, so that an accidental double-click or network retry never deducts `Branch Inventory` twice, pays double `Commission Ledger` amounts, or creates duplicate `Payment Transactions`.
4. As a receptionist checking in multiple guests or creating `Walk-in Orders` during peak hours, I want `Order` codes (`order_code`) to use a collision-resistant date + random suffix format (`ORD-yyyyMMdd-XXXXXX`), so that simultaneous orders or orders created 27.7 hours apart never crash with a unique-constraint `HTTP 500` error.
5. As a salon owner, I want `MANAGER` accounts to be strictly blocked from assigning the `ADMIN` role or creating/editing staff accounts in other branches, so that a branch manager cannot escalate their own privileges to global system administrator.
6. As a salon owner operating multiple branches, I want `MANAGER`, `STAFF`, and `STYLIST` users to be restricted to viewing and modifying `Orders`, `Branch Inventory`, `Bookings`, payroll, and P&L reports for their own assigned `branchId` only, so that employees at one branch cannot snoop on or tamper with another branch's operations.
7. As a security-conscious system administrator, I want unhandled server exceptions to be logged with full stack traces on the server while returning only a generic safe message (`ErrorCode.UNCATEGORIZED_EXCEPTION`) to HTTP clients, so that database table names and SQL details are never leaked to callers.
8. As a salon owner deploying SmartSalon to production, I want the PayOS sandbox simulation endpoint (`POST /api/v1/webhooks/payos/simulate/{bookingCode}`) to default to disabled (`false`) unless explicitly enabled in development/test profiles, so that an omitted environment variable in production never allows attackers to confirm `Booking` `Deposits` for free.
9. As a customer using the online `Booking` wizard, I want the public `Membership Tier` loyalty preview endpoint (`/api/v1/customers/loyalty-preview`) to return a masked customer name (e.g., hiding middle characters) and only the discount percentage/tier needed for checkout preview without exposing raw `Cumulative Spend` or `Retained Deposit` balances to unauthenticated callers, so that phone enumeration cannot harvest financial PII.
10. As a customer looking up my `Booking` status without logging in (`/api/v1/bookings/lookup`), I want the lookup to require both my `phone` and `bookingCode` (unless I am authenticated as staff or as that customer), so that strangers cannot list my entire booking history just by typing my phone number.
11. As a salon owner, I want STOMP WebSocket connections (`/ws/**`) to validate JWT authentication before subscribing to `/topic/branch/{branchId}/bookings` or `/topic/branch/{branchId}/dispatch`, so that unauthenticated outsiders cannot stream live customer names and phone numbers from the salon floor.
12. As a stylist or branch manager reviewing the `Stylist Daily Worklog` or P&L report, I want `PAID` `Orders` (including carry-over orders checked in yesterday and paid today) to be grouped by their settlement timestamp (`COALESCE(settledAt, createdAt)`), so that end-of-day cash handover, service revenue, `Chemical COGS`, and `Commission Ledger` payouts all match the exact day payment was collected.
13. As a branch manager or owner viewing the P&L dashboard for a 1-day, 7-day, or custom period, I want Tier-2 fixed payroll (`Base Salary`) to be pro-rated by the number of days in the selected period ($\text{Base Salary} \times \frac{\text{daysInPeriod}}{30}$), so that daily and weekly profit reports are not distorted by a full 30-day salary deduction.
14. As a customer selecting a date and stylist on Step 2 of the `Booking` wizard, I want `/api/v1/bookings/available-slots` and `/api/v1/bookings/stylists` to execute a constant number of batch database and Redis queries instead of `240+` queries inside nested loops, so that the slot grid loads instantaneously even under heavy traffic.
15. As a branch manager loading the P&L Analytics dashboard or exporting a monthly report, I want the backend to batch-load `Inventory Transactions`, `Commission Ledgers`, and `Order` items across all orders in the period rather than firing `3N + 1` queries per order, so that monthly reports with hundreds of orders complete in milliseconds.
16. As an administrator or branch manager opening the Staff Management screen (`GET /api/v1/users`), I want the backend to query only active staff for the target branch directly in PostgreSQL rather than loading all customer and staff rows via `findAll()`, so that `Provisional Customers` never appear in the staff list and memory usage stays flat as the customer base grows.
17. As a customer holding a 5-minute `Slot Lock`, I want Redis lock acquisition and TTL assignment to execute atomically (with automatic cleanup of any key missing a TTL), so that a transient network glitch never leaves a stylist's `Slot` permanently locked.
18. As a customer cancelling a `Booking` from the Customer Portal, I want my cancellation to invoke the same shared domain logic as staff-initiated cancellation—releasing Redis `Slot Locks` only when the `Booking` was `PENDING_PAYMENT` and crediting my paid `Deposit` to my `Retained Deposit` (`creditBalance`) under a row lock—so that cancelling a `CONFIRMED` booking never wipes out another customer's active `Slot Lock`.
19. As a backend developer maintaining SmartSalon, I want the three duplicated POS settlement blocks merged into one shared settlement method, unused `mapstruct` dependencies and dead repositories/fields deleted, and PDF TrueType fonts cached once in memory, so that the codebase is smaller, faster to build, and free of conflicting copies.

## Implementation Decisions

### 1. Concurrency Control & Transactional Financial Integrity
- **Pessimistic Row Locks on `Order` and Customer (`User`) Mutations**:
  - Add a pessimistic write lock query (`LockModeType.PESSIMISTIC_WRITE`) on the `Order` repository when loading an `Order` for settlement (`checkoutOrder` and `quickCompleteBooking`). If the locked `Order` is already in status `PAID` or `CANCELLED`, immediately reject the duplicate request with `ErrorCode.ORDER_ALREADY_PAID` / `ErrorCode.INVALID_ORDER_STATUS`.
  - Add a pessimistic write lock query (`LockModeType.PESSIMISTIC_WRITE`) on the `User` repository when loading a customer to apply/deduct `Retained Deposit` (`creditBalance`), refund a cancelled `Booking` `Deposit` to `creditBalance`, or increment `Cumulative Spend` (`totalSpent`).
- **Defer `Retained Deposit` (`creditBalance`) Deduction to Final `Order` Settlement**:
  - During `checkInBooking` and `createWalkInOrder`, do **not** mutate `customer.creditBalance`. For a checked-in `Booking`, set `order.depositDeducted` solely to the `Booking`'s already-paid `Deposit` (`booking.depositAmount` when `depositStatus == PAID`). For a `Walk-in Order`, initialize `order.depositDeducted` to zero.
  - Inside the unified `Order` settlement pipeline (executed when transitioning an `Order` to `PAID` in `checkoutOrder`, `createQuickServiceTicket`, and `quickCompleteBooking`), after item totals and discounts are finalized, lock the customer row and deduct up to $\max(0, \text{subtotal} - \text{discountAmount} - \text{existingDepositDeducted})$ from `customer.creditBalance`, adding that applied credit to `order.depositDeducted` and recalculating `finalAmount` before recording the `Payment Transaction`.
  - When previewing an active unpaid `Order` (or generating a VietQR preview for an unpaid `Order`), compute the effective payable preview taking into account the customer's current available `creditBalance` without mutating the database until settlement.
- **Collision-Resistant `Order` Code Generation**:
  - Replace `"ORD-" + (System.currentTimeMillis() % 100000000)` with `"ORD-" + LocalDate.now().format(BASIC_ISO_DATE) + "-" + randomAlphanumeric6()`, verifying uniqueness before save.

### 2. Unified POS Settlement & Deduplicated `Booking` Cancellation
- **Single POS Settlement Pipeline**:
  - Extract a single private settlement method inside the POS order service invoked by all three settlement entry points (`checkoutOrder`, `createQuickServiceTicket`, `quickCompleteBooking`).
  - This single method performs: (1) status verification under pessimistic lock, (2) customer `Retained Deposit` (`creditBalance`) application under pessimistic lock, (3) chemical `BOM` consumable deduction, (4) retail `Sealed Unit` deduction, (5) `Service Step` completion and `Commission Ledger` creation, (6) `Payment Transaction` persistence, (7) `settledBy`, `settledAt`, `OrderStatus.PAID`, and originating `BookingStatus.COMPLETED` updates, (8) customer `Cumulative Spend` (`totalSpent`) and `Membership Tier` upgrade calculation, and (9) STOMP WebSocket dispatch broadcast.
- **Single `Booking` Cancellation & `Retained Deposit` Crediting Helper**:
  - Centralize `Booking` cancellation logic so both customer self-service cancellation and staff status updates execute the same transition rules:
    - Release Redis `Slot Locks` **only** when the previous status was `PENDING_PAYMENT`.
    - When `depositStatus == PAID` and `depositAmount > 0`, lock the customer row (`PESSIMISTIC_WRITE`), add `depositAmount` to `customer.creditBalance`, and transition `depositStatus` to `CREDITED`.
  - Remove the redundant inline `SecurityContextHolder` customer lookup in `Booking` creation since `CustomerIdentityService.resolveForBooking` already performs that exact resolution.

### 3. Security, Privacy & Multi-Branch Access Control
- **Branch Scope Enforcement Helper**:
  - Provide a reusable authorization component/helper that extracts the authenticated user's roles and `branchId` (loading from the authenticated user or JWT claims).
  - If the caller holds `ADMIN`, allow access to any `branchId`.
  - If the caller holds `MANAGER`, `STAFF`, or `STYLIST` (and not `ADMIN`), verify that the target `branchId` (or the `branchId` of the target `Order`, `Booking`, or staff member) matches the caller's `branchId`; otherwise throw `AppException(ErrorCode.UNAUTHORIZED)` (`HTTP 403`).
- **Staff Creation & Update Privilege Guards**:
  - In staff creation and update:
    - If the caller is not `ADMIN`, forbid assigning the `ADMIN` role (and forbid assigning `MANAGER` by non-`ADMIN`), and force/validate that the target staff member's `branchId` equals the caller's `branchId`.
- **Safe Global Exception Handling & PayOS Simulation Default**:
  - In `GlobalExceptionHandler.handleGeneralException`, log the unhandled exception at `ERROR` level with full stack trace and return `ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage()` in the HTTP 500 `ApiResponse` instead of `ex.getMessage()`.
  - Change the `@Value` default for `app.payos.simulation-enabled` in the PayOS webhook controller and service from `true` to `false` (`${app.payos.simulation-enabled:false}`), keeping `simulation-enabled: true` only in local/dev/test configuration profiles.
- **Customer PII Protection on Public Endpoints & WebSocket**:
  - **Public Loyalty Preview (`GET /api/v1/customers/loyalty-preview`)**: When called by an unauthenticated user (or a `CUSTOMER` querying another phone), mask `customerName` (e.g., keeping only the first character of words or last name initial) and omit/zero out raw `totalSpent` while still returning `membershipTier`, `discountPercent`, and whether `creditBalance` is available (or only return full unmasked balances when the caller is authenticated staff `ADMIN`/`MANAGER`/`STAFF`/`STYLIST` or the matching authenticated customer).
  - **Public Booking Lookup (`GET /api/v1/bookings/lookup`)**: Require an optional `bookingCode` parameter for unauthenticated callers (returning only the booking matching both `phone` and `bookingCode`, or throwing `400/403` if `bookingCode` is missing when unauthenticated), while authenticated staff (`ADMIN`/`MANAGER`/`STAFF`/`STYLIST`) and the matching authenticated customer can still look up all bookings by `phone`.
  - **STOMP WebSocket Authentication**: Register a STOMP `ChannelInterceptor` on the inbound client channel that validates the Bearer JWT token on `CONNECT` / `SUBSCRIBE` frames for `/topic/branch/**` topics (while allowing test/sockjs handshake frames configured in integration tests or authenticated headers).

### 4. Financial Reporting Accuracy (`settledAt` & Pro-Rated `Base Salary`)
- **Settlement Timestamp Filtering**:
  - Update `OrderRepository` date-range queries for `PAID` `Orders` (used by `PnlAnalyticsService`, `StaffPayrollService`, and `PosOrderService.getStylistDailyWorklog`) to filter on `COALESCE(o.settledAt, o.createdAt) >= :startDate AND COALESCE(o.settledAt, o.createdAt) < :endDate` instead of `o.createdAt`.
  - Update daily P&L trend bucketing to bucket `PAID` orders by `COALESCE(order.getSettledAt(), order.getCreatedAt()).toLocalDate()`.
- **Pro-Rated `Base Salary` in Tier-2 P&L**:
  - Compute the number of inclusive days in the requested `AnalyticsPeriod`:
    $$\text{daysInPeriod} = \max(1, \text{ChronoUnit.DAYS.between}(\text{startDate}, \text{endDate}) + 1)$$
  - Calculate `fixedBaseSalaryCost` for the period as:
    $$\text{fixedBaseSalaryCost} = \sum \text{staff.baseSalary} \times \frac{\text{daysInPeriod}}{30}$$
    rounded to 0 decimal places (`HALF_UP` for VND), so a 30-day period deducts 100% of monthly `Base Salary` while a 1-day report deducts $\frac{1}{30}$ of monthly `Base Salary`.

### 5. Batch Query & Redis Optimization (`N+1` Elimination)
- **Batch `Slot` Calculation & Stylist Listing**:
  - In `SlotCalculationService.calculateAvailableSlots`:
    - Fetch all active `Bookings` for the branch and target date once via `bookingRepository.findActiveBookingsByBranchAndDay(branchId, dayStart, dayEnd)` before iterating over slots and stylists.
    - Build all Redis slot lock keys for the branch, date, and active stylists upfront and fetch their lock state in a single `redisTemplate.opsForValue().multiGet(allKeys)` call (or single batch call on `RedisLockService`), checking slot overlaps and lock membership in memory with zero SQL or Redis calls inside the `24 × N` loop.
  - In `SlotCalculationService.getActiveStylists`:
    - Add a single grouped aggregate query on `ServiceReviewRepository` that returns `(stylistId, AVG(rating), COUNT(id))` for a collection of `stylistIds`, eliminating the `2N` per-stylist review queries.
- **Batch P&L Order Aggregation**:
  - In `PnlAnalyticsService.getPnlReport`:
    - Eagerly fetch `Order.items` (or batch-load items) and batch-load all `Inventory Transactions` via the existing `findAllByReferenceOrderIdIn(orderIds)` and all `Commission Ledgers` via a new `findAllByOrderIdIn(orderIds)` method, grouping them into `Map<Long, List<...>>` before computing per-order and daily trend metrics.
- **Indexed Staff Listing**:
  - In `UserService.getUsers(branchId)`:
    - Replace `userRepository.findAll().stream().filter(...)` with `userRepository.findActiveStaffByBranchId(branchId)` when `branchId != null` and `userRepository.findAllActiveStaff()` when `branchId == null`.
- **Atomic Redis `Slot Lock` with TTL & Dead Method Removal**:
  - In `RedisLockServiceImpl.tryLockSlots`, execute lock creation and TTL assignment atomically via a Redis `DefaultRedisScript<Boolean>` Lua script (checking `EXISTS` on all keys, and if none exist, running `SET key val EX ttl` on all keys and returning `true`), and if any existing key has `TTL == -1`, heal/expire it.
  - Delete the unused `revokeAll` method (which called blocking `redisTemplate.keys(...)`) from `RefreshTokenStore` and `RedisRefreshTokenStore`, and delete the unused `getLockedSlots` method from `RedisLockService`.

### 6. Lean Codebase & Build Cleanup
- **Remove Unused Dependencies, Repositories & Legacy Entity Columns**:
  - Remove `mapstruct` and `mapstruct-processor` from `backend/pom.xml`.
  - Delete unused repository interfaces: `BookingServiceItemRepository`, `ServiceDefaultStepRepository`, and `OrderItemRepository`.
  - Delete unused repository methods: `BookingRepository.findOverlappingBookingsByBranch`, `ServiceReviewRepository.findByCustomerIdAndIsDeletedFalseOrderByCreatedAtDesc`, and `ServiceReviewRepository.findByStylistIdAndIsDeletedFalse`.
  - Remove the unreferenced legacy fields `branchId`, `currentStockUnits`, and `currentVolume` from `ProductEntity` (the columns remain harmlessly in historical Flyway migrations or can be ignored by JPA while `BranchInventoryEntity` serves as the single source of truth per `ADR-0003`).
- **Cache PDF Fonts Once**:
  - In `ReportExportServiceImpl`, cache the parsed Roboto Regular and Bold `byte[]` font data in `static` memory once on first load instead of reading classpath streams on every PDF export request, and fall back to standard `BaseFont.HELVETICA` cleanly if the classpath resource is absent.

## Testing Decisions

### What Makes a Good Test
- **Test observable domain behavior and security boundaries through public HTTP/service seams**: Every test should verify external outcomes—HTTP status codes, database state after concurrent execution, `Branch Inventory` quantities, `Retained Deposit` balances, `Commission Ledger` entries, P&L VND figures, and query counts—without coupling to private helper names.

### Highest-Level Seams to Test
1. **Concurrent Financial & Inventory Integrity Seam (`OrderAndInventoryDomainDeepeningTest` & `CustomerCrmIntegrationTest`)**:
   - Execute multi-threaded concurrency tests using `CountDownLatch` / `ExecutorService`:
     - **Concurrent Checkout Race Test**: Two threads simultaneously invoke `checkoutOrder(orderId)` on the same active `Order`. Assert that exactly one thread succeeds (`PAID`) and the second thread fails with a domain error, `Branch Inventory` chemical `Opened Volume` and retail `Sealed Units` are deducted **once**, `Commission Ledger` entries are written **once**, and `Payment Transaction` is recorded **once**.
     - **Concurrent `Retained Deposit` Double-Spend Test**: Two threads simultaneously submit `Booking` requests for the same customer who holds a `Retained Deposit` (`creditBalance`). Assert that `creditBalance` is never double-spent or driven negative.
     - **Draft `Order` Modification Credit Safety Test**: Check in a customer with a `Retained Deposit`, add/remove items or change discounts on the active `Order` before checkout, and assert that `customer.creditBalance` remains untouched until `checkoutOrder` is executed.
2. **Multi-Branch Authorization, Privilege Escalation & Public Privacy Seam (`SecurityAndExceptionSmokeTest` & `UserController` / `BookingIntegrationTest`)**:
   - Verify that a `MANAGER` attempting to create a user with role `ADMIN` or in another `branchId` receives `HTTP 403 Forbidden`.
   - Verify that a `STAFF` or `MANAGER` assigned to Branch 2 attempting to access or mutate Branch 1's POS `Orders`, `Branch Inventory`, or P&L Analytics receives `HTTP 403 Forbidden`.
   - Verify that unhandled exceptions return the generic `UNCATEGORIZED_EXCEPTION` message rather than raw exception details.
   - Verify that unauthenticated `/api/v1/customers/loyalty-preview` masks the customer's full name and does not expose raw `totalSpent`, and unauthenticated `/api/v1/bookings/lookup` requires a matching `bookingCode`.
3. **P&L Settlement Date (`settledAt`), Pro-Rated `Base Salary` & Batch Query Seam (`AnalyticsAndExportIntegrationTest` & `BookingIntegrationTest`)**:
   - Verify that a carry-over `Order` created yesterday (`createdAt` = yesterday) and settled today (`settledAt` = today) is counted in today's P&L report and today's `Stylist Daily Worklog` cash handover.
   - Verify that a 1-day P&L report pro-rates `fixedBaseSalaryCost` to $\frac{1}{30}$ of monthly `Base Salary` while a 30-day period deducts 100% of monthly `Base Salary`.
   - Verify that `GET /api/v1/users?branchId=1` returns only active staff members of Branch 1 and excludes `CUSTOMER` accounts.

### Prior Art in the Codebase
- `OrderAndInventoryDomainDeepeningTest`: Exercises transactional `Order` checkout, chemical `BOM` auto-unseal deductions, and `Commission Ledger` persistence.
- `CustomerCrmIntegrationTest`: Exercises `Provisional Customer` creation, `Membership Tier` discounts, and `Retained Deposit` lifecycle via `MockMvc`.
- `SecurityAndExceptionSmokeTest`: Exercises JWT role-based access control and `GlobalExceptionHandler` error envelopes via `MockMvc`.
- `AnalyticsAndExportIntegrationTest`: Exercises Tier-1/Tier-2 P&L calculations, `BOM Wastage`, `Staff Payroll`, and Excel/PDF exports via `MockMvc`.

## Out of Scope

- Frontend React UI modifications (unless a test or mock needs an updated query parameter for `bookingCode` on public lookup).
- Changing the stateless JWT architecture (`ADR-0002`) or two-tier `Service Commission Pool` math (`ADR-0009`).
- Destructive Flyway column drops on historical tables (removing unused legacy mappings in `ProductEntity` is handled cleanly at the JPA entity layer without breaking historical migration checksums).

## Further Notes

- Uses canonical domain terms from `GLOSSARY.md` (`Booking`, `Slot`, `Slot Lock`, `Deposit`, `Retained Deposit`, `Provisional Customer`, `Membership Tier`, `Cumulative Spend`, `Order`, `Walk-in Order`, `Quick Service Ticket`, `Stylist Daily Worklog`, `Service Step`, `Step Assignment`, `Service Commission Pool`, `Commission Ledger`, `Visual Log`, `BOM`, `Master Product`, `Branch Inventory`, `Sealed Unit`, `Opened Volume`, `Inventory Transaction`, `Chemical COGS`, `Order Net Profit`, `Base Salary`, `BOM Wastage`, `Dispatch Board`).
- Respects `ADR-0002`, `ADR-0003`, `ADR-0004`, `ADR-0005`, `ADR-0006`, `ADR-0007`, `ADR-0008`, `ADR-0009`, `ADR-0010`, `ADR-0012`, and `ADR-0013`.
