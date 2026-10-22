import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { posApi } from "../../api/posApi";
import { QUERY_KEYS, invalidateRealtimeCaches } from "../../lib/queryKeys";
import { calculateClampedDiscount } from "../../lib/utils";

export function usePosOrder(orderId, isOpen = true, { onNotice } = {}) {
  const queryClient = useQueryClient();
  const [discountInput, setDiscountInput] = useState("0");
  const [notesInput, setNotesInput] = useState("");
  const serverBaselineRef = useRef({ id: null, discountAmount: null, notes: null });

  const {
    data: order,
    isLoading: isLoadingOrder,
    refetch: refetchOrder,
  } = useQuery({
    queryKey: QUERY_KEYS.order(orderId),
    queryFn: () => posApi.getOrderById(orderId),
    enabled: !!orderId && isOpen,
  });

  // Reset baseline when drawer is closed so reopening the same order syncs fresh
  useEffect(() => {
    if (!isOpen) {
      serverBaselineRef.current = { id: null, discountAmount: null, notes: null };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!order) return;

    const isDifferentOrder = order.id !== serverBaselineRef.current.id;
    if (isDifferentOrder) {
      serverBaselineRef.current = {
        id: order.id,
        discountAmount: order.discountAmount != null ? order.discountAmount : 0,
        notes: order.notes || "",
      };
      setDiscountInput(order.discountAmount ? String(order.discountAmount) : "0");
      setNotesInput(order.notes || "");
      return;
    }

    // On background refetch of same order:
    // If the local input matches baseline (user is not typing dirty draft), update to server changes
    const currentServerDiscount = order.discountAmount != null ? order.discountAmount : 0;
    const currentServerNotes = order.notes || "";

    const isDiscountUntouched =
      discountInput === String(serverBaselineRef.current.discountAmount || 0);
    const isNotesUntouched = notesInput === (serverBaselineRef.current.notes || "");

    if (isDiscountUntouched && currentServerDiscount !== serverBaselineRef.current.discountAmount) {
      serverBaselineRef.current.discountAmount = currentServerDiscount;
      setDiscountInput(currentServerDiscount ? String(currentServerDiscount) : "0");
    }

    if (isNotesUntouched && currentServerNotes !== serverBaselineRef.current.notes) {
      serverBaselineRef.current.notes = currentServerNotes;
      setNotesInput(currentServerNotes);
    }
  }, [order, discountInput, notesInput]);

  const invalidateOrderWorkspace = useCallback(
    (successText) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.order(orderId) });
      invalidateRealtimeCaches(queryClient);
      if (successText && onNotice) {
        onNotice({ type: "success", text: successText });
      }
    },
    [queryClient, orderId, onNotice]
  );

  const notifyError = useCallback(
    (err, fallbackText) => {
      if (onNotice) {
        onNotice({
          type: "error",
          text: err?.response?.data?.message || fallbackText,
        });
      }
    },
    [onNotice]
  );

  const addServiceMutation = useMutation({
    mutationFn: (data) => posApi.addServiceItem(orderId, data),
    onSuccess: () => invalidateOrderWorkspace("Đã thêm dịch vụ vào đơn hàng thành công!"),
    onError: (err) => notifyError(err, "Không thể thêm dịch vụ."),
  });

  const addProductMutation = useMutation({
    mutationFn: (data) => posApi.addProductItem(orderId, data),
    onSuccess: () => invalidateOrderWorkspace("Đã thêm sản phẩm bán lẻ vào đơn hàng!"),
    onError: (err) => notifyError(err, "Không thể thêm sản phẩm."),
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId) => posApi.removeOrderItem(orderId, itemId),
    onSuccess: () => invalidateOrderWorkspace("Đã xóa mục hàng khỏi đơn!"),
    onError: (err) => notifyError(err, "Không thể xóa mục hàng."),
  });

  const updateOrderMutation = useMutation({
    mutationFn: (data) => posApi.updateOrder(orderId, data),
    onSuccess: (updated) => {
      const newDiscount =
        updated?.discountAmount != null ? updated.discountAmount : order?.discountAmount;
      const newNotes = updated?.notes != null ? updated.notes : order?.notes;
      serverBaselineRef.current = {
        id: orderId,
        discountAmount: newDiscount != null ? newDiscount : 0,
        notes: newNotes || "",
      };
      setDiscountInput(newDiscount != null ? String(newDiscount) : "0");
      setNotesInput(newNotes || "");
      invalidateOrderWorkspace("Cập nhật giảm giá và ghi chú thành công!");
    },
    onError: (err) => notifyError(err, "Không thể cập nhật đơn."),
  });

  const updateStepAssignmentMutation = useMutation({
    mutationFn: ({ stepId, data }) => posApi.updateStepAssignment(orderId, stepId, data),
    onSuccess: () => invalidateOrderWorkspace("Đã cập nhật phân công và tính lại hoa hồng!"),
    onError: (err) => notifyError(err, "Không thể cập nhật phân công bước."),
  });

  const updateStepStatusMutation = useMutation({
    mutationFn: ({ stepId, data }) => posApi.updateStepStatus(orderId, stepId, data),
    onSuccess: () => invalidateOrderWorkspace("Đã cập nhật tiến độ bước kỹ thuật!"),
    onError: (err) => notifyError(err, "Không thể cập nhật trạng thái bước."),
  });

  const currentSubtotal = Number(order?.subtotal || 0);
  const currentDeposit = Number(order?.depositDeducted || 0);
  const currentDiscount = calculateClampedDiscount(discountInput, currentSubtotal, currentDeposit);
  const liveFinalAmount = Math.max(0, currentSubtotal - currentDiscount - currentDeposit);

  const allSteps = order?.items?.flatMap((i) => i.steps || []) || [];
  const completedSteps = allSteps.filter((s) => s.status === "COMPLETED").length;
  const inProgressSteps = allSteps.filter((s) => s.status === "IN_PROGRESS").length;
  const totalSteps = allSteps.length;
  const isAllStepsCompleted = totalSteps > 0 && completedSteps === totalSteps;
  const isOrderSettled = order?.status === "PAID" || order?.status === "CANCELLED";

  return {
    order,
    isLoadingOrder,
    refetchOrder,
    discountInput,
    setDiscountInput,
    notesInput,
    setNotesInput,
    currentSubtotal,
    currentDiscount,
    currentDeposit,
    liveFinalAmount,
    completedSteps,
    inProgressSteps,
    totalSteps,
    isAllStepsCompleted,
    isOrderSettled,
    invalidateOrderWorkspace,
    addServiceMutation,
    addProductMutation,
    removeItemMutation,
    updateOrderMutation,
    updateStepAssignmentMutation,
    updateStepStatusMutation,
  };
}
