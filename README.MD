# SmartSalon - Salon & Spa Booking, POS, Inventory & Financial Analytics Platform

> **AI AGENT INSTRUCTION:** Tài liệu này là nguồn tham chiếu chuẩn (Single Source of Truth) về kiến trúc, quy chuẩn mã nguồn và nghiệp vụ hiện hành của dự án (đã hoàn thiện từ **Phase 1 đến Phase 5**). Trước khi khởi tạo file, viết API hoặc tạo UI component, AI Agent **BẮT BUỘC** phải tuân thủ nghiêm ngặt các phiên bản công nghệ (Modern Stack), Cấu trúc thư mục, Chuẩn dữ liệu (API Contract), Từ điển miền ([`GLOSSARY.md`](GLOSSARY.md)) và các Quyết định Kiến trúc ([`docs/adr/`](docs/adr/)) được định nghĩa dưới đây.

---

## 1. Tổng quan Dự án (Project Overview)

**SmartSalon** là nền tảng quản lý vận hành, đặt lịch, điều phối POS, kiểm soát kho định mức (BOM) và phân tích tài chính thời gian thực dành cho chuỗi Salon tóc, Spa và Barbershop. Hệ thống giải quyết 5 bài toán cốt lõi:

1. **Đặt lịch Thông minh & Khóa Slot Đa Bucket (Smart Booking & Multi-Bucket Lock):** Chia khung giờ thành các bucket 30 phút (`08:30` – `20:30`), khóa nguyên tử (atomic `MSETNX`, TTL 5 phút) trên Redis, tự động phân bổ Stylist ít việc nhất (Least-Workload Load Balancing) và thanh toán cọc 20% qua PayOS / VietQR (kèm chế độ giả lập Sandbox).
2. **Điều phối Tại quầy Thời gian thực (Real-time POS & Dispatch Board):** Đồng bộ tức thời qua STOMP WebSocket theo từng chi nhánh (`/topic/branch/{branchId}/bookings` và `/dispatch`), quản lý Kanban/Timeline, tiếp nhận khách đặt trước (Check-in) hoặc khách vãng lai (Walk-in), và chia công đoạn dịch vụ (`Step Assignment`) cho nhiều kỹ thuật viên trên cùng một hóa đơn.
3. **Kho Đa Chi nhánh & Tự động Khui nắp (Master Catalog & Dual-Level Auto-Unseal Inventory):** Tách biệt Danh mục Sản phẩm Chuẩn (`Master Product`) và Tồn kho Chi nhánh (`Branch Inventory`), quản lý song song **Đơn vị nguyên niêm phong** (`stock_units`: Chai/Tuýp/Hộp) và **Thể tích đang mở nắp** (`current_volume`: `ml`/`g`), tự động khui hộp mới khi lượng hóa chất đang mở không đủ trừ định mức BOM, kèm lưu Hồ sơ Kỹ thuật (`Visual Log` + ảnh Before/After).
4. **Thanh toán Nguyên tử & Sổ cái Hoa hồng 2 Tầng (Atomic Checkout & Two-Tier Commission Engine):** Chốt đơn trong một giao dịch `@Transactional` duy nhất: khấu trừ tiền cọc, trừ kho hóa chất thực tế (`actual_bom_json`) hoặc theo BOM chuẩn, trừ kho sản phẩm bán lẻ, và ghi sổ cái hoa hồng bất biến (`Commission Ledger`) theo mô hình Quỹ hoa hồng dịch vụ (`Service Commission Pool`).
5. **Phân tích Lãi/Lỗ (Dual-Tier P&L), Hao hụt BOM & Xuất Báo cáo Doanh nghiệp (Analytics & Enterprise Export):** Lưu snapshot giá vốn (`unit_cost_snapshot`) ngay tại thời điểm xuất kho để bảo toàn lịch sử P&L, tính lợi nhuận ròng 2 tầng (trước và sau lương cứng `Base Salary`), theo dõi tỷ lệ khách yêu cầu đích danh (`Requested Stylist Rate`) & khách quay lại (`Re-booking Rate`), cảnh báo tồn kho thông minh 3 mức theo tốc độ tiêu hao (Burn Rate), và xuất báo cáo `.xlsx` (Apache POI) / `.pdf` tiếng Việt chuẩn Unicode (OpenPDF).

