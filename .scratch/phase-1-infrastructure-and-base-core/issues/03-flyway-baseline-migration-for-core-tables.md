# 03: Flyway Baseline Migration for 14 Core Domain Tables

**What to build:** An automated Flyway database schema migration script defining the 14 core SmartSalon domain tables compatible with MySQL 9.7, establishing constraints, indexes, foreign keys, and audit columns so that database state is version-controlled and reproducible.

**Blocked by:** 01: Root Infrastructure & Monorepo Restructuring, 02: Backend Base Core & Package Standardization

**Status:** ready-for-agent

- [ ] Create `backend/src/main/resources/db/migration/V1__init_schema.sql` targeting MySQL 9.7 with `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`.
- [ ] Define tables: `roles`, `branches`, `users`, `user_roles`.
- [ ] Define tables: `services`, `products`, `service_bom`.
- [ ] Define tables: `bookings`, `orders`, `order_items`, `order_step_assignments`.
- [ ] Define tables: `technical_logs`, `inventory_transactions`, `payment_transactions`, `commission_ledgers`.
- [ ] Ensure all foreign key constraints, unique indexes, and audit columns (`created_at`, `updated_at`, `created_by`, `is_deleted`) are properly mapped.
- [ ] Verify migration succeeds cleanly on application startup against MySQL 9.7.
