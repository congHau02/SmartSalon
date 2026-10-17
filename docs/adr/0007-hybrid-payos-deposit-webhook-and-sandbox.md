# 0007 Hybrid PayOS Deposit Gateway and Sandbox Simulation Seam

We designed the deposit payment module around Spring 7's `RestClient` for live PayOS integration with `HMAC-SHA256` webhook verification, backed by an automatic VietQR sandbox fallback and simulation endpoint for local and CI environments.

## Context

Confirming a `Booking` requires a 20% upfront `Deposit` within the 5-minute `Slot Lock` window via PayOS VietQR. However, developers and automated integration suites frequently run without live merchant credentials (`client-id`, `api-key`, `checksum-key`) or public webhook tunnels, which would otherwise block end-to-end verification of the `PENDING_PAYMENT -> CONFIRMED` state machine.

## Decision

1. **20% Deposit Calculation & Immutable Audit**:
   - Creating a booking snapshots selected service prices, computes `deposit_amount = round(total_price * 0.20)`, and creates a `PENDING` record in `payment_transactions` with a unique `transaction_code`.
2. **Hybrid PayOS Provider**:
   - When PayOS credentials are configured, `PayOSService` invokes the PayOS v2 payment-requests endpoint via `RestClient` and validates incoming webhooks at `POST /api/v1/webhooks/payos` using `HMAC-SHA256` checksum verification.
   - When PayOS credentials are absent (sandbox/local mode), `PayOSService` deterministically generates a VietQR payload and payment URL so the checkout UI renders a scannable QR code and countdown timer identically to production.
3. **Sandbox Webhook Simulation Endpoint**:
   - Expose `POST /api/v1/webhooks/payos/simulate/{bookingCode}` (enabled in local/sandbox configuration) that feeds a canonical webhook payload through the exact same transactional state transition (`payment_transactions.status = SUCCESS`, `bookings.status = CONFIRMED`, `bookings.deposit_status = PAID`) as a live PayOS callback.

## Consequences

- Production deployments enforce cryptographic `HMAC-SHA256` webhook authenticity before confirming bookings.
- Developers, reviewers, and E2E tests can verify the complete 5-minute countdown, QR rendering, and instant booking confirmation flow without external merchant secrets.
