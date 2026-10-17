# Specification: Phase 2 - Catalog, Inventory & Auth (RBAC)

Status: ready-for-agent

## Problem Statement

Following the baseline infrastructure established in Phase 1, SmartSalon lacks core domain entities and business capabilities for authentication, role-based authorization, service catalog definitions, and chemical inventory accounting. Specifically:
1. Users cannot log in or register; secured endpoints reject calls because no token issuance endpoint or authentication provider exists.
2. The system cannot distinguish between system roles (`ADMIN`, `MANAGER`, `STAFF`, `STYLIST`, `CUSTOMER`), nor can it enforce branch-scoped permissions.
3. Salon services lack categorization, Bill of Materials (BOM) chemical formulas (ml/gram consumption rules), and standardized operational step workflows with staff commission allocations.
4. Product definitions are tightly coupled, lacking a clear separation between global master catalog definitions and physical branch inventories, which prevents multi-branch chain operations and accurate sealed-unit-to-opened-volume conversions.
5. The frontend lacks login/register pages, navigation guards, branch selection, and management views for services, consumables, and stock transactions.

Without these foundational modules, downstream appointment booking, real-time POS operations, and commission tracking in subsequent phases cannot function.

## Solution

Build out the complete Catalog, Inventory, and Auth & RBAC capabilities across backend and frontend:
1. **Flyway Migration `V2__catalog_inventory_auth.sql`**:
   - Decouple master products from branch inventories via `branch_inventories (id, branch_id, product_id, stock_units, current_volume, min_stock_alert_units, ...)`.
   - Enhance `services` with `category` and create `service_default_steps` for step-level commission templates.
   - Seed initial flagship branch, default Super Admin (`admin`), core service categories, services with BOM, and consumable chemical products.
2. **Auth & RBAC Backend**:
   - Dual-identifier login endpoint (`POST /api/v1/auth/login`) accepting either `username` or `phone`.
   - Redis-backed Refresh Token lifecycle with token rotation, revocation upon logout (`POST /api/v1/auth/logout`), and renewal (`POST /api/v1/auth/refresh`).
   - Public customer registration (`POST /api/v1/auth/register`) and secured staff management endpoints (`POST /api/v1/users`).
   - Method security `@PreAuthorize` enforcing access boundaries across the 5 canonical roles and branch scoping.
3. **Catalog & BOM Backend**:
   - Comprehensive CRUD APIs for Services under `/api/v1/services` with category filtering.
   - Nested Bill of Materials (BOM) management under `/api/v1/services/{id}/bom` linking chemical products with consumable amounts in ml/g.
   - Default service steps management under `/api/v1/services/{id}/steps` specifying step name, sequence, and commission percentage.
4. **Inventory & Unit Conversion Engine**:
   - Master Product CRUD under `/api/v1/products` (SKU, barcode, packaging unit, standard volume/weight, cost/retail price).
   - Branch Inventory management under `/api/v1/branches/{branchId}/inventory` tracking sealed units (`stock_units`) and in-use volume (`current_volume`).
   - Automated dual-level auto-unseal engine: BOM deductions consume `current_volume`; when depleted, the engine auto-unseals 1 sealed unit, replenishes volume, and appends an immutable audit log to `inventory_transactions`.
   - Stock In (`POST /api/v1/branches/{branchId}/inventory/stock-in`), Stock Adjustment (`POST /api/v1/branches/{branchId}/inventory/adjustment`), and transaction history endpoints.
5. **Frontend UI/UX Implementation (React 19 + Tailwind CSS v4 + ui-ux-pro-max)**:
   - Dedicated modern responsive `/login` and `/register` views with smart validation and feedback.
   - Global Auth Context & Axios interceptor with silent refresh token renewal and Route Guards (`RequireAuth`, `RoleGuard`).
   - Upgraded `AdminLayout` with interactive sidebar, active route indicators, branch switcher dropdown, and user profile/logout menu.
   - Interactive Catalog Management view (`/admin/services`) with category tabs, BOM formula editor, and step commission builder.
   - Interactive Inventory Management view (`/admin/inventory`) with dual-level stock indicators (sealed units badge + opened ml progress), quick Stock-In modal, Adjustment dialog, and low-stock alert badges.

