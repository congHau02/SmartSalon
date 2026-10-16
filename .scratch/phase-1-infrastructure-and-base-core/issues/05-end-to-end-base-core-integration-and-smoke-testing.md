# 05: End-to-End Base Core Integration & Smoke Testing

**What to build:** An end-to-end verification and smoke testing suite ensuring that the backend REST API, database persistence, security policies, and frontend API consumption work together smoothly across all layers.

**Blocked by:** 02: Backend Base Core & Package Standardization, 03: Flyway Baseline Migration for 14 Core Domain Tables, 04: Frontend Core Initialization (React 19, Vite 8, Tailwind v4)

**Status:** resolved

- [x] Create a public health check endpoint `/api/v1/public/health` in `backend` returning an `ApiResponse<Map<String, Object>>` envelope validating MySQL and Redis connectivity.
- [x] Write integration test verifying public vs secured route access under `SecurityFilterChain`.
- [x] Write integration test verifying `GlobalExceptionHandler` and `ApiResponse` envelope on exceptions.
- [x] Create a demo health/status indicator in `frontend` fetching `/api/v1/public/health` via `axiosClient` and TanStack Query.
- [x] Verify complete stack starts and smoke tests pass end-to-end.
