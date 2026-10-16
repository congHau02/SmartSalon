# SmartSalon Domain Glossary

Core domain language and context boundaries for the SmartSalon Booking, POS & Operations Platform.

## Language

**Booking**:
A reservation requested by a customer for one or more salon services at a specific branch and scheduled time.
_Avoid_: Appointment, ticket, reservation

**Slot**:
A discrete time window assigned to a stylist, chair, or bed that can be locked temporarily during checkout.
_Avoid_: Time range, session, shift

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
