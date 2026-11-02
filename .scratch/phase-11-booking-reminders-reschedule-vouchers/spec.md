# Specification: Phase 11 - Booking Confirmation & 24h Reminders, Self-Service Reschedule, Non-Stacking Vouchers & CI

Status: ready-for-agent

## Problem Statement

SmartSalon (Phases 1-10) covers the full operational loop — `Booking` with Redis `Slot Locks` and PayOS `Deposit`, POS `Dispatch Board` and atomic checkout, BOM inventory, dual-tier P&L, CRM `Membership Tiers`, `Service Reviews`, stylist worklogs and shift rosters. But the customer-facing revenue and retention loop has four gaps:

1. **Customers get no confirmation or reminder outside the app.**
   - After a `Deposit` is paid the customer sees a confirmation screen only once. Nothing reminds them the day before, so no-shows waste a stylist's `Slots`.
   - `Bookings` store only `customer_phone`. Provisional customers (auto-created by `CustomerIdentityService`) have no email at all, so even if the backend could send mail, it has nowhere to send it.
   - The backend has no mail capability.
2. **Customers cannot move a booking — only cancel it.**
   - Cancelling ≥ 2h before `booking_time` turns the paid `Deposit` into `Retained Deposit` (`credit_balance`, ADR-0012), and the customer must then rebook from scratch. A customer who simply wants another hour loses their stylist's slot and goes through the whole wizard again.
   - Cancel is only available to logged-in customers. Guests — the majority — can only look a booking up by phone + `booking_code`.
3. **The salon has no promotional lever.**
   - The only discount mechanism is the automatic `Membership Tier` rate on `Order.discount_amount`. Managers cannot run a campaign ("GIAM50K this weekend") or hand a specific customer a code.
4. **Nothing guards the ten phases already built.**
   - There is no CI. 35 backend test classes and 14 frontend test files only run when someone remembers to run them locally.
   - The public `/lookup` endpoint (phone + `booking_code`) has no rate limit, so booking codes can be brute-forced. A new guest reschedule endpoint keyed on the same secret would inherit the same hole.

## Solution

1. **Email confirmation + one 24h reminder, plus in-app notice to the branch.**
   - The booking wizard gets an optional email field. When a `Booking` becomes `CONFIRMED` the customer gets a confirmation email. A scheduler sends one reminder email about 24h before `booking_time`, and pushes an "upcoming customer" notice to the branch reception over the existing STOMP topic.
   - Email resolution: the registered user's email, else the email captured on the booking, else no email (in-app notice only). Phone-only customers are never blocked.
   - Mail failures never affect the booking; they are only logged.
2. **Self-service reschedule.**
   - A customer can move a `CONFIRMED` booking to another date/time at the same branch with the same services, at least 2h before the original `booking_time`, once per booking. They may pick another stylist or let Least-Workload assign one. The `Deposit` carries over untouched because `total_price` does not change.
   - Logged-in customers reschedule from the customer portal; guests reschedule from the booking lookup page using phone + `booking_code`.
   - The customer receives a "booking rescheduled" email, and the branch gets the realtime booking update it already gets for other changes.
3. **Vouchers.**
   - ADMIN creates chain-wide vouchers, optionally restricted to some branches. MANAGER can view them.
   - A customer may enter a code in the booking wizard (stored on the booking only, not deducted from the `Deposit`). At POS checkout the voucher on the booking — or a code typed at POS — is validated, and the `Order` gets whichever discount is larger: the voucher or the `Membership Tier`. They never stack.
   - Usage is counted only when the `Order` becomes `PAID`.
4. **CI + rate limiting.**
   - A GitHub Actions workflow runs the backend test suite and the frontend tests + build on every push and pull request.
   - The guest reschedule endpoint and the existing `/lookup` endpoint are rate limited per IP + phone.

## User Stories

### Confirmation & reminders

