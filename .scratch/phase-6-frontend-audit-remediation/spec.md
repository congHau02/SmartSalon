# Specification: Phase 6 - Frontend Quality Audit Remediation & Architecture Compliance

Status: resolved

## Problem Statement

Following the completion of Phases 1 through 5, a comprehensive quality and architecture audit of the SmartSalon frontend application revealed several operational bugs, financial input hazards, concurrency risks, resilience gaps, and component size violations that affect salon staff, branch managers, and customers during daily multi-branch operations:

1. **Checkout Financial Input & `Order` State Hazards on the POS `Dispatch Board`**:
   - During `Order` checkout, the discount input is not clamped to non-negative values or capped at the payable balance before being dispatched to the checkout mutation or the VietQR preview endpoint. Typing or pasting a negative discount inflates the customer's charge, while entering a discount exceeding the subtotal sends an invalid discount to the server and distorts `Order Net Profit` and `Commission Ledger` calculations.
   - Selecting the VietQR payment method binds the QR generation query directly to every keystroke of the discount input without debouncing, triggering a burst of redundant API requests whenever a receptionist types a multi-digit discount (e.g., typing `50000` fires five separate QR requests).
   - Whenever a staff member adds an item, updates a `Step Assignment`, or changes a `Service Step` status in the POS drawer, the resulting background `Order` refetch triggers an effect that overwrites any unsaved discount or note edits the receptionist was actively typing.
   - The `Service Step` commission rate input relies on an uncontrolled initial default value that never updates when server state changes, and `Service Step` status buttons allow transitioning a step to `IN_PROGRESS` or `COMPLETED` even when no technician is assigned (`Step Assignment` lacks a stylist), creating orphaned steps with no recipient for the `Service Commission Pool`.
2. **Inaccurate Schedule Visualization on the `Dispatch Board` Timeline**:
   - In Timeline mode on the `Dispatch Board`, an active `Order` is plotted only on the row of the very first `Service Step`'s assigned stylist, hiding the `Order` from all other stylists assigned to subsequent `Service Steps` on the same visit.
   - Every `Order` on the Timeline is rendered with a hardcoded 45-minute duration regardless of the actual duration of its services, misleading receptionists about when a stylist will become free for the next `Booking` or `Walk-in Order`.
3. **Authentication Token Rotation Race & Production Hygiene Gaps**:
   - The HTTP client interceptor manages concurrent `401 Unauthorized` responses via a single-flight refresh queue, but the authentication context also exposes an independent refresh method that calls the refresh endpoint directly without coordinating with the interceptor queue. Because the backend enforces single-use Redis Refresh Token rotation (`ADR-0005`), simultaneous calls cause a token rotation collision and unexpectedly log the staff member out during a shift.
   - Quick-fill demo credentials remain visible in production builds on the login screen, the `401` interceptor checks authentication URLs via loose substring matching, and the unauthorized screen uses hardcoded role strings and logs out without navigating back to the login view.
4. **Missing Runtime Fault Isolation, Unhandled LAN Clipboard Errors & Unbounded Upload Sizes**:
   - None of the three primary portal layouts (Customer Portal, POS `Dispatch Board`, or Executive Admin Portal) are protected by a React Error Boundary. A single rendering exception in any child widget crashes the entire browser tab into a blank white screen.
   - Copy-to-clipboard actions on the `Deposit` QR payment screen and POS checkout screen invoke the browser clipboard API without error handling, throwing unhandled promise rejections when accessed over non-HTTPS local salon networks.
   - The `Visual Log` before/after photo uploader does not validate file sizes client-side before starting multipart uploads, allowing oversized mobile camera files (20MB+) to stall the POS tablet.
5. **Frontend Architecture Rule Violations (`AGENTS.md` 250 LOC Hard Limit) & Dead Starter Assets**:
   - Thirty frontend components exceed the repository's hard limit of 250 lines of code per component (with the POS `Order` drawer reaching 901 LOC, the `Visual Log` tab 726 LOC, the Admin `Booking` management page 668 LOC, the POS checkout tab 647 LOC, and the `Master Product` catalog page 609 LOC), mixing data-fetching hooks, form state, static option constants, and deeply nested JSX in monolithic files.
   - Unused framework starter assets remain in the source tree.

