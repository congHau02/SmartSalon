# Issue 06: AdminLayout Enhancement with Interactive Sidebar, Header Branch Switcher & User Profile Menu

Status: ready-for-agent

## Description

Enhance the `AdminLayout` component into a production-grade salon management shell following `ui-ux-pro-max`:
1. Modern sidebar with brand logo, grouped navigation items (Dashboard, Services & BOM, Products & Master Catalog, Branch Inventory, Inventory Audit Log).
2. Header with dynamic Branch Selector dropdown, allowing managers/admins to switch active branch context.
3. User profile menu showing current user name, role badge, and one-click Logout.
4. Active link styling, breadcrumb navigation, and responsive mobile drawer support.

## Tasks

- [ ] Fetch branch list from `/api/v1/branches` (or use active branch from auth context).
- [ ] Implement Branch Context / state so that child views (Inventory, Catalog, Reports) automatically react to branch switching.
- [ ] Redesign `src/components/layout/AdminLayout.jsx` with full navigation structure:
  - Overview / Dashboard (`/admin`)
  - Catalog: Dịch vụ & BOM (`/admin/services`)
  - Catalog: Danh mục sản phẩm (`/admin/products`)
  - Kho: Tồn kho chi nhánh (`/admin/inventory`)
  - Kho: Lịch sử biến động (`/admin/inventory/transactions`)
- [ ] Add user badge, branch selector dropdown, and logout trigger in the top navbar.
- [ ] Ensure responsive collapse behavior for smaller screens.

## Comments
