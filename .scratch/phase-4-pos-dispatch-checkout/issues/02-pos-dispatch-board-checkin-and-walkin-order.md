# 02: POS Dispatch Board (Kanban & Timeline), Booking Check-In & Walk-In Order Creation

**What to build:** Receptionists can open the `Dispatch Board` for a selected branch and date and switch between a 4-column **Kanban View** (`Sắp đến / Chờ Check-in`, `Đã Check-in / Chờ phục vụ`, `Đang thực hiện`, `Chờ thanh toán & Hoàn tất`) and a **Timeline View** (`08:30 – 20:30` across branch stylists), accompanied by a live Stylist Availability bar (`Đang rảnh` / `Đang bận`). From the board, a receptionist can click **Check-in** on a waiting `Booking` to transition it to `CHECKED_IN` and automatically open a linked POS `Order` pre-loaded with the booked `Booking Service Items`, default `Step Assignments` assigned to the booked stylist, and any paid 20% `Deposit` deducted; or open the **Walk-in Order** modal to create an unscheduled `Order` either by entering customer name/phone or by clicking **"Khách lẻ nhanh"** (`walkin.guest`). All check-in and walk-in actions broadcast live updates over the branch dispatch WebSocket topic.

**Blocked by:** 01: Real-Time Booking Push Notifications to Receptionist & POS Screens

**Status:** closed

- [x] Database schema migration V4 adds `commission_pool_rate` (default `20.00%`) to services, snapshot/checkout metadata (`customer_name`, `customer_phone`, `payment_method`, `notes`) to orders, `actual_bom_json` to technical logs, and seeds the canonical `walkin.guest` customer account.
- [x] Checking in a `Booking` transitions its status to `CHECKED_IN`, creates a linked `Order` in `CHECKED_IN` status, copies all `Booking Service Items` into `Order` service items, generates default `Step Assignments` from each service's default `Service Steps` pre-assigned to the booking's stylist, and populates `deposit_deducted` when the booking's `Deposit` is `PAID`.
- [x] Creating a `Walk-in Order` resolves an existing customer or creates a new customer by phone number (or binds to `walkin.guest` for one-click anonymous walk-in), creates an `Order` in `CHECKED_IN` status with the selected services and products, and generates default `Step Assignments`.
- [x] The `Dispatch Board` UI renders both the 4-column **Kanban View** (default) and the **Timeline View** (`08:30 – 20:30` per stylist), displays the live Stylist Availability strip, and updates automatically across terminals via WebSocket when check-in or walk-in events occur.
- [x] Automated backend tests verify V4 migration schema, booking check-in (`Deposit` carryover, item snapshot, default steps), walk-in creation (`walkin.guest` and phone lookup), and dispatch board query responses.
