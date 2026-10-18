# 0011 Explicit Requested-Stylist Flag, Dual Retention Metrics & Server-Side Report Exports

We added an explicit `is_stylist_requested` flag to `bookings` to distinguish customer-requested stylists from load-balanced assignments, paired `Requested Stylist Rate` with repeat-customer `Re-booking Rate`, and implemented server-side `.xlsx` (Apache POI) and `.pdf` (OpenPDF with embedded Vietnamese Unicode fonts) report generation.

## Context

In `ADR-0006`, when a customer selects "Any Available Stylist" (`CreateBookingRequest.stylistId == null`), `BookingServiceImpl` immediately selects the least-loaded stylist and assigns ` bookings.staff_id` so Redis `Slot Lock` keys can be bound to a specific stylist. Consequently, inspecting `bookings.staff_id IS NOT NULL` cannot tell whether the customer explicitly asked for that stylist or was auto-assigned. Furthermore, salon owners and accountants require end-of-month payroll and P&L statements in multi-sheet Excel workbooks and printable Vietnamese PDF vouchers with signature blocks.

## Decision

1. **Explicit `bookings.is_stylist_requested` Flag & Dual Stylist KPIs**:
   - Add `is_stylist_requested TINYINT(1) NOT NULL DEFAULT 0` to `bookings`, set to `true` only when `CreateBookingRequest.stylistId() != null`.
   - Report two complementary stylist loyalty metrics in Staff Performance:
     - **`Requested Stylist Rate`**: Percentage of a stylist's completed orders/bookings where `is_stylist_requested = true`.
     - **`Re-booking Rate`**: Percentage of a stylist's distinct identified customers (excluding `walkin.guest`) who have completed $\ge 2$ `PAID` orders with that stylist.
2. **Server-Side Enterprise Excel & PDF Generation**:
   - Use **Apache POI (`poi-ooxml`)** on the backend to stream `.xlsx` files containing formatted currency columns, summary headers, and separate sheets (e.g., Sheet 1: Payroll & KPI Summary; Sheet 2: Itemized `Commission Ledger` per shift/step).
   - Use **OpenPDF (`com.github.librepdf:openpdf`)** with a bundled Vietnamese TrueType font (`Roboto`/`DejaVuSans`) to stream `.pdf` accounting reports complete with branch header, summary tables, and signature blocks (`Người lập biểu`, `Kế toán`, `Chủ Salon`).

## Consequences

- Automatic stylist load-balancing at booking time continues to work without losing analytics visibility into which stylists customers actively request by name.
- Exported `.xlsx` and `.pdf` financial documents render Vietnamese diacritics and currency formatting identically across Windows, macOS, and mobile devices without relying on browser print stylesheets.
