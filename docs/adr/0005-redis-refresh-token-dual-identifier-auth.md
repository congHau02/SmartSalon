# 0005 Redis Refresh Token Lifecycle and Dual-Identifier Authentication

We implemented dual-identifier authentication (Username or Phone Number) and stateful refresh token lifecycle management in Redis while preserving stateless access token verification.

## Context

Salon customers and staff in the Vietnamese retail market predominantly identify themselves via phone numbers rather than abstract usernames. Furthermore, stateless JWTs cannot be revoked prior to their expiry timestamp without a distributed blacklist, leaving sessions vulnerable if user credentials or devices are compromised.

## Decision

1. **Dual Identifier**: The login seam accepts either `username` or `phone` in a single unified `identifier` payload field, resolving against the `users` table via an indexed lookup.
2. **Token Architecture**:
   - Short-lived Access Token (1 hour): Pure stateless JWT containing `sub` (username), `userId`, `roles`, and `branchId`.
   - Long-lived Refresh Token (7 days): Cryptographically secure random UUID stored in Redis under key `refresh_token:{userId}:{token}` with a 7-day TTL.
3. **Rotation & Revocation**:
   - Refreshing an access token invalidates the consumed refresh token and issues a new pair (Token Rotation).
   - Logging out immediately deletes the user's refresh token keys from Redis, invalidating future session extensions.

## Consequences

- Low API gateway latency: protected endpoints verify JWT signatures locally without hitting Redis or the database.
- Controlled session revocation: compromised tokens or employee departures can be cut off immediately via Redis key eviction.
- Added Redis dependency for session renewal, which is already provisioned in the base infrastructure.
