# 08: Voucher Code in the Booking Wizard & Auto-Apply at POS Check-In

**What to build:** While booking, a customer can enter a voucher code in the confirm step and immediately see whether it is valid and roughly how much it saves (validated against branch and current subtotal through a public validate endpoint). The code is stored on the `Booking` only — it does **not** reduce the 20% `Deposit` or the VietQR amount, and it consumes no usage. When the booking is checked in and its POS `Order` is created, the stored code is pre-applied through the ticket-07 apply path if still valid; if not, it is dropped and the cashier sees a notice with the reason. Redemption still happens only at `PAID` (ticket 07). See the spec (`../spec.md`, "Vouchers").

**Blocked by:** 07 (Vouchers — Admin Management, POS Apply & Redemption on PAID)

**Status:** done

- [x] New Flyway migration (next free version) adds nullable `voucher_code` to `bookings`.
- [x] `POST /api/v1/vouchers/validate` (public) with `{ code, branchId, subtotal, phone? }` returns a discount preview or the validator error code; rate limiting is not required (no secret is guessed), note this in `## Comments` if you disagree.
- [x] Booking create accepts an optional `voucherCode`; it is re-validated on create (invalid → rejected with the error code) but `deposit_amount` is unchanged.
- [x] Order creation from a checked-in booking pre-applies the stored code when valid; otherwise it is skipped and the POS shows the reason.
- [x] Booking wizard confirm step: voucher input with validate feedback (Zod schema in the existing booking schema file); the deposit/QR amounts visibly stay unchanged.
- [x] MockMvc tests: booking with valid code stores it and deposit is unchanged; invalid code rejected; check-in pre-applies a valid code; an expired-since-booking code is dropped; no redemption row until `PAID`.
