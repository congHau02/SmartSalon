# Issue 01: Flyway Schema Migration V2 for Catalog, Service Steps, Branch Inventory & Seed Baseline

Status: resolved

## Description

Create Flyway database migration `V2__catalog_inventory_auth.sql` to support:
1. Category column on `services` (`VARCHAR(100)`).
2. Table `service_default_steps` for step templates and suggested commission splits per service.
3. Table `branch_inventories` decoupling master products from physical branch stock (`stock_units`, `current_volume`, `min_stock_alert_units`).
4. Seed baseline data: Flagship branch, Super Admin (`admin`), default service categories, services with BOM, and salon chemical master products.

## Tasks

- [x] Write `backend/src/main/resources/db/migration/V2__catalog_inventory_auth.sql`.
- [x] Add `category` column and index to `services`.
- [x] Create `service_default_steps` with foreign key to `services(id)`.
- [x] Create `branch_inventories` with unique constraint `(branch_id, product_id)` and foreign keys to `branches` and `products`.
- [x] Seed flagship branch `SmartSalon Flagship - Quận 1`.
- [x] Seed super admin user `admin` with BCrypt password `Admin@123` and assign `ADMIN` role.
- [x] Seed sample master products (Wella Color, L'Oréal Oxy, Kérastase Shampoo, Kérastase Mask).
- [x] Seed sample services with BOM relations and default service steps.
- [x] Seed initial branch inventory stock for the flagship branch.

## Answer

Implemented migration script `V2__catalog_inventory_auth.sql`:
1. Added `category` column with index to table `services`.
2. Created table `service_default_steps` with foreign key cascade to `services(id)`.
3. Created table `branch_inventories` with unique constraint `(branch_id, product_id)` decoupling master catalog definitions from branch stock.
4. Seeded initial demo entities:
   - Flagship Branch (`id: 1`, SmartSalon Flagship - Quận 1).
   - Super Admin user (`admin` / `Admin@123` with verified BCrypt hash `$2a$10$DZJ6dkpX7yQ3qTx1TVzLOOCBc8qXRqkF5ji.FkPez./skNqXqxWTm` and role `ADMIN`).
   - 4 master products (Wella Color, L'Oréal Oxy, Kérastase Shampoo, Kérastase Mask).
   - Initial stock for Branch 1 (20 units Wella Color, 10 units + 450ml Oxy, 8 units + 800ml Shampoo, 5 units + 200g Mask).
   - 4 services across categories with 5 BOM chemical formulations and 10 default step commission records.
5. Automated test `FlywayMigrationTest.java` was updated with JDBC verification assertions and passes cleanly (`BUILD SUCCESS`).

## Comments

