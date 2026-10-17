# Issue 06: Deposit QR Checkout (Step 4), 5-Minute Countdown & Customer Booking Lookup

Status: ready-for-agent
Blocked by: 04, 05

## Description

Build Step 4 of the Booking Wizard (`DepositQrStep.jsx`) featuring the dynamic VietQR / PayOS QR code, real-time 5-minute (`05:00`) countdown timer synced with `slotLockExpiresAt`, automatic TanStack Query polling (`refetchInterval: 2500`), one-click Sandbox payment simulation button, Confirmed Electronic Booking Ticket (`CONFIRMED`), and the Customer Booking Lookup view (`BookingLookupSection.jsx`) plus Public Services Price List page (`/customer/services`).

## Tasks

- [ ] Build `DepositQrStep.jsx` (Step 4):
  - Render dynamic VietQR image, transfer details (amount, booking code, bank info), and live `mm:ss` countdown timer from `slotLockExpiresAt`.
  - Poll `GET /api/v1/bookings/code/{bookingCode}` every 2.5s while status is `PENDING_PAYMENT`.
  - Provide "Giả lập thanh toán thành công (Sandbox)" button calling `POST /api/v1/webhooks/payos/simulate/{bookingCode}` with instant query invalidation.
  - Render Confirmed Electronic Booking Ticket when `status === 'CONFIRMED'` or Expiration Retry screen when `status === 'EXPIRED'`.
- [ ] Build `BookingLookupModal.jsx` / tab on `/customer/booking` allowing customers to search their bookings by Phone Number or Booking Code (`BK-...`).
- [ ] Replace the `/customer/services` placeholder with a rich public Service Catalog & Price List view with direct "Đặt lịch ngay" action pre-selecting the service in the Wizard.

## Comments

