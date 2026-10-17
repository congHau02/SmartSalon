# Specification: Phase 3 - Smart Booking, Redis Slot Lock & PayOS Deposit

Status: ready-for-agent

## Problem Statement

Following the completion of Catalog, Inventory, and Auth (RBAC) in Phase 2, SmartSalon still lacks an end-to-end customer booking engine, concurrency-safe slot locking, and automated deposit collection:
1. The `bookings` table in `V1__init_schema.sql` lacks a join table (`booking_services`) to record multiple selected services per booking, lacks `end_time`, `total_duration_minutes`, `total_price`, and `booking_code` for time-window overlap detection and customer lookup, and has no seeded `STYLIST` accounts.
2. Customers cannot query real-time available time slots (`SlotCalculationService`) that account for multi-service duration (`end_time = start_time + total_duration_minutes`), overlapping database bookings, and active Redis holds across both specific stylists and "Any Available Stylist" auto-assignment.
3. High-concurrency booking requests risk double-booking the same stylist unless all 30-minute buckets within `[startTime, endTime)` are atomically locked in Redis 8 (`lock:slot:{stylistId}:{date}:{timeSlot}`) with a 5-minute TTL (`300s`) and automatically expired if unpaid.
4. No PayOS / VietQR integration or webhook handler exists to collect the 20% upfront `Deposit`, audit the `Payment Transaction`, and transition bookings from `PENDING_PAYMENT` to `CONFIRMED`.
5. The frontend lacks the React 19 Multi-step Booking Wizard (`/customer/booking`), the 5-minute QR deposit checkout & ticket screen, customer booking lookup, and the Admin/Receptionist Booking Management portal (`/admin/bookings`).

## Solution

Build out the complete Smart Booking, Redis 8 Multi-Bucket Lock, PayOS Deposit Webhook, and React 19 Multi-step Booking Wizard across backend and frontend:
1. **Flyway Migration `V3__smart_booking_payos.sql`**:
   - Extend `bookings` with `booking_code`, `end_time`, `total_duration_minutes`, `total_price`, `customer_name`, and `customer_phone` snapshot columns, updating default `status` to `PENDING_PAYMENT`.
   - Create `booking_services (id, booking_id, service_id, price, duration_minutes)` linking each booking to one or more catalog services.
   - Seed a second branch (`SmartSalon Luxury - Quận 3`) and sample `STYLIST` and `STAFF` users assigned to branches so slot calculation and load-balancing work out of the box.
2. **Slot Calculation & Multi-Bucket Redis Lock Engine (`com.smartsalon.booking`)**:
   - `SlotCalculationService`: Generates 30-minute `Slot` candidates within branch operating hours (`08:30` – `20:30`) for a given `branchId`, `date`, and `serviceIds` (summing `totalDurationMinutes`). Marks each slot as `AVAILABLE`, `LOCKED`, `BOOKED`, or `PAST` by checking `(RequestStart < ExistingEnd) AND (RequestEnd > ExistingStart)` against active DB bookings and Redis keys.
   - Supports both specific `stylistId` selection and `stylistId = null` ("Any Available Stylist") using least-workload load balancing (selecting the free stylist with the fewest booked minutes on that date, with automatic fallback if a Redis lock collision occurs).
   - `RedisLockService`: Atomically locks all 30-minute buckets inside `[startTime, endTime)` using `StringRedisTemplate.opsForValue().multiSetIfAbsent(...)` under key pattern `lock:slot:{stylistId}:{date}:{HH:mm}` with a 300-second TTL.
   - `@Scheduled` expiration job sweeping `PENDING_PAYMENT` bookings where `slot_lock_expires_at <= NOW()`, transitioning them to `EXPIRED` and releasing Redis keys.
3. **PayOS Deposit & Webhook Engine (`com.smartsalon.payment`)**:
   - Calculates `deposit_amount = round(total_price * 0.20)` upon booking creation and persists a `PENDING` `PaymentTransactionEntity`.
   - `PayOSService` uses Spring 7 `RestClient` for live PayOS payment link generation and `HMAC-SHA256` signature verification at `POST /api/v1/webhooks/payos`, with automatic fallback to deterministic VietQR generation and `POST /api/v1/webhooks/payos/simulate/{bookingCode}` for local/sandbox testing.