---

## 2. Modern Tech Stack & Version Constraints

### Backend (`./backend`)

- **Language:** **Java 25 LTS** (kích hoạt Virtual Threads qua `spring.threads.virtual.enabled=true`).
- **Framework:** **Spring Boot 4.1.0** (Spring Framework 7, Jakarta EE 11).
- **Security & Auth:** **Spring Security 7**, Stateless JWT (`jjwt 0.12.6`, Access Token 1h) kết hợp **Redis Refresh Token** (7 ngày, hỗ trợ Token Rotation & Revocation), đăng nhập đa định danh (`username` hoặc `phone`), phân quyền RBAC (`ADMIN`, `MANAGER`, `STAFF`, `STYLIST`, `CUSTOMER`).
- **Database & Migration:**
  - **MySQL 9.7 LTS** (`utf8mb4_unicode_ci`).
  - **Spring Data JPA (Hibernate 7.x)** (`ddl-auto: validate`) + **Flyway** (`V1` → `V5` migrations kèm dữ liệu mẫu đầy đủ).
- **Caching & Distributed Lock:** **Redis 8.4 Alpine** + **Spring Data Redis** (`StringRedisTemplate` với `multiSetIfAbsent` cho khóa slot đa bucket và lưu trữ Refresh Token).
- **Real-time Messaging:** **Spring WebSocket (STOMP + SockJS)** phát sóng sự kiện theo phạm vi từng chi nhánh (`branchId`).
- **Third-Party Integrations & Hybrid Fallbacks:**
  - **PayOS / VietQR:** Tích hợp qua `RestClient` và xác thực Webhook bằng `HMAC-SHA256`, tự động chuyển sang chế độ **VietQR Sandbox** và cung cấp endpoint giả lập `/api/v1/webhooks/payos/simulate/{bookingCode}` khi chạy local/CI.
  - **Cloudinary & Local Media Storage:** Upload ảnh `Visual Log` (Before/After) lên Cloudinary qua `RestClient`, tự động fallback lưu trữ tĩnh tại `uploads/visual-logs/` và phục vụ qua `/uploads/visual-logs/**` khi chạy local.
- **Enterprise Reporting:** **Apache POI 5.3.0** (`poi-ooxml` xuất Excel nhiều sheet) và **OpenPDF 2.0.3** (`com.github.librepdf:openpdf` kết hợp font `Roboto-Regular.ttf` / `Roboto-Bold.ttf` xuất báo cáo PDF tiếng Việt có khung chữ ký kế toán).
- **Utilities:** Lombok, MapStruct 1.6.3, Jakarta Validation, SpringDoc OpenAPI 2.8.5 (Swagger UI), H2 Database (cho test).

### Frontend (`./frontend`)

- **Core & Bundler:** **React 19.2+** + **Vite 8.3** (`@vitejs/plugin-react` v6).
- **Styling & UI:**
  - **Tailwind CSS v4.1+** kết hợp plugin `@tailwindcss/vite` (khai báo `@import "tailwindcss";` và `@theme` trong `src/index.css`, không dùng `tailwind.config.js` cũ).
  - **Lucide React** (Icons), `clsx`, `tailwind-merge`.
