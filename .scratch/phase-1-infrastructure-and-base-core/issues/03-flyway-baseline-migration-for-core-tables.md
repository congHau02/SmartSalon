# 03: Flyway Baseline Migration for 14 Core Domain Tables

**What to build:** An automated Flyway database schema migration script defining the 14 core SmartSalon domain tables compatible with MySQL 9.7, establishing constraints, indexes, foreign keys, and audit columns so that database state is version-controlled and reproducible.

**Blocked by:** 01: Root Infrastructure & Monorepo Restructuring, 02: Backend Base Core & Package Standardization

**Status:** resolved

- [x] Create `backend/src/main/resources/db/migration/V1__init_schema.sql` targeting MySQL 9.7 with `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`.
- [x] Define tables: `roles`, `branches`, `users`, `user_roles`.
- [x] Define tables: `services`, `products`, `service_bom`.
- [x] Define tables: `bookings`, `orders`, `order_items`, `order_step_assignments`.
- [x] Define tables: `technical_logs`, `inventory_transactions`, `payment_transactions`, `commission_ledgers`.
- [x] Ensure all foreign key constraints, unique indexes, and audit columns (`created_at`, `updated_at`, `created_by`, `is_deleted`) are properly mapped.
- [x] Verify migration succeeds cleanly on application startup against MySQL 9.7.

## Answer

- Created `backend/src/main/resources/db/migration/V1__init_schema.sql` establishing all 14 core tables with InnoDB engine and `utf8mb4_unicode_ci` collation.
- Seeded default security roles: `ADMIN`, `MANAGER`, `STYLIST`, `STAFF`, `CUSTOMER`.
- Mapped all audit columns (`created_at`, `updated_at`, `created_by`, `is_deleted`) to match `BaseEntity`.
- Added automated Flyway integration test in `FlywayMigrationTest.java` verifying full migration execution cleanly. All 6 tests passing.
