# 0014 Shift Roster, 60-Minute Overtime Slot Window, POS PIN Attendance & Shift-Prorated Payroll

We replaced the static full-day stylist availability assumption (`08:30–20:30` daily) with a branch-scoped `Shift Template` and `Shift Roster` engine, a 60-minute `Overtime Slot Window` for long chemical services, 1-touch POS PIN `Staff Attendance` with real-time STOMP presence broadcasting, a `1.2x` `Overtime Commission Multiplier` in the `Commission Ledger`, and `Shift-Prorated Base Salary` accounting across staff payroll and Tier-2 Executive P&L.

## Context

Prior to Phase 10, `SlotCalculationServiceImpl` and `BookingServiceImpl` assumed every active stylist at a branch worked continuously from `08:30` to `20:30` every day. In real multi-shift salon operations (`Ca Sáng 08:30–15:00`, `Ca Chiều 14:00–20:30`, `Ca Cả ngày 08:30–20:30`, and scheduled days off), this created four operational hazards:
1. Customers could book a stylist on their day off or outside their shift, and Least-Workload auto-assignment (`stylistId == null`) routed bookings to off-duty or absent stylists.
2. Multi-hour chemical services (e.g., 150-minute bleaching/perm) starting in the last hour of a morning shift (`13:30`) either had to be blocked entirely—wasting productive chair hours—or allowed without a hard overtime cap or fair overtime compensation for the stylist staying late.
3. Salon managers changing a stylist's shift had no automated guard against stranding existing `CONFIRMED` customer bookings.
4. Monthly `Base Salary` in `/api/v1/analytics/staff-payroll`, `/api/v1/analytics/my-payroll`, and Tier-2 Executive P&L (`/api/v1/analytics/pnl`) was treated as a static lump sum regardless of actual shift attendance or extra shifts covered for colleagues.

## Decision

1. **Branch `Shift Template` & `Shift Roster` with Booking Conflict Protection**:
   - Store reusable branch shift definitions in `shift_templates` (seeded with `MORNING` `08:30–15:00`, `AFTERNOON` `14:00–20:30`, and `FULL_DAY` `08:30–20:30`) and daily assignments in `staff_schedules` (`WORKING` vs. `OFF`).
   - If a Manager or Admin attempts to change or cancel (`OFF`) a stylist's `Shift Roster` entry when active `CONFIRMED` or `PENDING_PAYMENT` bookings for that stylist fall outside the new shift boundary, the backend rejects the update (`HTTP 409 Conflict`) and returns the list of conflicting bookings so the Manager can reassign them on the POS `Dispatch Board` first.
2. **Strict Shift Start Filtering & 60-Minute `Overtime Slot Window` in Booking Engine**:
   - Batch-load `staff_schedules` and `staff_attendances` for the target branch and date *outside* the 30-minute slot evaluation loop in `SlotCalculationServiceImpl` to preserve $O(1)$ database query overhead (`ADR-0011`).
   - A `Slot` is valid for a stylist only when:
     - The stylist has an active `WORKING` `Shift Roster` entry on that date and is not marked `ABSENT` or `ON_BREAK` (for today's current slots),
     - `slot.startTime >= shift.startTime` and `slot.startTime < shift.endTime`, and
     - `slot.endTime` (`slot.startTime + totalDuration`) does not exceed `min(branchClosingTime 20:30, shift.endTime + 60 minutes)` (`Overtime Slot Window`).
   - Least-Workload auto-assignment (`stylistId == null`) evaluates only stylists who satisfy both the shift window and real-time attendance availability.
3. **1-Touch POS PIN `Staff Attendance` & Real-Time Floor Presence**:
   - Add a 4-digit `attendance_pin` to `users` and track daily `clock_in_at`, `break_start_at`, `break_end_at`, `clock_out_at`, and `status` (`PRESENT`, `ON_BREAK`, `COMPLETED`, `ABSENT`) in `staff_attendances`.
   - Stylists can clock in, toggle break, and clock out in 1 touch at `/pos` via PIN verification (or receptionist/manager override), immediately broadcasting a STOMP WebSocket event to `/topic/branch/{branchId}/dispatch` so the `Dispatch Board` and walk-in assignment modals reflect live floor availability without page reloads.
4. **`1.2x` `Overtime Commission Multiplier` & `Shift-Prorated Base Salary`**:
   - During atomic POS order settlement (`UnifiedOrderSettlementHelper`), any `Service Step` executed by a stylist whose order completion/window extends past their scheduled `shift.endTime` (within the `Overtime Slot Window`) or occurs on an unscheduled extra shift receives an `Overtime Commission Multiplier` of `1.2x`, recorded in `commission_ledger` with an explicit audit formula note (`OT 1.2x`).
   - Both `Personal Payroll Statement` (`GET /api/v1/analytics/my-payroll`), branch `Staff Payroll` (`GET /api/v1/analytics/staff-payroll`), and Tier-2 Executive P&L (`GET /api/v1/analytics/pnl`) calculate `Shift-Prorated Base Salary` as:
     $$\text{Shift-Prorated Base Salary} = \text{Contract Base Salary} \times \frac{\text{Completed Valid Shifts}}{\max(1, \text{Total Scheduled Working Shifts})}$$
     (allowing $> 100\%$ proration when a stylist covers extra shifts beyond their scheduled roster), while preserving backward-compatible full `Base Salary` fallback for historical periods prior to shift schedule seeding.

## Consequences

- Online customers and POS receptionists can only book stylists who are actually scheduled to work, while salons maximize chair utilization in the last hour of a shift via the bounded 60-minute `Overtime Slot Window`.
- Stylists staying late for long chemical treatments are automatically compensated with a `1.2x` commission rate in the immutable `Commission Ledger`.
- Executive Tier-2 P&L and personal payroll statements reflect real attendance-backed labor costs without manual spreadsheet adjustments.
