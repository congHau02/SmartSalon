# 03: 1-Touch POS PIN Staff Attendance & Real-Time Dispatch Board Presence

**What to build:** Stylists and receptionists on the `/pos` workspace can view live daily shift and attendance status badges (`Đang trực`, `Tạm nghỉ`, `Đã tan ca`, `Vắng mặt`) across the `Dispatch Board` stylist bar and inside the `Stylist Daily Worklog`, and perform 1-touch timekeeping (`Clock-in`, `Tạm nghỉ / Tiếp tục`, `Clock-out`) via a 4-digit personal PIN modal (or receptionist/manager administrative override). Clocking out past a stylist's scheduled `shift.endTime` automatically computes and records `overtimeMinutes`. Every attendance transition broadcasts a real-time STOMP WebSocket update to `/topic/branch/{branchId}/dispatch` so all open POS screens refresh immediately without page reloads, and stylists marked `ABSENT` (or `ON_BREAK` for immediate slots) are automatically excluded from today's available booking slots and Least-Workload assignment.

**Blocked by:** 01: Branch Shift Templates, Weekly Shift Roster Matrix & Booking Conflict Guard, 02: Shift-Aware Slot Calculation Engine & 60-Minute Overtime Slot Window

**Status:** done

- [x] `GET /api/v1/pos/attendance/today?branchId={id}` returns each branch staff member's scheduled shift template for today, live `Staff Attendance` status (`PRESENT`, `ON_BREAK`, `COMPLETED`, `ABSENT`), clock-in/break/clock-out timestamps, and overtime minutes.
- [x] `POST /api/v1/pos/attendance/action` verifies the staff member's 4-digit `attendance_pin` (returning `HTTP 400 Bad Request` on invalid PIN, while permitting `ADMIN`/`MANAGER`/`STAFF` override), updates attendance timestamps and `overtimeMinutes`, and broadcasts a real-time event to `/topic/branch/{branchId}/dispatch`.
- [x] Today's slot calculation and Least-Workload stylist assignment automatically exclude stylists whose today `Staff Attendance` is `ABSENT` or who are currently `ON_BREAK`.
- [x] The `/pos` workspace stylist status strip and `Stylist Daily Worklog` display live shift and presence badges, personal weekly shift schedule summary, and a 1-touch 4-digit PIN modal (`Clock-in`, `Tạm nghỉ`, `Clock-out`), verified by backend `MockMvc` and frontend Vitest tests.
