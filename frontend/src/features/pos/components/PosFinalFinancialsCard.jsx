import React from "react";
import { Tag, Loader2, X, Check } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export function PosFinalFinancialsCard({
  order,
  subtotal,
  discountInput,
  setDiscountInput,
  depositDeducted,
  effectiveLiveFinal,
  voucherInput = "",
  setVoucherInput,
  voucherErrorMessage,
  onApplyVoucher,
  onRemoveVoucher,
  isApplyingVoucher = false,
  isRemovingVoucher = false,
}) {
  const isPaid = order?.status === "PAID";
  const hasVoucher = Boolean(order?.voucherCode);
  const isManual = Boolean(order?.isDiscountManual);
  const tierAmount = Number(order?.tierDiscountAmount || 0);
  const voucherAmount = Number(order?.voucherDiscountAmount || 0);
  const hasBoth = !isManual && tierAmount > 0 && voucherAmount > 0;

  return (
    <div className="p-4 rounded-2xl bg-slate-850/80 border border-slate-800 space-y-3 shadow-sm">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
        Chi tiết thanh toán cuối cùng
      </h4>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>Tổng giá trị dịch vụ & sản phẩm:</span>
          <span className="font-mono text-slate-200">{formatCurrency(subtotal)}</span>
        </div>

        {/* Voucher Code Input & Apply / Remove */}
        {!isPaid && (
          <div className="pt-2 pb-1 border-t border-slate-800/60">
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              {hasVoucher ? (
                <div className="flex-1 flex items-center justify-between bg-pink-500/10 border border-pink-500/20 rounded-lg px-2.5 py-1 text-xs text-pink-300">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="text-[11px] text-pink-400">Voucher áp dụng:</span>
                    <span className="font-mono font-bold text-white tracking-wider">{order.voucherCode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onRemoveVoucher}
                    disabled={isRemovingVoucher}
                    className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {isRemovingVoucher ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                    <span>Gỡ</span>
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex gap-1.5">
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput && setVoucherInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (onApplyVoucher) onApplyVoucher(voucherInput);
                      }
                    }}
                    placeholder="MÃ GIẢM GIÁ (VD: TET2026)"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 font-mono uppercase text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                  />
                  <button
                    type="button"
                    onClick={() => onApplyVoucher && onApplyVoucher(voucherInput)}
                    disabled={isApplyingVoucher || !voucherInput?.trim()}
                    className="px-3 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isApplyingVoucher ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    <span>Áp dụng</span>
                  </button>
                </div>
              )}
            </div>
            {voucherErrorMessage && (
              <p className="mt-1 text-[11px] text-rose-400 font-medium pl-5">
                {voucherErrorMessage}
              </p>
            )}
            {order?.voucherNotice && (
              <p className="mt-1 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded p-1.5">
                {order.voucherNotice}
              </p>
            )}
          </div>
        )}

        {/* Discount Line & Breakdown */}
        <div className="flex justify-between items-center text-slate-300 pt-1">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span>Chiết khấu / Giảm giá:</span>
              {isManual ? (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-medium">
                  Ghi đè thủ công
                </span>
              ) : order?.discountSource === "VOUCHER" ? (
                <span className="text-[10px] text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded border border-pink-500/20 font-medium">
                  Voucher {order.voucherCode}
                </span>
              ) : order?.discountSource === "TIER" ? (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-medium">
                  Hạng {order.customerMembershipTier} (-{order.customerDiscountPercent}%)
                </span>
              ) : null}
            </div>
            {hasBoth && order?.discountSource === "VOUCHER" && (
              <span className="text-[10px] text-slate-400">
                Ưu đãi hạng {order.customerMembershipTier} (-{formatCurrency(tierAmount)}) thấp hơn voucher, không cộng dồn.
              </span>
            )}
            {hasBoth && order?.discountSource === "TIER" && (
              <span className="text-[10px] text-slate-400">
                Voucher {order.voucherCode} (-{formatCurrency(voucherAmount)}) thấp hơn ưu đãi hạng {order.customerMembershipTier}.
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              placeholder="0"
              aria-label="Số tiền giảm giá"
              className="w-28 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-right font-mono text-white text-xs focus:outline-none focus:border-pink-500"
            />
            <span className="text-[11px] text-slate-400">đ</span>
          </div>
        </div>

        {depositDeducted > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>Đã thanh toán cọc trước (20%):</span>
            <span className="font-mono">-{formatCurrency(depositDeducted)}</span>
          </div>
        )}

        <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-sm font-bold text-white">
          <span>Số tiền khách cần trả:</span>
          <span className="text-lg font-mono text-pink-400">
            {formatCurrency(effectiveLiveFinal)}
          </span>
        </div>
      </div>
    </div>
  );
}
