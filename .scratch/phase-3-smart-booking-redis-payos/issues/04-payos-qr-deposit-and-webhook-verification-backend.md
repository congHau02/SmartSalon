# Issue 04: PayOS VietQR Deposit Generation, Webhook Verification & Sandbox Simulation

Status: resolved
Blocked by: 03

## Description

Implement `PaymentTransactionEntity`, `PaymentTransactionRepository`, `PayOSService` (using Spring 7 `RestClient` with automatic VietQR sandbox fallback), and `PayOSWebhookController` (`POST /api/v1/webhooks/payos` and `POST /api/v1/webhooks/payos/simulate/{bookingCode}`) to process 20% deposit payments, verify `HMAC-SHA256` signatures, record immutable payment audit logs, and transition bookings from `PENDING_PAYMENT` to `CONFIRMED`.

## Tasks

- [x] Create `PaymentTransactionEntity` and `PaymentTransactionRepository` mapped to `payment_transactions`.
- [x] Add `app.payos` properties to `application.yml` (`client-id`, `api-key`, `checksum-key`, `bank-id`, `account-no`, `account-name`).
- [x] Implement `PayOSService` using `RestClient` to generate PayOS payment links when credentials are configured, or deterministic VietQR dynamic image URLs + QR payloads when in sandbox/local mode.
- [x] Implement `HMAC-SHA256` signature verification for incoming PayOS webhook payloads.
- [x] Implement `PayOSWebhookController`:
  - `POST /api/v1/webhooks/payos` for PayOS webhook callbacks.
  - `POST /api/v1/webhooks/payos/simulate/{bookingCode}` for one-click Sandbox payment confirmation on the UI.
- [x] Write integration tests verifying deposit QR generation, HMAC verification, and booking transition from `PENDING_PAYMENT` to `CONFIRMED`.

## Comments

- Implemented `PaymentTransactionEntity` (standalone entity mapping to `payment_transactions` with `booking_id` FK and `order_id` nullable FK).
- Configured `app.payos` properties with customizable environment variables and MB bank defaults.
- Implemented `PayOSServiceImpl` with RestClient support, resilient VietQR dynamic image generation fallback, HMAC-SHA256 data signing/verification, and one-click Sandbox simulation.
- Exposed `/api/v1/webhooks/payos`, `/api/v1/webhooks/payos/simulate/{bookingCode}`, `/api/v1/webhooks/payos/payment-info/{bookingCode}`, and `/api/v1/bookings/{code}/payment-info`.
- Added comprehensive unit test suite `PayOSServiceTest` (7 tests) and MockMvc integration suite `PayOSWebhookIntegrationTest` (3 tests).
- 68/68 backend tests passing.


