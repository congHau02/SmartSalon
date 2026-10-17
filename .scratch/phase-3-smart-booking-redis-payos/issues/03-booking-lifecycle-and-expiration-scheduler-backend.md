# Issue 03: Booking Lifecycle, Seamless Guest/Customer Resolution & Expiration Scheduler

Status: ready-for-agent
Blocked by: 01, 02

## Description

Implement the `BookingEntity`, `BookingServiceItemEntity`, `BookingRepository`, `BookingService`, `BookingExpirationScheduler`, and `BookingController` to handle holding slots (`PENDING_PAYMENT`), resolving logged-in or guest customers by phone number, looking up bookings, managing booking status transitions, and automatically expiring overdue holds after 5 minutes.

## Tasks

- [ ] Create `BookingEntity`, `BookingServiceItemEntity`, `BookingStatus`, and `DepositStatus` enums/models.
- [ ] Implement `BookingRepository` with overlap queries, daily stylist workload aggregation, overdue `PENDING_PAYMENT` lookup, and customer/admin filter queries.
- [ ] Implement `BookingService.holdSlotAndCreate(CreateBookingRequest)`:
  - Resolve authenticated user or find/auto-create `CUSTOMER` user by phone number.
  - Calculate `totalDurationMinutes`, `endTime`, `totalPrice`, and 20% `depositAmount`.
  - Acquire multi-bucket Redis lock (for specific stylist or least-workload auto-assigned stylist).
  - Persist `BookingEntity` (`PENDING_PAYMENT`, `slotLockExpiresAt = now + 5m`) and `BookingServiceItemEntity` snapshots.
- [ ] Implement `BookingExpirationScheduler` (`@Scheduled`) to sweep expired `PENDING_PAYMENT` bookings into `EXPIRED` and release Redis keys.
- [ ] Expose REST endpoints in `BookingController` (`POST /api/v1/bookings`, `GET /api/v1/bookings/{code}`, `GET /api/v1/bookings/lookup`, `GET /api/v1/bookings`, `PATCH /api/v1/bookings/{id}/status`).

## Comments

