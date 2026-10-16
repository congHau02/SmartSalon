# SmartSalon - Salon & Spa Booking, POS & Operations Platform

> **AI AGENT INSTRUCTION:** Tài liệu này là nguồn tham chiếu chuẩn (Single Source of Truth) về kiến trúc, quy chuẩn mã nguồn và nghiệp vụ của dự án. Trước khi khởi tạo file, viết API hoặc tạo UI component, AI Agent **BẮT BUỘC** phải tuân thủ nghiêm ngặt các phiên bản công nghệ (Modern Stack), Cấu trúc thư mục, Chuẩn dữ liệu (API Contract) và Luồng nghiệp vụ được định nghĩa dưới đây. **Tuyệt đối không sinh mã nguồn hoặc file cấu hình của các phiên bản cũ đã deprecated.**

---

## 1. Tổng quan Dự án (Project Overview)

**SmartSalon** là hệ thống quản lý vận hành và đặt lịch theo thời gian thực dành cho các chuỗi Salon tóc, Spa và Barbershop. Hệ thống giải quyết 4 bài toán cốt lõi:

1. **Đặt lịch & Giữ chỗ (Smart Booking):** Xử lý đồng thời (Concurrency), khóa slot tạm thời (TTL 5 phút) và thanh toán cọc tự động.
2. **Điều phối tại quầy (POS & Dispatching):** Quản lý trạng thái ghế/giường thời gian thực và chia công đoạn dịch vụ cho nhiều kỹ thuật viên trên cùng một hóa đơn.
3. **Quản lý Kho định mức (BOM Inventory):** Quy đổi đơn vị nhập/xuất (Chai/Tuýp -> ml/gram), trừ kho tự động theo công thức pha chế và lưu hồ sơ kỹ thuật (Visual Log).
4. **Thanh toán & Hoa hồng (Checkout & Commission Engine):** Khấu trừ tiền cọc, gạch nợ tự động qua Webhook và tính toán hoa hồng đa nhân sự.

---

## 2. Modern Tech Stack & Version Constraints (Bắt buộc tuân thủ)

### Backend (`./backend`)

- **Language:** **Java 25 LTS** (tận dụng Virtual Threads thông qua `spring.threads.virtual.enabled=true`).
- **Framework:** **Spring Boot 4.1.x** (nền tảng Spring Framework 7, Jakarta EE 11).
- **Security:** **Spring Security 7**, OAuth2 Resource Server / JWT (Access Token & Refresh Token), RBAC.
- **Database & Migration:**
  - **MySQL 9.7 LTS** (hoặc **MySQL 8.4 LTS** - _Lưu ý: Không dùng MySQL 8.0 vì đã EOL_).
  - **Spring Data JPA (Hibernate 7.x)** + **Flyway 11.x** (quản lý Database Migration).
- **Caching & Distributed Lock:** **Redis 8.x** kết hợp **Redisson** / **Spring Data Redis** (xử lý giữ slot đặt lịch).
- **Real-time:** Spring WebSocket (STOMP) đồng bộ trạng thái lịch hẹn và bảng điều phối POS.
- **Third-party Integrations:**
  - **PayOS / VietQR:** Tạo mã QR thanh toán động và nhận Webhook gạch nợ tự động (sử dụng `RestClient` mới của Spring thay cho `RestTemplate` cũ).
  - **Cloudinary:** Lưu trữ hình ảnh kết quả dịch vụ (Visual Log) và avatar.
- **Utilities:** Lombok, MapStruct 1.6+, Jakarta Validation, SpringDoc OpenAPI v2.8+ (Swagger UI).

### Frontend (`./frontend`)

- **Core & Bundler:** **React 19.3** + **Vite 8.1** (sử dụng trình biên dịch Rust Rolldown/Oxc).
- **Server State & Data Fetching:** **TanStack Query v5** (`@tanstack/react-query` ^5.x) + **Axios** (^1.8+).
- **Styling & UI:**
  - **Tailwind CSS v4.1+** kết hợp plugin `@tailwindcss/vite` (_Lưu ý cho AI: KHÔNG tạo file `tailwind.config.js` hay `postcss.config.js` kiểu cũ của v3_).
  - **Shadcn UI** (tương thích React 19 + Tailwind v4), **Lucide React** (Icons).
- **Routing & Client State:**
  - **React Router v7** (`react-router`).
  - **Zustand v5** (quản lý Auth state, UI theme và giỏ hàng POS tạm thời).
