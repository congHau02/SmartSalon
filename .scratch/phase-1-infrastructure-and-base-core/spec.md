# Specification: Phase 1 - Infrastructure & Base Core

Status: ready-for-agent

## Problem Statement

Developing the SmartSalon Booking, POS, and Operations platform requires a robust, modern foundation capable of supporting high-concurrency booking, real-time salon floor dispatching, and inventory BOM calculations. Currently, the codebase lacks a unified monorepo structure: the backend contains package misalignments that prevent Spring Boot component scanning, duplicate property files, unhandled JWT filter edge cases, and missing database migrations. Furthermore, containerized local services (MySQL 9.7 and Redis 8.4) and the frontend single-page application framework (React 19, Vite 8, Tailwind CSS v4, React Router v7, TanStack Query v5) have not been established at the root level. Without this core foundation, business features cannot be built or tested reliably.

## Solution

Establish a standardized, high-performance base infrastructure and core architecture:
1. **Containerized Infrastructure**: Root `docker-compose.yml` hosting MySQL 9.7 and Redis 8.4 with health checks and persistent volume configurations.
2. **Backend Base Core**: Spring Boot 4.1.x on Java 25 LTS running in `backend/`, configured with Virtual Threads (`spring.threads.virtual.enabled=true`), unified package scanning under `com.smartsalon`, `BaseEntity` with automatic JPA auditing via `AuditorAware`, `ApiResponse<T>` record wrapper, `GlobalExceptionHandler`, and stateless JWT authentication filter.
3. **Database Schema Baseline**: Complete Flyway baseline migration (`V1__init_schema.sql`) compatible with MySQL 9.7 creating the 14 fundamental domain tables (`users`, `roles`, `branches`, `services`, `products`, `service_bom`, `bookings`, `orders`, `order_items`, `order_step_assignments`, `technical_logs`, `inventory_transactions`, `payment_transactions`, `commission_ledgers`).
4. **Frontend Base Core**: React 19 + Vite 8 client in `frontend/`, configured with Tailwind CSS v4 via `@tailwindcss/vite`, TanStack Query v5 `QueryClientProvider`, React Router v7, and a pre-configured `axiosClient` with JWT Bearer token authentication interceptors.

## User Stories

1. As a developer, I want to start MySQL 9.7 and Redis 8.4 with a single command from the root directory, so that my local environment matches production infrastructure constraints.
2. As a backend developer, I want all core classes located in the `com.smartsalon` root package, so that Spring Boot's component scan discovers all configurations, controllers, and exception handlers automatically.
3. As a backend developer, I want Virtual Threads enabled in Spring Boot, so that high-concurrency booking requests do not block OS platform threads during database or Redis operations.
4. As an API client, I want all HTTP responses formatted consistently in an `ApiResponse<T>` envelope containing `code`, `message`, `result`, and `timestamp`, so that frontend data parsers have a predictable data contract.
5. As an API client, I want business and validation errors returned as structured HTTP error responses via `GlobalExceptionHandler`, so that client applications can display clear error feedback.
6. As a security auditor, I want all entities extending `BaseEntity` to automatically record `createdAt`, `updatedAt`, and `createdBy` from the authenticated user token, so that data modifications are tracked without manual boilerplate.
7. As a security auditor, I want requests authenticated statelessly using HMAC-SHA256 JWT tokens passed in the `Authorization: Bearer <token>` header, so that backend services remain stateless and horizontally scalable.
8. As a backend engineer, I want `JwtAuthenticationFilter` to safely handle missing or malformed role claims without throwing uncaught exceptions, so that unauthorized requests receive clean 401 Unauthorized statuses.
9. As a database administrator, I want Flyway to execute `V1__init_schema.sql` automatically on application startup, so that all 14 core tables are provisioned with correct foreign keys, indexes, and UTF-8 encoding.
10. As a store manager, I want the schema to define `branches` and `users` linked by foreign keys, so that staff members and customers can be scoped to salon branches.
11. As a customer, I want the database to support `bookings` with slot expiration timestamps and deposit tracking, so that appointment slots are reserved deterministically.
12. As a cashier, I want the database to support `orders` and `order_items` linked to bookings and services, so that delivered services and products can be billed accurately.
13. As a salon floor coordinator, I want `order_step_assignments` in the schema, so that individual service steps (e.g., washing, cutting, coloring) can be assigned to different technicians.
14. As a hair stylist, I want `technical_logs` in the schema, so that chemical formulas and before/after photographs are retained for future customer visits.
15. As an inventory manager, I want `products`, `service_bom`, and `inventory_transactions` in the schema, so that chemical formulations (in ml/grams) can be deducted from stock automatically.
16. As an accountant, I want `payment_transactions` and `commission_ledgers` in the schema, so that payment webhooks and staff commission splits are immutably audited.
17. As a frontend developer, I want a React 19 and Vite 8 project ready in `frontend/`, so that modern UI features can be developed using current React paradigms.
18. As a frontend developer, I want Tailwind CSS v4 configured via the Vite plugin without legacy v3 config files, so that modern CSS styling is fast and maintainable.
19. As a frontend developer, I want TanStack Query v5 integrated at the application root, so that server state caching and optimistic updates are standard throughout the app.
20. As a frontend developer, I want `axiosClient` configured with request and response interceptors, so that authentication headers and centralized error responses are handled uniformly.
21. As a frontend developer, I want React Router v7 configured with placeholder routes, so that page navigation and protected layouts can be added without restructuring the app.

## Implementation Decisions

