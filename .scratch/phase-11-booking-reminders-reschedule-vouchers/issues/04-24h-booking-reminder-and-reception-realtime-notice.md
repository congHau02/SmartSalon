# 04: 24h Booking Reminder Email & Branch Reception Realtime Notice

**What to build:** About a day before their appointment, a customer with a resolvable email receives exactly one reminder email, and the branch reception sees an "upcoming customer" notice in the admin/POS notification bell over the existing per-branch STOMP topic. A scheduler running every 5 minutes (alongside the existing booking expiration scheduler) picks `CONFIRMED` bookings whose `booking_time` is between now+23h and now+24h and that have not been reminded, stamps `reminder_sent_at` in the same transaction, then publishes `BookingReminderDueEvent` handled after commit by the ticket-03 notification listener. Bookings made less than 23h ahead, and cancelled/expired bookings, are never reminded; restarts never resend. See the spec (`../spec.md`, "Reminder scheduler").

**Blocked by:** 03 (Booking Confirmation Email via Notification Sender)

**Status:** closed

- [x] New Flyway migration (next free version) adds nullable `reminder_sent_at` to `bookings`.
- [x] Scheduler selects only `CONFIRMED`, unreminded bookings inside the 23-24h window, stamps `reminder_sent_at`, and publishes the event.
- [x] Reminder email (Vietnamese HTML, same template family as confirmation) is sent via `NotificationSender`; no email when no recipient resolves, but the realtime notice is still sent.
- [x] A new realtime event type for the reminder is broadcast only to the booking's branch topic via the existing realtime notification service; the frontend realtime layer renders it in the notification bell/toast.
- [x] Scheduler test (prior art: the booking expiration scheduler test) covers: inside window → one email + one broadcast; outside window, already reminded, cancelled → nothing; invoking twice → no duplicate.
- [x] ADR-0015 / `GLOSSARY.md` gain **Booking Reminder**.
