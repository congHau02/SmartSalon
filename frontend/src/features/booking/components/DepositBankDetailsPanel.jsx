import React from "react";
import { Copy, Check, Zap, Loader2 } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export function DepositBankDetailsPanel({
  paymentInfo,
  booking,
  copiedField,
  onCopy,
  onSimulate,
  isSimulating,
}) {
  return (
    <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-900 text-base">Thông tin chuyển khoản</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Hệ thống sẽ tự động cập nhật ngay khi ngân hàng báo giao dịch thành công (Polling 2.5s)
        </p>
      </div>

      <div className="space-y-3 text-xs">
        {/* Bank Name */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
          <strong className="text-slate-900 font-bold">
            {paymentInfo?.bankId || "MB"} (Quân Đội)
          </strong>
        </div>

        {/* Account Number */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-slate-500">Số tài khoản:</span>
          <div className="flex items-center gap-2">
            <strong className="text-slate-900 font-mono text-sm">
              {paymentInfo?.accountNo || "0988888888"}
            </strong>
            <button
              type="button"
              onClick={() => onCopy(paymentInfo?.accountNo || "0988888888", "accountNo")}
              aria-label="Sao chép số tài khoản"
              title="Sao chép số tài khoản"
              className="p-1 text-slate-400 hover:text-pink-600 rounded transition-colors cursor-pointer"
            >
              {copiedField === "accountNo" ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Account Name */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-slate-500">Chủ tài khoản:</span>
          <strong className="text-slate-900 uppercase">
            {paymentInfo?.accountName || "SMART SALON VIETNAM"}
          </strong>
        </div>

        {/* Deposit Amount */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-pink-50/70 border border-pink-200">
          <span className="text-pink-800 font-bold">Số tiền cọc (20%):</span>
          <div className="flex items-center gap-2">
            <strong className="text-pink-700 font-black text-base font-mono">
              {formatCurrency(paymentInfo?.amount || booking?.depositAmount || 0)}
            </strong>
            <button
              type="button"
              onClick={() =>
                onCopy(
                  String(paymentInfo?.amount || booking?.depositAmount || 0),
                  "amount"
                )
              }
              aria-label="Sao chép số tiền"
              title="Sao chép số tiền"
              className="p-1 text-pink-500 hover:text-pink-700 rounded transition-colors cursor-pointer"
            >
              {copiedField === "amount" ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Transfer Memo */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/80 border border-amber-200">
          <span className="text-amber-800 font-bold">Nội dung chuyển khoản (Bắt buộc):</span>
          <div className="flex items-center gap-2">
            <strong className="text-amber-900 font-mono font-bold text-sm">
              {paymentInfo?.description || booking?.bookingCode}
            </strong>
            <button
              type="button"
              onClick={() =>
                onCopy(
                  paymentInfo?.description || booking?.bookingCode,
                  "description"
                )
              }
              aria-label="Sao chép nội dung"
              title="Sao chép nội dung chuyển khoản"
              className="p-1 text-amber-600 hover:text-amber-800 rounded transition-colors cursor-pointer"
            >
              {copiedField === "description" ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sandbox Testing Simulation Button */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400">Chế độ kiểm thử (Sandbox):</span>
        <button
          type="button"
          onClick={onSimulate}
          disabled={isSimulating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          {isSimulating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5 fill-current" />
          )}
          <span>Giả lập PayOS Webhook</span>
        </button>
      </div>
    </div>
  );
}
