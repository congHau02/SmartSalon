# Issue 02: Auth & RBAC Backend with Dual-Identifier Login, Redis Refresh Token Rotation & Revocation

Status: ready-for-agent

## Description

Implement the authentication and authorization backend infrastructure supporting:
1. Dual-identifier login via `POST /api/v1/auth/login` accepting `username` or `phone`.
2. Token generation: Stateless JWT Access Token (1 hour) and Redis-backed Refresh Token (7 days).
3. Token rotation on `POST /api/v1/auth/refresh` (invalidates old refresh token in Redis and issues fresh pair).
4. Immediate revocation on `POST /api/v1/auth/logout` (deletes refresh token from Redis).
5. Public registration for customers via `POST /api/v1/auth/register` (assigns `CUSTOMER` role).
6. User entities, repositories, and role-based method security annotations (`@PreAuthorize`).

## Tasks

- [ ] Create JPA entities: `UserEntity`, `RoleEntity`, `BranchEntity` under `com.smartsalon.user.entity` and `com.smartsalon.branch.entity`.
- [ ] Implement `UserRepository`, `RoleRepository`, `BranchRepository`.
- [ ] Implement `RedisTemplate<String, Object>` service for managing refresh token keys with TTL.
- [ ] Implement DTOs: `LoginRequest`, `RegisterRequest`, `TokenResponse`, `RefreshTokenRequest`, `UserDto`.
- [ ] Implement `AuthService` handling authentication, BCrypt verification, token issuance, rotation, and logout.
- [ ] Implement `AuthController` with endpoints `/login`, `/register`, `/refresh`, `/logout`, and `/me`.
- [ ] Update `SecurityConfig` to expose `/api/v1/auth/**` and secure `/api/v1/users/**` by role.
- [ ] Write unit/slice tests verifying successful login with username and phone, invalid credentials handling, and refresh token rotation.

## Comments
