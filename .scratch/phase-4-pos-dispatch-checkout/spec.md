# Specification: Phase 4 - POS, Real-Time Dispatching, Visual Log & Checkout

Status: ready-for-agent

## Problem Statement

Following the completion of Smart Booking, Slot Lock, and PayOS Deposit collection in Phase 3, SmartSalon still lacks the in-salon operational workflow required to take scheduled appointments and walk-in visits from arrival at the front desk through multi-staff service execution, chemical tracking, staff commission accounting, and final payment settlement:
1. When a customer creates a `Booking` online or confirms a 20% `Deposit` via PayOS webhook, receptionists have no real-time push alerts (`WebSocket` STOMP) and must manually refresh the screen to discover new arrivals or confirmed deposits.
2. Receptionists and floor managers lack a unified `Dispatch Board` supporting both a 4-column **Kanban View** (tracking operational progress from waiting arrivals to checkout) and a **Timeline View** (showing 30-minute `Slot` occupancy across branch stylists), making it impossible to check in a `Booking`, open a `Walk-in Order`, or monitor stylist availability in real time.
3. No POS `Order` lifecycle or multi-staff `Step Assignment` workflow exists to split a single service across multiple technicians (e.g., Shampoo Assistant, Chemical Technician, Master Stylist) and track the progress of each `Service Step` (`PENDING` → `IN_PROGRESS` → `COMPLETED`).
4. Technicians and receptionists cannot record a `Visual Log` (`Technical Log`) capturing chemical mixing formulas, hair condition notes, actual `BOM` consumable quantities (`ml`/`g`) used during treatment, and `Before/After` result photographs uploaded via Cloudinary.
5. Cashiers cannot execute an atomic POS Checkout that deducts actual or standard `BOM` volumes from `Opened Volume` (triggering auto-unseal of `Sealed Units` when needed) alongside retail `Master Product` units from `Branch Inventory`, subtracts paid `Booking` `Deposit` amounts, processes final payment (`CASH`, `VIETQR`, or `CARD`), and writes immutable staff payout entries into the `Commission Ledger` using the two-tier `Service Commission Pool` formula.

## Solution

Deliver an end-to-end Real-Time WebSocket Notification system, Hybrid Kanban/Timeline `Dispatch Board`, Multi-Staff `Step Assignment` engine, `Visual Log` with actual `BOM` override and Hybrid Cloudinary photo upload, and Transactional POS Checkout with automated `Commission Ledger` accounting:
1. **Real-Time Branch-Scoped WebSocket Notifications (STOMP)**:
   - Broadcast live `Booking` creation, `Deposit` confirmation, and status transitions to the branch's booking notification topic so receptionists immediately receive toast alerts, audio cues, and notification badge updates without refreshing.
   - Broadcast live POS `Dispatch Board` state changes (`Order` check-in, `Walk-in Order` creation, `Step Assignment` updates, `Visual Log` saves, and `Order` checkout) to the branch's dispatch topic so all active POS terminals stay synchronized in real time.
2. **Hybrid Kanban & Timeline `Dispatch Board`**:
   - Provide a 4-column **Kanban View** (`Sắp đến / Chờ Check-in`, `Đã Check-in / Chờ phục vụ`, `Đang thực hiện`, `Chờ thanh toán & Hoàn tất`) as the default operational view, paired with a switchable **Timeline View** mapping bookings and orders across branch stylists from `08:30` to `20:30`.
   - Include a live Stylist Availability bar (`Đang rảnh` / `Đang phục vụ`), one-click `Booking` **Check-in** (converting a `Booking` into an active `Order` pre-loaded with booked services, default `Step Assignments`, and paid `Deposit` deduction), and a **Walk-in Order** creation modal supporting both customer phone lookup/creation and one-click anonymous guest checkout (`walkin.guest`).
3. **Cart Management & Multi-Staff `Step Assignment`**:
   - Allow adding/removing catalog services and retail `Master Product` items on an active `Order`, applying order-level discounts, and editing order notes.
   - Automatically generate `Step Assignment` records from each service's default `Service Steps`, allowing receptionists to assign different staff members to individual steps, override step commission weights if needed, preview calculated commission amounts in VND, and advance step statuses (`PENDING` → `IN_PROGRESS` → `COMPLETED`), automatically updating parent `Order` and `Booking` statuses.
