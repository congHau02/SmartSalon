# Issue 05: Customer Multi-Step Booking Wizard (Steps 1–3) on React 19

Status: ready-for-agent
Blocked by: 02, 03

## Description

Build the customer-facing Multi-Step Booking Wizard (`/customer/booking` and `/booking`) on React 19 + TanStack Query v5 + Tailwind CSS v4 following `ui-ux-pro-max` guidelines, covering Step 1 (Branch & Multi-Service Selection), Step 2 (Stylist & Real-Time Slot Picker), and Step 3 (Customer Info & 5-Minute Slot Hold). Also fix navigation routes in `CustomerLayout.jsx` and `App.jsx`.

## Tasks

- [ ] Create `src/features/booking/bookingApi.js` and TanStack Query v5 hooks in `src/features/booking/useBooking.js` (`useBookingStylists`, `useAvailableSlots`, `useCreateBooking`, `useBookingDetail`, `useLookupBookings`, `useSimulateDepositWebhook`).
- [ ] Fix routing in `App.jsx` and `CustomerLayout.jsx` so `/customer/booking`, `/customer/services`, and `/booking` navigate seamlessly.
- [ ] Build Step 1 (`BranchAndServiceStep.jsx`): Branch selector cards, category filter pills, multi-service selection cards with duration/price badges, and sticky summary bar showing total duration, total price, and 20% deposit.
- [ ] Build Step 2 (`StylistAndSlotStep.jsx`): Stylist selector cards including "Bất kỳ Stylist nào còn trống (Tự động phân bổ)", date picker strip, and `SlotPicker` grid grouped by Morning / Afternoon / Evening with visual states (`AVAILABLE`, `LOCKED`, `BOOKED`, `PAST`).
- [ ] Build Step 3 (`CustomerConfirmStep.jsx`): Auto-fills name/phone when logged in or validates Guest Name + Vietnamese Phone Number via React Hook Form + Zod, displays full booking breakdown, and submits `useCreateBooking()` to lock the slot for 5 minutes.

## Comments

