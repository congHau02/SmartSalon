# 06: Guest Reschedule from the Booking Lookup Page

**What to build:** A guest who found their booking on the public lookup page (phone + `booking_code`) can click **"Dời lịch"** and reschedule it exactly like a logged-in customer, using the same dialog and the same reschedule service from ticket 05. The public endpoint authenticates by matching phone + booking code exactly as lookup does, and is rate limited with the ticket-02 limiter (5 attempts / 10 minutes per IP + phone, `429` + `TOO_MANY_REQUESTS`). See the spec (`../spec.md`, "Reschedule" and "Rate limiting").

**Blocked by:** 02 (Redis Fixed-Window Rate Limit), 05 (Logged-In Customer Self-Service Reschedule)

**Status:** closed

- [x] `POST /api/v1/bookings/reschedule` (public) with body `{ phone, bookingCode, newBookingTime, stylistId? }` delegates to the ticket-05 reschedule service; a phone/code mismatch returns the same not-found error as lookup (no information leak about which part was wrong).
- [x] Endpoint is rate limited via the ticket-02 component.
- [x] Booking lookup page shows "Dời lịch" on eligible bookings and reuses the ticket-05 dialog and error mapping, including `429`.
- [x] MockMvc integration tests: guest happy path; wrong phone or code → rejected; 6th attempt → `429`; all ticket-05 rules still enforced through this entry point (at least one rule case).
