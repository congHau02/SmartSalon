# 03: POS Order Cart, Multi-Staff Service Step Assignment & Progress Tracking

**What to build:** Clicking any `Order` card on the `Dispatch Board` opens the interactive POS Order Drawer on **Tab 1 (Dịch vụ, Sản phẩm & Chia công đoạn)**. Receptionists and floor managers can add or remove catalog services (`SERVICE`) and retail `Master Product` items (`PRODUCT`), apply order-level discounts or notes, assign different stylists/technicians to individual `Service Steps`, adjust step commission weight percentages while viewing the live VND commission preview computed via the two-tier `Service Commission Pool` formula, and advance individual steps (`PENDING` → `IN_PROGRESS` → `COMPLETED`)—which automatically progresses the parent `Order` and linked `Booking` across the `Dispatch Board` columns in real time.

**Blocked by:** 02: POS Dispatch Board (Kanban & Timeline), Booking Check-In & Walk-In Order Creation

**Status:** resolved

- [x] Adding a catalog service to an unpaid `Order` appends the `Order` item, generates its default `Step Assignments`, and recalculates `subtotal` and `final_amount`; removing an item deletes its associated steps and recalculates totals.
- [x] Adding a retail `Master Product` item to an unpaid `Order` appends a `PRODUCT` item with quantity and unit retail price and recalculates `subtotal` and `final_amount`.
- [x] Receptionists can reassign the staff member (`staff_id`) and adjust the step weight (`commission_rate`) on any `Step Assignment`, immediately recalculating the step's preview `commission_amount` as `orderItem.totalPrice * (service.commissionPoolRate / 100) * (step.commissionRate / 100)`.
- [x] Transitioning the first `Step Assignment` of an `Order` to `IN_PROGRESS` records `started_at` and automatically transitions the `Order` (and any linked `Booking`) to `IN_PROGRESS`; transitioning all steps to `COMPLETED` records `completed_at` and advances the `Order` to `READY_FOR_CHECKOUT`.
- [x] The POS Order Drawer UI renders cart items, retail product additions, step-level staff selectors, commission previews, and step status toggles, broadcasting updates over WebSocket so Kanban step progress bars (`1/3`, `2/3`, `3/3`) update immediately.
- [x] Automated tests verify service/product cart mutations, two-tier step commission previews, and automatic parent `Order`/`Booking` state progression when steps start and complete.
