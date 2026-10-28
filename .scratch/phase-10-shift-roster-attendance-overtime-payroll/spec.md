# Specification: Phase 10 - Stylist Shift Roster, 60-Minute Overtime Slot Engine, POS PIN Attendance & Shift-Prorated Payroll P&L

Status: ready-for-agent

## Problem Statement

While SmartSalon provides an enterprise POS `Dispatch Board`, `Quick Service Ticket` reconciliation, two-tier `Commission Ledger` accounting, and executive P&L analytics, four workforce scheduling and attendance gaps currently prevent accurate multi-shift operations across branches:

1. **Booking Engine Assumes All Stylists Work Full Days (08:30–20:30) Every Day**:
   - Available `Slot` calculation and `Booking` creation currently assume every active stylist at a branch is on duty from `08:30` to `20:30` seven days a week.
   - Customers can book a specific stylist on their day off or outside their assigned shift (`Ca Sáng 08:30–15:00` vs. `Ca Chiều 14:00–20:30`), and Least-Workload auto-assignment (`stylistId` omitted) assigns appointments to stylists who are off-duty or absent.
2. **Long Chemical Services Near Shift End Lack a Bounded Overtime Window & Fair Compensation**:
   - In daily salon operations, a customer frequently books a multi-hour chemical treatment (bleaching, perm, dyeing) during the last hour of a stylist's Morning Shift (e.g., starting at `14:00` on a `08:30–15:00` shift). Without a formal `Overtime Slot Window`, the salon either rejects all late-shift chemical bookings or allows unbounded overtime that exhausts stylists.
   - Furthermore, when a stylist stays past their scheduled shift end time (or comes in on an off day to cover a shift) to complete a customer's `Order`, the `Commission Ledger` currently pays only the standard commission rate with no `Overtime Commission Multiplier`.
3. **Shift Changes Risk Stranding Confirmed Customer Bookings & POS Lacks Live Attendance**:
   - Salon managers lack a visual weekly/monthly `Shift Roster` workspace to assign preset `Shift Templates` (`Ca Sáng`, `Ca Chiều`, `Ca Cả ngày`) or days off (`OFF`), and there is no automated conflict check preventing a manager from cancelling or narrowing a stylist's shift when `CONFIRMED` customer `Bookings` already exist in those hours.
   - On the POS floor, there is no fast 1-touch `Staff Attendance` mechanism (via a 4-digit personal PIN or receptionist/manager override) to track whether a scheduled stylist has clocked in (`PRESENT`), is on break (`ON_BREAK`), has clocked out (`COMPLETED`), or is `ABSENT`, nor live WebSocket updates to reflect floor status on the `Dispatch Board`.
4. **Monthly `Base Salary` in Payroll & Tier-2 P&L Ignores Shift Attendance & Extra Shift Coverage**:
   - Branch `Staff Payroll`, individual `Personal Payroll Statements`, and Executive Tier-2 P&L reports currently apply 100% of a staff member's contractual monthly `Base Salary` regardless of how many scheduled shifts they actually completed, whether they had unexcused absences, or whether they covered extra shifts for colleagues.

## Solution

Deliver an end-to-end Workforce Scheduling, 60-Minute Overtime Slot Engine, 1-Touch POS PIN Attendance, and Shift-Prorated Payroll system:

1. **Branch `Shift Template` & Weekly `Shift Roster` Workspace with Booking Conflict Protection**:
   - Provide reusable branch-level `Shift Templates` (seeded with `Ca Sáng 08:30–15:00` with a 60-minute `Overtime Slot Window`, `Ca Chiều 14:00–20:30`, and `Ca Cả ngày 08:30–20:30`) and a Weekly Matrix `Shift Roster` grid in the Admin Portal (including 1-click copy from the previous week).
   - Guard every `Shift Roster` change against active `Bookings` (`PENDING_PAYMENT`, `CONFIRMED`, `CHECKED_IN`, `IN_PROGRESS`): if changing a shift to `OFF` or to a narrower `Shift Template` would leave any existing `Booking` outside the new shift start window or beyond its `Overtime Slot Window`, block the update (`HTTP 409 Conflict`) and return the list of conflicting `Bookings` so the manager can reassign those appointments on the `Dispatch Board` first.