- **Server State & Networking:** **TanStack Query v5** (`@tanstack/react-query` ^5.67+) + **Axios** (^1.8.2) với Interceptor tự động gắn Bearer Token và xử lý lỗi 401.
- **Routing & Client Context:**
  - **React Router v7** (`react-router-dom` ^7.3+).
  - **React Context Providers:** `AuthContext` (phiên đăng nhập & RBAC), `BranchContext` (chuyển đổi chi nhánh đang làm việc cho Admin/POS), `RealtimeContext` (kết nối STOMP WebSocket, thông báo chuông âm thanh & Toast thời gian thực).
- **Form & Validation:** **React Hook Form v7** (`^7.90.0`) + **Zod v4** (`^4.6.7`) + `@hookform/resolvers`.
- **Real-time Client:** `@stomp/stompjs` (^7.5.0) + `sockjs-client`.

### DevOps & Infrastructure

- **Docker Compose:** `docker-compose.yml` tại thư mục gốc khởi tạo `mysql:9.7` (port `3306`) và `redis:8.4-alpine` (port `6379`) kèm healthcheck và persistent volumes.

---

## 3. Cấu trúc Thư mục Hiện tại (Project Directory Structure)

```text
SmartSalon/
├── docker-compose.yml                        # MySQL 9.7 LTS & Redis 8.4 Alpine
├── GLOSSARY.md                               # Từ điển ngôn ngữ miền (Ubiquitous Language)
├── AGENTS.md                                 # Quy tắc điều hướng và kỹ năng cho AI Agent
├── README.md                                 # Tài liệu kiến trúc & hướng dẫn toàn diện
├── docs/
│   ├── adr/                                  # Architecture Decision Records (0001 -> 0011)
│   └── agents/                               # Quy trình quản lý issue, triage và domain docs
├── .scratch/                                 # Hồ sơ đặc tả (spec.md) & tickets theo từng Phase (1 -> 5)
│
├── backend/                                  # Spring Boot 4.1.0 Application (Java 25 LTS)
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/smartsalon/              # Package-by-Feature ở cấp cao nhất
│       │   ├── SmartSalonBackendApplication.java
│       │   ├── config/                       # SecurityConfig, RedisConfig, WebSocketConfig, CorsConfig, OpenApiConfig, WebMvcConfig
│       │   ├── common/                       # ApiResponse, PageResponse, BaseEntity, Enums (BookingStatus, OrderStatus, ...)
│       │   ├── exception/                    # GlobalExceptionHandler, AppException, ErrorCode
│       │   ├── security/                     # JwtProvider, JwtAuthenticationFilter
│       │   ├── auth/                         # Đăng nhập (username/phone), Đăng ký, Refresh Token Redis
│       │   ├── user/                         # UserEntity, RoleEntity, Quản lý nhân sự & Lương cứng (base_salary)
│       │   ├── branch/                       # Quản lý đa chi nhánh (BranchController, BranchService)
│       │   ├── catalog/                      # Dịch vụ (ServiceItem), Bước kỹ thuật mặc định (ServiceDefaultStep), Định mức BOM
│       │   ├── inventory/                    # Master Product, Branch Inventory, Auto-Unseal, Stock In/Adjustment, Cost Snapshots
│       │   ├── booking/                      # SlotCalculationService, Multi-Bucket Redis Lock, Least-Workload Stylist, Expiration Scheduler
│       │   ├── payment/                      # PayOSService, PayOSWebhookController (Live + Sandbox Simulate), PaymentTransaction, CommissionLedger
│       │   ├── pos/                          # Dispatch Board, Walk-in & Check-in, Step Assignment, Visual Log (TechnicalLog), Atomic Checkout, Media Upload
│       │   ├── realtime/                     # RealtimeNotificationService (STOMP Broadcasts cho Booking & Dispatch)
│       │   └── analytics/                    # Dual-Tier P&L, Staff Performance & Payroll, Smart Stock Alerts, BOM Wastage, Excel/PDF Export
│       └── resources/
│           ├── application.yml
│           ├── fonts/                        # Roboto-Regular.ttf, Roboto-Bold.ttf (Nhúng Unicode tiếng Việt cho PDF)
│           └── db/migration/                 # Flyway SQL Migrations
│               ├── V1__init_schema.sql
│               ├── V2__catalog_inventory_auth.sql
│               ├── V3__smart_booking_payos.sql
│               ├── V4__pos_dispatch_checkout.sql
│               └── V5__analytics_pnl_and_payroll.sql
│
└── frontend/                                 # React 19 + Vite 8 + Tailwind v4 Application
    ├── package.json
    ├── vite.config.js                        # Cấu hình @vitejs/plugin-react, @tailwindcss/vite và proxy /api, /ws, /uploads
    └── src/
        ├── index.css                         # @import "tailwindcss"; và cấu hình @theme
        ├── App.jsx                           # Định tuyến React Router v7 (Customer, Admin, POS Portals)
        ├── main.jsx
        ├── api/                              # axiosClient.js, posApi.js, analyticsApi.js
        ├── components/
        │   ├── auth/                         # RequireAuth.jsx, RoleGuard.jsx
        │   ├── layout/                       # AdminLayout, AdminSidebar, AdminHeader, PosLayout, CustomerLayout
        │   └── ui/                           # Button.jsx, Badge.jsx
        ├── features/                         # Chia theo Module nghiệp vụ
        │   ├── auth/                         # AuthContext, LoginPage, RegisterPage, UnauthorizedPage
        │   ├── branch/                       # BranchContext, useBranch (Bộ chọn chi nhánh toàn cục)
        │   ├── booking/                      # BookingWizardPage (4 bước), SlotPicker, DepositQrStep, BookingLookupModal, AdminBookingsPage
        │   ├── catalog/                      # ServicesPage, CustomerServicesPage, ServiceFormModal (Steps + BOM)
        │   ├── inventory/                    # ProductsPage (Master Catalog), BranchInventoryPage, StockInModal, StockAdjustmentModal, InventoryTransactionsPage
        │   ├── pos/                          # DispatchBoardPage (Kanban & Timeline), WalkInModal, PosOrderDrawer, VisualLogTab, PosCheckoutTab, CommissionLedgerModal
        │   ├── dashboard/                    # DashboardPage (PnlDashboardTab, StaffPayrollTab, InventoryAlertsTab, DownloadCenterTab, EditBaseSalaryModal)
        │   └── realtime/                     # RealtimeContext, NotificationBell, RealtimeToastContainer, WebSocketStatusBadge, audioChime
        └── lib/                              # queryClient.js, navigation.js, roles.js, tokenStorage.js, utils.js
```

