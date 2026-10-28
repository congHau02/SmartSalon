# 02: Shift-Aware Slot Calculation Engine & 60-Minute Overtime Slot Window

**What to build:** Customers booking online and receptionists booking on the POS workspace only see `AVAILABLE` 30-minute `Slots` that align with each stylist's scheduled `Shift Roster` and 60-minute `Overtime Slot Window`. Batch-loading daily shift schedules outside the 30-minute slot evaluation loop ($O(1)$ query overhead), the booking engine marks a `Slot` available for a stylist only when `slot.startTime` falls strictly inside `[shift.startTime, shift.endTime)` and `slot.endTime` (`slot.startTime + totalDuration`) does not exceed `min(20:30, shift.endTime + shift.maxOvertimeMinutes)`. Stylists scheduled `OFF` on the target date are excluded from both specific-stylist slot grids and Least-Workload (`stylistId` omitted) automatic assignment, while far-future dates without published branch rosters gracefully fall back to standard branch operating hours (`08:30–20:30`). Customer and POS booking interfaces display shift badges/hints on stylist cards so users know each stylist's working shift.

**Blocked by:** 01: Branch Shift Templates, Weekly Shift Roster Matrix & Booking Conflict Guard

**Status:** done

- [x] Available slot calculation batch-loads the target branch's daily `Shift Roster` schedules in a single query before evaluating the 30-minute slot grid, avoiding $N+1$ database queries.
- [x] For a stylist assigned to a `WORKING` shift, slots starting before `shift.startTime` or at/after `shift.endTime` are unavailable, while slots starting inside the shift are available if and only if `slot.startTime + totalDuration <= min(20:30, shift.endTime + shift.maxOvertimeMinutes)`.
- [x] On a Morning Shift (`08:30–15:00`, `maxOvertimeMinutes = 60`), a 90-minute service at `14:00` (finishing at `15:30 <= 16:00`) is `AVAILABLE`, whereas a 150-minute service at `14:00` (finishing at `16:30 > 16:00`) is blocked.
- [x] Least-Workload auto-assignment (`stylistId` omitted) and direct booking validation automatically exclude stylists whose schedule on the requested date is `OFF` or whose shift window cannot accommodate the requested service duration.
- [x] Customer Booking Step 2 stylist cards and POS booking flows display the stylist's scheduled shift badge for the selected date and pass end-to-end integration and unit tests.
