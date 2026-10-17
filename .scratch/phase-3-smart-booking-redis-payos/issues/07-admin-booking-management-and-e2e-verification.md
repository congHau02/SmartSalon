# Issue 07: Admin Booking Management Portal (`/admin/bookings`) & End-to-End Verification

Status: ready-for-agent
Blocked by: 04, 06

## Description

Build the Admin/Manager/Staff Booking Management page (`/admin/bookings`) inside the Admin Portal to view, filter (by branch, date, status, search query), confirm, check in, or cancel customer bookings, and run the full backend (`mvn test`) and frontend (`npm run lint`, `npm run build`) verification suite.

## Tasks

- [ ] Add "Quản lý Lịch hẹn" (`/admin/bookings`) to `src/lib/navigation.js` and `src/App.jsx`.
- [ ] Build `AdminBookingsPage.jsx` with summary metric cards (Tổng lịch hẹn, Đang giữ chỗ QR, Đã xác nhận cọc, Đã hoàn thành/Hủy), branch & date/status filter bar, and booking management table.
- [ ] Allow Admin/Manager/Staff to update booking status (`CONFIRMED`, `CHECKED_IN`, `CANCELLED`, `NO_SHOW`) or simulate deposit confirmation directly.
- [ ] Run backend unit & integration tests (`mvn test`) and verify 100% pass rate.
- [ ] Run frontend lint & production build (`npm run lint`, `npm run build`) and verify zero errors.

## Comments

