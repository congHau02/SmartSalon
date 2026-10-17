# Issue 07: Admin Booking Management Portal (`/admin/bookings`) & End-to-End Verification

Status: resolved
Blocked by: 04, 06

## Description

Build the Admin/Manager/Staff Booking Management page (`/admin/bookings`) inside the Admin Portal to view, filter (by branch, date, status, search query), confirm, check in, or cancel customer bookings, and run the full backend (`mvn test`) and frontend (`npm run lint`, `npm run build`) verification suite.

## Tasks

- [x] Add "Quản lý Lịch hẹn" (`/admin/bookings`) to `src/lib/navigation.js` and `src/App.jsx`.
- [x] Build `AdminBookingsPage.jsx` with summary metric cards (Tổng lịch hẹn, Đang giữ chỗ QR, Đã xác nhận cọc, Đã hoàn thành/Hủy), branch & date/status filter bar, and booking management table.
- [x] Allow Admin/Manager/Staff to update booking status (`CONFIRMED`, `CHECKED_IN`, `CANCELLED`, `NO_SHOW`) or simulate deposit confirmation directly.
- [x] Run backend unit & integration tests (`mvn test`) and verify 100% pass rate.
- [x] Run frontend lint & production build (`npm run lint`, `npm run build`) and verify zero errors.

## Comments

- Implemented `AdminBookingsPage.jsx` with summary metrics, comprehensive filter bar (branch, status, date, search), status transitions, Sandbox one-click PayOS simulation, and electronic booking ticket preview modal.
- Configured `/admin/bookings` route in `App.jsx` under `AdminLayout` and added "Quản lý Lịch hẹn" to `ADMIN_NAV_GROUPS` in `navigation.js`.
- Frontend production build succeeded with 0 errors via Vite in 1.15s.
- Backend test suite passed 100% across all 68 tests (0 failures, 0 errors, 0 skipped).
- Phase 3 Smart Booking, Redis Lock & PayOS Deposit complete.