---

## 4. Quy chuẩn Kỹ thuật (Coding Standards)

### 4.1. Backend (Java 25 + Spring Boot 4.1)

1. **Package-by-Feature:** Mỗi miền nghiệp vụ nằm trực tiếp dưới `com.smartsalon.<feature>` (gồm `controller`, `service`, `repository`, `entity`, `dto`).
2. **Java Records cho DTO:** Sử dụng `record` kết hợp Jakarta Validation (`@NotBlank`, `@NotNull`, `@Positive`) cho mọi Request/Response DTO.
3. **Standard API Response:** Mọi REST endpoint trả về `ApiResponse<T>` thống nhất:
   ```json
   {
     "code": 1000,
     "message": "Success",
     "result": {},
     "timestamp": "2026-10-19T08:30:00Z"
   }
   ```
4. **HTTP Client & Concurrency:**
   - Sử dụng `RestClient` của Spring Framework 7 khi giao tiếp với PayOS và Cloudinary.
   - Bật Virtual Threads (`spring.threads.virtual.enabled: true`).
   - Đánh dấu `@Transactional(rollbackFor = Exception.class)` cho toàn bộ nghiệp vụ ghi liên bảng (Booking Hold, Webhook Confirm, POS Check-in/Checkout, Trừ kho Auto-Unseal).
5. **Xử lý Lỗi Tập trung:** Ném `AppException(ErrorCode)` và xử lý thống nhất tại `GlobalExceptionHandler`.