### 1. Repository & Monorepo Structure
- Root directory contains `docker-compose.yml`, `README.md`, `GLOSSARY.md`, `docs/`, and `.scratch/`.
- Backend code resides under `backend/` (relocated from nested `SmartSalon/`).
- Frontend code resides under `frontend/`.
- Multi-container environment managed by root `docker-compose.yml` with `mysql:9.7` on port 3306 and `redis:8.4-alpine` on port 6379, configured with health checks and utf8mb4 collation.

### 2. Backend Base Core (Spring Boot 4 / Java 25)
- Standardize all package declarations to `com.smartsalon.*`.
- Move `SmartSalonApplication.java` to `com.smartsalon.SmartSalonApplication`.
- Update `SmartSalonApplicationTests.java` to import `com.smartsalon.SmartSalonApplication`.
- Remove redundant `application.properties` and keep `application.yml` as the single configuration source.
- Configure `AuditorAware<String>` bean in `SecurityConfig` to extract the current authenticated username from `SecurityContextHolder`.
- Harden `JwtAuthenticationFilter` with null checks for role claims and standard role prefix normalization.
- Ensure `Virtual Threads` are enabled via `spring.threads.virtual.enabled: true`.

### 3. Database Schema Baseline (MySQL 9.7 & Flyway)
- Create `backend/src/main/resources/db/migration/V1__init_schema.sql`.
- Engine: `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`.
- Primary keys: `BIGINT AUTO_INCREMENT PRIMARY KEY`.
- Tables created:
  - `roles`: `(id, name, description)`
  - `branches`: `(id, name, address, phone, is_active, created_at, updated_at, created_by, is_deleted)`
  - `users`: `(id, branch_id, username, password_hash, full_name, phone, email, is_active, created_at, updated_at, created_by, is_deleted)`
  - `user_roles`: `(user_id, role_id)`
  - `services`: `(id, name, description, base_price, duration_minutes, is_active, created_at, updated_at, created_by, is_deleted)`
  - `products`: `(id, name, sku, barcode, unit, volume_or_weight, current_stock_units, current_volume, min_stock_alert, is_active, created_at, updated_at, created_by, is_deleted)`
  - `service_bom`: `(id, service_id, product_id, standard_amount, unit, created_at, updated_at, is_deleted)`
  - `bookings`: `(id, branch_id, customer_id, staff_id, booking_time, slot_lock_expires_at, status, deposit_amount, deposit_status, notes, created_at, updated_at, created_by, is_deleted)`
  - `orders`: `(id, branch_id, customer_id, booking_id, order_code, subtotal, discount_amount, deposit_deducted, final_amount, status, created_at, updated_at, created_by, is_deleted)`
  - `order_items`: `(id, order_id, service_id, product_id, item_type, quantity, unit_price, total_price, created_at, updated_at, is_deleted)`
  - `order_step_assignments`: `(id, order_item_id, step_name, staff_id, commission_rate, commission_amount, status, started_at, completed_at, created_at, updated_at)`
  - `technical_logs`: `(id, order_id, customer_id, staff_id, formula_notes, before_image_url, after_image_url, created_at, updated_at, is_deleted)`
  - `inventory_transactions`: `(id, product_id, branch_id, transaction_type, quantity_units, volume_amount, unit, balance_after, reference_order_id, notes, created_at, created_by)`
  - `payment_transactions`: `(id, order_id, booking_id, payment_method, transaction_code, amount, status, payload_webhook, created_at, updated_at)`
  - `commission_ledgers`: `(id, staff_id, order_id, step_assignment_id, amount, status, calculation_notes, created_at, updated_at)`

### 4. Frontend Base Core (React 19 + Vite 8)
- Initialize `frontend/` using Vite with React 19.
- Install and configure `@tailwindcss/vite` in `vite.config.js` and `@import "tailwindcss";` in `src/index.css`.
- Configure `TanStack Query v5` (`QueryClientProvider`) wrapping the root component tree.
- Configure `React Router v7` with layout routes (`AdminLayout`, `PosLayout`, `CustomerLayout` placeholders).
- Configure `src/api/axiosClient.js` with `baseURL` pointing to `http://localhost:8080/api/v1` and Bearer token interceptor.
- Establish clean directory layout: `src/components/`, `src/features/`, `src/api/`, `src/hooks/`, `src/lib/`.

## Testing Decisions

- **Good Test Philosophy**: Tests must evaluate external system behavior (HTTP status codes, response envelope payloads, authentication headers, schema constraints) rather than mocking internal class fields.
- **Backend HTTP Boundary Seam**: Use `MockMvc` / `@SpringBootTest` to verify:
  - Public endpoints (`/api/v1/auth/**`, `/swagger-ui/**`) return valid responses without authentication.
  - Secured endpoints reject requests missing JWT tokens with HTTP 401 / 403.
  - Custom exceptions produce proper `ApiResponse<Void>` error bodies with HTTP status codes matching `ErrorCode`.
  - Spring Boot application context loads cleanly under Java 25.
- **Database Migration Seam**: Run Flyway migration against the running MySQL 9.7 container and verify all 14 tables and indexes are created without syntax or collation errors.
- **Frontend Build & Render Seam**: Verify that `npm run build` succeeds under Vite 8 and that the root React component mounts with the `QueryClientProvider` and `RouterProvider`.

## Out of Scope

- Specific business feature implementations (Authentication login/register endpoint logic, PayOS VietQR payment flow, Redisson slot lock engine, WebSocket STOMP real-time handlers).
- UI component implementation for Booking stepper, POS Kanban board, inventory forms, or visual logs.
- Cloudinary third-party image upload integration.

## Further Notes

- Architecture decisions are recorded in `docs/adr/0001-monorepo-layout.md` and `docs/adr/0002-stateless-jwt-virtual-threads.md`.
- Domain terminology is standardized in `GLOSSARY.md`.
