import React from "react";
import { formatCurrency } from "../../../lib/utils";

export function PosFinalFinancialsCard({
  order,
  subtotal,
  discountInput,
  setDiscountInput,
  depositDeducted,
  effectiveLiveFinal,
}) {
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

        <div className="flex justify-between items-center text-slate-300">
          <div className="flex items-center gap-1.5">
            <span>Chiết khấu / Giảm giá trực tiếp:</span>
            {order?.isDiscountManual ? (
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-medium">
                Ghi đè thủ công
              </span>
            ) : order?.customerDiscountPercent > 0 ? (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-medium">
                Hạng {order.customerMembershipTier} (-{order.customerDiscountPercent}%)
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              placeholder="0"
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
