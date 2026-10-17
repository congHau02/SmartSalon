# Issue 04: PayOS VietQR Deposit Generation, Webhook Verification & Sandbox Simulation

Status: ready-for-agent
Blocked by: 03

## Description

Implement `PaymentTransactionEntity`, `PaymentTransactionRepository`, `PayOSService` (using Spring 7 `RestClient` with automatic VietQR sandbox fallback), and `PayOSWebhookController` (`POST /api/v1/webhooks/payos` and `POST /api/v1/webhooks/payos/simulate/{bookingCode}`) to process 20% deposit payments, verify `HMAC-SHA256` signatures, record immutable payment audit logs, and transition bookings from `PENDING_PAYMENT` to `CONFIRMED`.

## Tasks

- [ ] Create `PaymentTransactionEntity` and `PaymentTransactionRepository` mapped to `payment_transactions`.
- [ ] Add `app.payos` properties to `application.yml` (`client-id`, `api-key`, `checksum-key`, `bank-id`, `account-no`, `account-name`).
- [ ] Implement `PayOSService` using `RestClient` to generate PayOS payment links when credentials are configured, or deterministic VietQR dynamic image URLs + QR payloads when in sandbox/local mode.
- [ ] Implement `HMAC-SHA256` signature verification for incoming PayOS webhook payloads.
- [ ] Implement `PayOSWebhookController`:
  - `POST /api/v1/webhooks/payos` for PayOS webhook callbacks.
  - `POST /api/v1/webhooks/payos/simulate/{bookingCode}` for one-click Sandbox payment confirmation on the UI.
- [ ] Write integration tests verifying deposit QR generation, HMAC verification, and booking transition from `PENDING_PAYMENT` to `CONFIRMED`.

## Comments