- **Form & Validation:** **React Hook Form v7** + **Zod v3.24+**.
- **Real-time Client:** `@stomp/stompjs` v7+.

### DevOps & Environment

- **Containerization:** Docker & Docker Compose v2 (`mysql:9.7`, `redis:8.4-alpine`, `nginx:1.28-alpine`, Multi-stage Dockerfile với `eclipse-temurin:25-jre-alpine` và `node:22-alpine`).

---

## 3. Cấu trúc Thư mục Chuẩn (Project Directory Structure)

AI Agent khi tạo file mới phải đặt đúng vào các package/folder theo cấu trúc sau:

```text
smart-salon/
├── docker-compose.yml
├── README.md
├── backend/                                  # Spring Boot 4.1 Application (Java 25 LTS)
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/smartsalon/
│       │   ├── config/                       # SecurityConfig, RedisConfig, WebSocketConfig, CorsConfig, OpenApiConfig
│       │   ├── common/                       # ApiResponse, PageResponse, BaseEntity, Constants
│       │   ├── exception/                    # GlobalExceptionHandler, AppException, ErrorCode
│       │   ├── security/                     # JwtProvider, JwtAuthenticationFilter, CustomUserDetails
│       │   └── modules/                      # Chia theo Domain/Feature (Package-by-Feature)
│       │       ├── auth/                     # Controller, Service, DTO
│       │       ├── user/                     # Staff, Customer, Role, CommissionConfig
│       │       ├── catalog/                  # ServiceItem, ServiceStep, Product, BOM (Bill of Materials)
│       │       ├── booking/                  # Booking, SlotEngine, RedisLockService
│       │       ├── pos/                      # Order, OrderItem, OrderStepAssignment, TechnicalLog
│       │       ├── inventory/                # InventoryTransaction, UnitConversion, StockDeduction
│       │       ├── payment/                  # PaymentTransaction, PayOSWebhookController, CommissionLedger
│       │       └── notification/             # WebSocketNotificationService
│       └── resources/
│           ├── db/migration/                 # Flyway SQL scripts (V1__init_schema.sql, ...)
│           └── application.yml
│
└── frontend/                                 # React 19 + Vite 8 + Tailwind v4 Application
    ├── package.json
    ├── vite.config.js                        # Cấu hình @vitejs/plugin-react và @tailwindcss/vite
    └── src/
        ├── index.css                         # Chứa @import "tailwindcss"; và @theme { ... } của Tailwind v4
        ├── api/                              # axiosClient.js, interceptors, endpoint constants
        ├── components/
        │   ├── ui/                           # Reusable atomic UI (Button, Modal, Input, Badge, Table)
        │   └── layout/                       # AdminLayout, PosLayout, CustomerLayout, Sidebar, Header
        ├── features/                         # Chia theo Module nghiệp vụ
        │   ├── auth/                         # hooks/, components/, pages/, services/
        │   ├── booking/                      # Luồng đặt lịch cho khách (SlotPicker, StylistSelector, DepositQR)
        │   ├── pos/                          # Bảng điều phối Kanban/Timeline, Check-in, Chia ca thợ, Checkout
        │   ├── inventory/                    # Nhập xuất kho, Quy đổi ml/gram, Công thức pha chế
        │   ├── staff/                        # Quản lý nhân sự, Ca làm việc, Bảng kê hoa hồng
        │   └── customer/                     # Hồ sơ khách hàng, Lịch sử kỹ thuật (Visual Log)
        ├── hooks/                            # Global custom hooks (useWebSocket, useDebounce, useAuth)
        ├── lib/                              # queryClient.js, utils.js (cn, formatCurrency, formatDate)
        ├── routes/                           # AppRoutes, ProtectedRoute, RoleBasedRoute (React Router v7)
        ├── store/                            # Zustand v5 stores (useAuthStore, usePosStore)
        ├── App.jsx
        └── main.jsx
```

---

## 4. Quy chuẩn Kỹ thuật dành cho AI Agent (Modern Coding Standards)

### 4.1. Quy tắc Backend (Java 25 + Spring Boot 4.1)