## User Stories

1. As a user, I want to log in using either my username or phone number, so that I don't have to remember arbitrary credentials.
2. As a client application, I want access tokens to expire in 1 hour and refresh tokens to rotate via Redis, so that stolen tokens cannot be exploited indefinitely.
3. As an authenticated user, I want logging out to immediately revoke my refresh token in Redis, so that no subsequent tokens can be minted.
4. As a new customer, I want to register an account directly from the frontend, so that I can explore services and book appointments.
5. As an admin, I want to create and manage staff accounts assigned to specific branches with designated roles, so that employees only access permitted features.
6. As a salon manager, I want to create and organize salon services into categories (e.g., Haircut, Color & Perm, Spa & Shampoo), so that customers and cashiers can browse them systematically.
7. As a technical director, I want to attach a BOM (Bill of Materials) recipe to a service specifying standard chemical amounts in ml or grams, so that product consumption is tracked automatically.
8. As a salon manager, I want each service to define default technical steps and suggested commission percentages, so that POS checkout can split commissions across stylists seamlessly.
9. As an inventory manager, I want to define master products with packaging specifications (e.g., L'Oréal Shampoo 1000ml bottle, Wella Color 100ml tube), so that item definitions are standardized across all branches.
10. As a branch manager, I want to view my branch's real-time inventory showing both unopened sealed bottles and remaining milliliters in currently opened bottles, so that I have complete visibility over physical stock.
11. As a branch manager, I want to receive incoming stock shipments (Stock In) by entering the number of commercial units received, so that branch stock is incremented automatically.
12. As a branch manager, I want to perform stock adjustments with documented reasons (spillage, breakage, physical count discrepancy), so that audits remain reconciled.
13. As a technician performing a service, I want chemical deductions to automatically unseal a new bottle when the current bottle is empty, so that I don't have to fill out manual paperwork during customer treatments.
14. As an auditor, I want every stock modification recorded in `inventory_transactions` with previous and updated volume balances, so that discrepancies can be investigated.
15. As an admin, I want a branch selector in the top navigation bar, so that I can switch contexts and view data for any salon branch instantly.

## Implementation Decisions

### 1. Database Schema Migrations (`V2__catalog_inventory_auth.sql`)
- Create table `service_default_steps`:
  - `id BIGINT AUTO_INCREMENT PRIMARY KEY`
  - `service_id BIGINT NOT NULL`
  - `step_name VARCHAR(100) NOT NULL`
  - `step_order INT NOT NULL DEFAULT 1`
  - `commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00`
  - Constraints & foreign keys to `services(id)`.
- Alter table `services`:
  - Add `category VARCHAR(100) NOT NULL DEFAULT 'GENERAL'` with index `idx_services_category`.
- Create table `branch_inventories`:
  - `id BIGINT AUTO_INCREMENT PRIMARY KEY`
  - `branch_id BIGINT NOT NULL`
  - `product_id BIGINT NOT NULL`
  - `stock_units INT NOT NULL DEFAULT 0`
  - `current_volume DECIMAL(12, 2) NOT NULL DEFAULT 0.00`
  - `min_stock_alert_units INT NOT NULL DEFAULT 5`
  - `created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`
  - `updated_at DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6)`
  - `created_by VARCHAR(100) NULL`
  - Constraints: Unique key `uk_branch_product (branch_id, product_id)`.
- Foreign key relations:
  - `branch_inventories` -> `branches(id)` ON DELETE RESTRICT
  - `branch_inventories` -> `products(id)` ON DELETE RESTRICT
- Seed Data:
  - Default Branch: `SmartSalon Flagship - Quận 1`.
  - Default Super Admin: `username: admin`, `password: Admin@123` (BCrypt encoded), role: `ADMIN`.
  - Default Categories: `Cắt tóc & Tạo kiểu`, `Uốn - Nhuộm chuyên sâu`, `Gội đầu dưỡng sinh & Spa`, `Phục hồi tóc cao cấp`.
  - Master Products:
    - `PRD-COLOR-WELLA-01`: Kem nhuộm tóc Wella Color Perfect (Tuýp, 100ml)
    - `PRD-OXY-LOREAL-01`: Trợ nhuộm L'Oréal Oxydant Creme 6% (Chai, 1000ml)
    - `PRD-SHAMPOO-KERASTASE`: Dầu gội phục hồi Kérastase Bain Nutritive (Chai, 1000ml)
    - `PRD-MASK-KERASTASE`: Mặt nạ ủ tóc Kérastase Masque (Hộp, 500g)
  - Sample Services with BOM & Steps:
    - Service: `Nhuộm tóc thời trang cao cấp` (Giá: 850,000 VND, 120 phút).
      - BOM: 60ml Wella Color + 60ml Oxy L'Oréal.
      - Steps: Bước 1: Xả & chuẩn bị (15% commission), Bước 2: Pha & vào thuốc (65% commission), Bước 3: Gội xả & sấy tạo kiểu (20% commission).
    - Service: `Gội đầu dưỡng sinh & Massage cổ vai gáy` (Giá: 250,000 VND, 60 phút).
      - BOM: 30ml Dầu gội Kérastase.
      - Steps: Bước 1: Khai huyệt & Gội dưỡng sinh (70% commission), Bước 2: Sấy khô (30% commission).

### 2. Backend Architecture & Package Layout
- `com.smartsalon.auth`:
  - `dto.LoginRequest`, `dto.RegisterRequest`, `dto.TokenResponse`, `dto.RefreshTokenRequest`
  - `AuthService`, `AuthController`
  - Redis token storage: `RedisTemplate<String, Object>` managing `refresh_token:{userId}:{token}`.
- `com.smartsalon.catalog`:
  - `entity.ServiceEntity`, `entity.ServiceBomEntity`, `entity.ServiceDefaultStepEntity`
  - `dto.ServiceRequest`, `dto.ServiceResponse`, `dto.ServiceBomDto`, `dto.ServiceStepDto`
  - `repository.ServiceRepository`, `repository.ServiceBomRepository`, `repository.ServiceStepRepository`
  - `ServiceCatalogService`, `ServiceCatalogController`
- `com.smartsalon.inventory`:
  - `entity.ProductEntity`, `entity.BranchInventoryEntity`, `entity.InventoryTransactionEntity`
  - `dto.ProductRequest`, `dto.ProductResponse`, `dto.StockInRequest`, `dto.StockAdjustmentRequest`, `dto.BranchInventoryResponse`
  - `repository.ProductRepository`, `repository.BranchInventoryRepository`, `repository.InventoryTransactionRepository`
  - `InventoryService`, `ProductController`, `BranchInventoryController`
- `com.smartsalon.user`:
  - `entity.UserEntity`, `entity.RoleEntity`, `entity.BranchEntity`
  - `repository.UserRepository`, `repository.RoleRepository`, `repository.BranchRepository`
  - `UserService`, `UserController`

### 3. Inventory Auto-Unseal Calculation Logic
When consuming `V_needed` (ml/g) of product $P$ at branch $B$:
1. Fetch `BranchInventory` with pessimistic lock (`PESSIMISTIC_WRITE`) to ensure thread-safe concurrency under virtual threads.
2. Calculate total available volume: $V_{available} = current\_volume + (stock\_units \times volume\_per\_unit)$.
3. If $V_{needed} > V_{available}$, throw `AppException(ErrorCode.INSUFFICIENT_STOCK)`.
4. If $current\_volume \ge V_{needed}$:
   - $current\_volume = current\_volume - V_{needed}$.
5. If $current\_volume < V_{needed}$:
   - $deficit = V_{needed} - current\_volume$.
   - $units\_to\_unseal = \lceil deficit / volume\_per\_unit \rceil$.
   - $stock\_units = stock\_units - units\_to\_unseal$.
   - $current\_volume = current\_volume + (units\_to\_unseal \times volume\_per\_unit) - V_{needed}$.
6. Save updated `BranchInventory`.
7. Create and persist `InventoryTransaction` record with `CONSUMPTION` type, delta values, resulting volume balance, and user tracking.

### 4. Frontend Architecture & UI/UX (React 19 + ui-ux-pro-max)
- `src/features/auth`:
  - `LoginPage.jsx`: Clean dual-identifier form (Username or Phone), password toggle, loading spinner, error feedback.
  - `RegisterPage.jsx`: Customer registration with validation on Vietnamese phone numbers, full name, username, and password.
  - `authStore.js` / `AuthContext.jsx`: Reactive auth state, role check helpers (`hasRole`, `isAdmin`, `isManager`).
- `src/components/auth`:
  - `RequireAuth.jsx`: Route guard blocking unauthorized visitors and redirecting to `/login`.
  - `RoleGuard.jsx`: Route guard verifying user roles and rendering 403 or fallback view.
- `src/components/layout`:
  - `AdminLayout.jsx`: Responsive sidebar with brand icon, active link pills, collapse button; Topbar with Branch Switcher select dropdown, current user badge, and Logout button.
- `src/features/catalog`:
  - `ServicesPage.jsx`: Filterable service list by category, duration, search query; Service create/edit modal with dynamic BOM recipe builder and step commission split table.
  - `ProductsPage.jsx`: Master product table with SKU, packaging unit, standard volume/weight, cost/retail price, and barcode.
- `src/features/inventory`:
  - `BranchInventoryPage.jsx`: Visual inventory cards/table per selected branch; Dual-level display: "Chai nguyên" (badge) + "Chai đang dùng" (progress bar of remaining ml); Quick Stock-In modal; Quick Adjustment modal.
  - `InventoryTransactionsPage.jsx`: Filterable audit log of stock movements with transaction type tags (`IMPORT`, `CONSUMPTION`, `ADJUSTMENT`).

## Testing Decisions

- **Auth Seam**:
  - `POST /api/v1/auth/login` verifies valid JWT return for both username and phone credentials; invalid credentials return 401 with `ApiResponse`.
  - `POST /api/v1/auth/refresh` with valid Redis refresh token produces fresh access token and rotates refresh token; revoked token returns 401.
  - `POST /api/v1/auth/logout` deletes refresh token from Redis.
- **Catalog & BOM Seam**:
  - CRUD operations for `services` properly persist category, BOM items, and default step assignment records.
  - Validation ensures duration > 0, base price >= 0, and total default step commission percentages sum to <= 100%.
- **Inventory Auto-Unseal Seam**:
  - Stock in of 5 units of 1000ml correctly updates `stock_units = 5`, `current_volume = 0.00`.
  - BOM consumption of 200ml when `current_volume = 0.00` correctly decrements `stock_units = 4` and sets `current_volume = 800.00`.
  - Consumption exceeding total available volume throws `INSUFFICIENT_STOCK`.
  - Adjustment transaction reconciles physical volume and appends audit record.
- **Frontend Build & Render Seam**:
  - Vite build passes cleanly with no missing imports or syntax errors.
  - Protected routes redirect unauthenticated users to `/login`.
  - Admin users can navigate between Catalog, Inventory, and Dashboard without page reload.

## Out of Scope

- PayOS VietQR payment gateway integration and webhook verification (Phase 4).
- Redisson distributed chair/slot locking engine for real-time customer booking (Phase 3).
- WebSocket STOMP real-time floor dispatching and Kanban board (Phase 3).
- Customer visual log photograph upload to Cloudinary (Phase 3).

## Further Notes

- Architecture decisions are recorded in `docs/adr/0003-master-catalog-branch-inventory.md`, `docs/adr/0004-dual-level-auto-unseal-inventory.md`, and `docs/adr/0005-redis-refresh-token-dual-identifier-auth.md`.
- Domain terminology is strictly aligned with `GLOSSARY.md`.