4. **React 19 Multi-Step Booking Wizard & Admin Booking Portal (`ui-ux-pro-max`)**:
   - **Step 1 (Branch & Services)**: Select branch and multiple services grouped by category with live sticky summary (total duration, total price, 20% deposit).
   - **Step 2 (Stylist & Time Slot)**: Choose a specific Stylist or "Any Available Stylist", pick a date, and select an available time slot grouped by Morning / Afternoon / Evening.
   - **Step 3 (Customer Info & 5-Min Hold)**: Auto-fills from `useAuth()` if logged in or accepts Guest Name + Phone (backend resolves or creates a `CUSTOMER` user by phone), plus notes, and triggers `POST /api/v1/bookings` to acquire the 5-minute Redis lock.
   - **Step 4 (VietQR / PayOS Deposit & Confirmed Ticket)**: Displays scannable VietQR, `05:00` countdown timer, TanStack Query v5 polling every `2.5s`, a Sandbox "Giả lập thanh toán thành công" button, and transitions to the confirmed electronic booking ticket (`CONFIRMED`) or expiration alert (`EXPIRED`).
   - **Customer Lookup & Admin Bookings (`/admin/bookings`)**: Customer lookup by phone/booking code on `/customer/booking` and full branch/date/status booking management table for Admin/Manager/Staff on `/admin/bookings`.

## User Stories

1. As a customer, I want to select one or more salon services and immediately see the combined duration, total price, and 20% required deposit.
2. As a customer, I want to either pick my favorite Stylist or choose "Any Available Stylist" and view all valid 30-minute start times between `08:30` and `20:30` that can accommodate my full service duration without overlapping another appointment.
3. As a walk-in or unauthenticated online customer, I want to book by entering my full name and phone number without being forced through a separate registration screen first, while logged-in customers have their details pre-filled automatically.
4. As a customer confirming my booking step, I want the system to hold my chosen time slot for 5 minutes (`300s`) so nobody else can take my stylist while I scan the VietQR code.
5. As a customer on the QR checkout screen, I want to see a live 5-minute countdown timer and have the screen automatically transition to a Confirmed Booking Ticket the moment my PayOS/VietQR deposit succeeds.
6. As a developer or tester running locally without live PayOS merchant credentials, I want a "Giả lập thanh toán thành công (Sandbox)" button on the QR checkout screen that triggers the webhook confirmation flow end-to-end.
7. As a salon manager or receptionist, I want unpaid bookings whose 5-minute hold expires to automatically change status to `EXPIRED` and free up the stylist's slots for other customers.
8. As a customer, I want to look up my existing bookings by Booking Code or Phone Number so I can review my appointment time, assigned stylist, and deposit status.
9. As an admin, manager, or receptionist, I want an Admin Booking Management page (`/admin/bookings`) to filter appointments by branch, date, and status, and to confirm, check in, or cancel bookings.

## Implementation Decisions

### 1. Database Schema Migration (`V3__smart_booking_payos.sql`)
- Alter `bookings` table:
  - Add `booking_code VARCHAR(30) NOT NULL UNIQUE`
  - Add `end_time DATETIME NOT NULL`
  - Add `total_duration_minutes INT NOT NULL DEFAULT 30`
  - Add `total_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00`
  - Add `customer_name VARCHAR(150) NULL`
  - Add `customer_phone VARCHAR(20) NULL`
  - Alter `status` default to `'PENDING_PAYMENT'`
  - Add composite index `idx_bookings_stylist_window (staff_id, booking_time, end_time)`
- Create `booking_services` table:
  - `id BIGINT AUTO_INCREMENT PRIMARY KEY`
  - `booking_id BIGINT NOT NULL` (FK -> `bookings(id)` ON DELETE CASCADE)
  - `service_id BIGINT NOT NULL` (FK -> `services(id)` ON DELETE RESTRICT)
  - `price DECIMAL(15, 2) NOT NULL DEFAULT 0.00`
  - `duration_minutes INT NOT NULL DEFAULT 30`
- Seed Data:
  - Branch 2: `SmartSalon Luxury - Quận 3`.
  - Stylists for Branch 1: `stylist.minh` (Master Stylist Minh Tuấn), `stylist.lan` (Senior Stylist Lan Anh), `stylist.hung` (Creative Stylist Hoàng Hùng) with role `STYLIST`.
  - Stylist for Branch 2: `stylist.thao` (Master Stylist Phương Thảo) with role `STYLIST`.
  - Receptionist Staff for Branch 1: `staff.le` (Lễ tân Thanh Lê) with role `STAFF`.

### 2. Slot Calculation & Overlap Algorithm (`SlotCalculationService`)
- Operating hours: `08:30` to `20:30`, step `30 minutes` (`08:30`, `09:00`, ..., `20:00`).
- Given `branchId`, `date` (`LocalDate`), `serviceIds` (`List<Long>`), and optional `stylistId`:
  1. Sum `totalDurationMinutes` across all active requested `ServiceEntity` items.
  2. For each candidate `slotStart` from `08:30` while `slotStart.plusMinutes(totalDurationMinutes) <= 20:30`:
     - Compute `slotEnd = slotStart.plusMinutes(totalDurationMinutes)`.
     - Enumerate all 30-minute bucket timestamps `t` in `[slotStart, slotEnd)`.
     - For a given Stylist $S$:
       - Check DB overlap: `(slotStart < existing.endTime) AND (slotEnd > existing.bookingTime)` where `existing.status IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS')` OR (`existing.status = 'PENDING_PAYMENT'` AND `existing.slotLockExpiresAt > NOW()`).
       - Check Redis lock keys: `lock:slot:{S.id}:{date}:{t}` for all buckets $t$.
  3. If `stylistId != null`, return slot statuses directly for that stylist.
  4. If `stylistId == null` ("Any Available Stylist"), a slot is `AVAILABLE` if at least one active Stylist at `branchId` is completely free across `[slotStart, slotEnd)`; `LOCKED` if no stylist is free due to active holds; `BOOKED` otherwise.