### 4.2. Frontend (React 19 + Vite 8 + TanStack Query v5 + Tailwind v4)

1. **Tailwind CSS v4:** Sử dụng `@tailwindcss/vite` trong `vite.config.js` và `@import "tailwindcss";` trong `src/index.css`.
2. **Server State với TanStack Query v5:** Quản lý dữ liệu API thông qua `useQuery` và `useMutation` (dùng `isPending`, `gcTime`), tự động `invalidateQueries` khi nhận sự kiện STOMP WebSocket từ `RealtimeContext`.
3. **UI/UX Design System:** Tuân thủ phong cách thẩm mỹ Salon/Spa hiện đại, phân tách rõ 3 không gian làm việc:
   - **Customer Portal (`/customer/*`):** Trải nghiệm đặt lịch 4 bước mượt mà, tra cứu mã đặt lịch và danh mục dịch vụ.
   - **POS Dispatch Board (`/pos`):** Giao diện tối ưu thao tác nhanh tại quầy (Kanban / Timeline, dải trạng thái Stylist, Drawer xử lý đơn hàng, Visual Log & Checkout).
   - **Executive Admin Portal (`/admin/*`):** Quản trị P&L, bảng lương & KPI nhân sự, cảnh báo kho, danh mục dịch vụ/BOM và trung tâm xuất báo cáo.

---

## 5. Luồng Nghiệp vụ Cốt lõi & Kiến trúc Miền (Core Domain Rules & ADRs)

Chi tiết đầy đủ về thuật ngữ miền được định nghĩa tại [`GLOSSARY.md`](GLOSSARY.md) và 11 bản ghi quyết định kiến trúc tại [`docs/adr/`](docs/adr/):

### 5.1. Đặt lịch Thông minh, Khóa Slot Đa Bucket & Đặt cọc PayOS (`ADR-0006`, `ADR-0007`)

- **Vòng đời Lịch hẹn (`Booking`):**
  - Luồng chính: `PENDING_PAYMENT` → `CONFIRMED` → `CHECKED_IN` → `IN_PROGRESS` → `COMPLETED`.
  - Nhánh phụ: `EXPIRED` (quá 5 phút giữ chỗ chưa thanh toán cọc, được quét tự động bởi `@Scheduled` job), `CANCELLED`, `NO_SHOW`.
- **Khóa Slot Nguyên tử trên Redis:** Giờ mở cửa (`08:30` – `20:30`) được chia thành các `Slot` 30 phút. Một lịch hẹn kéo dài `[startTime, endTime)` sẽ khóa đồng thời tất cả các bucket `lock:slot:{stylistId}:{date}:{HH:mm}` qua lệnh Redis `MSETNX` (`multiSetIfAbsent`) với TTL 300 giây.
- **Tự động Phân bổ Stylist (`Least-Workload Auto-Assignment`):** Khi khách chọn *"Bất kỳ Stylist nào rảnh"* (`stylistId = null`), hệ thống lọc các Stylist không bị trùng lịch trong khung giờ yêu cầu, sắp xếp tăng dần theo tổng số phút đã nhận trong ngày và khóa slot trên ứng viên ít việc nhất. Cờ `is_stylist_requested` ghi nhận rõ khách chủ động chọn thợ (`true`) hay hệ thống tự phân bổ (`false`).
- **Thanh toán Cọc 20% & Sandbox:** Hệ thống tính `deposit_amount = 20% * total_price`, sinh mã VietQR qua PayOS. Ở môi trường dev/test không cấu hình khóa PayOS thật, giao diện hiển thị nút **"Giả lập thanh toán thành công (Sandbox)"** gọi vào `POST /api/v1/webhooks/payos/simulate/{bookingCode}` để kích hoạt luồng xác nhận và bắn thông báo WebSocket thời gian thực.