## Solution

Deliver a targeted Frontend Quality Remediation and Architecture Compliance suite across the Customer Portal, POS `Dispatch Board`, and Admin Portal:

1. **Hardened POS Checkout, Debounced VietQR & Non-Destructive `Order` Workspace State**:
   - Clamp all POS discount inputs and payloads to the valid range $[0, \max(0, \text{subtotal} - \text{depositDeducted})]$ across live previews, VietQR generation, and final `Order` checkout mutations.
   - Debounce the discount value used by the POS VietQR query so QR codes are requested only after the receptionist pauses typing.
   - Synchronize local discount and notes draft state only when switching to a different `Order` (or upon explicit order save), preserving in-progress receptionist edits across background refetches triggered by `Step Assignment` or item updates.
   - Synchronize `Service Step` commission rate inputs with updated server values and disable `Service Step` progression (`IN_PROGRESS` / `COMPLETED`) until a valid stylist/technician is assigned to the `Step Assignment`.
2. **Multi-Stylist & True-Duration `Dispatch Board` Timeline**:
   - Plot `Order` timeline blocks across every distinct stylist assigned to any `Service Step` within the `Order` so multi-technician visits appear on each participating stylist's lane.
   - Calculate `Order` timeline block duration from the aggregated duration of its service items (falling back to a sensible default only for retail-only `Walk-in Orders`).
3. **Single-Flight Refresh Token Coordination & Auth Production Hardening**:
   - Unify token refresh execution through a single shared single-flight promise/queue in the HTTP client layer so manual context refreshes and `401` interceptor retries never issue parallel rotation requests with the same Refresh Token.
   - Gate quick-fill demo login buttons behind development/demo environment flags, tighten authentication endpoint path matching in the HTTP interceptor, and standardize role constants and post-logout navigation on the unauthorized screen.
4. **Portal Error Boundaries, Safe LAN Clipboard Copy & `Visual Log` Upload Guards**:
   - Wrap the Customer Portal, POS `Dispatch Board`, and Admin Portal layouts in a reusable React Error Boundary that catches render failures and provides a one-click view reset without losing session authentication.
   - Centralize clipboard copy operations in a safe utility that handles missing secure contexts and rejected promises gracefully.
   - Enforce a 10MB client-side file size limit with immediate user feedback before uploading `Visual Log` before/after photographs.
5. **Component Decomposition (<250 LOC Hard Limit) & Asset Cleanup**:
   - Refactor all components exceeding the 250 LOC hard limit into focused sub-components (targeting <150 LOC, strictly $\le 250$ LOC), extracting custom hooks (`use*`) when pre-return logic exceeds 40 LOC or 3 hooks, and moving static table column definitions, filter options, and Zod schemas into dedicated `*.constants` and `*.schema` modules.
   - Delete unused starter template image and vector assets from the frontend source tree.

## User Stories

