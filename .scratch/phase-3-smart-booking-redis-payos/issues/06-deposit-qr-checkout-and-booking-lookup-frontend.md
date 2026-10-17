# Issue 06: Deposit QR Checkout (Step 4), 5-Minute Countdown & Customer Booking Lookup

Status: resolved
Blocked by: 04, 05

## Description

Build Step 4 of the Booking Wizard (`DepositQrStep.jsx`) featuring the dynamic VietQR / PayOS QR code, real-time 5-minute (`05:00`) countdown timer synced with `slotLockExpiresAt`, automatic TanStack Query polling (`refetchInterval: 2500`), one-click Sandbox payment simulation button, Confirmed Electronic Booking Ticket (`CONFIRMED`), and the Customer Booking Lookup view (`BookingLookupSection.jsx`) plus Public Services Price List page (`/customer/services`).

## Tasks

- [x] Build `DepositQrStep.jsx` (Step 4):
  - Render dynamic VietQR image, transfer details (amount, booking code, bank info), and live `mm:ss` countdown timer from `slotLockExpiresAt`.
  - Poll `GET /api/v1/bookings/code/{bookingCode}` every 2.5s while status is `PENDING_PAYMENT`.
  - Provide "Giả lập thanh toán thành công (Sandbox)" button calling `POST /api/v1/webhooks/payos/simulate/{bookingCode}` with instant query invalidation.
  - Render Confirmed Electronic Booking Ticket when `status === 'CONFIRMED'` or Expiration Retry screen when `status === 'EXPIRED'`.
- [x] Build `BookingLookupModal.jsx` / tab on `/customer/booking` allowing customers to search their bookings by Phone Number or Booking Code (`BK-...`).
- [x] Replace the `/customer/services` placeholder with a rich public Service Catalog & Price List view with direct "Đặt lịch ngay" action pre-selecting the service in the Wizard.

## Comments

- Step 4 (`DepositQrStep.jsx`) integrates live 5-minute countdown synced with `slotLockExpiresAt`, clipboard copy feedback, one-click sandbox simulation, and fallback for expired or non-existent holds.
- `ConfirmedTicket.jsx` provides an elegant perforated salon boarding ticket with full financial breakdown (20% deposit paid, 80% balance due at salon) and print/PDF support.
- `BookingLookupModal.jsx` provides instant search by Phone number or `BK-...` code, status badges, and direct navigation to ticket or QR payment.
- Integrated `serviceId` deep-linking from `/customer/services` directly into Step 1 of Booking Wizard.
- Frontend builds cleanly in Vite (`npm run build`).