1. As a guest customer, I want to optionally enter my email while booking, so that I receive a confirmation and reminder without creating an account.
2. As a guest customer, I want the email field to be optional, so that I can still book with only my phone number.
3. As a registered customer, I want my account email to be used automatically, so that I don't have to type it every time.
4. As a customer, I want a confirmation email as soon as my deposit is paid (or covered by `Retained Deposit`), so that I have a record of my booking code, branch, time, stylist and services.
5. As a customer, I want a reminder email about 24 hours before my appointment, so that I don't forget it.
6. As a customer, I want to receive the reminder only once, so that I'm not spammed even if the server restarts.
7. As a customer who booked less than 24h in advance, I want to not receive a pointless "reminder" right after the confirmation, so that my inbox stays clean.
8. As a customer whose booking was cancelled or expired, I want no reminder to be sent, so that I'm not confused.
9. As a customer, I want the email to include my booking code and a link to the lookup page, so that I can reschedule or check details quickly.
10. As a customer, I want the email in Vietnamese with correct diacritics, so that it reads naturally.
11. As a receptionist, I want an in-app notice for tomorrow's confirmed customers, so that I can prepare the branch schedule.
12. As a receptionist, I want that notice only for my branch, so that I'm not distracted by other branches.
13. As a customer, I want my booking to succeed even when the mail server is down, so that an email outage never costs me my slot.
14. As a developer, I want a local mail catcher with a web inbox in docker-compose, so that I can see every email sent during development without a real mailbox.
15. As a developer, I want SMTP settings in configuration, so that I can point production at a real provider without code changes.

### Reschedule

16. As a logged-in customer, I want a "Reschedule" action on my upcoming bookings in the customer portal, so that I can move my appointment myself.
17. As a guest customer, I want to reschedule from the booking lookup page with my phone and booking code, so that I don't need an account.
18. As a customer, I want to see available slots for the same services at the same branch when rescheduling, so that I only pick times that actually work.
19. As a customer, I want to keep my current stylist, choose another one, or let the system choose, so that I stay flexible.
20. As a customer, I want my paid deposit to carry over to the new time, so that I don't pay again.
21. As a customer, I want a clear message when rescheduling is no longer allowed (less than 2h before, already rescheduled once, or not confirmed), so that I know to contact the salon.
22. As a customer, I want my original booking kept intact if the new slot is taken at the last moment, so that I never end up with no booking at all.
23. As a customer, I want a "booking rescheduled" email with the new time, so that I have the updated details.
24. As a customer, I want a new 24h reminder for the new time, so that the reminder matches my actual appointment.
25. As a receptionist, I want the dispatch board / booking list to update in realtime when a customer reschedules, so that I don't serve a stale schedule.
26. As a stylist, I want my freed original slot to become bookable by others, so that I don't lose revenue.
27. As a salon owner, I want each booking rescheduled at most once, so that customers cannot hold slots indefinitely by repeatedly moving them.
28. As a salon owner, I want rescheduling to respect the stylist's shift and overtime rules (Phase 10), so that customers cannot move into a stylist's day off.
29. As a salon owner, I want the guest reschedule and lookup endpoints rate limited, so that booking codes cannot be brute-forced.
30. As a customer who hits the rate limit, I want a clear "too many attempts, try again later" message, so that I understand what happened.

### Vouchers

31. As an admin, I want to create a voucher with a code, type (percent or fixed amount), value, optional maximum discount, minimum order amount, start/end time, total usage limit and per-customer limit, so that I can run promotions safely.
32. As an admin, I want voucher codes to be unique and case-insensitive, so that "giam50k" and "GIAM50K" are the same voucher.
33. As an admin, I want to restrict a voucher to specific branches or leave it valid chain-wide, so that I can run local promotions.
34. As an admin, I want to deactivate a voucher immediately, so that I can stop a leaked code.
35. As an admin, I want to see how many times each voucher was used, so that I can measure the campaign.
36. As a manager, I want to view vouchers valid at my branch, so that I can tell customers about them.
37. As a customer, I want to enter a voucher code while booking and see whether it is valid, so that I know it will be applied.
38. As a customer, I want my deposit unaffected by the voucher, so that the deposit amount and QR stay simple.
39. As a cashier, I want the voucher saved on the booking to be applied automatically when I open the POS order, so that I don't have to ask the customer again.
40. As a cashier, I want to type or remove a voucher code at POS, so that walk-in customers can use promotions too.
41. As a cashier, I want the system to apply whichever is larger — voucher or membership tier discount — so that the customer gets the best deal without me calculating it.
42. As a cashier, I want a clear reason when a voucher is rejected (expired, not started, inactive, wrong branch, below minimum order, usage exhausted, customer limit reached), so that I can explain it.
43. As a cashier, I want checkout to fail with a clear message if the voucher ran out at the moment of payment, so that I can remove it and retry.
44. As a salon owner, I want voucher usage counted only when the order is actually paid, so that abandoned bookings don't burn limited codes.
45. As a salon owner, I want a voucher used at most once per order and never over its limits even when two cashiers check out simultaneously, so that limits hold under concurrency.
46. As a stylist, I want vouchers to never reduce my commission, so that promotions are funded by the salon, not by me.
47. As a salon owner, I want voucher discounts to flow into P&L the same way membership discounts do, so that reports stay correct.
48. As a manually overriding cashier, I want my manual discount at POS to still take precedence as today, so that existing workflows don't change.

