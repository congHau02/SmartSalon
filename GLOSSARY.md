# SmartSalon Domain Glossary

Core domain language and context boundaries for the SmartSalon Booking, POS & Operations Platform.

## Language

**Booking**:
A reservation requested by a customer for one or more salon services at a specific branch and scheduled time window.
_Avoid_: Appointment, ticket, reservation

**Booking Service Item**:
A snapshot of a selected catalog service (recording price and duration at booking time) attached to a Booking.
_Avoid_: Booking line, cart item, selected treatment

**Slot**:
A discrete 30-minute time bucket assigned to a stylist within branch operating hours that can be evaluated for availability or locked during checkout.
_Avoid_: Time range, session, shift

**Slot Lock**:
A temporary 5-minute reservation hold across one or more consecutive Slots for a specific stylist while awaiting deposit confirmation.
_Avoid_: Temp booking, cart hold, session lock

**Deposit**:
An upfront partial payment (20% of the total Booking service value) required to transition a Booking from pending hold to confirmed status.
_Avoid_: Prepayment, down payment, booking fee

**Payment Transaction**:
An immutable financial audit record capturing a deposit or order payment attempt, QR reference code, and gateway webhook payload.
_Avoid_: Receipt, payment log, invoice record

**BOM (Bill of Materials)**:
The standard quantitative recipe of consumable materials or chemicals (measured in ml or grams) deducted per service.
_Avoid_: Formula, recipe, ingredients list

**Order**:
A finalized or in-progress transaction representing delivered services and retail items for a customer visit.
_Avoid_: Invoice, bill, check

**Service Step**:
A distinct operational phase within a salon service (e.g., washing, cutting, bleaching, styling) capable of independent staff assignment.
_Avoid_: Sub-service, task, process

**Step Assignment**:
The assignment of a specific technician/stylist to a service step with an associated commission rate.
_Avoid_: Staff task, split

**Visual Log (Technical Log)**:
A permanent technical record storing chemical formulas, customer conditions, and before/after service result photographs.
_Avoid_: Service note, customer note, gallery

**Commission Ledger**:
The immutable financial accounting ledger tracking commission payables earned by staff members per order item or step.
_Avoid_: Tip ledger, staff payout, bonus

**Inventory Transaction**:
An audited stock movement record tracking unit-to-volume conversions (bottles/tubes to ml/grams) and stock deductions.
_Avoid_: Stock change, adjustment

**Master Product**:
The canonical system-wide product definition (SKU, barcode, packaging unit, standard volume/weight, retail price) independent of any specific branch inventory.
_Avoid_: Item, SKU record, global product

**Branch Inventory**:
The stock tracking record of a Master Product allocated to a specific branch, measuring sealed units and in-use partial volume.
_Avoid_: Warehouse stock, branch product, stock level

**Sealed Unit**:
An unopened commercial package (e.g., bottle, tube, box) of a product in stock.
_Avoid_: Closed bottle, package, whole unit

**Opened Volume**:
The remaining active volume or weight (in ml or grams) inside an unsealed consumable container currently being used for salon services.
_Avoid_: Dispense volume, in-use stock, loose liquid

**Stock In**:
An audited receipt of sealed product units into a branch inventory from suppliers or central warehouse.
_Avoid_: Restock, inward, receive

**Stock Adjustment**:
A corrective transaction reconciling recorded inventory volume against physical counts due to spillage, evaporation, breakage, or expiry.
_Avoid_: Stock change, write-off, count fix

**Dispatch Board**:
The real-time operational floor view (in Kanban and Timeline modes) tracking a branch's daily arrivals, active Orders, Service Step progress, and stylist availability.
_Avoid_: POS screen, receptionist dashboard, schedule grid

**Walk-in Order**:
An Order initiated directly at the POS counter for an unscheduled customer visit without a prior Booking.
_Avoid_: Direct bill, quick ticket, unbooked appointment

**Service Commission Pool**:
The percentage of a service item's price allocated as the total commission budget to be split across that service's Step Assignments according to their step weights.
_Avoid_: Staff fee, bonus pool, service cut

**Chemical COGS**:
The material cost of consumable chemicals (measured in ml or grams) deducted for a service, valued using the snapshotted cost per volume unit at the time of stock movement.
_Avoid_: Material fee, supply expense, product cost

**Order Net Profit**:
The net operational earnings of a completed Order after deducting Chemical COGS, retail product cost of goods, and staff commissions from net revenue.
_Avoid_: Shift margin, ticket profit, gross take

**Base Salary**:
The fixed monthly base compensation configured for a staff member prior to adding earned commissions from the Commission Ledger.
_Avoid_: Fixed wage, retainer, base pay

**Requested Stylist Rate**:
The percentage of a stylist's completed Bookings in which the customer explicitly requested that specific stylist rather than accepting automatic load-balanced assignment.
_Avoid_: Pick rate, preference score, direct booking rate

**Re-booking Rate**:
The percentage of a stylist's identified customers who have completed two or more service visits with that same stylist.
_Avoid_: Retention score, repeat ratio, loyalty rate

**BOM Wastage**:
The excess consumable chemical volume (from treatment overrides and negative Stock Adjustments) consumed beyond the aggregated standard BOM of completed services over a period.
_Avoid_: Chemical shrinkage, over-pour, variance loss

**Provisional Customer**:
A customer profile automatically created from a phone number during an unauthenticated Booking or Walk-in Order before the customer registers login credentials.
_Avoid_: Shadow user, temp account, anonymous guest

**Cumulative Spend**:
The lifetime total of net revenue paid by an identified customer across all completed Orders, used to determine their Membership Tier.
_Avoid_: Points balance, lifetime value, gross spend

**Membership Tier**:
A loyalty classification (`STANDARD`, `SILVER`, `GOLD`, `DIAMOND`) assigned to a customer based on their Cumulative Spend, granting an automatic percentage discount on eligible purchases.
_Avoid_: VIP rank, loyalty level, member grade

**Retained Deposit**:
Previously paid Booking Deposit funds preserved on a customer's profile after an eligible cancellation, available to offset future Bookings or Orders.
_Avoid_: Wallet balance, refund credit, prepaid balance

**Service Review**:
A customer's post-visit evaluation (1-to-5 star rating and optional comment) submitted for a completed Order and attributed to a stylist.
_Avoid_: Feedback ticket, testimonial, survey
