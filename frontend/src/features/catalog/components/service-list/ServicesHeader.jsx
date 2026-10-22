import React from "react";
import { Plus, RefreshCw } from "lucide-react";

export function ServicesHeader({
  totalServices,
  isLoading,
  onRefresh,
  onCreate,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Danh mục Dịch vụ & Định mức BOM
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-50 text-pink-700 border border-pink-200/60">
            {totalServices} dịch vụ
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Quản lý bảng giá chuẩn, định mức trừ kho hoá chất tự động (BOM) và cơ chế chia hoa hồng thợ
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Tải lại dữ liệu"
          className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shadow-xs min-h-[44px] min-w-[44px]"
          title="Tải lại danh sách"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>

        <button
          type="button"
          onClick={onCreate}
          className="h-10 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-semibold text-xs shadow-md shadow-pink-500/20 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm dịch vụ mới</span>
        </button>
      </div>
    </div>
  );
}