2. **Shift-Aware `Slot` Calculation Engine & 60-Minute `Overtime Slot Window`**:
   - Batch-load daily `Shift Roster` schedules and `Staff Attendance` records outside the 30-minute slot evaluation loop to preserve $O(1)$ database query overhead.
   - Enforce a two-part shift boundary for every candidate stylist:
     - **Strict Shift Start**: A `Slot` is valid only if `slot.startTime` falls within `[shift.startTime, shift.endTime)`.
     - **60-Minute `Overtime Slot Window`**: The service completion time (`slot.startTime + totalDuration`) may extend up to 60 minutes past `shift.endTime`, capped by the branch's `20:30` closing time (`slot.endTime <= min(20:30, shift.endTime + maxOvertimeMinutes)`).
   - Automatically exclude stylists who are scheduled `OFF` or marked `ABSENT` (or currently `ON_BREAK`) from both specific-stylist availability and Least-Workload auto-assignment.
3. **1-Touch POS PIN `Staff Attendance` & Real-Time Floor Presence**:
   - Equip each staff profile with a 4-digit attendance PIN (default `1234` for seeded staff) and provide a 1-touch POS PIN modal and status strip on the `Dispatch Board` and `Stylist Daily Worklog` to record **Clock-in**, **Break Toggle**, **Clock-out**, and manager **Absent** overrides.
   - Broadcast every `Staff Attendance` transition over STOMP WebSocket so all open POS screens and walk-in assignment drawers update live without page reloads.
4. **`1.2x` `Overtime Commission Multiplier` & `Shift-Prorated Base Salary` Accounting**:
   - During atomic POS `Order` settlement (both receptionist checkout and stylist `Quick Service Ticket`), any `Service Step` executed by a stylist whose service extends past their scheduled `shift.endTime` into the `Overtime Slot Window`—or is performed on an unscheduled/`OFF` extra cover day—automatically receives a `1.2x` `Overtime Commission Multiplier` in the `Commission Ledger` with an explicit `[OT 1.2x]` audit note.
   - Compute `Shift-Prorated Base Salary` across the `Personal Payroll Statement`, branch `Staff Payroll` report, and Executive Tier-2 P&L report by scaling contractual `Base Salary` by the ratio of completed valid shifts (including extra covered shifts) to total scheduled working shifts in the period.

## User Stories