### CI

49. As a developer, I want every push and pull request to run the backend tests, so that regressions in earlier phases are caught.
50. As a developer, I want every push and pull request to run the frontend tests and production build, so that broken imports or failing tests are caught.
51. As a developer, I want CI to need no external services, so that it is fast and free.

## Implementation Decisions

### Schema (one Flyway migration per ticket, starting at `V10`, numbered in landing order)

- `bookings`: add `customer_email VARCHAR(255) NULL`, `reminder_sent_at DATETIME NULL`, `reschedule_count INT NOT NULL DEFAULT 0`, `voucher_code VARCHAR(50) NULL`.
- `vouchers`: `id`, `code` (unique, stored upper-case), `type` (`PERCENT` | `FIXED`), `value DECIMAL(15,2)`, `max_discount DECIMAL(15,2) NULL`, `min_order_amount DECIMAL(15,2) NOT NULL DEFAULT 0`, `starts_at`, `ends_at`, `usage_limit INT NULL` (null = unlimited), `per_customer_limit INT NOT NULL DEFAULT 1`, `used_count INT NOT NULL DEFAULT 0`, `active TINYINT(1)`, audit timestamps.
- `voucher_branches(voucher_id, branch_id)`: an empty set means valid at all branches.
- `voucher_redemptions`: `id`, `voucher_id`, `order_id` (UNIQUE), `customer_id` (nullable for `walkin.guest`), `discount_amount`, `redeemed_at`.
- `orders`: add `voucher_id NULL` (FK) so the applied voucher is visible on the order and in reports.

### Notifications module (new, backend)

- Add `spring-boot-starter-mail`. Add Mailpit to `docker-compose` (SMTP + web UI). SMTP host/port/credentials and the public frontend base URL (for lookup links) come from configuration.
- Domain events published from the booking flow: `BookingConfirmedEvent`, `BookingRescheduledEvent`, `BookingReminderDueEvent`. Listeners use `@TransactionalEventListener(AFTER_COMMIT)` + `@Async`, so mail never runs inside or rolls back the booking transaction (AGENTS.md "Decouple Side Effects").
- A small `NotificationSender` seam with one email implementation. It accepts a recipient-resolved message, so SMS/Zalo can be added later without touching the booking code. shortcut: email is the only channel, add SMS/Zalo behind the same seam when a paid provider is chosen.
- Recipient resolution, in one place: `customer.email` if present, else `booking.customer_email`, else skip the email (in-app notice still goes out).
- Templates are simple Vietnamese HTML with booking code, branch name/address, time, stylist, services, deposit status and a lookup link. No template engine dependency unless one is already present; plain string/`MessageFormat` templates are acceptable.

### Reminder scheduler

- `@Scheduled` every 5 minutes, next to the existing `BookingExpirationScheduler`. It selects `CONFIRMED` bookings with `reminder_sent_at IS NULL` and `booking_time` between now+23h and now+24h, sets `reminder_sent_at` and publishes `BookingReminderDueEvent`.
- Because the window starts at +23h, bookings created less than 23h ahead never get a reminder (story 7). Bookings that are cancelled or expired are excluded by status.
- The flag is set in the same transaction that selects the row, so restarts never resend. A lost email is acceptable; a duplicate is not.
- The in-app notice to reception goes over the existing per-branch STOMP topic via `RealtimeNotificationService` (ADR-0008), with a new event type for "upcoming customer reminder".

### Reschedule

- Rich-domain method on the `Booking` entity: `booking.reschedule(newTime, newEndTime, newStaff, now)` enforces `status == CONFIRMED`, `booking_time - now >= 2h`, `reschedule_count == 0`, updates time/stylist/`is_stylist_requested`, increments `reschedule_count` and clears `reminder_sent_at`. Violations throw domain-specific error codes.
- Service orchestration, in this order (ADR-0006):
  1. Validate eligibility via the entity rules (without mutating yet).
  2. Resolve the stylist: the requested one, or Least-Workload among shift-eligible stylists for the new window (reuse the existing slot/shift eligibility logic, including the Phase 10 overtime window).
  3. Acquire the new multi-bucket `Slot Lock` with `MSETNX`. If that fails → `SLOT_UNAVAILABLE`, booking untouched.
  4. Persist `booking.reschedule(...)`.
  5. After commit: release the old slot keys, broadcast the booking update on the branch topic, publish `BookingRescheduledEvent`.
  - If the transaction fails after step 3, release the newly acquired keys.
