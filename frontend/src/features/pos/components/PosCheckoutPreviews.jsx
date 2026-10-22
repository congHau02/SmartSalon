import React from "react";
import { Sparkles, Coins, ChevronUp, ChevronDown } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export function PosCheckoutPreviews({
  visualLogData,
  productItems = [],
  serviceItems = [],
  showDeductionPreview,
  setShowDeductionPreview,
  showCommissionPreview,
  setShowCommissionPreview,
}) {
  return (
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
                <div className="text-[11px] font-semibold text-slate-300">
                  Sản phẩm bán lẻ nguyên seal:
                </div>
                <div className="divide-y divide-slate-800/60">
                  {productItems.map((p) => (
                    <div key={p.id} className="py-1 flex justify-between text-slate-300">
                      <span>
                        {p.productName} ({p.productSku})
                      </span>
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
                  <div
                    key={step.id}
                    className="py-1.5 flex justify-between items-center text-slate-300"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {step.staffName || "Chưa phân công"}
                      </div>
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
  );
}