1. As a receptionist checking out an `Order` at the POS counter, I want negative discount values to be rejected or clamped to zero and discounts exceeding the remaining payable balance ($\text{Subtotal} - \text{Deposit}$) to be capped automatically, so that a typing mistake never overcharges a customer or records a negative `Order` settlement.
2. As a receptionist selecting the VietQR payment method on an `Order`, I want the dynamic QR code request to wait until I finish typing the discount amount (debounced), so that typing a 5-digit discount does not fire five separate QR generation requests or cause the QR image to flicker.
3. As a receptionist typing a discount or note on an active `Order`, I want my unsaved text to remain intact when a stylist or receptionist updates a `Service Step` status or `Step Assignment` in the same drawer, so that background `Order` refetches do not wipe out my work.
4. As a branch manager or receptionist reviewing `Step Assignments` in the POS drawer, I want each `Service Step`'s commission rate input to immediately reflect updated server values after a refetch, so that I never view or resubmit a stale commission percentage.
5. As a branch manager, I want the "Bắt đầu" (`IN_PROGRESS`) and "Hoàn thành" (`COMPLETED`) action buttons on a `Service Step` to be disabled until a stylist or technician is assigned to that `Step Assignment`, so that no service phase can be completed without a responsible staff member for the `Commission Ledger`.
6. As a receptionist viewing the `Dispatch Board` in Timeline mode, I want an `Order` whose `Service Steps` are split across multiple stylists to display on each assigned stylist's timeline lane, so that I can see every technician's true active workload and avoid double-booking them.
7. As a receptionist viewing the `Dispatch Board` in Timeline mode, I want each `Order` block's width to reflect the actual total duration of its services rather than a fixed 45-minute box, so that 2-hour chemical treatments and 30-minute haircuts are represented accurately on the schedule grid.
8. As a stylist uploading before/after photographs to a customer's `Visual Log`, I want the app to validate that each selected image is at most 10MB before uploading and show a clear Vietnamese error message if a file is too large, so that oversized camera files do not freeze the POS tablet.
9. As a staff member whose access token expires while multiple dashboard queries fire simultaneously, I want all token refresh attempts across the HTTP interceptor and authentication context to share a single in-flight refresh request, so that Redis Refresh Token rotation never logs me out due to a race condition.
10. As a system administrator deploying SmartSalon to production, I want the quick-fill demo account buttons on the login screen to only appear in development mode (or when explicitly enabled via environment configuration), so that production users do not see test credentials.
11. As an authenticated user who lands on the unauthorized access screen and clicks logout, I want my session cleared and my browser navigated cleanly to the login screen, and I want role checks on that screen to use the canonical role constants.
12. As a receptionist or customer copying a bank account number, transfer memo, or `Deposit` amount on a local HTTP salon network, I want clipboard copy actions to handle browser permission or non-HTTPS restrictions gracefully without throwing unhandled runtime errors.
13. As a receptionist or branch manager working on the POS `Dispatch Board` or Executive Dashboard, I want each portal layout wrapped in an Error Boundary with a "Tải lại giao diện" recovery button, so that an unexpected rendering error in one tab or modal never leaves me stranded on a blank white screen.
14. As a frontend developer maintaining SmartSalon, I want every React component in the frontend codebase to strictly obey the 250 LOC hard limit (with complex modals, tables, and drawers split into cohesive sub-components, custom hooks, and constants modules), so that every file is easy to read, test, and modify in isolation.
15. As a frontend developer, I want unused starter template assets removed from the repository, so that the codebase contains zero dead files.

## Implementation Decisions

### 1. POS `Order`, Checkout & `Dispatch Board` State Refinements
- **Discount Sanitization & Clamping**:
  - Define a pure helper function that normalizes raw discount input along with `subtotal` and `depositDeducted`:
    $$\text{maxAllowedDiscount} = \max(0, \text{subtotal} - \text{depositDeducted})$$
    $$\text{sanitizedDiscount} = \min(\text{maxAllowedDiscount}, \max(0, \text{parsedDiscount}))$$
  - Use `sanitizedDiscount` consistently in `usePosOrder` live amount calculations, in the POS checkout mutation payload, and in the VietQR query parameter.
- **Debounced VietQR Query**:
  - Introduce a reusable `useDebouncedValue(value, delayMs)` hook (default 400ms).
  - In the POS checkout view, pass the debounced `sanitizedDiscount` into the VietQR query key and API call so intermediate keystrokes do not trigger network requests.
- **Non-Destructive `Order` Draft State Sync**:
  - In `usePosOrder`, track the last synchronized `order.id` (and server-side `order.discountAmount` / `order.notes` baseline) via a ref so that local `discountInput` and `notesInput` states are reset when `order.id` changes or when `updateOrderMutation` succeeds, rather than on unrelated background refetches of the same `Order`.
- **Controlled `Step Assignment` Commission Input & Stylist Requirement**:
  - Key the `Service Step` commission rate input by both `step.id` and `step.commissionRate` (or bind it to controlled step draft state) so external refetches immediately update the displayed rate.
  - Disable the `Service Step` status progression buttons (`PENDING` $\to$ `IN_PROGRESS` and `IN_PROGRESS` $\to$ `COMPLETED`) whenever `!step.staffId`, adding a tooltip explaining that a technician must be assigned first.
