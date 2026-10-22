import React from "react";
import { Package, Plus, RefreshCw } from "lucide-react";

export function ProductsHeader({ onRefresh, onCreateProduct }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <Package className="w-5 h-5" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Danh mục Mặt hàng Master
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          Quản lý mã định danh SKU, mã vạch, quy cách đóng gói và định lượng chuẩn hóa toàn hệ thống.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onRefresh}
          className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
          title="Làm mới danh sách"
          aria-label="Làm mới danh mục"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onCreateProduct}
          className="min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl font-bold text-sm shadow-md shadow-amber-600/20 transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Thêm mặt hàng mới</span>
        </button>
      </div>
    </div>
  );
}
