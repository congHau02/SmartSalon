import { describe, it, expect } from "vitest";
import { calculateClampedDiscount } from "../lib/utils";
import { QUERY_KEYS } from "../lib/queryKeys";

/**
 * Pure state reducer modeling the draft synchronization logic of usePosOrder
 */
function syncOrderDraftState({
  baseline,
  currentDraft,
  order,
  isOpen = true,
  actionType = "ORDER_FETCH",
  savePayload = null,
}) {
  if (!isOpen) {
    return {
      baseline: { id: null, discountAmount: null, notes: null },
      draft: currentDraft,
    };
  }

  if (actionType === "ORDER_SAVE_SUCCESS") {
    const newDiscount =
      savePayload?.discountAmount != null
        ? savePayload.discountAmount
        : order?.discountAmount ?? 0;
    const newNotes = savePayload?.notes != null ? savePayload.notes : order?.notes ?? "";

    const newBaseline = {
      id: order?.id,
      discountAmount: newDiscount,
      notes: newNotes,
    };
    return {
      baseline: newBaseline,
      draft: {
        discountInput: String(newDiscount),
        notesInput: newNotes,
      },
    };
  }

  if (!order) return { baseline, draft: currentDraft };

  const isDifferentOrder = order.id !== baseline.id;
  if (isDifferentOrder) {
    const newBaseline = {
      id: order.id,
      discountAmount: order.discountAmount != null ? order.discountAmount : 0,
      notes: order.notes || "",
    };
    return {
      baseline: newBaseline,
      draft: {
        discountInput: order.discountAmount ? String(order.discountAmount) : "0",
        notesInput: order.notes || "",
      },
    };
  }

  // Same order background refetch:
  const currentServerDiscount = order.discountAmount != null ? order.discountAmount : 0;
  const currentServerNotes = order.notes || "";

  const isDiscountUntouched =
    currentDraft.discountInput === String(baseline.discountAmount || 0);
  const isNotesUntouched = currentDraft.notesInput === (baseline.notes || "");

  const nextBaseline = { ...baseline };
  const nextDraft = { ...currentDraft };

  if (isDiscountUntouched && currentServerDiscount !== baseline.discountAmount) {
    nextBaseline.discountAmount = currentServerDiscount;
    nextDraft.discountInput = currentServerDiscount ? String(currentServerDiscount) : "0";
  }

  if (isNotesUntouched && currentServerNotes !== baseline.notes) {
    nextBaseline.notes = currentServerNotes;
    nextDraft.notesInput = currentServerNotes;
  }

  return { baseline: nextBaseline, draft: nextDraft };
}

describe("POS Order Draft State & Server Baseline Sync", () => {
  it("initializes draft inputs from server values when opening an order", () => {
    const order = { id: 101, discountAmount: 30000, notes: "Khách VIP giảm giá 10%" };
    const initial = syncOrderDraftState({
      baseline: { id: null, discountAmount: null, notes: null },
      currentDraft: { discountInput: "0", notesInput: "" },
      order,
    });

    expect(initial.baseline.id).toBe(101);
    expect(initial.draft.discountInput).toBe("30000");
    expect(initial.draft.notesInput).toBe("Khách VIP giảm giá 10%");
  });

  it("preserves in-progress local drafts across background order refetches", () => {
    const order = { id: 101, discountAmount: 30000, notes: "Gốc" };
    // User opened order
    let state = syncOrderDraftState({
      baseline: { id: null, discountAmount: null, notes: null },
      currentDraft: { discountInput: "0", notesInput: "" },
      order,
    });

    // User is typing a draft: changed discount to 50000 and notes to "Đang cắt tóc"
    state.draft.discountInput = "50000";
    state.draft.notesInput = "Đang cắt tóc";

    // Background refetch arrives (e.g., step status was updated by stylist)
    const backgroundRefetchedOrder = {
      ...order,
      subtotal: 450000, // item added
      items: [{ id: 1, name: "Uốn tóc" }],
    };

    const afterRefetch = syncOrderDraftState({
      baseline: state.baseline,
      currentDraft: state.draft,
      order: backgroundRefetchedOrder,
    });

    // Draft MUST NOT be wiped out
    expect(afterRefetch.draft.discountInput).toBe("50000");
    expect(afterRefetch.draft.notesInput).toBe("Đang cắt tóc");
  });

  it("updates inputs on background refetch if user has not modified them", () => {
    const order = { id: 101, discountAmount: 20000, notes: "Ghi chú 1" };
    let state = syncOrderDraftState({
      baseline: { id: null, discountAmount: null, notes: null },
      currentDraft: { discountInput: "0", notesInput: "" },
      order,
    });

    // Another receptionist on another tablet updated the discount to 40000
    const serverUpdatedOrder = { id: 101, discountAmount: 40000, notes: "Ghi chú mới" };
    const afterRefetch = syncOrderDraftState({
      baseline: state.baseline,
      currentDraft: state.draft,
      order: serverUpdatedOrder,
    });

    expect(afterRefetch.draft.discountInput).toBe("40000");
    expect(afterRefetch.draft.notesInput).toBe("Ghi chú mới");
  });

  it("resets draft and baseline when updateOrderMutation succeeds", () => {
    const order = { id: 101, discountAmount: 20000, notes: "Cũ" };
    const saved = syncOrderDraftState({
      baseline: { id: 101, discountAmount: 20000, notes: "Cũ" },
      currentDraft: { discountInput: "75000", notesInput: "Mới" },
      order,
      actionType: "ORDER_SAVE_SUCCESS",
      savePayload: { discountAmount: 75000, notes: "Đã lưu thành công" },
    });

    expect(saved.baseline.discountAmount).toBe(75000);
    expect(saved.draft.discountInput).toBe("75000");
    expect(saved.draft.notesInput).toBe("Đã lưu thành công");
  });

  it("resets baseline when drawer is closed so reopening syncs fresh", () => {
    const closed = syncOrderDraftState({
      baseline: { id: 101, discountAmount: 20000, notes: "Cũ" },
      currentDraft: { discountInput: "20000", notesInput: "Cũ" },
      order: null,
      isOpen: false,
    });

    expect(closed.baseline.id).toBe(null);
  });
});

describe("POS VietQR Query Key & Clamping Integration", () => {
  it("creates stable VietQR query keys with sanitized discount", () => {
    const subtotal = 300000;
    const deposit = 50000;
    const typedDiscount = "100000";

    const clamped = calculateClampedDiscount(typedDiscount, subtotal, deposit);
    const key = QUERY_KEYS.posVietQr(99, clamped);

    expect(key).toEqual(["pos-vietqr", 99, 100000]);
  });
});