4. **`Visual Log` (`Technical Log`), Actual `BOM` Override & Hybrid Cloudinary Upload**:
   - Provide a dedicated `Visual Log` tab within the POS Order Drawer that pre-populates consumable chemicals from the standard `BOM` of all services in the `Order`, allowing technicians to adjust actual `ml`/`g` quantities consumed or add extra consumables, record formula and hair condition notes, and upload `Before` and `After` photographs.
   - Process image uploads through a Hybrid Cloudinary Storage service that uploads directly to Cloudinary when cloud credentials are configured and seamlessly falls back to local static storage when running in local/sandbox environments.
5. **Atomic POS Checkout, Inventory Deduction & Two-Tier `Commission Ledger`**:
   - Execute POS Checkout inside a single atomic transaction that:
     1. Deducts consumable chemical volumes from `Branch Inventory` (`Opened Volume` with automatic `Sealed Unit` unsealing) using the `Visual Log` actual `BOM` quantities if recorded, or the aggregated standard `BOM` of the order's services otherwise.
     2. Deducts `Sealed Units` from `Branch Inventory` for any retail `Master Product` items sold on the `Order`.
     3. Computes staff commissions using the two-tier formula (`OrderItem.totalPrice × Service.commissionPoolRate × StepAssignment.commissionRate`) and writes immutable records to the `Commission Ledger` with a transparent calculation breakdown.
     4. Deducts any paid `Booking` `Deposit`, records a `SUCCESS` `Payment Transaction` (`CASH`, `VIETQR` with dynamic QR generation, or `CARD`), transitions the `Order` to `PAID`, and transitions the originating `Booking` (if any) to `COMPLETED`.
   - Provide a `Commission Ledger` summary view for managers and receptionists to inspect daily staff commission payouts by branch, date, and technician.

## User Stories

