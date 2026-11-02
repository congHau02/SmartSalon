# 0015 Booking Reminders, Self-Service Reschedule, Non-Stacking Vouchers & Redis Rate Limiting

We introduce lifecycle reminders, self-service reschedule with lock-new-then-release-old semantics, non-stacking promotion vouchers settled at order payment, and Redis-backed fixed-window rate limiting on public booking endpoints.

## Context

Prior to Phase 11, four customer-facing revenue and security gaps existed:
1. Public booking lookup (`GET /api/v1/bookings/lookup`) and the upcoming guest reschedule endpoint had no brute-force protection, allowing adversaries to harvest booking codes or customer booking details by guessing phone and booking codes.
2. Customers received no confirmation or reminders outside the app, leading to no-shows and unused stylist slots.
3. Customers could not reschedule moving appointments without cancelling and rebooking from scratch.
4. Salons lacked promotional campaign vouchers to incentivize repeat visits and seasonal marketing.

## Decision

1. **Redis Fixed-Window Rate Limiting on Public Booking Endpoints**:
   - Provide a reusable `RateLimiter` component backed by `StringRedisTemplate` with atomic `INCR` and `EXPIRE` set on the first hit (`count == 1`).
   - Rate limit `GET /api/v1/bookings/lookup` (and upcoming guest reschedule) to 5 attempts per 10-minute window, keyed by `rl:<endpoint>:<clientIp>:<phone>`.
   - The 6th attempt within 10 minutes returns HTTP 429 with error code `2013` (`TOO_MANY_REQUESTS`) in the standard `ApiResponse` envelope.
   - Client IP is strictly sourced from servlet `request.getRemoteAddr()`, without trusting unverified forwarded headers.
   - The frontend lookup modal displays a clear Vietnamese notification when rate limited.
   - *Shortcut*: Fixed window allows up to a 2x burst at window boundary edges; upgrade to sliding window or Bucket4j if targeted abuse is observed.

2. **Booking Confirmation & 24h Reminders via Decoupled Events (Phase 11 Seam)**:
   - Decouple email notifications using Spring `ApplicationEventPublisher` and `@TransactionalEventListener(AFTER_COMMIT)` with `@Async`. Booking database transactions never fail or roll back due to mail server outages.
   - A generic `NotificationSender` seam isolates email transport (`JavaMailSender`), leaving a clean seam for future SMS/Zalo ZNS providers without altering the booking flow (`shortcut: email is the only channel, add SMS/Zalo behind the same seam when a paid provider is chosen`).
   - Unified recipient resolution: registered customer `UserEntity.email` -> `booking.customer_email` -> none (skip email, preserve booking & in-app alerts).
   - Run a 5-minute scheduler (`BookingReminderScheduler`) scanning `CONFIRMED` bookings with appointment times between 23h and 24h ahead, setting `reminder_sent_at` in the same transaction and publishing `BookingReminderDueEvent` to send a single Vietnamese reminder email via `NotificationSender` and broadcast a `BOOKING_REMINDER_DUE` real-time notice to the branch topic over STOMP.

3. **Self-Service Reschedule with Lock-New-Then-Release-Old Semantics**:
   - Reschedule requires $\ge 2\text{h}$ advance notice and at most 1 reschedule per booking (`reschedule_count == 0`).
   - Rich domain method `BookingEntity.reschedule(newTime, newEndTime, newStaff, isStylistRequested, now)` enforces domain rules with distinct error codes: `2014` (`RESCHEDULE_WINDOW_EXPIRED`), `2015` (`BOOKING_ALREADY_RESCHEDULED`), `2016` (`BOOKING_NOT_CONFIRMED`), `2017` (`STYLIST_OFF_SHIFT`), and `2007` (`SLOT_NOT_AVAILABLE`).
   - Increments `reschedule_count` and resets `reminder_sent_at = null` so the 24h reminder scheduler re-evaluates the appointment for the new window.
   - Orchestration via `BookingRescheduleService`:
     1. Validate entity rules without mutation.
     2. Resolve stylist: check shift & overtime window eligibility (Phase 10) for explicit stylist or Least-Workload among candidate stylists; exclude current booking from DB overlap check to allow time adjustments with the same stylist.
     3. Acquire new multi-bucket slot lock with Redis (`tryLockSlots`). If collision occurs, throw `SLOT_NOT_AVAILABLE` without mutating database or touching old locks.
     4. Persist updated booking.
     5. After commit (`TransactionSynchronization.afterCommit`): release old Redis slot keys, broadcast `BOOKING_RESCHEDULED` to branch reception via WebSocket STOMP, and publish `BookingRescheduledEvent` to dispatch confirmation email.
     6. If transaction fails or rolls back, newly acquired slot locks are released.
   - Paid deposit, total price, service items, and branch carry over 100% without requiring payment gateway interactions.

4. **Non-Stacking Vouchers Settled at POS Payment**:
   - Support fixed-amount and percentage discounts.
   - For an order, calculate $\text{discount} = \max(\text{tierDiscount}, \text{voucherDiscount})$; discounts never stack.
   - Pessimistically lock and redeem vouchers inside the unified payment transaction upon transition to `PAID`.

## Consequences

- Public booking lookups cannot be brute-forced, protecting customer booking privacy while keeping overhead low on the existing Redis cluster.
- Reusable rate-limiting interface enables guest reschedule (Ticket 06) and other sensitive public endpoints to enforce identical security thresholds with one line of code.
- Outage resilience: If Redis is temporarily unreachable, rate limiting fails open gracefully with an error log to avoid blocking legitimate salon clients.
