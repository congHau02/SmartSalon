import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  CreditCard,
  Banknote,
  QrCode,
  Check,
  Copy,
  Printer,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Scissors,
  ShoppingBag,
  Coins,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { posApi } from "../../api/posApi";
import { formatCurrency } from "../../lib/utils";
import { QUERY_KEYS } from "../../lib/queryKeys";

export function PosCheckoutTab({
  orderId,
  order,
  branchId,
  discountInput: controlledDiscountInput,
  setDiscountInput: setControlledDiscountInput,
  notesInput: controlledNotesInput,
  setNotesInput: setControlledNotesInput,
  liveFinalAmount: controlledLiveFinalAmount,
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

  // 1. Fetch VietQR data when VIETQR is selected
  const { data: vietQrData, isLoading: isLoadingVietQr } = useQuery({
    queryKey: QUERY_KEYS.posVietQr(orderId, parseFloat(discountInput) || 0),
    queryFn: () => posApi.getPosVietQr(orderId, parseFloat(discountInput) || 0),
    enabled: paymentMethod === "VIETQR" && !!orderId && order?.status !== "PAID",
  });

  // 2. Fetch Visual Log to preview actual BOM vs standard BOM
  const { data: visualLogData } = useQuery({
    queryKey: QUERY_KEYS.visualLog(orderId),
    queryFn: () => posApi.getVisualLog(orderId),
    enabled: !!orderId && order?.status !== "PAID",
  });

  // 3. Checkout Mutation
  const checkoutMutation = useMutation({
    mutationFn: (payload) => posApi.checkoutOrder(orderId, payload),
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
          text:
            err?.response?.data?.message ||
            "Lỗi thanh toán đơn hàng. Vui lòng kiểm tra lại tồn kho và dữ liệu đơn.",
        });
      }
    },
  });

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExecuteCheckout = () => {
    const discountVal = parseFloat(discountInput) || 0;
    checkoutMutation.mutate({
      paymentMethod,
      discountAmount: discountVal,
      notes: notesInput || undefined,
    });
  };

  const isPaid = order?.status === "PAID";
  const items = order?.items || [];
  const serviceItems = items.filter((i) => i.itemType === "SERVICE");
  const productItems = items.filter((i) => i.itemType === "PRODUCT");

  // Calculate live preview financial amounts
  const currentSubtotal = order?.subtotal || 0;
  const currentDiscount = parseFloat(discountInput) || 0;
  const currentDeposit = order?.depositDeducted || 0;
  const liveFinalAmount =
    controlledLiveFinalAmount ??
    Math.max(0, currentSubtotal - currentDiscount - currentDeposit);

  /* =========================================================================
     A. VIEW WHEN ORDER IS PAID: PRINTABLE RECEIPT SUMMARY
     ========================================================================= */
  if (isPaid) {
    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        {/* Paid banner */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Đơn hàng đã thanh toán thành công!</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950">
                  {order.paymentMethod || "PAID"}
                </span>
              </h4>
              <p className="text-xs text-emerald-400/80">
                Tồn kho đã trừ tự động & Hoa hồng đã ghi vào Sổ cái nhân viên.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-emerald-900/30"
          >
            <Printer className="w-4 h-4" />
            <span>In hóa đơn</span>
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-6 shadow-inner print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
          {/* Receipt Header */}
          <div className="text-center pb-5 border-b border-dashed border-slate-800">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Scissors className="w-5 h-5 text-pink-500" />
              <span className="font-black text-lg text-white tracking-wider">SMARTSALON</span>
            </div>
            <p className="text-xs text-slate-400">
              {order.branchName || "SmartSalon Flagship"}
            </p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              HÓA ĐƠN THANH TOÁN DỊCH VỤ / POS RECEIPT
            </p>
          </div>

          {/* Receipt Meta */}
          <div className="grid grid-cols-2 gap-3 text-xs border-b border-dashed border-slate-800 pb-4">
            <div>
              <span className="text-slate-500 block">Mã hóa đơn:</span>
              <strong className="text-white font-mono text-sm">{order.orderCode}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Ngày giờ:</span>
              <span className="text-slate-300 font-mono">
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleString("vi-VN", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })
                  : "--"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Khách hàng:</span>
              <strong className="text-white">{order.customerName || "Khách lẻ"}</strong>
              {order.customerPhone && (
                <span className="text-slate-400 block font-mono text-[11px]">
                  {order.customerPhone}
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Phương thức:</span>
              <span className="font-semibold text-pink-400">
                {order.paymentMethod === "VIETQR"
                  ? "Chuyển khoản VietQR"
                  : order.paymentMethod === "CARD"
                  ? "Thẻ ngân hàng (POS)"
                  : "Tiền mặt (CASH)"}
              </span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-3">
            <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
              <span>Khoản mục</span>
              <span className="text-right">Thành tiền</span>
            </div>
            {items.map((item) => (
              <div key={item.id} className="text-xs space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-white">
                      {item.itemType === "SERVICE" ? item.serviceName : item.productName}
                    </span>
                    <span className="text-slate-400 text-[11px] block">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    {formatCurrency(item.totalPrice)}
                  </span>
                </div>
                {/* Steps and assigned staff */}
                {item.steps?.length > 0 && (
                  <div className="pl-3 border-l-2 border-slate-800 space-y-0.5 text-[11px] text-slate-400">
                    {item.steps.map((s) => (
                      <div key={s.id} className="flex justify-between">
                        <span>• {s.stepName}: {s.staffName || "KTV"}</span>
                        <span className="text-amber-400/90 font-mono">
                          +{formatCurrency(s.commissionAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Financial Totals */}
          <div className="pt-4 border-t border-dashed border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Tổng tiền dịch vụ & sản phẩm:</span>
              <span className="font-mono text-white">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-rose-400">
                <span>Giảm giá / Ưu đãi:</span>
                <span className="font-mono">-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            {order.depositDeducted > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Đã trừ tiền cọc trước (20%):</span>
                <span className="font-mono">-{formatCurrency(order.depositDeducted)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-sm">
              <span className="font-bold text-white">Tổng thực thu đã thanh toán:</span>
              <span className="font-mono font-bold text-lg text-emerald-400">
                {formatCurrency(order.finalAmount)}
              </span>
            </div>
          </div>

          {/* Receipt Footer Message */}
          <div className="text-center pt-4 border-t border-dashed border-slate-800 space-y-1">
            <p className="text-xs font-semibold text-slate-300">
              Cảm ơn Quý khách & Hẹn gặp lại!
            </p>
            <p className="text-[10px] text-slate-500">
              Hotline hỗ trợ: 1900 6868 • smartsalon.vn
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     B. VIEW WHEN ORDER IS UNPAID: CHECKOUT BREAKDOWN & SETTLEMENT
     ========================================================================= */
  return (
    <div className="space-y-6">
      {/* 1. Financial Breakdown Card */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Chi tiết thanh toán hóa đơn</span>
          <span className="text-[11px] text-slate-400 lowercase font-normal">
            {items.length} mục hàng
          </span>
        </h4>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>Tổng tiền tạm tính (Subtotal):</span>
            <span className="font-mono font-bold text-white">
              {formatCurrency(currentSubtotal)}
            </span>
          </div>

          {/* Editable Discount Row */}
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5">
              <span>Giảm giá / Voucher:</span>
            </span>
            <div className="flex items-center gap-1">
              <span className="text-rose-400 font-mono">-</span>
              <input
                type="number"
                min="0"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder="0"
                className="w-28 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-xs text-rose-300 focus:outline-none focus:border-pink-500 font-mono"
              />
              <span className="text-slate-400 text-[11px]">đ</span>
            </div>
          </div>

          {/* Deposit Deducted */}
          {currentDeposit > 0 && (
            <div className="flex justify-between items-center text-emerald-400">
              <div className="flex items-center gap-1.5">
                <span>Đã trừ tiền cọc trước (20% PayOS):</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold">
                  Tự động trừ
                </span>
              </div>
              <span className="font-mono font-bold">
                -{formatCurrency(currentDeposit)}
              </span>
            </div>
          )}

          {/* Final Amount Due */}
          <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-white block">
                Tổng thực thu cần thanh toán:
              </span>
              <span className="text-[11px] text-slate-400">
                Max(0, Tạm tính - Giảm giá - Tiền cọc)
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-mono font-black text-pink-400">
                {formatCurrency(liveFinalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Previews Accordion: Stock Deductions & Staff Commissions */}
      <div className="space-y-2">
        {/* Toggle 1: Chemical & Retail Stock Deductions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setShowDeductionPreview(!showDeductionPreview)}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-white">
                Dự kiến trừ tồn kho hóa chất (ml) & bán lẻ
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-400 text-[11px]">
              <span>
                {visualLogData?.bomItems?.length || 0} hóa chất • {productItems.length} sản phẩm
              </span>
              {showDeductionPreview ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </div>
          </button>

          {showDeductionPreview && (
            <div className="p-3 pt-0 border-t border-slate-800/80 space-y-2">
              <div className="text-[11px] text-slate-400 italic">
                {visualLogData?.isSaved
                  ? "★ Áp dụng định mức tiêu hao thực tế từ Visual Log (Đã điều chỉnh)."
                  : "★ Áp dụng định mức BOM tiêu chuẩn của dịch vụ (Chưa ghi đè trong Visual Log)."}
              </div>

              {visualLogData?.bomItems && visualLogData.bomItems.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-slate-300">Hóa chất tiêu hao:</div>
                  <div className="divide-y divide-slate-800/60">
                    {visualLogData.bomItems.map((b, idx) => (
                      <div key={idx} className="py-1 flex justify-between text-slate-300">
                        <span>{b.productName}</span>
                        <span className="font-mono text-purple-300">
                          {b.actualAmount} {b.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {productItems.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="text-[11px] font-semibold text-slate-300">Sản phẩm bán lẻ nguyên seal:</div>
                  <div className="divide-y divide-slate-800/60">
                    {productItems.map((p) => (
                      <div key={p.id} className="py-1 flex justify-between text-slate-300">
                        <span>{p.productName} ({p.productSku})</span>
                        <span className="font-mono text-emerald-400">
                          -{p.quantity} hộp/chai
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Toggle 2: Staff Commission Split */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setShowCommissionPreview(!showCommissionPreview)}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white">
                Dự kiến hạch toán Sổ cái Hoa hồng thợ
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-400 text-[11px]">
              <span>Công thức 2 cấp (Pool Rate x Trọng số)</span>
              {showCommissionPreview ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </div>
          </button>

          {showCommissionPreview && (
            <div className="p-3 pt-0 border-t border-slate-800/80 space-y-2">
              <div className="divide-y divide-slate-800/60">
                {serviceItems.map((item) =>
                  item.steps?.map((step) => (
                    <div key={step.id} className="py-1.5 flex justify-between items-center text-slate-300">
                      <div>
                        <div className="font-semibold text-white">{step.staffName || "Chưa phân công"}</div>
                        <div className="text-[11px] text-slate-400">
                          {item.serviceName} • {step.stepName} ({step.commissionRate}%)
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-amber-400">
                        {formatCurrency(step.commissionAmount)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Payment Method Selection */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
          Phương thức thanh toán
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setPaymentMethod("CASH")}
            className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
              paymentMethod === "CASH"
                ? "bg-pink-600/10 border-pink-500 text-pink-400 shadow-sm"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <Banknote className="w-5 h-5" />
            <span className="text-xs font-bold">Tiền mặt</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("VIETQR")}
            className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
              paymentMethod === "VIETQR"
                ? "bg-pink-600/10 border-pink-500 text-pink-400 shadow-sm"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <QrCode className="w-5 h-5" />
            <span className="text-xs font-bold">VietQR</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("CARD")}
            className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
              paymentMethod === "CARD"
                ? "bg-pink-600/10 border-pink-500 text-pink-400 shadow-sm"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-xs font-bold">Quẹt thẻ</span>
          </button>
        </div>
      </div>

      {/* 4. Dynamic VietQR Box (Shown only when VIETQR selected) */}
      {paymentMethod === "VIETQR" && (
        <div className="p-4 rounded-2xl bg-white border border-pink-200 text-slate-900 space-y-4 shadow-sm animate-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-pink-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-pink-700">
                Mã VietQR thanh toán tự động
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Đúng số tiền {formatCurrency(liveFinalAmount)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* QR Code Canvas */}
            <div className="w-44 h-44 p-2 rounded-xl border border-dashed border-pink-300 bg-white flex items-center justify-center shrink-0">
              {isLoadingVietQr ? (
                <div className="flex flex-col items-center gap-1 text-[11px] text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
                  <span>Đang tải QR...</span>
                </div>
              ) : vietQrData?.qrCodeUrl ? (
                <img
                  src={vietQrData.qrCodeUrl}
                  alt="POS VietQR Code"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-[11px] text-slate-400">Không thể tạo mã QR</div>
              )}
            </div>

            {/* Bank details & Copy controls */}
            <div className="space-y-2 text-xs flex-1 w-full">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-[11px] text-slate-500">Ngân hàng thụ hưởng:</div>
                <div className="font-bold text-slate-800">
                  {vietQrData?.bankId || "MB"} - {vietQrData?.accountName || "SMART SALON VIETNAM"}
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-500">Số tài khoản:</div>
                  <div className="font-mono font-bold text-slate-900">
                    {vietQrData?.accountNo || "0988888888"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(vietQrData?.accountNo || "0988888888", "acc")}
                  className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 hover:text-pink-600 hover:border-pink-300 text-xs flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === "acc" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedField === "acc" ? "Đã chép" : "Sao chép"}</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-pink-50/60 border border-pink-200">
                <div>
                  <div className="text-[10px] text-pink-700 font-semibold">Nội dung chuyển khoản:</div>
                  <div className="font-mono font-bold text-pink-900">
                    {vietQrData?.description || order.orderCode}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(vietQrData?.description || order.orderCode, "desc")
                  }
                  className="p-1.5 rounded-lg bg-white border border-pink-300 text-pink-700 hover:bg-pink-50 text-xs flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === "desc" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedField === "desc" ? "Đã chép" : "Sao chép"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Checkout Action Button */}
      <div className="pt-2">
        <button
          type="button"
          disabled={checkoutMutation.isPending || items.length === 0}
          onClick={handleExecuteCheckout}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {checkoutMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang thực hiện thanh toán & trừ kho...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>
                Xác nhận Thanh toán & Chốt đơn ({formatCurrency(liveFinalAmount)})
              </span>
            </>
          )}
        </button>
        <p className="text-[11px] text-center text-slate-500 mt-2">
          Giao dịch nguyên tử: Tự động trừ định mức hóa chất, sản phẩm bán lẻ, ghi nhận hoa hồng và hoàn tất lịch hẹn.
        </p>
      </div>
    </div>
  );
}