1. As a receptionist, I want to receive an instant toast notification and sound alert the moment a customer creates a new `Booking` at my branch, so that I am immediately aware of upcoming appointments without refreshing the page.
2. As a receptionist, I want to receive a real-time notification when a customer's 20% `Deposit` payment succeeds via PayOS webhook or sandbox simulation, so that I know the `Booking` is officially `CONFIRMED`.
3. As a receptionist, I want a notification bell in the top header with an unread counter and history dropdown of recent booking and dispatch events, so that I never miss an alert while helping a customer at the counter.
4. As a receptionist, I want all open POS terminals at the same branch to automatically refresh their `Dispatch Board` via WebSocket whenever another staff member checks in a customer, updates a `Service Step`, or completes a checkout, so that floor state is never stale.
5. As a receptionist, I want the `Dispatch Board` to open by default in a 4-column **Kanban View** (`Sắp đến / Chờ Check-in`, `Đã Check-in / Chờ phục vụ`, `Đang thực hiện`, `Chờ thanh toán & Hoàn tất`), so that I can manage the physical flow of customers through the salon.
6. As a receptionist, I want to switch the `Dispatch Board` to a **Timeline View** displaying a time grid (`08:30 – 20:30`) per branch stylist, so that I can visually inspect free time gaps before assigning walk-in customers.
7. As a receptionist, I want a live Stylist Availability bar at the top of the `Dispatch Board` showing which stylists at the branch are currently free (`Đang rảnh`) versus actively performing a `Service Step` (`Đang bận`), so that I can dispatch work evenly.
8. As a receptionist, I want to filter the `Dispatch Board` by branch and date, so that I can review today's active floor operations or audit past/future daily schedules.
9. As a receptionist, I want to click **"Check-in & Mở đơn"** on a waiting `Booking` card to transition the `Booking` to `CHECKED_IN` and automatically create a linked POS `Order`, so that I don't have to re-enter the customer's chosen services.
10. As a receptionist checking in a `Booking`, I want the newly created `Order` to automatically carry over the customer's paid 20% `Deposit` into `deposit_deducted`, so that the customer is never double-charged at checkout.
11. As a receptionist checking in a `Booking`, I want the system to automatically generate `Step Assignment` rows from each booked service's default `Service Steps` and pre-assign them to the stylist selected in the `Booking`, so that dispatching requires minimal clicks.
12. As a receptionist, I want to create a `Walk-in Order` directly on the `Dispatch Board` by entering a customer's name and phone number (automatically matching an existing `Customer` or creating a new one), so that unscheduled visitors are onboarded smoothly.
13. As a receptionist during peak hours, I want a one-click **"Khách lẻ nhanh (Walk-in Guest)"** option when creating a `Walk-in Order` that binds the order to the canonical `walkin.guest` profile without requiring a phone number, so that I can open an order in under 5 seconds.
14. As a receptionist, I want to add additional catalog services to an in-progress `Order` when a customer requests an extra treatment mid-visit, and have the system automatically generate the default `Service Steps` and recalculate the `Order` subtotal and final amount.
15. As a receptionist, I want to add retail `Master Product` items (e.g., take-home shampoo or hair mask) to an active `Order`, so that service treatments and retail purchases are settled on a single bill.
16. As a receptionist, I want to remove a mistakenly added service or retail `Master Product` item from an unpaid `Order` and have the order totals and step assignments update immediately.
17. As a receptionist or floor manager, I want to assign different stylists or technicians to individual `Service Steps` within a service (e.g., Technician A for *Chuẩn bị & Xả tóc*, Master Stylist B for *Pha & Vào thuốc nhuộm*, Assistant C for *Gội xả & Sấy tạo kiểu*), so that each employee is credited for the exact phase they performed.
18. As a salon manager, I want each service to have a configurable `Service Commission Pool` percentage (defaulting to `20%` of the service price) that is distributed across the service's `Service Steps` according to their step weights (`commission_rate`), so that total staff commissions remain financially sustainable while preserving relative step weights (`15% / 65% / 20%`).
19. As a receptionist or manager, I want to see the live calculated VND commission preview for each `Step Assignment` inside the POS Order Drawer and optionally adjust a step's weight percentage for special cases before checkout.
20. As a receptionist or stylist, I want to transition an individual `Step Assignment` from `PENDING` to `IN_PROGRESS` (recording `started_at`) and from `IN_PROGRESS` to `COMPLETED` (recording `completed_at`), so that treatment progress (`1/3`, `2/3`, `3/3`) is visible on the Kanban card.
21. As a receptionist, I want starting the first `Service Step` on an `Order` to automatically move the `Order` (and its linked `Booking`, if any) to `IN_PROGRESS`, and completing all steps to allow moving the `Order` to `READY_FOR_CHECKOUT`, so that cards flow across the Kanban board naturally.
22. As a technician or receptionist, I want to open the `Visual Log` tab on an `Order` and see the standard `BOM` chemical items (`ml`/`g`) for all services in that order pre-filled automatically, so that I have a baseline recipe ready to confirm or adjust.
23. As a technician, I want to modify the actual `ml` or `g` quantity of any pre-filled `BOM` chemical or add an extra consumable chemical product to the `Visual Log` when a customer has thicker/longer hair, so that actual chemical consumption is recorded accurately.
24. As a technician, I want to record detailed `Formula Notes` (dye ratios, oxidant strength, processing time) and `Hair Condition Notes` (porosity, bleaching history, scalp sensitivity) in the `Visual Log`, so that the salon retains a permanent technical record for the customer's next visit.
25. As a technician or receptionist, I want to upload `Before` and `After` treatment photographs in the `Visual Log` and view them side-by-side, so that visual results are documented alongside the chemical formula.
26. As a developer or tester running SmartSalon locally without external Cloudinary API keys, I want photo uploads in the `Visual Log` to automatically fall back to local static disk storage while using live Cloudinary CDN whenever credentials are configured, so that photo upload works out of the box in all environments.
27. As a cashier opening the **Checkout** tab of an `Order`, I want to see a clear financial breakdown showing `Subtotal`, editable `Discount Amount`, `Deposit Deducted` (from a paid `Booking`), and `Final Amount` due (`max(0, subtotal - discount - deposit)`).
28. As a cashier, I want to select from `CASH` (Tiền mặt), `VIETQR` (Chuyển khoản QR), or `CARD` (Thẻ) when settling the `Final Amount` at checkout.
29. As a cashier selecting `VIETQR` at checkout, I want the POS Drawer to display a dynamic scannable VietQR code for the exact `Final Amount` due along with the transfer reference code, so that the customer can scan and pay at the counter immediately.
30. As a cashier completing POS Checkout, I want the system to atomically deduct the order's consumable chemicals (`actual_bom_json` if saved in the `Visual Log`, otherwise standard service `BOM`) from `Branch Inventory` (`Opened Volume`, automatically unsealing `Sealed Units` and logging `AUTO_UNSEAL` + `SERVICE_CONSUMPTION` `Inventory Transactions`), so that chemical stock is always accurate in real time.
31. As a cashier completing POS Checkout for an `Order` that includes retail `Master Product` items, I want the system to atomically deduct the sold quantity from `Sealed Units` (`stock_units`) in `Branch Inventory` and log a `RETAIL_SALE` `Inventory Transaction`.
32. As a cashier completing POS Checkout, I want the system to atomically generate immutable `Commission Ledger` records for every `Step Assignment` in the `Order` containing the exact VND payout and human-readable calculation formula (`calculation_notes`), and transition the `Order` to `PAID` and the linked `Booking` to `COMPLETED`.
33. As a salon manager or receptionist, I want to open a **Sổ cái Hoa hồng (`Commission Ledger`)** modal on the `Dispatch Board` to view total earned commissions per staff member and inspect individual step commission records for the selected branch and date.

