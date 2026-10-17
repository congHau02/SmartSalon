# 0006 Multi-Bucket Redis Slot Lock and Least-Workload Stylist Auto-Assignment

We implemented atomic multi-bucket Redis distributed locks (`multiSetIfAbsent` with 300-second TTL) across 30-minute time buckets paired with a least-workload stylist load-balancing selector for "Any Available Stylist" bookings.

## Context

Salon services vary widely in duration (from 30-minute haircuts to 120-minute chemical dye treatments), meaning a single booking spans multiple consecutive 30-minute slots. Locking only the start time bucket allows overlapping bookings (e.g., a 120-minute booking at 09:00 colliding with a new booking at 09:30) during high-concurrency checkout. Furthermore, customers frequently select "Any Available Stylist" rather than a specific technician, requiring deterministic staff allocation that avoids double-booking or overloading a single stylist.

## Decision

1. **Multi-Bucket Atomic Redis Lock**:
   - Operating hours (`08:30` to `20:30`) are discretized into 30-minute `Slot` buckets.
   - A booking spanning `[startTime, endTime)` computes all covered 30-minute buckets and acquires keys `lock:slot:{stylistId}:{date}:{HH:mm}` atomically via Redis `MSETNX` (`opsForValue().multiSetIfAbsent(...)`), setting a 300-second (5-minute) TTL on each bucket.
2. **Dual-Layer Overlap & Expiration Enforcement**:
   - `SlotCalculationService` evaluates a slot as available only if every 30-minute bucket in `[RequestStart, RequestEnd)` is free of Redis locks AND has no overlapping database `Booking` satisfying `(RequestStart < ExistingEnd) AND (RequestEnd > ExistingStart)` in active states (`CONFIRMED`, `CHECKED_IN`, `IN_PROGRESS`, or `PENDING_PAYMENT` where `slot_lock_expires_at > NOW()`).
   - A scheduled background job (`@Scheduled`) periodically sweeps `PENDING_PAYMENT` bookings whose `slot_lock_expires_at <= NOW()`, transitioning them to `EXPIRED` and releasing any residual Redis lock keys.
3. **Least-Workload Stylist Auto-Assignment**:
   - When a customer requests `stylistId = null` ("Any Available Stylist"), the engine filters all active `STYLIST` users at the branch who have zero overlap across `[startTime, endTime)`, sorts candidates by total scheduled minutes on that date ascending, and attempts atomic Redis multi-bucket lock acquisition in order—falling back to the next candidate if a concurrent request wins the lock first.

## Consequences

- Prevents partial-window race conditions across multi-hour services without serializing unrelated stylists or branches.
- Evenly distributes walk-in and unassigned online bookings across branch stylists.
- Requires both Redis key TTL expiry and a lightweight scheduled database sweep to keep SQL booking status (`EXPIRED`) consistent with Redis lock expiration.