- **Multi-Stylist & Computed Duration on `TimelineBoard`**:
  - When mapping active `Orders` into timeline items:
    - Collect all unique non-null `staffId` values across `order.items[].steps[]`. Create a timeline block on each participating stylist's lane (or for the specific step duration if step-level timing is available).
    - Compute the `Order` duration from the sum of `durationMinutes` across its `SERVICE` items (falling back to 45 minutes only when duration metadata is absent or the `Order` contains only retail `Master Products`).
- **`Visual Log` Image Upload Validation**:
  - Before appending a selected file to `FormData` or preview state in the `Visual Log` tab, verify `file.size <= 10 * 1024 * 1024` (10MB). If exceeded, reject the file and surface an error notice to the user.

### 2. Authentication Single-Flight Refresh & Security Hygiene
- **Shared Single-Flight Refresh Token Executor**:
  - Extract a single `refreshAccessToken()` function inside the HTTP client module that uses the existing `isRefreshing` lock and `failedQueue` promise queue.
  - Update the authentication context's `refreshToken` method to call this shared single-flight function instead of issuing a separate uncoordinated POST request to the refresh endpoint, guaranteeing that at most one refresh request is in flight at any time per browser tab.
- **Exact Auth Endpoint Matching**:
  - Replace substring `.includes()` checks for `/auth/login`, `/auth/refresh`, and `/auth/register` in the HTTP response interceptor with a helper that checks normalized pathname suffixes safely (`originalRequest?.url`).
- **Demo Credentials & Role Constant Hygiene**:
  - Render the quick-fill demo credential section on the login view only when `import.meta.env.DEV` is true (or `import.meta.env.VITE_ENABLE_DEMO_ACCOUNTS === "true"`).
  - In the unauthorized view, replace hardcoded `"CUSTOMER"` comparisons with `ROLES.CUSTOMER` and ensure clicking the logout button awaits `logout()` and navigates to `/login`.

### 3. Runtime Resilience & Shared Utilities
- **Portal-Level `ErrorBoundary` Component**:
  - Create a reusable React class-based `ErrorBoundary` component accepting a portal title and reset callback, rendering a clean fallback card with error details (in dev mode) and a "Tải lại giao diện" button that resets the error state or reloads the route.
  - Wrap the route outlets/containers in the Customer, POS, and Admin layouts with `ErrorBoundary`.
- **Safe Clipboard Copy Utility**:
  - Provide a `copyToClipboard(text)` helper in the shared utility module that attempts `navigator.clipboard?.writeText(String(text))` inside a `try/catch` with a fallback hidden `<textarea>` `document.execCommand("copy")` for non-HTTPS LAN environments, never throwing an unhandled rejection.

### 4. Component Decomposition (`AGENTS.md` Compliance: $\le 250$ LOC per File)
- **Strict Decomposition Target**:
  - Every `.jsx` and `.js` source file under `frontend/src` must be $\le 250$ lines of code.
  - Apply the established feature sub-directory pattern (`components/<sub-feature>/` + custom hooks `use*.js` + `*.constants.js` / `*.schema.js`) across the remaining oversized modules:
    - **POS Module**: Decompose the POS `Order` drawer (into header, cart item list, step assignment row, add-service/product modals, and summary footer), `Visual Log` tab (into BOM override table, before/after photo uploader, and technical notes form), POS checkout tab (into payment method selector, VietQR panel, BOM/commission preview accordions, and printable receipt view), `Walk-in Order` modal, `Dispatch Board` page, Kanban board, and `Commission Ledger` modal.
    - **Booking Module**: Decompose the Admin `Bookings` management page (into filter bar, booking table, and status action controls), `Deposit` QR step (into countdown banner, QR card, and bank transfer details panel), Customer confirm step, Stylist & `Slot` step, and Branch & service step.
    - **Inventory & Catalog Modules**: Decompose the `Master Product` catalog page, `Inventory Transactions` history page, `Branch Inventory` page, `Services` catalog page, and the oversized modal components (`ProductFormModal`, `StockAdjustmentModal`, `StockInModal`, `ServiceFormModal`) by extracting form sections and table sub-components.
    - **Dashboard, Layout & Auth Modules**: Decompose `DownloadCenterTab`, `StaffPayrollTab`, `OrderPnlTable`, `InventoryAlertsTab`, `StockAlertsTable`, `PnlTrendChart`, `AdminHeader`, `NotificationBell`, `RegisterPage`, and `LoginPage` into sub-components and custom hooks under 250 LOC each.
