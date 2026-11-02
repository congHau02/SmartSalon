import { useState } from "react";
import { copyToClipboard, calculateClampedDiscount } from "../../lib/utils";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import {
  usePosVietQr,
  useVisualLog,
  useCheckoutOrder,
  useApplyVoucher,
  useRemoveVoucher,
} from "./usePosQueries";
import { resolveVoucherErrorMessage } from "../voucher/voucher.constants";

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
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherErrorMessage, setVoucherErrorMessage] = useState(null);

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

  const applyVoucherMutation = useApplyVoucher(orderId, {
    onSuccess: (data) => {
      setVoucherInput("");
      setVoucherErrorMessage(null);
      if (setDiscountInput && data?.discountAmount != null) {
        setDiscountInput(String(data.discountAmount));
      }
      if (onNotice) {
        onNotice({
          type: "success",
          text: `Áp dụng mã ${data?.voucherCode || ""} thành công!`,
        });
      }
    },
    onError: (err) => {
      const msg = resolveVoucherErrorMessage(err);
      setVoucherErrorMessage(msg);
      if (onNotice) {
        onNotice({ type: "error", text: msg });
      }
    },
  });

  const removeVoucherMutation = useRemoveVoucher(orderId, {
    onSuccess: (data) => {
      setVoucherErrorMessage(null);
      if (setDiscountInput && data?.discountAmount != null) {
        setDiscountInput(String(data.discountAmount));
      }
      if (onNotice) {
        onNotice({
          type: "success",
          text: "Đã gỡ mã giảm giá khỏi đơn hàng.",
        });
      }
    },
    onError: (err) => {
      if (onNotice) {
        onNotice({
          type: "error",
          text: err?.response?.data?.message || "Không thể gỡ mã giảm giá.",
        });
      }
    },
  });

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

  const handleApplyVoucher = (code) => {
    const targetCode = (code || voucherInput || "").trim();
    if (!targetCode) {
      setVoucherErrorMessage("Vui lòng nhập mã giảm giá");
      return;
    }
    setVoucherErrorMessage(null);
    applyVoucherMutation.mutate(targetCode);
  };

  const handleRemoveVoucher = () => {
    setVoucherErrorMessage(null);
    removeVoucherMutation.mutate();
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
    voucherInput,
    setVoucherInput,
    voucherErrorMessage,
    setVoucherErrorMessage,
    handleApplyVoucher,
    handleRemoveVoucher,
    isApplyingVoucher: applyVoucherMutation.isPending,
    isRemovingVoucher: removeVoucherMutation.isPending,
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
