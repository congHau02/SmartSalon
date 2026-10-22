# 03: POS Checkout Financial Clamping, Debounced VietQR, Draft State & Timeline

**What to build:** Implement non-negative, balance-capped discount clamping across POS live calculations, VietQR generation, and checkout mutations. Introduce a reusable `useDebouncedValue` hook to debounce VietQR queries during discount typing. Isolate in-progress discount/notes drafts from background order refetches in `usePosOrder`. Ensure step commission inputs update on refetch and require an assigned stylist before transitioning step status to `IN_PROGRESS` or `COMPLETED`. Multi-stylist lanes and aggregated duration calculation on the `TimelineBoard`.

**Blocked by:** 01-auth-single-flight-refresh-and-security-hygiene.md, 02-runtime-resilience-error-boundary-and-safe-clipboard.md

**Status:** resolved

- [x] Discount input and mutation payload are clamped to `[0, Math.max(0, subtotal - depositDeducted)]`.
- [x] Reusable `useDebouncedValue` hook debounces VietQR queries by 400ms.
- [x] `usePosOrder` preserves local discount and notes drafts across background refetches, resetting only on order change or successful order update.
- [x] Service step commission input is controlled/keyed to update on server refetch, and step start/complete action buttons are disabled when `!step.staffId`.
- [x] `TimelineBoard` maps orders to lanes for all assigned stylists on any step, with duration aggregated from service items (fallback 45m).