- **Dead Asset Removal**:
  - Delete the unreferenced starter assets (`react.svg`, `vite.svg`, `hero.png`) from the frontend assets folder.

## Testing Decisions

### What Makes a Good Test
- **Test observable behavior through public module contracts, never internal implementation details**: Tests should invoke hooks, utility functions, HTTP interceptor boundaries, or rendered feature components and assert observable outputs (calculated VND amounts, emitted API payloads, DOM states, and error boundary fallback rendering), never internal state variable names.

### Highest-Level Seams to Test
1. **Frontend Behavioral Unit & Component Seam (Vitest)**:
   - Configure and run a fast Vitest test suite (`npm test`) exercising the remediated behavioral seams:
     - **POS Financial & Draft State Seam**: Verifies discount clamping ($[0, \text{subtotal} - \text{depositDeducted}]$), debounced VietQR query key behavior, and preservation of unsaved discount/notes inputs across background `Order` refetches.
     - **`Dispatch Board` Timeline Mapping Seam**: Verifies that an `Order` with multiple `Service Steps` assigned to different stylists produces timeline blocks for each assigned stylist and computes duration from its services rather than a hardcoded 45 minutes.
     - **Single-Flight Auth Refresh Seam**: Verifies that concurrent `401` responses and manual `refreshToken()` calls share a single in-flight refresh request and do not trigger duplicate token rotation calls.
     - **Resilience & Utility Seam**: Verifies `copyToClipboard` resolves safely when `navigator.clipboard` fails or is absent, and `ErrorBoundary` renders its recovery UI when a child throws.
2. **Static Build & Architecture Compliance Seam (`npm run build` + LOC Verification)**:
   - Execute `npm run build` to verify that all decomposed components, barrel exports, hooks, and routes bundle cleanly with zero compilation errors.
   - Verify via an automated check that zero `.js`/`.jsx` files under `frontend/src` exceed the 250 LOC hard limit defined in `AGENTS.md` and that dead starter assets are removed.

### Prior Art in the Codebase
- Existing decomposed modal directories in `features/inventory/components/` (`product-modal/`, `stock-in-modal/`, `adjustment-modal/`) and `features/catalog/components/` (`service-list/`, `service-modal/`) establish the repository's convention for splitting large views into `index.js`, sub-components, `use*Form.js` hooks, and `*Schema.js` files.

## Out of Scope

- Backend Spring Boot API contract or database schema changes (all backend endpoints required for Phases 1–5 are already complete).
- Migrating JWT storage from `localStorage` to `HttpOnly` cookies (would require breaking changes to the backend stateless authentication contract defined in `ADR-0002` and `ADR-0005`).
- Server-side pagination changes on existing backend analytics or inventory transaction endpoints.

## Further Notes

- All domain terminology strictly adheres to `GLOSSARY.md` (`Booking`, `Slot`, `Slot Lock`, `Deposit`, `Order`, `Service Step`, `Step Assignment`, `Visual Log`, `Commission Ledger`, `Master Product`, `Branch Inventory`, `Sealed Unit`, `Opened Volume`, `Stock In`, `Stock Adjustment`, `Dispatch Board`, `Walk-in Order`, `Service Commission Pool`, `Chemical COGS`, `Order Net Profit`, `Base Salary`, `BOM Wastage`).
- Respects `ADR-0005` (Redis Refresh Token Rotation), `ADR-0008` (STOMP WebSocket Branch Dispatch), `ADR-0009` (Service Commission Pool & Transactional POS Checkout), and the Frontend Architecture Rules in `AGENTS.md`.
