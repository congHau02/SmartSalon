# 02: Backend Base Core & Package Standardization

**What to build:** A standardized Spring Boot 4.1 backend structure under Java 25 LTS where the main application class resides at the root package `com.smartsalon`, allowing automatic component discovery of all configurations, exception handlers, and security filters, backed by JPA entity auditing and Virtual Threads.

**Blocked by:** 01: Root Infrastructure & Monorepo Restructuring

**Status:** ready-for-agent

- [ ] Relocate `SmartSalonApplication.java` from package `com.hau.SmartSalon` to `com.smartsalon.SmartSalonApplication` in `backend/src/main/java/com/smartsalon/SmartSalonApplication.java`.
- [ ] Remove old package folder `com/smartsalon/SmartSalon` and update `SmartSalonApplicationTests.java` to test the new package.
- [ ] Delete redundant `backend/src/main/resources/application.properties` and verify `application.yml` has Virtual Threads enabled (`spring.threads.virtual.enabled: true`).
- [ ] Add an `AuditorAware<String>` Bean in `SecurityConfig` to automatically extract the authenticated user identity for `BaseEntity`'s `@CreatedBy`.
- [ ] Update `JwtAuthenticationFilter` with defensive null checks and normalize role authorities.
- [ ] Verify `mvnw compile` and `mvnw test` execute successfully under Java 25.