## Implementation Decisions

### 1. Schema Evolution (Flyway V4 Migration)
- **Service Commission Pool**: Extend `services` with `commission_pool_rate DECIMAL(5, 2) NOT NULL DEFAULT 20.00` representing the percentage of a service item's price allocated to the total staff commission pool.
- **Order Metadata Snapshots**: Extend `orders` with `customer_name VARCHAR(150) NULL`, `customer_phone VARCHAR(20) NULL`, `payment_method VARCHAR(30) NULL`, and `notes VARCHAR(500) NULL` so walk-in and booking orders display customer identity and settlement method without extra joins.
- **Visual Log Actual BOM**: Extend `technical_logs` with `actual_bom_json JSON NULL` storing an array of `{ productId, productName, sku, standardAmount, actualAmount, unit }` items.
- **Canonical Walk-in Guest Seed**: Seed a `walkin.guest` user (`CUSTOMER` role) to back one-click anonymous `Walk-in Orders` while keeping `orders.customer_id` non-null.

### 2. Real-Time STOMP WebSocket Messaging Module
- Configure a Spring STOMP WebSocket message broker exposing `/ws` (supporting both native WebSocket and SockJS) with `/topic` broker destinations.
- Publish structured `RealtimeEventDto` payloads (`eventType`, `branchId`, `referenceId`, `code`, `title`, `message`, `timestamp`, `data`) across two branch-scoped channels:
  - `/topic/branch/{branchId}/bookings`: Triggered when a `Booking` is created (`BOOKING_CREATED`), confirmed via PayOS deposit webhook/simulation (`BOOKING_CONFIRMED`), or changes status (`BOOKING_STATUS_CHANGED`).
  - `/topic/branch/{branchId}/dispatch`: Triggered when a `Booking` is checked in (`ORDER_CHECKED_IN`), a `Walk-in Order` is created (`WALK_IN_CREATED`), an `Order` or `Step Assignment` is updated (`ORDER_UPDATED`, `STEP_UPDATED`), a `Visual Log` is saved (`VISUAL_LOG_SAVED`), or an `Order` is checked out (`ORDER_CHECKED_OUT`).

### 3. POS Dispatch Board, Order & Step Assignment Module
- **Order Status Lifecycle**: `CHECKED_IN` → `IN_PROGRESS` → `READY_FOR_CHECKOUT` → `PAID` (plus `CANCELLED`).
- **Step Assignment Lifecycle**: `PENDING` → `IN_PROGRESS` → `COMPLETED`.
- **Booking Check-in Contract (`POST /api/v1/pos/bookings/{bookingId}/check-in`)**:
  - Validates that the `Booking` is in `CONFIRMED` or `PENDING_PAYMENT` state and has not already been checked into an active `Order`.
  - Transitions `Booking.status` to `CHECKED_IN`.
  - Creates an `Order` (`status = 'CHECKED_IN'`), snapshots `customerName` and `customerPhone`, sets `depositDeducted = booking.depositAmount` if `booking.depositStatus == PAID` (otherwise `0`), copies all `Booking Service Items` into `SERVICE` `OrderItems`, and generates `Step Assignments` from each service's default `Service Steps` assigned initially to `booking.staff`.
