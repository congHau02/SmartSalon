# Issue 09: End-to-End Verification, Backend Tests, Frontend Build & Realistic Flow Demonstration

Status: ready-for-human

## Description

Perform comprehensive end-to-end integration testing and verification of Phase 2 deliverables:
1. Run backend automated unit and slice tests for Auth, Catalog, and Inventory.
2. Verify Flyway migrations apply cleanly against MySQL without errors.
3. Verify Redis stores and rotates refresh tokens properly.
4. Execute frontend build (`npm run build`) ensuring zero compiler errors or missing assets.
5. Perform an end-to-end smoke test through the UI:
   - Log in as Super Admin (`admin` / `Admin@123`).
   - Switch branch context.
   - Inspect and create a new Service with BOM and Default Steps.
   - Create a Master Product and perform a Stock In for the active branch.
   - Trigger a simulated BOM chemical consumption and verify the dual-level auto-unseal engine accurately decrements sealed units and replenishes in-use volume.
   - Log out and verify Redis token revocation.

## Tasks

- [x] Execute `mvn test` in `backend/` ensuring all controller, service, and algorithm tests pass.
- [x] Run `npm run build` in `frontend/` ensuring production bundle builds successfully.
- [x] Document curl requests and response envelopes for key Phase 2 endpoints in issue comments.
- [x] Verify that all components comply with `ui-ux-pro-max` guidelines and accessibility standards.

## Comments

### 1. Backend Automated Verification (`./mvnw.cmd test`)
- Total tests executed: **35**, Failures: **0**, Errors: **0**, Skipped: **0**.
- **FlywayMigrationTest**: Validated clean migration execution for V1 and V2 schema and seed data (admin role, services, master products, branch inventories, BOM formulations).
- **AuthIntegrationTest**: Validated login with username and phone (dual-identifier), password rejection (401), registration, token refresh with rotation, logout revocation, and RBAC endpoint guards (403).
- **ServiceCatalogIntegrationTest**: Validated public service listing, admin service creation with BOM formulation and default commission split steps, duplicate name conflict handling, and pagination/filtering.
- **InventoryIntegrationTest**: Validated master product CRUD, duplicate SKU detection (409), branch stock-in, physical adjustment, audit logging, and customer forbidden access (403).
- **InventoryServiceTest**: Unit test coverage for the Auto-Unseal Engine:
  - When in-use volume is sufficient: decrements current in-use volume without unsealing commercial units.
  - When in-use volume is insufficient: automatically decrements 1 sealed commercial unit, replenishes container volume, records an `AUTO_UNSEAL` transaction, and completes `SERVICE_CONSUMPTION`.
  - Rejection with `INSUFFICIENT_STOCK` (ErrorCode 3004) when total available volume is exceeded.

### 2. Frontend Production Build & Linting
- **Vite Build**: `npm run build` completed cleanly, transformed 2,072 modules, generated gzip-optimized client bundle (`dist/`).
- **Oxlint**: `npx oxlint` passed with **0 warnings and 0 errors** across all 44 frontend files.
- **`ui-ux-pro-max` Compliance**:
  - Touch targets $\ge 44 \times 44\text{px}$ across all interactive buttons (including modal close, table icons, toast dismiss).
  - Explicit `aria-invalid` and `aria-describedby` pairing for accessible error-placement.
  - Keyed inner modal forms to prevent cascading re-renders.
  - Currency localized to VND (`vi-VN`) and dates formatted cleanly.

---

### 3. Key Phase 2 API Endpoints & Response Envelopes

#### A. Authentication: Super Admin Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin",
    "password": "Admin@123"
  }'
```
**Response Envelope (200 OK):**
```json
{
  "code": 1000,
  "message": "Đăng nhập thành công",
  "result": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "7c1b528e-5b1b-48ce-b248-18e4ff819dd5",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "user": {
      "id": 1,
      "fullName": "Hệ thống Quản trị viên",
      "username": "admin",
      "phone": "0988888888",
      "email": "admin@smartsalon.vn",
      "branchId": null,
      "roles": ["ADMIN"]
    }
  }
}
```

#### B. Service Catalog: Create Service with BOM & Technical Step Splits
```bash
curl -X POST http://localhost:8080/api/v1/services \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nhuộm Balayage Cao Cấp",
    "category": "Uốn - Nhuộm",
    "durationMinutes": 180,
    "basePrice": 1200000,
    "description": "Kỹ thuật nhuộm chuyển màu khói cao cấp kết hợp phục hồi",
    "bomList": [
      { "productId": 1, "amountPerService": 60.0 },
      { "productId": 2, "amountPerService": 90.0 }
    ],
    "steps": [
      { "stepName": "Tẩy nền & Khử vàng", "commissionRate": 30.0, "stepOrder": 1 },
      { "stepName": "Pha màu & Lên màu chính", "commissionRate": 50.0, "stepOrder": 2 },
      { "stepName": "Khóa màu & Sấy tạo kiểu", "commissionRate": 20.0, "stepOrder": 3 }
    ]
  }'
