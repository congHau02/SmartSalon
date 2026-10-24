import React from "react";
import { CreditCard, Banknote, QrCode, Check, Loader2 } from "lucide-react";
import { formatCurrency } from "../../lib/utils";
import { PosReceiptView } from "./components/PosReceiptView";
import { PosCheckoutPreviews } from "./components/PosCheckoutPreviews";
import { PosVietQrPanel } from "./components/PosVietQrPanel";
import { PosFinalFinancialsCard } from "./components/PosFinalFinancialsCard";
import { usePosCheckout } from "./usePosCheckout";

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
  const {
    paymentMethod,
    setPaymentMethod,
    discountInput,
    setDiscountInput,
    subtotal,
    depositDeducted,
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
  } = usePosCheckout({
    orderId,
    order,
    controlledDiscountInput,
    setControlledDiscountInput,
    controlledNotesInput,
    setControlledNotesInput,
    controlledLiveFinalAmount,
    onNotice,
    onCheckoutSuccess,
  });

  const isPaid = order?.status === "PAID";
  const items = order?.items || [];
  const serviceItems = items.filter((i) => i.itemType === "SERVICE");
  const productItems = items.filter((i) => i.itemType === "PRODUCT");

  if (!order) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Đang tải thông tin thanh toán...
      </div>
    );
  }

  if (isPaid) {
    return <PosReceiptView order={order} items={items} onPrint={handlePrint} />;
  }

  return (
    <div className="space-y-6">
      <PosFinalFinancialsCard
        order={order}
        subtotal={subtotal}
        discountInput={discountInput}
        setDiscountInput={setDiscountInput}
        depositDeducted={depositDeducted}
        effectiveLiveFinal={effectiveLiveFinal}
      />

      <PosCheckoutPreviews
        order={order}
        visualLogData={visualLogData}
        productItems={productItems}
        serviceItems={serviceItems}
        showDeductionPreview={showDeductionPreview}
        setShowDeductionPreview={setShowDeductionPreview}
        showCommissionPreview={showCommissionPreview}
        setShowCommissionPreview={setShowCommissionPreview}
      />

      {/* Payment Method Selection */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
          Chọn phương thức thanh toán
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setPaymentMethod("CASH")}
            className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              paymentMethod === "CASH"
                ? "bg-pink-600/20 border-pink-500 text-pink-300 shadow-md shadow-pink-900/20"
                : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <Banknote className="w-5 h-5" />
            <span>Tiền mặt</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("VIETQR")}
            className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              paymentMethod === "VIETQR"
                ? "bg-pink-600/20 border-pink-500 text-pink-300 shadow-md shadow-pink-900/20"
                : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <QrCode className="w-5 h-5" />
            <span>Chuyển khoản VietQR</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("CARD")}
            className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              paymentMethod === "CARD"
                ? "bg-pink-600/20 border-pink-500 text-pink-300 shadow-md shadow-pink-900/20"
                : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span>Quẹt thẻ POS</span>
          </button>
        </div>
      </div>

      {paymentMethod === "VIETQR" && (
        <PosVietQrPanel
          vietQrData={vietQrData}
          isLoadingVietQr={isLoadingVietQr}
          liveFinalAmount={effectiveLiveFinal}
          orderCode={order.orderCode}
          onCopy={handleCopy}
          copiedField={copiedField}
        />
      )}

      {/* Checkout Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleExecuteCheckout}
          disabled={checkoutMutation.isPending}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-pink-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {checkoutMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang chốt đơn & trừ kho...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>
                Xác nhận thanh toán ({formatCurrency(effectiveLiveFinal)})
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
