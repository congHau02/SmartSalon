# 04: POS and Booking Module Component Decomposition (<= 250 LOC Hard Limit)

**What to build:** Decompose all oversized POS and Booking module components into focused sub-components, custom hooks, and constants/schemas under the 250 LOC hard limit defined in `AGENTS.md`. Refactor `PosOrderDrawer`, `VisualLogTab`, `PosCheckoutTab`, `WalkInModal`, `DispatchBoardPage`, `KanbanBoard`, `CommissionLedgerModal`, `AdminBookingsPage`, `DepositQrStep`, `CustomerConfirmStep`, `StylistAndSlotStep`, and `BranchAndServiceStep`.

**Blocked by:** 03-pos-checkout-financial-clamping-debounced-vietqr-and-timeline.md

**Status:** resolved

- [x] All POS feature components (`PosOrderDrawer`, `VisualLogTab`, `PosCheckoutTab`, `WalkInModal`, `DispatchBoardPage`, `KanbanBoard`, `CommissionLedgerModal`) refactored so that every file has $\le 250$ LOC.
- [x] All Booking feature components (`AdminBookingsPage`, `DepositQrStep`, `CustomerConfirmStep`, `StylistAndSlotStep`, `BranchAndServiceStep`) refactored so that every file has $\le 250$ LOC.
- [x] All existing POS and Booking interactions, queries, mutations, modals, and drawers function seamlessly without regressions.
