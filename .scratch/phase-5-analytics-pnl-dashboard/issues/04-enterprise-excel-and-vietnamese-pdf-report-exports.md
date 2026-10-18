# 04: End-of-Month Multi-Sheet Excel (.xlsx) & Vietnamese Unicode PDF (.pdf) Report Exports

**What to build:** Salon owners, branch managers, and accountants can click **"Xuất Excel (.xlsx)"** or **"Xuất PDF (.pdf)"** on both **Tab 1 (Báo cáo Lãi/Lỗ P&L Thực tế)** and **Tab 2 (Hiệu suất Nhân sự & Hoa hồng)** of the Executive Dashboard to download formatted end-of-month financial and payroll statements for the selected branch and period. Exporting to Excel generates a multi-sheet `.xlsx` workbook with formatted VND currency cells and bold totals (for Staff Payroll: Sheet 1 `Tong_Hop_Bang_Luong_KPI` and Sheet 2 `Chi_Tiet_Hoa_Hong_Tung_Ca`; for P&L: Sheet 1 `Tong_Hop_Ket_Qua_Kinh_Doanh` and Sheet 2 `Chi_Tiet_Lai_Lo_Tung_Ca`). Exporting to PDF streams a printable A4 document rendered with an embedded Vietnamese Unicode font, complete with branch header metadata, summary cards, data tables, and a 3-column accounting signature footer (`Người lập biểu`, `Kế toán trưởng`, `Chủ Salon / Giám đốc`).

**Blocked by:** 01: Realized Profit & Loss (P&L) Engine, Cost Snapshots & Executive Command Center Dashboard (Tab 1), 02: Staff Performance, Base Salary Management, Requested Stylist / Re-booking KPIs & Payroll View (Tab 2)

**Status:** ready-for-agent

- [ ] Server-side Excel export (`xlsx`) generates valid multi-sheet OOXML workbooks for both `staff-payroll` (Payroll & KPI Summary sheet + Itemized `Commission Ledger` sheet) and `pnl` (Dual-Tier Period Summary & Daily Trend sheet + Per-Order P&L Breakdown sheet).
- [ ] Server-side PDF export (`pdf`) generates valid A4 PDF documents using an embedded Unicode TrueType font supporting full Vietnamese diacritics, formatted currency tables, and signature blocks (`Người lập biểu`, `Kế toán trưởng`, `Chủ Salon / Giám đốc`) for both `staff-payroll` and `pnl`.
- [ ] The **"Xuất Excel (.xlsx)"** and **"Xuất PDF (.pdf)"** buttons on **Tab 1 (P&L)** and **Tab 2 (Hiệu suất Nhân sự & Hoa hồng)** trigger authenticated binary downloads with descriptive filenames (`Bao_Cao_PL_<Branch>_<Start>_<End>.xlsx/.pdf` and `Bang_Luong_Hoa_Hong_<Branch>_<Start>_<End>.xlsx/.pdf`) and loading states.
- [ ] Automated backend integration tests verify HTTP 200 responses, `Content-Disposition` headers, valid Apache POI multi-sheet `.xlsx` workbooks, and valid `.pdf` binary headers (`%PDF-`) for both report types, and the frontend compiles cleanly.
