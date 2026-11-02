# 02: Redis Fixed-Window Rate Limit on Public Booking Lookup

**What to build:** The public booking lookup (phone + `booking_code`) can no longer be brute-forced. Each client gets at most 5 lookup attempts per 10 minutes per phone number; the 6th returns `HTTP 429` with a `TOO_MANY_REQUESTS` error code in the standard `ApiResponse` envelope, and the customer lookup page shows a clear Vietnamese "too many attempts, try again later" message. The limiter is a small reusable component on the existing Redis (`INCR` + `EXPIRE` on first hit), keyed by endpoint + client IP + phone, so ticket 06 can reuse it for guest reschedule. No new dependency. See the spec (`../spec.md`, "Rate limiting").

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] A reusable rate-limit component exposes "allow or reject for (key, limit, window)" backed by `StringRedisTemplate`; the counter key expires after the window.
- [ ] `GET /api/v1/bookings/lookup` is limited to 5 requests / 10 minutes per IP + phone; the 6th returns `429` + `TOO_MANY_REQUESTS`, and a different phone or IP is counted independently.
- [ ] Code carries `shortcut: fixed window allows a 2x burst at window edges, upgrade to sliding window/Bucket4j if abuse is observed`.
- [ ] Client IP comes from the servlet remote address; no new trust of forwarded headers.
- [ ] Frontend lookup page maps `429` / `TOO_MANY_REQUESTS` to a friendly message.
- [ ] Integration test (MockMvc, existing booking test prior art) proves allow ×5, reject on 6th, and independent keys. Test Redis setup follows whatever existing booking/Redis tests use.
- [ ] ADR-0015 is created (or appended) with the rate-limit decision.