1. As a salon manager, I want to view and configure preset `Shift Templates` (`Ca Sáng 08:30–15:00`, `Ca Chiều 14:00–20:30`, `Ca Cả ngày 08:30–20:30`) for my branch, so that staff scheduling follows standardized salon operating shifts.
2. As a salon manager, I want to view a 7-day weekly `Shift Roster` matrix showing all stylists and receptionists at my branch as rows and Monday–Sunday dates as columns, so that I can see shift coverage across the entire week at a glance.
3. As a salon manager, I want to click any cell in the weekly `Shift Roster` matrix to switch a staff member between `Ca Sáng`, `Ca Chiều`, `Ca Cả ngày`, and `Nghỉ (OFF)`, so that I can adjust daily shift assignments quickly.
4. As a salon manager, I want to click **"Sao chép lịch tuần trước"** to copy all `Shift Roster` assignments from the previous week into the currently viewed week, so that I do not have to re-enter recurring weekly schedules manually.
5. As a salon manager attempting to change a stylist's shift to `OFF` or `Ca Sáng` on a day when that stylist already has a `CONFIRMED` customer `Booking` at `16:00`, I want the system to block the save and display the conflicting `Booking` code, customer name, and time window, so that I can reassign the customer to another stylist before modifying the shift.
6. As a branch manager with access restricted to my own branch, I want `Shift Template` and `Shift Roster` mutations for other branches to be rejected with HTTP 403 Forbidden, so that multi-branch tenant isolation is preserved.
7. As a customer booking online for a specific stylist assigned to `Ca Sáng (08:30–15:00)`, I want all 30-minute `Slots` starting at `15:00` or later to be marked unavailable for that stylist, so that I cannot book an appointment starting after the stylist's shift ends.
8. As a customer booking a 90-minute chemical service at `14:00` with a stylist assigned to `Ca Sáng (08:30–15:00)`, I want the `14:00` `Slot` to be `AVAILABLE` because the `15:30` completion time falls within the 60-minute `Overtime Slot Window` (`<= 16:00`), so that I can still book productive late-shift appointments.
9. As a customer attempting to book a 150-minute service combo at `14:00` with a stylist assigned to `Ca Sáng (08:30–15:00)`, I want the `14:00` `Slot` to be unavailable because the `16:30` completion time exceeds the 60-minute `Overtime Slot Window` (`15:00 + 60m = 16:00`), so that the stylist is protected from excessive overtime.
10. As a customer booking a service with a stylist assigned to `Ca Chiều (14:00–20:30)` or `Ca Cả ngày (08:30–20:30)`, I want the service completion time to never exceed the branch's `20:30` closing time, so that salon closing hours are strictly respected.
11. As a customer selecting **"Tự động chọn Stylist (Least-Workload)"** during online booking, I want the booking engine to evaluate only stylists who have an active `WORKING` shift covering the requested `Slot` and `Overtime Slot Window` and who are not marked `ABSENT` or `ON_BREAK`, so that my appointment is never assigned to an off-duty or absent stylist.
12. As a customer booking an appointment for a far-future date where the branch manager has not yet published any `Shift Roster` rows for the branch, I want the booking engine to fall back gracefully to standard branch hours (`08:30–20:30`), so that advance bookings are not blocked before next month's roster is created.
13. As a stylist arriving for my shift, I want to click the attendance button on the POS workspace, select my name, and enter my 4-digit PIN to **Clock-in**, so that my status transitions to `PRESENT` (`Đang trực`) in under 3 seconds.
14. As a stylist stepping out for lunch, I want to enter my 4-digit PIN on the POS workspace to toggle **Tạm nghỉ (`ON_BREAK`)** and later **Tiếp tục làm việc (`PRESENT`)**, so that receptionists and the slot engine know not to assign immediate walk-in customers to my chair while I am on break.
15. As a stylist finishing my workday, I want to enter my 4-digit PIN on the POS workspace to **Clock-out (`COMPLETED`)**, automatically recording my `clockOutAt` timestamp and any overtime minutes worked past my scheduled `shift.endTime`, so that my daily shift attendance is completed for payroll.
16. As a stylist viewing my `Stylist Daily Worklog` on the POS workspace, I want to see my current week's personal `Shift Roster` schedule alongside a quick attendance button, so that I know my upcoming shifts and can clock in or out directly from my worklog.
17. As a receptionist or branch manager on the POS `Dispatch Board`, I want to see live shift and attendance status badges (`Ca Sáng`, `Ca Chiều`, `Cả ngày`, `OFF` + `Đang trực`, `Tạm nghỉ`, `Đã tan ca`, `Vắng mặt`) for every stylist and be able to update attendance or mark a stylist `ABSENT` without needing their PIN, so that floor dispatch stays accurate even if a stylist forgets to punch in.
18. As a receptionist with the POS `Dispatch Board` open on my counter screen, I want any `Staff Attendance` change made by a stylist on another tablet to appear immediately via WebSocket without refreshing the page, so that the floor view is always real-time.
19. As a stylist completing a customer `Order` (via POS checkout or `Quick Service Ticket`) that finishes past my scheduled `shift.endTime` within the `Overtime Slot Window`, I want the `Commission Ledger` entries for my `Service Steps` on that `Order` to automatically apply a `1.2x` `Overtime Commission Multiplier` with `[OT 1.2x]` in the ledger formula note, so that I am fairly compensated for working overtime.
20. As a stylist who comes in on my scheduled `OFF` day to cover an extra shift and completes customer `Orders`, I want my `Service Steps` on that extra shift to also receive the `1.2x` `Overtime Commission Multiplier` and count toward my completed shifts, so that covering for colleagues is rewarded in both commission and base pay.
21. As an employee viewing my `Personal Payroll Statement`, I want to see my `Scheduled Shifts`, `Completed Shifts`, `Extra Covered Shifts`, `Contract Base Salary`, `Shift-Prorated Base Salary`, and `Overtime Commission Total` (`OT 1.2x`), so that I can verify how my attendance and overtime affected my take-home pay.
22. As a salon manager or owner viewing the branch `Staff Payroll` table and the Executive Tier-2 P&L dashboard, I want staff base salary payouts and Tier-2 `totalBaseSalaries` expense to reflect each employee's `Shift-Prorated Base Salary` over the selected period, so that P&L net profit reflects true attendance-adjusted labor costs.
23. As a developer or evaluator running SmartSalon, I want the database migration to automatically seed preset `Shift Templates`, default 4-digit PINs (`1234`), and a rolling 60-day window of `Shift Roster` schedules and `Staff Attendance` records across both branches, so that booking, attendance, and payroll features work immediately out of the box.