### 5.2. Điều phối POS, Chia Công đoạn & Hoa hồng 2 Tầng (`ADR-0008`, `ADR-0009`)

- **Tiếp nhận Khách (`Check-in` & `Walk-in`):** Lễ tân có thể Check-in từ một `Booking` đã xác nhận hoặc tạo mới `Walk-in Order` cho khách vãng lai ngay trên `Dispatch Board`.
- **Mô hình Quỹ Hoa hồng Dịch vụ 2 Tầng (`Two-Tier Service Commission Pool`):**
  - Mỗi dịch vụ có định mức quỹ hoa hồng tổng `commission_pool_rate` (mặc định `20%` giá dịch vụ).
  - Một dịch vụ trong đơn (`OrderItem`) được chia thành nhiều bước kỹ thuật (`OrderStepAssignment`), mỗi bước có trọng số `step_commission_rate` (tổng các bước = `100%`, ví dụ: Chuẩn bị 15% + Vào thuốc 65% + Sấy tạo kiểu 20%).
  - Khi đơn hàng hoàn tất (`PAID`), hoa hồng của từng thợ ở mỗi bước được tính chính xác theo công thức:
    $$\text{Step Commission Amount} = \text{Item Total Price} \times \frac{\text{commission\_pool\_rate}}{100} \times \frac{\text{step\_commission\_rate}}{100}$$
    và ghi bất biến vào bảng `commission_ledger`.

### 5.3. Kho Đa Chi nhánh, Tự động Khui nắp & Hồ sơ Kỹ thuật (`ADR-0003`, `ADR-0004`, `ADR-0009`)

- **Tách biệt Master Catalog & Branch Inventory:** Bảng `products` lưu thông tin sản phẩm toàn hệ thống (`sku`, `unit`, `volume_or_weight_per_unit`, `volume_unit`, `cost_price`, `retail_price`). Bảng `branch_inventories` lưu tồn kho vật lý tại từng chi nhánh gồm `stock_units` (số chai/tuýp nguyên niêm phong) và `current_volume` (số `ml`/`g` đang mở nắp).
- **Cơ chế Tự động Khui nắp (`Auto-Unseal`):** Khi trừ hóa chất tiêu hao theo định mức BOM (hoặc theo công thức thực tế `actual_bom_json` do thợ nhập trong `Visual Log`), nếu `current_volume` đang mở không đủ, hệ thống tự động khui thêm các đơn vị nguyên (`stock_units--`, cộng dồn `volume_or_weight_per_unit` vào `current_volume`) và ghi nhận lịch sử biến động vào `inventory_transactions`.

### 5.4. Phân tích Lãi/Lỗ 2 Tầng, Hao hụt BOM & Xuất Báo cáo (`ADR-0010`, `ADR-0011`)

- **Snapshot Giá vốn Bất biến (`Immutable Cost Snapshot`):** Mỗi bản ghi `inventory_transactions` lưu cứng `unit_cost_snapshot` và `total_cost_amount` ngay tại thời điểm xuất kho để báo cáo lãi/lỗ các tháng trước không bị sai lệch khi giá nhập hàng (`cost_price`) thay đổi về sau.
- **Báo cáo P&L 2 Tầng (`Dual-Tier P&L`):**
  - Khấu trừ giảm giá (`discount_amount`) được phân bổ theo tỷ lệ doanh thu Dịch vụ và Bán lẻ trên từng đơn hàng.
  - **Tier 1 (`Operational Order Net Profit`):** Doanh thu thuần trừ đi Giá vốn hóa chất (`Chemical COGS`), Giá vốn hàng bán lẻ (`Retail COGS`) và Hoa hồng nhân viên (`Staff Commissions`).
  - **Tier 2 (`Net Profit After Fixed Payroll`):** Lợi nhuận vận hành Tier 1 trừ tiếp tổng quỹ lương cứng (`Base Salary`) của nhân sự chi nhánh.
