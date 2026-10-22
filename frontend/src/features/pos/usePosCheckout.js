import { useState } from "react";
import { formatCurrency, copyToClipboard, calculateClampedDiscount } from "../../lib/utils";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { usePosVietQr, useVisualLog, useCheckoutOrder } from "./usePosQueries";

export function usePosCheckout({
  orderId,
  order,
  controlledDiscountInput,
  setControlledDiscountInput,
  controlledNotesInput,
  setControlledNotesInput,
  controlledLiveFinalAmount,
  onNotice,
  onCheckoutSuccess,
}) {
  const [paymentMethod, setPaymentMethod] = useState("CASH"); // 'CASH' | 'VIETQR' | 'CARD'
  const [localDiscountInput, setLocalDiscountInput] = useState(
    order?.discountAmount ? order.discountAmount.toString() : "0"
  );
  const [localNotesInput, setLocalNotesInput] = useState(order?.notes || "");
  const discountInput = controlledDiscountInput ?? localDiscountInput;
  const setDiscountInput = setControlledDiscountInput ?? setLocalDiscountInput;
  const notesInput = controlledNotesInput ?? localNotesInput;
  const setNotesInput = setControlledNotesInput ?? setLocalNotesInput;
  const [copiedField, setCopiedField] = useState(null);
  const [showDeductionPreview, setShowDeductionPreview] = useState(false);
  const [showCommissionPreview, setShowCommissionPreview] = useState(false);

  const subtotal = Number(order?.subtotal || 0);
  const depositDeducted = Number(order?.depositDeducted || 0);
  const sanitizedDiscount = calculateClampedDiscount(discountInput, subtotal, depositDeducted);
  const debouncedDiscount = useDebouncedValue(sanitizedDiscount, 400);

  const { data: vietQrData, isLoading: isLoadingVietQr } = usePosVietQr(
    orderId,
    debouncedDiscount,
    {
      enabled: paymentMethod === "VIETQR" && !!orderId && order?.status !== "PAID",
    }
  );

  const { data: visualLogData } = useVisualLog(orderId, {
    enabled: !!orderId && order?.status !== "PAID",
  });

  const checkoutMutation = useCheckoutOrder(orderId, {
    onSuccess: (data) => {
      if (onCheckoutSuccess) {
        onCheckoutSuccess(data);
      }
      if (onNotice) {
        onNotice({
          type: "success",
          text: `Thanh toán thành công đơn hàng ${data.orderCode}! Hóa đơn đã được chốt.`,
        });
      }
    },
    onError: (err) => {
      if (onNotice) {
        onNotice({
          type: "error",
          text: err?.response?.data?.message || "Thanh toán thất bại. Vui lòng kiểm tra lại.",
        });
      }
    },
  });

  const handleCopy = async (text, fieldName) => {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExecuteCheckout = () => {
    checkoutMutation.mutate({
      paymentMethod,
      discountAmount: sanitizedDiscount,
      notes: notesInput || undefined,
    });
  };

  const effectiveLiveFinal =
    controlledLiveFinalAmount !== undefined
      ? controlledLiveFinalAmount
      : Math.max(0, subtotal - sanitizedDiscount - depositDeducted);

  return {
    paymentMethod,
    setPaymentMethod,
    discountInput,
    setDiscountInput,
    notesInput,
    setNotesInput,
    subtotal,
    depositDeducted,
    sanitizedDiscount,
    effectiveLiveFinal,
    vietQrData,
    isLoadingVietQr,
    visualLogData,
    checkoutMutation,
    copiedField,
    handleCopy,
    handlePrint,
    handleExecuteCheckout,
    showDeductionPreview,
    setShowDeductionPreview,
    showCommissionPreview,
    setShowCommissionPreview,
  };
}