- `total_price`, `deposit_amount`, `deposit_status`, `items` and branch are unchanged, so no PayOS interaction is needed.
- API:
  - `GET` available slots for reschedule reuses the existing slot-availability endpoint with the booking's branch, services/duration and date, so no new endpoint is needed.
  - `POST /api/v1/customer/me/bookings/{bookingId}/reschedule` (authenticated, ownership checked like cancel).
  - `POST /api/v1/bookings/reschedule` (public) with body `{ phone, bookingCode, newBookingTime, stylistId? }`. It is matched on phone + code exactly like `/lookup`.

### Rate limiting

- A fixed-window counter on the existing Redis (`INCR` + `EXPIRE` on first hit), keyed by endpoint + client IP + phone: 5 attempts per 10 minutes. Exceeding it returns HTTP 429 with a `TOO_MANY_REQUESTS` error code in the standard `ApiResponse` envelope.
- Applied to the public reschedule endpoint and the existing `GET /api/v1/bookings/lookup`. No new dependency. shortcut: fixed window allows a 2x burst at window edges, upgrade to sliding window/Bucket4j if abuse is observed.
- The client IP is taken from the servlet remote address. Forwarded headers are only trusted if the app is already configured for a proxy; this phase does not change that.

### Vouchers

- Module `voucher` (entity, repository, service, controller, mapper, validator), following the existing package layout.
- `VoucherValidator` checks, in order: exists → active → within `starts_at`/`ends_at` → branch allowed → subtotal ≥ `min_order_amount` → `used_count < usage_limit` → customer's redemptions < `per_customer_limit` (skipped for `walkin.guest`). Each failure has its own error code.
- Discount amount: `PERCENT` → `subtotal × value / 100`, capped by `max_discount`; `FIXED` → `value`; both clamped to `[0, subtotal]`.
- **No stacking (extends ADR-0012):** when an unpaid `Order`'s discount is auto-computed, `discount_amount = max(tierDiscount, voucherDiscount)`, and `orders.voucher_id` is set only when the voucher wins. A manual staff override at POS still takes precedence, unchanged. `OrderItem.unit_price` and `Booking.total_price` stay at catalog prices, so the `Commission Ledger` (ADR-0009) and P&L discount pro-rating (ADR-0010) are untouched.
- Booking wizard: `voucher_code` is validated via a public validate endpoint (with branch + current subtotal) for UX feedback, and stored on the booking. It is **not** applied to `deposit_amount`.
- POS: when an `Order` is created from a checked-in booking, the booking's `voucher_code` is pre-applied if still valid; an invalid one is dropped with a notice. The cashier can apply or remove a code on an unpaid order.
- Redemption happens inside the existing unified settlement transaction when the `Order` transitions to `PAID`: lock the voucher row pessimistically (same pattern as the customer `credit_balance` lock), re-run the validator, increment `used_count`, insert `voucher_redemptions` (the UNIQUE `order_id` guards against double counting). If the voucher is no longer valid → `VOUCHER_NO_LONGER_VALID`, settlement rolls back, and the cashier removes the code and retries.
- API:
  - `POST/PUT/GET /api/v1/admin/vouchers` (ADMIN write; ADMIN + MANAGER read, MANAGER filtered to their branch).
  - `PATCH /api/v1/admin/vouchers/{id}/active`.
  - `POST /api/v1/vouchers/validate` (public: `{ code, branchId, subtotal, phone? }` → discount preview or error code).
  - POS apply/remove voucher on an unpaid order.

### Frontend

- Booking wizard: optional email field and voucher code input with validate feedback, both in the existing confirm step. Zod schema additions go in the existing booking schema file.
- Customer portal + booking lookup: a "Reschedule" action that opens a dialog reusing the existing slot picker and stylist selector components, with error-code-to-message mapping for every rejection reason and 429.
- POS order drawer: voucher input/remove in the checkout tab; the discount line shows whether the tier or the voucher won.
- Admin: a vouchers page (table + form dialog) under the admin layout, minimalist-ui style. Query keys and mutations live in custom hooks; columns and options in `*.constants`.