## Implementation Decisions

### 1. Database Schema & Rolling Seed Data (Flyway V8)
- **User Attendance PIN**:
  - Add `attendance_pin VARCHAR(10) NOT NULL DEFAULT '1234'` to the users table.
- **Branch Shift Templates (`shift_templates`)**:
  - Store `branch_id`, `code` (`MORNING`, `AFTERNOON`, `FULL_DAY`), `name`, `start_time`, `end_time`, `max_overtime_minutes` (default `60` for `MORNING`, `0` where `end_time` already reaches `20:30` closing time), and `is_active`.
  - Seed the 3 preset templates (`Ca Sáng 08:30–15:00`, `Ca Chiều 14:00–20:30`, `Ca Cả ngày 08:30–20:30`) for both active branches.
- **Staff Shift Roster (`staff_schedules`)**:
  - Store `branch_id`, `user_id`, `shift_template_id` (nullable when status is `OFF`), `schedule_date`, `status` (`WORKING` or `OFF`), and `notes`, with a unique constraint on `(user_id, schedule_date)` and an index on `(branch_id, schedule_date)`.
  - Seed a rolling schedule window (`CURDATE() - INTERVAL 30 DAY` through `CURDATE() + INTERVAL 30 DAY`) for all seeded stylists and staff across both branches so both current-day booking/POS tests and current-month payroll calculations have realistic shift rosters out of the box.
- **Staff Attendance (`staff_attendances`)**:
  - Store `branch_id`, `user_id`, `schedule_id`, `attendance_date`, `clock_in_at`, `break_start_at`, `break_end_at`, `clock_out_at`, `status` (`PRESENT`, `ON_BREAK`, `COMPLETED`, `ABSENT`), `overtime_minutes`, and `notes`, with a unique constraint on `(user_id, attendance_date)` and an index on `(branch_id, attendance_date)`.
  - Seed completed attendance records for past working days in the rolling window and `PRESENT` status for today's scheduled stylists.

### 2. Shift Roster Management & Booking Conflict Guard Contract
- **Shift Template & Roster Endpoints**:
  - `GET /api/v1/shifts/templates?branchId={id}` and `POST` / `PUT /api/v1/shifts/templates` (`ADMIN`, `MANAGER` with branch isolation).
  - `GET /api/v1/shifts/roster?branchId={id}&startDate={date}&endDate={date}` returning the branch's staff list and their daily schedule + attendance cells for the requested date window.
  - `PUT /api/v1/shifts/roster` (`ADMIN`, `MANAGER`) accepting a batch of cell updates (`userId`, `scheduleDate`, `status`, `shiftTemplateId`, `notes`).
  - `POST /api/v1/shifts/roster/copy-week` (`ADMIN`, `MANAGER`) copying all `staff_schedules` from `sourceStartDate` (7 days) to `targetStartDate` (7 days) for the specified branch.
- **Booking Conflict Guard**:
  - When `PUT /api/v1/shifts/roster` modifies or sets `OFF` on a `(userId, scheduleDate)` cell, query active `Bookings` (`PENDING_PAYMENT`, `CONFIRMED`, `CHECKED_IN`, `IN_PROGRESS`) assigned to `userId` on `scheduleDate`.
  - If the new schedule is `OFF`, or if any active booking has `startTime < newShift.startTime`, `startTime >= newShift.endTime`, or `endTime > min(20:30, newShift.endTime + newShift.maxOvertimeMinutes)`, abort the transaction with `HTTP 409 Conflict` (`ErrorCode.SHIFT_BOOKING_CONFLICT`) and return the conflicting bookings (`bookingCode`, `customerName`, `startTime`, `endTime`) in the error message/payload.

