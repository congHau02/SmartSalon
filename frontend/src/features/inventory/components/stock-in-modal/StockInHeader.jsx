import React from "react";
import { ArrowDownToLine, Building2, X } from "lucide-react";

export function StockInHeader({ branchName, titleId, onClose, isSubmitting }) {
  return (
    <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/60">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <ArrowDownToLine className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h2 id={titleId} className="text-lg font-bold text-slate-900 leading-tight">
            Nhập kho Sản phẩm / Vật tư
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>
              Kho chi nhánh: <strong className="text-slate-700">{branchName || "Chi nhánh hiện tại"}</strong>
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        aria-label="Đóng cửa sổ"
        className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <X className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  );
}