### CI

- `.github/workflows/ci.yml` on push + pull_request with two jobs:
  - backend: Temurin JDK 25, Maven cache, `mvn -B verify`. Tests already run on H2, so no MySQL/Redis services are needed.
  - frontend: Node LTS, npm cache, `npm ci`, `npm test`, `npm run build`. The frontend has no `lint` script, so lint is not part of CI.

### Documentation

- ADR-0015: reminders via after-commit async events, reschedule lock-new-then-release-old, non-stacking vouchers with redemption at `PAID`, and the Redis fixed-window rate limit.
- `GLOSSARY.md`: add **Voucher**, **Voucher Redemption**, **Reschedule**, **Booking Reminder**.

## Testing Decisions

- Good tests here drive the public HTTP API or the scheduler entry point and assert observable outcomes: response codes/error codes, persisted booking/order/voucher state, Redis keys, captured outgoing emails, broadcast STOMP messages. They do not assert which private helper was called.
- **Seams (highest available, existing first):**
  1. **HTTP API via MockMvc integration tests** (existing seam: `BookingIntegrationTest`, `CustomerCrmIntegrationTest`, `PosControllerIntegrationTest`): reschedule (portal + guest), lookup rate limit, voucher admin CRUD, validate, POS apply + checkout redemption.
  2. **`NotificationSender` (new seam, the only new one):** replaced with a recording fake in tests, so tests assert "a confirmation/reminder/reschedule email to X with booking code Y was sent" without SMTP. The realtime side reuses the existing approach from `RealtimeBookingNotificationIntegrationTest`.
  3. **Reminder scheduler** invoked directly, as `BookingExpirationSchedulerTest` does, with bookings placed inside/outside the 23-24h window, already-flagged, cancelled; then invoked twice to prove no duplicate.
- Required cases:
  - Reschedule: happy path keeps deposit and frees old slot keys / holds new ones; < 2h rejected; second reschedule rejected; non-`CONFIRMED` rejected; new slot taken → original booking and its locks unchanged; off-shift stylist rejected; guest with wrong phone/code rejected; 6th attempt in window → 429.
  - Vouchers: each validator rejection code; percent cap and clamp to subtotal; tier vs voucher picks the larger and never sums; commission ledger amounts identical with and without voucher; redemption counted only on `PAID`; concurrent checkout of the last usage → exactly one succeeds (prior art: `PosConcurrencyIntegrationTest`); per-customer limit; branch restriction.
  - Email: confirmation sent on deposit webhook and on `Retained Deposit`-covered booking; recipient resolution order (user email → booking email → none); a sender that throws does not fail booking creation.
- Domain unit tests for `Booking.reschedule` rules and the voucher discount calculation (prior art: `OrderAndInventoryDomainDeepeningTest`).
- Frontend: vitest for the reschedule error-message mapping and the tier-vs-voucher display logic (prior art: `pos-calculations.test.js`, `membership-tier.test.js`).
- `FlywayMigrationTest` must pass with `V10`.

## Out of Scope

- SMS / Zalo ZNS / push notifications (the seam exists; no provider).
- A 2h reminder or configurable reminder schedule.
- Rescheduling to another branch or changing services (that would change `total_price`/`Deposit` and require PayOS top-up/refund).
- Applying vouchers to the `Deposit`.
- Stacking vouchers with membership discounts or with each other; multiple vouchers per order.
- Service-specific, tier-specific or first-visit-only vouchers; auto-generated personal vouchers and win-back campaigns (candidate next phase).
- Prepaid service packages / gift cards (candidate separate phase, touches deferred revenue and commission).
- Deployment, Docker image publishing, and frontend linting setup in CI.
- Changing the existing cancel policy or `Retained Deposit` behaviour.

## Further Notes

- Suggested issue order: (1) CI → (2) notification infrastructure + confirmation + 24h reminder → (3) self-service reschedule + rate limit (reuses (2) for the rescheduled email) → (4) vouchers (independent). Each is a vertical slice: backend + frontend + tests.
- `V10` can be split across issues as `V10`, `V11`, … if issues land separately. Keep one migration per issue rather than editing a merged migration.
- The 23-24h reminder window plus a 5-minute schedule means reminders arrive 23-24h ahead, not exactly 24h. That is intended.
