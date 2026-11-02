# 05: Logged-In Customer Self-Service Reschedule from the Customer Portal

**What to build:** A logged-in customer opens an upcoming `CONFIRMED` booking in the customer portal, clicks **"Dời lịch"**, picks a new date/time from the same branch's available `Slots` for the same services (reusing the existing slot picker and stylist selector), optionally keeps/changes the stylist or lets Least-Workload assign one, and confirms. The `Deposit`, `total_price`, services and branch carry over unchanged. Rules live on the entity (`booking.reschedule(...)`): only `CONFIRMED`, at least 2h before the original `booking_time`, at most once per booking. The new multi-bucket `Slot Lock` is acquired first with `MSETNX` (ADR-0006); only after the booking update commits are the old slot keys released, so a taken slot leaves the original booking and locks untouched. Shift and overtime-window eligibility from Phase 10 applies. After commit, the branch gets the usual realtime booking update, the customer gets a "booking rescheduled" email, and `reminder_sent_at` is cleared so the reminder follows the new time. See the spec (`../spec.md`, "Reschedule").

**Blocked by:** 03 (Booking Confirmation Email via Notification Sender), 04 (24h Booking Reminder — owns `reminder_sent_at`)

**Status:** closed

- [x] New Flyway migration (next free version) adds `reschedule_count INT NOT NULL DEFAULT 0` to `bookings`.
- [x] `Booking.reschedule(newTime, newEndTime, newStaff, now)` enforces the three rules with distinct error codes, increments `reschedule_count`, clears `reminder_sent_at`, and updates `is_stylist_requested` accordingly; domain unit tests cover each rule.
- [x] `POST /api/v1/customer/me/bookings/{bookingId}/reschedule` with ownership checked like cancel; orchestration: validate → resolve stylist (requested or Least-Workload, shift-eligible) → acquire new lock (fail → `SLOT_UNAVAILABLE`, nothing changed) → persist → after commit release old keys, broadcast, publish `BookingRescheduledEvent`; new keys released if the transaction fails.
- [x] Reschedule email sent via the ticket-03 sender.
- [x] Customer portal "Dời lịch" dialog with error-code → Vietnamese message mapping (too late, already rescheduled, not confirmed, slot taken, stylist off-shift).
- [x] MockMvc integration tests: happy path (deposit unchanged, old keys freed, new keys held, email recorded, broadcast sent); < 2h; second reschedule; non-`CONFIRMED`; slot taken → original booking + locks unchanged; off-shift stylist; another customer's booking → forbidden.
- [x] Frontend vitest for the error mapping.
- [x] ADR-0015 records lock-new-then-release-old; `GLOSSARY.md` gains **Reschedule**.
