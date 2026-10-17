# Issue 02: Auth & RBAC Backend with Dual-Identifier Login, Redis Refresh Token Rotation & Revocation

Status: resolved

## Description

Implement the authentication and authorization backend infrastructure supporting:
1. Dual-identifier login via `POST /api/v1/auth/login` accepting `username` or `phone`.
2. Token generation: Stateless JWT Access Token (1 hour) and Redis-backed Refresh Token (7 days).
3. Token rotation on `POST /api/v1/auth/refresh` (invalidates old refresh token in Redis and issues fresh pair).
4. Immediate revocation on `POST /api/v1/auth/logout` (deletes refresh token from Redis).
5. Public registration for customers via `POST /api/v1/auth/register` (assigns `CUSTOMER` role).
6. User entities, repositories, and role-based method security annotations (`@PreAuthorize`).

## Tasks

- [x] Create JPA entities: `UserEntity`, `RoleEntity`, `BranchEntity` under `com.smartsalon.user.entity` and `com.smartsalon.branch.entity`.
- [x] Implement `UserRepository`, `RoleRepository`, `BranchRepository`.
- [x] Implement `RedisTemplate<String, Object>` service for managing refresh token keys with TTL (`RedisRefreshTokenStore`).
- [x] Implement DTOs: `LoginRequest`, `RegisterRequest`, `TokenResponse`, `RefreshTokenRequest`, `UserDto`.
- [x] Implement `AuthService` handling authentication, BCrypt verification, token issuance, rotation, and logout.
- [x] Implement `AuthController` with endpoints `/login`, `/register`, `/refresh`, `/logout`, and `/me`.
- [x] Update `SecurityConfig` to expose `/api/v1/auth/**` and secure `/api/v1/users/**` by role.
- [x] Write unit/slice tests verifying successful login with username and phone, invalid credentials handling, and refresh token rotation.

## Answer

Implemented the complete Auth & RBAC backend infrastructure:
1. **Domain Entities & Repositories**:
   - `UserEntity`, `RoleEntity`, and `BranchEntity` mapped to database tables with audit support (`BaseEntity`).
   - `UserRepository` supporting single-field dual-identifier lookup (`username` OR `phone`) via indexed query.
2. **Token Lifecycle & Redis Revocation**:
   - `JwtProvider` generates stateless JWT Access Tokens (1h) embedding subject, roles, userId, and branchId.
   - `RefreshTokenStore` interface with `RedisRefreshTokenStore` managing keys `rt:{userId}:{token}` with 7-day TTL.
   - Token rotation in `AuthService.refreshToken()` invalidates the consumed refresh token immediately upon issuance of new token pair.
   - Token revocation in `AuthService.logout()` deletes refresh token from store.
3. **API Endpoints**:
   - `AuthController`: `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`.
   - `UserController`: `POST /api/v1/users` and `GET /api/v1/users` secured with `@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")`.
   - `BranchController`: `GET /api/v1/branches` for querying active salon branches.
   - `GlobalExceptionHandler`: Added `AccessDeniedException` mapping returning HTTP 403 Forbidden with `ApiResponse`.
4. **Automated Verification**:
   - `AuthIntegrationTest` (8 tests) verifies username/phone login, bad credentials rejection, customer registration, token rotation, logout revocation, current user retrieval, and RBAC 403 enforcement.
   - All 18 tests in backend pass cleanly (`BUILD SUCCESS`).

## Comments