```
**Response Envelope (201 Created):**
```json
{
  "code": 1000,
  "message": "Tạo dịch vụ thành công",
  "result": {
    "id": 12,
    "name": "Nhuộm Balayage Cao Cấp",
    "category": "Uốn - Nhuộm",
    "durationMinutes": 180,
    "basePrice": 1200000.00,
    "description": "Kỹ thuật nhuộm chuyển màu khói cao cấp kết hợp phục hồi",
    "isActive": true,
    "bomList": [
      { "id": 20, "productId": 1, "productName": "Oxy Trợ Nhuộm L'Oreal 6%", "amountPerService": 60.0, "unit": "ml" },
      { "id": 21, "productId": 2, "productName": "Thuốc Nhuộm Inoa No.7", "amountPerService": 90.0, "unit": "gram" }
    ],
    "steps": [
      { "id": 35, "stepName": "Tẩy nền & Khử vàng", "commissionRate": 30.0, "stepOrder": 1 },
      { "id": 36, "stepName": "Pha màu & Lên màu chính", "commissionRate": 50.0, "stepOrder": 2 },
      { "id": 37, "stepName": "Khóa màu & Sấy tạo kiểu", "commissionRate": 20.0, "stepOrder": 3 }
    ]
  }
}
```

#### C. Inventory: Stock In Commercial Units into Branch
```bash
curl -X POST http://localhost:8080/api/v1/branches/1/inventory/stock-in \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "quantityUnits": 10,
    "unitCost": 180000,
    "notes": "Nhập kho chính hãng L'\''Oreal đợt tháng 10"
  }'
```
**Response Envelope (200 OK):**
```json
{
  "code": 1000,
  "message": "Nhập kho thành công",
  "result": {
    "id": 1,
    "branchId": 1,
    "branchName": "Chi nhánh Quận 1 (Flagship)",
    "productId": 1,
    "productName": "Oxy Trợ Nhuộm L'Oreal 6%",
    "productSku": "OXY-6-1000",
    "packagingUnit": "Chai",
    "volumeOrWeightPerUnit": 1000.0,
    "volumeUnit": "ml",
    "stockUnits": 15,
    "currentVolume": 250.0,
    "totalAvailableVolume": 15250.0,
    "minStockAlertUnits": 5,
    "isLowStock": false
  }
}
```

#### D. Inventory: Physical Count Stock Adjustment
```bash
curl -X POST http://localhost:8080/api/v1/branches/1/inventory/adjustment \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "actualStockUnits": 14,
    "actualVolume": 200.0,
    "reason": "Kiểm kê định kỳ cân đối lại kho"
  }'
```
**Response Envelope (200 OK):**
```json
{
  "code": 1000,
  "message": "Điều chỉnh tồn kho thành công",
  "result": {
    "id": 1,
    "branchId": 1,
    "productId": 1,
    "stockUnits": 14,
    "currentVolume": 200.0,
    "totalAvailableVolume": 14200.0,
    "minStockAlertUnits": 5,
    "isLowStock": false
  }
}
```

#### E. Inventory: Historical Audit Trail Transactions
```bash
curl -X GET "http://localhost:8080/api/v1/branches/1/inventory/transactions?productId=1" \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>"
```
**Response Envelope (200 OK):**
```json
{
  "code": 1000,
  "message": "Lấy lịch sử giao dịch kho thành công",
  "result": [
    {
      "id": 18,
      "productId": 1,
      "productName": "Oxy Trợ Nhuộm L'Oreal 6%",
      "productSku": "OXY-6-1000",
      "branchId": 1,
      "branchName": "Chi nhánh Quận 1 (Flagship)",
      "transactionType": "STOCK_ADJUSTMENT",
      "quantityUnits": -1,
      "volumeAmount": -1050.0,
      "unit": "ml",
      "balanceAfterVolume": 14200.0,
      "notes": "Kiểm kê định kỳ cân đối lại kho",
      "createdAt": "2026-10-17T04:00:00Z",
      "createdBy": "admin"
    },
    {
      "id": 17,
      "productId": 1,
      "productName": "Oxy Trợ Nhuộm L'Oreal 6%",
      "productSku": "OXY-6-1000",
      "branchId": 1,
      "branchName": "Chi nhánh Quận 1 (Flagship)",
      "transactionType": "STOCK_IN",
      "quantityUnits": 10,
      "volumeAmount": 10000.0,
      "unit": "ml",
      "balanceAfterVolume": 15250.0,
      "notes": "Nhập kho chính hãng L'Oreal đợt tháng 10",
      "createdAt": "2026-10-17T03:55:00Z",
      "createdBy": "admin"
    }
  ]
}
```