1. **Java Records cho DTO:** Bắt buộc sử dụng `record` của Java cho tất cả `RequestDTO` và `ResponseDTO` để đảm bảo tính bất biến (Immutability) và ngắn gọn, kết hợp Jakarta Validation (`@NotBlank`, `@NotNull`, `@Positive`).
2. **HTTP Client mới:** Sử dụng `RestClient` (fluent API) hoặc `@HttpExchange` của Spring để gọi sang PayOS/Cloudinary. **Không dùng** `RestTemplate` đã lỗi thời.
3. **Standard API Response:** Mọi REST API đều trả về đối tượng `ApiResponse<T>` thống nhất:
   ```json
   {
     "code": 1000,
     "message": "Success",
     "result": {},
     "timestamp": "2026-10-16T08:30:00Z"
   }
   ```
4. **Quản lý Transaction & Concurrency:**
   - Bật Virtual Threads trong `application.yml`: `spring.threads.virtual.enabled: true`.
   - Các nghiệp vụ thay đổi nhiều bảng (Check-in tạo Order, Trừ kho BOM, Thanh toán & Chia hoa hồng) bắt buộc đánh dấu `@Transactional(rollbackFor = Exception.class)`.
5. **Xử lý Lỗi Tập trung:** Không dùng `try-catch` tràn lan trong Controller. Ném `AppException(ErrorCode)` và xử lý tại `@RestControllerAdvice` (`GlobalExceptionHandler`).
6. **Audit Fields:** Tất cả các Entity chính phải kế thừa `BaseEntity` chứa `id`, `createdAt`, `updatedAt`, `createdBy`, `isDeleted` (Soft Delete).

#### Mẫu Code Chuẩn Backend (AI Agent MUST follow):

```java
// 1. DTO dùng Java Record + Validation
public record CreateBookingRequest(
    @NotNull Long branchId,
    @NotNull Long stylistId,
    @NotEmpty List<Long> serviceIds,
    @NotNull LocalDateTime startTime
) {}

// 2. Controller mỏng, trả về ApiResponse<T>
@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {
    private final BookingService bookingService;

    @PostMapping
    public ApiResponse<BookingResponse> createBooking(@Valid @RequestBody CreateBookingRequest req) {
        return ApiResponse.success(bookingService.holdSlotAndCreate(req));
    }
}
```

### 4.2. Quy tắc Frontend (React 19 + Vite 8 + TanStack Query v5 + Tailwind v4)

1. **Quy chuẩn Tailwind CSS v4 (Rất quan trọng):**
   - Trong `vite.config.js`, sử dụng plugin chính thức `@tailwindcss/vite`:

     ```javascript
     import { defineConfig } from "vite";
     import react from "@vitejs/plugin-react";
     import tailwindcss from "@tailwindcss/vite";

     export default defineConfig({
       plugins: [react(), tailwindcss()],
     });
     ```

   - Trong `src/index.css`, chỉ dùng cú pháp mới `@import "tailwindcss";` và khai báo biến thiết kế trong block `@theme { ... }`. **Tuyệt đối không dùng** `@tailwind base; @tailwind components; @tailwind utilities;` hay tạo file `tailwind.config.js`.

2. **Quy chuẩn React 19:**
   - Truyền trực tiếp `ref` như một prop thông thường vào Function Component, **không dùng** `React.forwardRef`.
   - Không lạm dụng `useMemo` và `useCallback` thủ công cho các phép tính đơn giản.
3. **Quản lý Server State bằng TanStack Query v5:**
   - **KHÔNG** dùng `useEffect` + `useState` để fetch API.
   - Bắt buộc viết các Custom Hooks trong từng feature (ví dụ: `useBookings()`, `useAvailableSlots()`, `useCreateBooking()`).
   - Sử dụng cú pháp Object duy nhất của TanStack Query v5. Lưu ý: trạng thái chờ của mutation là `isPending` (thay cho `isLoading` cũ) và thời gian lưu rác là `gcTime` (thay cho `cacheTime` cũ).
4. **Axios Interceptor:** Cấu hình một instance `axiosClient` duy nhất tại `src/api/axiosClient.js`, tự động đính kèm `Bearer Token` và xử lý Refresh Token khi gặp lỗi `401 Unauthorized`.

#### Mẫu Code Chuẩn Frontend (AI Agent MUST follow):

```javascript
// Custom Hook chuẩn TanStack Query v5 tại src/features/booking/hooks/useBookingQueries.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingApi } from "../services/bookingApi";

export const useAvailableSlots = (params) => {
  return useQuery({
    queryKey: ["available-slots", params],
    queryFn: () => bookingApi.getAvailableSlots(params),
    enabled: Boolean(params?.branchId && params?.date),
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => bookingApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["available-slots"] });
    },
  });
};
```

