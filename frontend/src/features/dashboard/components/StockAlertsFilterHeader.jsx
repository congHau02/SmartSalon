import React from "react";
import { ShieldAlert, Search } from "lucide-react";

export function StockAlertsFilterHeader({
  alerts = [],
  searchTerm,
  setSearchTerm,
  tierFilter,
  setTierFilter,
}) {
  return (
    <div className="p-5 border-b border-slate-100 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            Danh mục Cảnh báo Cạn kho & Tốc độ Tiêu hao
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân loại 3 cấp độ cảnh báo (Hết hàng, Sắp hết, Tiệm cận) và dự báo số ngày còn lại theo tốc độ dùng hàng ngày.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm, mã SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTierFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-pink-500 outline-none ${
              tierFilter === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tất cả ({alerts.length})
          </button>
          <button
            type="button"
            onClick={() => setTierFilter("OUT_OF_STOCK")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 outline-none ${
              tierFilter === "OUT_OF_STOCK"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60"
            }`}
          >
            Hết hàng ({alerts.filter((a) => a.alertLevel === "OUT_OF_STOCK").length})
          </button>
          <button
            type="button"
            onClick={() => setTierFilter("LOW_STOCK")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 outline-none ${
              tierFilter === "LOW_STOCK"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60"
            }`}
          >
            Sắp hết ({alerts.filter((a) => a.alertLevel === "LOW_STOCK").length})
          </button>
          <button
            type="button"
            onClick={() => setTierFilter("NEAR_THRESHOLD")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 outline-none ${
              tierFilter === "NEAR_THRESHOLD"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60"
            }`}
          >
            Tiệm cận ({alerts.filter((a) => a.alertLevel === "NEAR_THRESHOLD").length})
          </button>
          <button
            type="button"
            onClick={() => setTierFilter("HEALTHY")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none ${
              tierFilter === "HEALTHY"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60"
            }`}
          >
            An toàn ({alerts.filter((a) => a.alertLevel === "HEALTHY").length})
          </button>
        </div>
      </div>
    </div>
  );
}