- **Walk-in Order Contract (`POST /api/v1/pos/orders/walk-in`)**:
  - Accepts `branchId`, optional `customerName` and `customerPhone` (resolving an existing user by phone or creating a new `CUSTOMER` user, or defaulting to `walkin.guest` when `isQuickGuest = true`), initial `serviceIds`, optional `productItems`, and optional default `stylistId`.
  - Creates the `Order` (`status = 'CHECKED_IN'`), populates items and default `Step Assignments`, and calculates initial totals.
- **Automatic Parent State Progression**:
  - When the first `Step Assignment` of an `Order` transitions to `IN_PROGRESS` (or `COMPLETED`), `Order.status` automatically advances from `CHECKED_IN` to `IN_PROGRESS`, and any linked `Booking.status` advances to `IN_PROGRESS`.
  - When all `Step Assignments` of an `Order` reach `COMPLETED`, `Order.status` automatically advances to `READY_FOR_CHECKOUT`.
- **Two-Tier Commission Formula**:
  $$\text{commissionAmount} = \text{round}\left(\text{orderItem.totalPrice} \times \frac{\text{service.commissionPoolRate}}{100} \times \frac{\text{step.commissionRate}}{100},\ 0\right)$$

### 4. Visual Log & Hybrid Cloudinary Media Module
- **Visual Log Resolution (`GET /api/v1/pos/orders/{orderId}/visual-log`)**:
  - If a `TechnicalLog` record already exists for the `Order` with `actual_bom_json`, returns the saved record and parsed BOM items.
  - Otherwise, aggregates the standard `BOM` across all active `SERVICE` items in the `Order` (summing `standard_amount * quantity` per `productId`) so the frontend table is pre-populated with the exact expected chemical quantities.
- **Visual Log Persistence (`PUT /api/v1/pos/orders/{orderId}/visual-log`)**:
  - Upserts the `TechnicalLog` for the `Order`, saving `formulaNotes`, `hairConditionNotes`, `beforeImageUrl`, `afterImageUrl`, `staffId`, and serializing `actualBomItems` into `actual_bom_json`.
- **Hybrid Cloudinary Upload (`POST /api/v1/pos/media/upload`)**:
  - Accepts a `MultipartFile` image.
  - When `app.cloudinary.{cloud-name, api-key, api-secret}` are configured, signs the upload request with `SHA-1` and uploads to Cloudinary REST API under folder `smartsalon/visual-logs`, returning `secure_url`.
  - When Cloudinary credentials are blank, writes the file to local directory `uploads/visual-logs/` and returns `/uploads/visual-logs/{filename}` served statically by Spring WebMvc.

### 5. Atomic POS Checkout, Inventory Deduction & Commission Ledger Module
- **Checkout Contract (`POST /api/v1/pos/orders/{orderId}/checkout`)**:
  - Runs inside a single `@Transactional` method:
    1. Recalculates `subtotal`, applies `discountAmount` and `depositDeducted`, and computes `finalAmount = max(0, subtotal - discountAmount - depositDeducted)`.
    2. **Chemical BOM Deduction**: Determines consumable amounts from `TechnicalLog.actual_bom_json` (if present and non-empty) or from the standard `BOM` of all `SERVICE` items in the `Order`. Invokes the existing dual-level auto-unseal engine (`deductConsumables`) for each chemical product with `referenceOrderId = order.id`.
    3. **Retail Product Deduction**: For each `PRODUCT` item in the `Order`, acquires a pessimistic write lock on `BranchInventory`, verifies `stock_units >= quantity`, decrements `stock_units`, and records a `RETAIL_SALE` `Inventory Transaction`.
    4. **Step Completion & Commission Ledger Generation**: Marks any unfinished `Step Assignments` as `COMPLETED`, computes final `commissionAmount` per step using the two-tier `Service Commission Pool` formula, and inserts immutable `Commission Ledger` records (`status = 'EARNED'`) with descriptive `calculation_notes`.
    5. **Payment & Status Settlement**: Creates a `SUCCESS` `Payment Transaction` linked to `order_id` with the chosen `paymentMethod` (`CASH`, `VIETQR`, `CARD`) and `amount = finalAmount`, transitions `Order.status` to `PAID`, and transitions the linked `Booking` (if any) to `COMPLETED`.
    6. Broadcasts an `ORDER_CHECKED_OUT` WebSocket event to `/topic/branch/{branchId}/dispatch`.

