import React from "react";
import { Building2, RefreshCw, ArrowDownToLine, Scale } from "lucide-react";

export function BranchInventoryHeader({
  branchName,
  isLoading,
  onRefresh,
  onOpenStockIn,
  onOpenAdjustment,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Tồn kho Chi nhánh
          </h1>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200/80">
            <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{branchName || "Chưa chọn chi nhánh"}</span>
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Theo dõi tồn kho 2 tầng: Số kiện nguyên seal và dung tích ml/gram đang mở nắp sử dụng dở
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Tải lại dữ liệu"
          className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shadow-xs min-h-[44px] min-w-[44px]"
          title="Tải lại tồn kho"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onOpenStockIn}
          className="h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
        >
          <ArrowDownToLine className="w-4 h-4" aria-hidden="true" />
          <span>Nhập kho</span>
        </button>

        <button
          type="button"
          onClick={onOpenAdjustment}
          className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md shadow-slate-900/10 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
        >
          <Scale className="w-4 h-4" aria-hidden="true" />
          <span>Kiểm kê</span>
        </button>
      </div>
    </div>
  );
}
