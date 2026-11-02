# 03: Booking Confirmation Email via Notification Sender, Optional Customer Email & Mailpit

**What to build:** A customer can optionally type an email in the booking wizard. When a `Booking` becomes `CONFIRMED` — whether through the PayOS deposit webhook / sandbox simulate or because `Retained Deposit` (`credit_balance`) fully covered the `Deposit` — the customer receives a Vietnamese HTML confirmation email (booking code, branch name/address, time, stylist, services, deposit status, lookup link). Developers see every email in Mailpit's web inbox from `docker-compose`. Email is sent after commit and asynchronously; an SMTP failure is only logged and never fails or rolls back the booking. Phone-only customers book exactly as before. See the spec (`../spec.md`, "Notifications module").

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] New Flyway migration (next free version) adds nullable `customer_email` to `bookings`; `FlywayMigrationTest` passes.
- [x] Booking create request accepts an optional, validated email; the booking wizard confirm step has an optional email field (Zod schema updated in the existing booking schema file).
- [x] `spring-boot-starter-mail` added; SMTP settings and the public frontend base URL come from configuration; Mailpit service (SMTP + web UI) added to `docker-compose`.
- [x] A `NotificationSender` seam with one email implementation; code carries `shortcut: email is the only channel, add SMS/Zalo behind the same seam when a paid provider is chosen`.
- [x] Recipient resolution lives in one place: registered user email → `booking.customer_email` → none (skip email).
- [x] `BookingConfirmedEvent` is published on both confirmation paths; a `@TransactionalEventListener(AFTER_COMMIT)` + `@Async` listener sends the email.
- [x] Integration tests with a recording fake `NotificationSender`: email sent on webhook confirmation and on credit-covered confirmation; recipient resolution order; a throwing sender does not fail booking creation/confirmation.
- [x] ADR-0015 records the after-commit async notification decision; `GLOSSARY.md` gains **Booking Confirmation** / notification terms as needed.
