# Issue 01: Flyway Schema Migration V3 for Smart Booking, Booking Services & Stylist Seeds

Status: resolved

## Description

Create Flyway database migration `V3__smart_booking_payos.sql` to extend the `bookings` table for multi-service time-window overlap detection, create the `booking_services` join table, and seed initial `STYLIST` and `STAFF` accounts across branches.

## Tasks

- [x] Write `backend/src/main/resources/db/migration/V3__smart_booking_payos.sql`.
- [x] Alter `bookings` table to add `booking_code`, `end_time`, `total_duration_minutes`, `total_price`, `customer_name`, `customer_phone`, update default `status` to `PENDING_PAYMENT`, and add index `idx_bookings_stylist_window (staff_id, booking_time, end_time)`.
- [x] Create `booking_services` table with foreign keys to `bookings(id)` and `services(id)` storing `price` and `duration_minutes` snapshots.
- [x] Seed Branch 2 (`SmartSalon Luxury - Quận 3`) and sample `STYLIST` users (`stylist.minh`, `stylist.lan`, `stylist.hung`, `stylist.thao`) plus `STAFF` user (`staff.le`).
- [x] Update `FlywayMigrationTest` to assert V3 schema additions and seeded stylists.

## Answer

Implemented Flyway database migration `V3__smart_booking_payos.sql`:
1. **Extended `bookings` table**:
   - Added `booking_code VARCHAR(30) NOT NULL` with unique constraint `uk_bookings_code`.
   - Added `end_time DATETIME NOT NULL`, `total_duration_minutes INT NOT NULL DEFAULT 30`, `total_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00`.
   - Added `customer_name VARCHAR(150) NULL` and `customer_phone VARCHAR(20) NULL` with index `idx_bookings_customer_phone`.
   - Updated default `status` to `'PENDING_PAYMENT'`.
   - Added composite index `idx_bookings_stylist_window (staff_id, booking_time, end_time)`.
2. **Created join table `booking_services`**:
   - Maps `booking_id` (CASCADE) and `service_id` (RESTRICT) with `price` and `duration_minutes` snapshots.
3. **Seeded baseline entities**:
   - Branch 2: `SmartSalon Luxury - Quận 3`.
   - Stylists: `stylist.minh`, `stylist.lan`, `stylist.hung` (Branch 1), `stylist.thao` (Branch 2) assigned role `STYLIST`.
   - Staff: `staff.le` (Branch 1) assigned role `STAFF`.
   - Initial inventory for Branch 2 (15 units Wella Color, 8 units Oxy, 6 units Shampoo, 4 units Mask).
4. **Automated Verification**:
   - Updated `FlywayMigrationTest.java` with assertions for table `booking_services`, new `bookings` columns, branch 2, and seeded stylists/staff.
   - All 17 backend test suites run and pass (`BUILD SUCCESS`).

## Comments