- **Đo lường Hao hụt Hóa chất (`BOM Wastage`) & Cảnh báo Tồn kho 3 Mức:**
  - Đối chiếu tổng lượng hóa chất thực tế tiêu hao (gồm cả xuất dùng dịch vụ và kiểm kê hao hụt âm) so với định mức `BOM` chuẩn để quy ra khối lượng (`ml`/`g`) và giá trị tiền (`VND`) hao hụt.
  - Phân loại cảnh báo kho thành `OUT_OF_STOCK`, `LOW_STOCK` và `NEAR_THRESHOLD` kèm tính toán số ngày dự kiến hết hàng (`Estimated Days Left`) dựa trên tốc độ tiêu hao trung bình ngày (`Daily Burn Rate`).
- **Xuất Báo cáo Doanh nghiệp (`.xlsx` & `.pdf`):** Tải trực tiếp bảng lương nhân sự, sổ cái hoa hồng và báo cáo tài chính P&L dưới định dạng Excel nhiều sheet và PDF tiếng Việt có sẵn khung ký duyệt.

---

## 6. Hướng dẫn Khởi chạy Nhanh (Quick Start & Demo Accounts)

### 6.1. Khởi chạy Hạ tầng (MySQL 9.7 & Redis 8.4)

```bash
docker compose up -d
```

### 6.2. Khởi chạy Backend (Spring Boot 4.1 / Java 25)

```bash
cd backend
mvn spring-boot:run
```
- Backend API chạy tại: `http://localhost:8080`
- Swagger UI (OpenAPI): `http://localhost:8080/swagger-ui.html`
- Flyway sẽ tự động chạy các bản migration `V1` → `V5` và khởi tạo đầy đủ dữ liệu mẫu (2 chi nhánh, dịch vụ, công thức BOM, tồn kho, nhân sự, lịch hẹn và đơn hàng lịch sử).

### 6.3. Khởi chạy Frontend (React 19 / Vite 8)

```bash
cd frontend
npm install
npm run dev
```
- Ứng dụng Frontend chạy tại: `http://localhost:5173`
  - **Customer Booking Portal:** `http://localhost:5173/customer/booking`
  - **POS Dispatch Board:** `http://localhost:5173/pos`
  - **Executive Admin & P&L Dashboard:** `http://localhost:5173/admin`

### 6.4. Tài khoản Mẫu (Seeded Demo Accounts)

Tất cả các tài khoản mẫu dưới đây đều sử dụng chung mật khẩu: **`Admin@123`** (có thể đăng nhập bằng **Username** hoặc **Số điện thoại**):

| Vai trò (Role) | Username | Số điện thoại | Họ và tên | Chi nhánh |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | `admin` | `0988888888` | Hệ thống Quản trị viên | SmartSalon Flagship - Quận 1 |
| **STAFF (Lễ tân)** | `staff.le` | `0911000004` | Phạm Thanh Lê (Lễ tân Flagship) | SmartSalon Flagship - Quận 1 |
| **STYLIST** | `stylist.minh` | `0911000001` | Trần Minh Tuấn (Master Stylist) | SmartSalon Flagship - Quận 1 |
| **STYLIST** | `stylist.lan` | `0911000002` | Nguyễn Lan Anh (Senior Stylist) | SmartSalon Flagship - Quận 1 |
| **STYLIST** | `stylist.hung` | `0911000003` | Lê Hoàng Hùng (Creative Stylist) | SmartSalon Flagship - Quận 1 |
| **STYLIST** | `stylist.thao` | `0911000005` | Đặng Phương Thảo (Master Stylist Q3) | SmartSalon Luxury - Quận 3 |
| **CUSTOMER** | `cust.ha` | `0988111222` | Nguyễn Thu Hà | Khách hàng thân thiết |
| **CUSTOMER** | `cust.tri` | `0988222333` | Vũ Minh Trí | Khách hàng thân thiết |