### 3. Shift-Aware Slot Calculation & 60-Minute Overtime Window
- **Batch Loading for $O(1)$ Slot Evaluation**:
  - In the slot calculation and booking stylist resolution services, load all `staff_schedules` and `staff_attendances` for `(branchId, date)` in two single batch queries before iterating across the 30-minute time slots.
  - If a branch has zero `staff_schedules` rows across all staff on a far-future date (meaning the manager has not published that future week's roster yet), treat active stylists as defaulting to full-day operating hours (`08:30–20:30`). Once any schedule row exists for that stylist or date, enforce the explicit schedule strictly.
- **Slot & Overtime Eligibility Rules**:
  - A stylist is eligible for a requested `[slotStartTime, slotEndTime]` window on `date` if and only if:
    1. Their schedule status is `WORKING` with an active `Shift Template`.
    2. `slotStartTime >= shift.startTime` and `slotStartTime < shift.endTime`.
    3. `slotEndTime <= min(20:30, shift.endTime + shift.maxOvertimeMinutes)`.
    4. If `date` is today (`LocalDate.now()`), their `Staff Attendance` is not `ABSENT`, and is not `ON_BREAK` during a slot starting within the next 60 minutes.

### 4. 1-Touch POS PIN Attendance & Real-Time Dispatch Sync
- **POS Attendance Endpoints**:
  - `GET /api/v1/pos/attendance/today?branchId={id}` (`ADMIN`, `MANAGER`, `STAFF`, `STYLIST`) returning each branch staff member's today shift template, live attendance status, timestamps, and accumulated overtime minutes.
  - `POST /api/v1/pos/attendance/action` (`ADMIN`, `MANAGER`, `STAFF`, `STYLIST`) accepting `branchId`, `userId`, `action` (`CLOCK_IN`, `TOGGLE_BREAK`, `CLOCK_OUT`, `MARK_ABSENT`), and `pin`.
  - When a `STYLIST` triggers an attendance action (or anyone uses the quick PIN pad), validate `pin` against the target user's `attendance_pin` (returning `HTTP 400 Bad Request` / `INVALID_ATTENDANCE_PIN` on mismatch). `ADMIN`, `MANAGER`, and `STAFF` may also perform administrative overrides (`overridePin = true`) for their branch.
  - On `CLOCK_OUT`, if the stylist has a scheduled `Shift Template` and `clockOutAt.toLocalTime() > shift.endTime`, compute and store `overtimeMinutes`.
  - Broadcast a real-time STOMP WebSocket notification to `/topic/branch/{branchId}/dispatch` on every attendance state transition.

### 5. `1.2x` Overtime Commission Multiplier & Shift-Prorated Base Salary
- **Overtime Commission Multiplier (`1.2x`)**:
  - During atomic POS `Order` settlement, inspect each `Service Step` assignment's stylist schedule on the settlement date.
  - Apply `OVERTIME_COMMISSION_MULTIPLIER = 1.20` to the step's effective commission rate if:
    - The stylist's schedule on that date is `OFF` (covering an extra unscheduled shift), OR
    - The order's completion time (`settledAt`) or linked booking's scheduled `endTime` extends past `shift.endTime` (or started before `shift.startTime`).
  - Record `[OT 1.2x]` in the `Commission Ledger` entry's `notes` field alongside the commission split formula.
- **Shift-Prorated Base Salary Formula**:
  - Over a payroll/analytics period `[startDate, endDate]`:
    - `scheduledShiftCount`: count of `WORKING` `staff_schedules` rows for that staff member in `[startDate, endDate]`.
    - `completedShiftCount`: count of distinct dates in `[startDate, endDate]` where the staff member either has a valid `PRESENT`/`COMPLETED` `Staff Attendance` record OR completed at least one `PAID` `Order`/`Service Step`.
    - `extraShiftCount`: count of distinct dates in `[startDate, endDate]` where the staff member was scheduled `OFF` (or unscheduled) but clocked in or completed a `PAID` `Order`/`Service Step`.
    - When `scheduledShiftCount > 0`:
      $$\text{Shift-Prorated Base Salary} = \text{Contract Base Salary} \times \frac{\text{Completed Valid Shifts}}{\text{Scheduled Working Shifts}}$$
      rounded to `0` decimal places (`HALF_UP`). If `scheduledShiftCount == 0` (historical periods before schedule tracking), default `Shift-Prorated Base Salary` to `Contract Base Salary`.
    - Enrich `StaffPerformanceResponse` with `contractBaseSalary`, `baseSalary` (set to the `Shift-Prorated Base Salary` so `totalPayout = baseSalary + totalCommission` holds), `scheduledShiftCount`, `completedShiftCount`, `extraShiftCount`, and `overtimeCommissionTotal`.
    - Update Executive Tier-2 P&L (`totalBaseSalaries`) to sum the `Shift-Prorated Base Salary` of active branch staff over the period.

## Testing Decisions

### What Makes a Good Test
- **Test observable behavior at public HTTP and UI boundaries**: Exercise REST API endpoints (`MockMvc`) and frontend domain helpers against real state transitions—asserting HTTP status codes (`200 OK`, `400 Bad Request`, `403 Forbidden`, `409 Conflict`), persisted database records, slot availability states, `Commission Ledger` overtime math, and payroll proration totals without mocking internal private helper methods.

### Highest-Level Seams to Test
1. **Shift Roster & Booking Conflict HTTP Seam (`MockMvc` Integration Seam)**:
   - Call `GET /api/v1/shifts/templates`, `GET /api/v1/shifts/roster`, `PUT /api/v1/shifts/roster`, and `POST /api/v1/shifts/roster/copy-week`.
   - Create a `CONFIRMED` customer `Booking` at `16:00` for a stylist, then call `PUT /api/v1/shifts/roster` to change that stylist's shift on that date to `MORNING (08:30–15:00)` or `OFF`; assert `HTTP 409 Conflict` containing the conflicting `bookingCode`.
2. **Shift-Aware Slot Calculation & 60-Minute Overtime HTTP Seam (`MockMvc` / Service Seam)**:
   - Assign a stylist to `MORNING (08:30–15:00)` (`maxOvertimeMinutes = 60`) and query `GET /api/v1/bookings/available-slots`:
     - Verify a 90-minute service at `14:00` (`endTime = 15:30 <= 16:00`) is `AVAILABLE`.
     - Verify a 150-minute service at `14:00` (`endTime = 16:30 > 16:00`) is unavailable.
     - Verify slots at `15:00` and later are unavailable.
     - Verify Least-Workload (`stylistId` omitted) skips `OFF` and `ABSENT` stylists.
3. **POS PIN Attendance, `1.2x` Overtime Commission & Prorated Payroll HTTP Seam (`MockMvc` Integration Seam)**:
   - Exercise `POST /api/v1/pos/attendance/action` with wrong PIN (`400 Bad Request`) and valid PIN `1234` (`CLOCK_IN` $\rightarrow$ `TOGGLE_BREAK` $\rightarrow$ `CLOCK_OUT`).
   - Settle a POS `Order` for a stylist during overtime / extra shift and verify `Commission Ledger` records a `1.2x` rate with `[OT 1.2x]` in `notes`.
   - Query `GET /api/v1/analytics/my-payroll`, `GET /api/v1/analytics/staff-payroll`, and `GET /api/v1/analytics/pnl` and assert `scheduledShiftCount`, `completedShiftCount`, `contractBaseSalary`, `baseSalary` (prorated), and `overtimeCommissionTotal`.
4. **Frontend UI Helper & Component Build Seam (Vitest & Vite Build)**:
   - Verify shift roster matrix transformations, overtime badge formatting, and payroll proration helpers via Vitest unit tests and ensure a clean production bundle build.

### Prior Art in the Codebase
- `FlywayMigrationTest`: Verifies database migrations and seeded data invariants.
- `BookingIntegrationTest` & `SlotCalculationServiceImplTest`: Verify slot availability, Redis slot locks, and Least-Workload stylist assignment.
- `PosControllerIntegrationTest`: Verifies POS order lifecycle, quick tickets, and `Commission Ledger` generation.
- `StaffPayrollIntegrationTest`: Verifies branch payroll and `Personal Payroll Statement` calculations.

## Out of Scope

- Hardware fingerprint/biometric scanners or camera facial recognition for clock-in/out.
- Statutory progressive personal income tax (PIT) or social insurance (BHXH) deductions.
- Automated peer-to-peer shift swap marketplace between stylists without manager approval.

## Further Notes

- Architectural trade-offs are recorded in `ADR-0014`.
- Ubiquitous language terms (`Shift Template`, `Shift Roster`, `Overtime Slot Window`, `Staff Attendance`, `Overtime Commission Multiplier`, `Shift-Prorated Base Salary`) are defined in `GLOSSARY.md`.