## Testing Decisions

### What Makes a Good Test
- **Test external behavior, never implementation details**: Tests must interact with the system through its public contracts (HTTP REST endpoints via `MockMvc` or public service interfaces backed by real database transactions) and assert observable outcomes (HTTP responses, database state transitions, inventory balances, commission ledger records, and published WebSocket topic payloads) rather than mocking internal helper methods.
- **Prefer existing high-level seams**: Use the same full-stack Spring Boot integration test seam established in Phases 1–3 (`@SpringBootTest`, `@AutoConfigureMockMvc`, transactional test slices) so schema constraints, JPA mappings, locking, and serialization are verified together.

### Highest Seams & Modules to Test
1. **Flyway V4 Migration Seam (`FlywayMigrationTest`)**:
   - Extends the existing migration test suite to verify the new columns on `services`, `orders`, and `technical_logs`, as well as the seeded `walkin.guest` user.
2. **Real-Time WebSocket Notification Seam (`RealtimeNotificationServiceTest`)**:
   - Verifies that booking creation, PayOS deposit confirmation, and POS dispatch actions publish the expected `RealtimeEventDto` payloads to `/topic/branch/{branchId}/bookings` and `/topic/branch/{branchId}/dispatch`.
3. **POS Lifecycle, Visual Log & Atomic Checkout Integration Seam (`PosControllerIntegrationTest` / `PosOrderServiceTest`)**:
   - End-to-end behavioral tests covering:
     - Checking in a `CONFIRMED` `Booking` (with a paid 20% `Deposit`) into an `Order` and verifying `deposit_deducted`, copied service items, and auto-generated `Step Assignments`.
     - Creating a `Walk-in Order` (both with customer phone and with `walkin.guest`), adding/removing service and retail `Master Product` items, reassigning step stylists, and advancing step statuses (`PENDING` → `IN_PROGRESS` → `COMPLETED`).
     - Fetching default `BOM` quantities in `Visual Log`, overriding `actual_bom_json` (e.g., increasing dye from `60ml` to `85ml`), uploading `Before/After` images in local fallback mode, and saving the `Visual Log`.
     - Executing `POST /api/v1/pos/orders/{orderId}/checkout` and asserting that:
       - `Branch Inventory` deducts the overridden `85ml` chemical volume from `Opened Volume` (auto-unsealing a `Sealed Unit` if needed) and deducts `Sealed Units` for retail products.
       - `Commission Ledger` rows are persisted with exact two-tier payouts (`totalPrice × poolRate × stepRate`).
       - `Payment Transaction` is recorded for `finalAmount`, `Order.status` becomes `PAID`, and `Booking.status` becomes `COMPLETED`.
4. **Frontend Build & Static Verification Seam**:
   - `npm run lint` and `npm run build` verify all React 19 POS components, STOMP WebSocket hooks, Kanban/Timeline views, and the 3-tab POS Drawer compile cleanly with zero warnings or errors.

### Prior Art in the Codebase
- `FlywayMigrationTest`: Existing schema verification test for V1–V3 migrations.
- `BookingControllerIntegrationTest` & `PayOSWebhookIntegrationTest`: Existing `MockMvc` + Spring Security integration tests exercising REST contracts and state transitions.
- `InventoryServiceTest`: Existing unit/integration tests for `deductConsumables` and dual-level auto-unseal logic.

## Out of Scope

- Customer post-paid credit/debt accounts (`Ghi nợ khách hàng`) and multi-tier loyalty point accrual (Phase 5).
- Automated monthly payroll bank transfer file generation from the `Commission Ledger` (Phase 5).

## Further Notes

- Architectural trade-offs are documented in `ADR-0008` (Branch-Scoped STOMP WebSocket Topics) and `ADR-0009` (Two-Tier Service Commission Pool, Transactional POS Checkout & Hybrid Cloudinary Visual Log).
- All domain concepts strictly follow `GLOSSARY.md`.
