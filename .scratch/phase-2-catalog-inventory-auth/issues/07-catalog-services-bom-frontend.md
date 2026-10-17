# Issue 07: Services Catalog UI with Category Tabs, Service Modal, BOM Chemical Formula Builder & Step Editor

Status: ready-for-agent

## Description

Implement the Service Catalog management frontend at `/admin/services` complying with `ui-ux-pro-max`:
1. Category filter tabs (Tất cả, Cắt tóc & Tạo kiểu, Uốn - Nhuộm, Gội dưỡng sinh & Spa, Phục hồi).
2. Service grid/table displaying service name, category, duration, base price, BOM count, and active status switch.
3. Modal form for creating and editing services:
   - Basic info: Name, Category, Duration (minutes), Base Price (VND), Description.
   - Dynamic BOM Builder: add/remove consumable master products with required dosage (ml/g).
   - Dynamic Step Editor: add/remove technical steps with step name and commission rate percentage.
4. Validation ensuring positive prices, durations, and commission sums not exceeding 100%.

## Tasks

- [ ] Create `src/features/catalog/ServicesPage.jsx`.
- [ ] Implement category filter pills and live search box.
- [ ] Implement `ServiceFormModal.jsx` with tabs or stacked sections for Basic Info, BOM Formulations, and Step Splits.
- [ ] Connect TanStack Query hooks (`useServices`, `useCreateService`, `useUpdateService`, `useDeleteService`).
- [ ] Add toast alerts for success/error operations.
- [ ] Format currency in VND and durations in minutes with Vietnamese localization.

## Comments