---

## 5. Luồng Nghiệp vụ Cốt lõi & Ràng buộc Logic (Core Domain Rules)

AI Agent cần nắm rõ 4 luồng nghiệp vụ và State Machine sau khi viết Business Logic:

### 5.1. Vòng đời Lịch hẹn (Booking State Machine)

- Luồng chính: `PENDING_PAYMENT` -> `CONFIRMED` -> `CHECKED_IN` -> `IN_PROGRESS` -> `COMPLETED`
- Các nhánh rẽ phụ:
  - `EXPIRED`: Quá 5 phút giữ chỗ nhưng chưa nhận được Webhook thanh toán cọc.
  - `CANCELLED`: Khách hàng hoặc Lễ tân chủ động hủy lịch.
  - `NO_SHOW`: Quá giờ hẹn nhưng khách không đến cửa hàng.

### 5.2. Luật Khóa Slot & Đặt cọc (Concurrency & Hold Rule)

- **Kiểm tra chồng lấn thời gian (Overlap Check):** Khi khách chọn `stylist_id` và `start_time`, hệ thống tính `end_time = start_time + total_duration_minutes`. Một khung giờ bị coi là trùng nếu tồn tại lịch hẹn khác của cùng `stylist_id` thỏa mãn:
  `(RequestStart < ExistingEnd) AND (RequestEnd > ExistingStart)`
  với trạng thái thuộc `PENDING_PAYMENT`, `CONFIRMED`, `CHECKED_IN`, `IN_PROGRESS`.
- **Distributed Lock:** Sử dụng Redis Lock với key `lock:slot:{stylistId}:{date}:{timeSlot}` (TTL = 300 giây) ngay khi tạo lịch ở trạng thái `PENDING_PAYMENT` để chống 2 người đặt cùng lúc. Khi nhận Webhook thành công từ PayOS, chuyển trạng thái sang `CONFIRMED`.

### 5.3. Luật Chia Công đoạn & Hoa hồng (Task Splitting & Commission)

- Khi khách `CHECKED_IN`, hệ thống mở một phiếu `Order`.
- Một `OrderItem` (Dịch vụ khách làm, VD: Combo Uốn + Nhuộm) được phép tách thành nhiều bước `OrderStepAssignment` gắn với các `Staff` khác nhau:
  - Ví dụ: Bước 1 (Vào thuốc/Gội) gán cho Thợ phụ B (Hưởng 30% hoa hồng dịch vụ); Bước 2 (Cắt/Uốn chính) gán cho Thợ chính A (Hưởng 70% hoa hồng dịch vụ).
- Khi `Order` chuyển sang `COMPLETED`, hệ thống tự động tính tiền hoa hồng cho từng nhân sự và ghi vào bảng `CommissionLedger` (lưu dưới dạng sổ cái giao dịch bất biến để đối soát lương cuối tháng, tuyệt đối không cộng đè trực tiếp vào một cột tổng duy nhất).

### 5.4. Luật Trừ kho Định mức & Hồ sơ Kỹ thuật (Inventory BOM & Visual Log)

- **Đơn vị quy đổi:** Tồn kho hóa chất (`Product`) luôn được lưu ở **đơn vị cơ sở nhỏ nhất** (`base_unit`: `GRAM` hoặc `ML`).
- **Nhập kho:** Khi nhập theo đơn vị đóng gói (`packaging_unit`: `TUBE`, `BOTTLE`), hệ thống nhân số lượng nhập với hệ số quy đổi (`conversion_rate`, VD: 1 Tuýp = 100g) để cộng vào `current_stock_in_base_unit`.
- **Xuất kho pha chế:** Khi Kỹ thuật viên nhập công thức pha chế thực tế trong ca làm việc (VD: 40g thuốc mã X + 60ml Oxy), hệ thống trừ trực tiếp số `gram`/`ml` tương ứng khỏi kho, ghi vào `InventoryTransaction` và tính Giá vốn hóa chất (COGS) cho ca dịch vụ đó.
- **Visual Log:** Cho phép lưu hình ảnh sau khi làm xong (upload qua Cloudinary) kèm công thức vừa pha vào bảng `TechnicalLog` gắn với `customer_id` để tra cứu ở các lần khách quay lại sau.
