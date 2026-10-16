# 0002 Stateless JWT Authentication and Virtual Threads Concurrency

We chose stateless JWT-based authentication in Spring Security coupled with Java 25 Virtual Threads (`spring.threads.virtual.enabled=true`) for handling high-concurrency booking and POS operations.

## Context

SmartSalon experiences traffic spikes during appointment booking windows and requires real-time coordination across stylists and chairs. Traditional blocking thread-per-request models incur significant memory overhead under concurrent slot-lock requests.

## Decision

1. **Stateless Security**: Spring Security 7 configured with `SessionCreationPolicy.STATELESS` and a custom `JwtAuthenticationFilter` reading HMAC-SHA256 tokens from the `Authorization: Bearer <token>` header.
2. **Virtual Threads**: Enable Java 25 Virtual Threads in Spring Boot so blocking I/O calls (database queries, Redis distributed locks, STOMP broadcasts) do not consume OS platform threads.
3. **Auditing**: Automatic population of `createdBy` and `createdAt` via `AuditorAware<String>` wired directly to `SecurityContextHolder`.

## Consequences

The server scales efficiently to handle simultaneous lock requests without thread starvation. Authentication state is fully distributed and ready for horizontal scaling behind an API gateway or reverse proxy.
