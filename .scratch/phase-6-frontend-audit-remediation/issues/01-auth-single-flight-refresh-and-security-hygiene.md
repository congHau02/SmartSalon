# 01: Auth Single-Flight Refresh Token Coordination & Security Hygiene

**What to build:** Unify access token refresh logic into a shared single-flight executor in the HTTP client layer so that concurrent 401 interceptor retries and manual `refreshToken()` calls in `AuthContext` share a single in-flight request, preventing Redis single-use refresh token rotation collisions (`ADR-0005`). Tighten authentication endpoint path matching in the HTTP interceptor, restrict quick-fill demo login credentials to development mode, and update the unauthorized page to use canonical `ROLES` constants and redirect to `/login` upon logout.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] HTTP client exports a single-flight `refreshAccessToken()` coordinating `isRefreshing` and `failedQueue` for both 401 retries and `AuthContext.refreshToken()`.
- [x] Substring matching on `/auth/login`, `/auth/refresh`, and `/auth/register` in the HTTP interceptor is replaced with safe pathname matching.
- [x] Quick-fill demo account buttons on `LoginPage` are hidden when `import.meta.env.PROD` unless `VITE_ENABLE_DEMO_ACCOUNTS === "true"`.
- [x] `UnauthorizedPage` uses `ROLES.CUSTOMER` and awaits `logout()` then redirects to `/login`.
