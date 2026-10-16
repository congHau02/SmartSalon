# 02: Backend Base Core & Package Standardization

**What to build:** A standardized Spring Boot 4.1 backend structure under Java 25 LTS where the main application class resides at the root package `com.smartsalon`, allowing automatic component discovery of all configurations, exception handlers, and security filters, backed by JPA entity auditing and Virtual Threads.

**Blocked by:** 01: Root Infrastructure & Monorepo Restructuring

**Status:** resolved

- [x] Relocate `SmartSalonApplication.java` from package `com.hau.SmartSalon` to `com.smartsalon.SmartSalonApplication` in `backend/src/main/java/com/smartsalon/SmartSalonApplication.java`.
- [x] Remove old package folder `com/smartsalon/SmartSalon` and update `SmartSalonApplicationTests.java` to test the new package.
- [x] Delete redundant `backend/src/main/resources/application.properties` and verify `application.yml` has Virtual Threads enabled (`spring.threads.virtual.enabled: true`).
- [x] Add an `AuditorAware<String>` Bean in `SecurityConfig` to automatically extract the authenticated user identity for `BaseEntity`'s `@CreatedBy`.
- [x] Update `JwtAuthenticationFilter` with defensive null checks and normalize role authorities.
- [x] Verify `mvnw compile` and `mvnw test` execute successfully under Java 25.

## Answer

- Relocated `SmartSalonApplication.java` to `package com.smartsalon;` ensuring Spring Boot component scanning detects all beans, configurations, and exception handlers.
- Cleaned up obsolete directories and removed redundant `application.properties`.
- Added `AuditorAware<String>` bean in `SecurityConfig` defaulting to authenticated user or `SYSTEM`.
- Enhanced `JwtAuthenticationFilter` with defensive null-checks for roles and proper role prefix normalization (`ROLE_`).
- Configured H2 test database and added unit tests for `ApiResponse` and `JwtProvider`.
- All 5 tests passed with 0 failures under Java 25 LTS.