### 3. Multi-Bucket Redis Lock & Least-Workload Auto-Assign (`RedisLockService` & `BookingService`)
- Key format: `lock:slot:{stylistId}:{yyyy-MM-dd}:{HH:mm}`, value = `bookingCode`, TTL = `Duration.ofSeconds(300)`.
- `tryLockSlots(Long stylistId, LocalDateTime startTime, LocalDateTime endTime, String lockOwner)`:
  - Generates the list of 30-minute bucket keys covering `[startTime, endTime)`.
  - Calls `stringRedisTemplate.opsForValue().multiSetIfAbsent(keyValueMap)`.
  - If `Boolean.TRUE`, sets `expire(key, Duration.ofSeconds(300))` on each key and returns `true`.
- When `stylistId == null`, candidate free stylists at the branch are sorted ascending by total scheduled minutes on `date` (load-balancing), and `tryLockSlots` is attempted in order until one succeeds.
- `@Scheduled(fixedDelay = 30000)` job in `BookingExpirationScheduler` finds all `PENDING_PAYMENT` bookings with `slotLockExpiresAt <= LocalDateTime.now()`, marks them `EXPIRED`, and deletes their Redis lock keys.

### 4. PayOS Deposit & Webhook Verification (`PayOSService` & `PayOSWebhookController`)
- `depositAmount = totalPrice.multiply(new BigDecimal("0.20")).setScale(0, RoundingMode.HALF_UP)`.
- Creates a `PaymentTransactionEntity` with `paymentMethod = "PAYOS_VIETQR"`, unique `transactionCode`, `amount = depositAmount`, and `status = "PENDING"`.
- Webhook endpoint `POST /api/v1/webhooks/payos` verifies `HMAC-SHA256` signature when `app.payos.checksum-key` is configured, updates `PaymentTransactionEntity` (`status = "SUCCESS"`, stores `payloadWebhook`), updates `BookingEntity` (`status = "CONFIRMED"`, `depositStatus = "PAID"`, clears `slotLockExpiresAt`), and releases temporary Redis keys (since the confirmed DB booking now permanently guards the slot).
- Simulation endpoint `POST /api/v1/webhooks/payos/simulate/{bookingCode}` executes the same confirmation logic for local/sandbox development.

## Testing Decisions

- **Flyway Migration V3 Seam**:
  - `FlywayMigrationTest` verifies `bookings` new columns, `booking_services` table creation, and seeded `STYLIST` users.
- **Slot Calculation & Overlap Seam**:
  - Unit & integration tests verify that a 120-minute booking at `09:00–11:00` marks `08:30` (if duration > 30m), `09:00`, `09:30`, `10:00`, and `10:30` as unavailable for that stylist while keeping `11:00` available.
  - Verifies "Any Available Stylist" remains `AVAILABLE` at `09:00` when Stylist A is booked but Stylist B is free, and assigns Stylist B (least workload).
- **Redis Multi-Bucket Concurrency Seam**:
  - Verifies `multiSetIfAbsent` rejects overlapping partial-window lock attempts and releases keys upon cancellation or expiration.
- **PayOS Webhook & Expiration Seam**:
  - Verifies booking creation calculates 20% deposit, creates `PENDING` `PaymentTransaction`, and transitions to `CONFIRMED` + `PAID` upon webhook/simulation callback.
  - Verifies expired `PENDING_PAYMENT` bookings transition to `EXPIRED`.
- **Frontend Build & Wizard Flow Seam**:
  - `npm run build` and `eslint` pass with zero errors.
  - Multi-step Booking Wizard, QR countdown, and Admin Booking Management render and interact with backend APIs cleanly.

## Out of Scope

- POS Kanban/Timeline floor dispatching and multi-staff step splitting during active treatment (Phase 4).
- BOM chemical stock deduction upon POS Order completion and Visual Log photo upload (Phase 4).

## Further Notes

- Architecture decisions are recorded in `docs/adr/0006-multi-bucket-redis-slot-lock-and-stylist-load-balancing.md` and `docs/adr/0007-hybrid-payos-deposit-webhook-and-sandbox.md`.
- Domain terminology is strictly aligned with `GLOSSARY.md`.
