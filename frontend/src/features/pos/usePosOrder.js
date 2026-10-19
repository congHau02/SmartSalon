import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { posApi } from "../../api/posApi";
import { QUERY_KEYS, invalidateRealtimeCaches } from "../../lib/queryKeys";

export function usePosOrder(orderId, isOpen = true, { onNotice } = {}) {
  const queryClient = useQueryClient();
  const [discountInput, setDiscountInput] = useState("0");
  const [notesInput, setNotesInput] = useState("");

  const {
    data: order,
    isLoading: isLoadingOrder,
    refetch: refetchOrder,
  } = useQuery({
    queryKey: QUERY_KEYS.order(orderId),
    queryFn: () => posApi.getOrderById(orderId),
    enabled: !!orderId && isOpen,
  });

  useEffect(() => {
    if (order) {
      setDiscountInput(order.discountAmount ? String(order.discountAmount) : "0");
      setNotesInput(order.notes || "");
    }
  }, [order]);

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
    onSuccess: () => invalidateOrderWorkspace("Cập nhật giảm giá và ghi chú thành công!"),
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
  const currentDiscount = Math.max(0, parseFloat(discountInput) || 0);
  const currentDeposit = Number(order?.depositDeducted || 0);
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
