# Issue 07: Services Catalog UI with Category Tabs, Service Modal, BOM Chemical Formula Builder & Step Editor

Status: ready-for-human

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

- [x] Create `src/features/catalog/ServicesPage.jsx`.
- [x] Implement category filter pills and live search box.
- [x] Implement `ServiceFormModal.jsx` with tabs or stacked sections for Basic Info, BOM Formulations, and Step Splits.
- [x] Connect TanStack Query hooks (`useServices`, `useCreateService`, `useUpdateService`, `useDeleteService`).
- [x] Add toast alerts for success/error operations.
- [x] Format currency in VND and durations in minutes with Vietnamese localization.

## Comments

- Implemented `catalogApi.js` and TanStack Query hooks (`useServices`, `useCreateService`, `useUpdateService`, `useDeleteService`, `useMasterProducts`).
- Implemented `ServicesPage.jsx` with summary stats cards, category filter pills (Tất cả, Cắt tóc & Tạo kiểu, Uốn - Nhuộm, Gội dưỡng sinh & Spa, Phục hồi), live search box, active-only toggle, responsive service table, inline active switch toggle, and delete confirmation modal.
- Implemented `ServiceFormModal.jsx` with 3 accessible tabs: Basic Information, BOM Formula Builder (with master product selector, volume/weight per bottle, and dosage), and Step Editor (with dynamic commission sum, real-time warning on >100%, and quick template presets).
- Added proxy in `vite.config.js` for seamless `/api` communication with Spring Boot backend at `http://localhost:8080`.
- Verified clean build with `npm run build` and zero lint warnings with `npx oxlint`.
