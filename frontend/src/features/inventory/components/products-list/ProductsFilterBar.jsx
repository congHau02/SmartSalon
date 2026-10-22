import React from "react";
import { Search, X } from "lucide-react";
import { PACKAGING_UNITS } from "../../constants";

export function ProductsFilterBar({
  searchQuery,
  setSearchQuery,
  selectedUnit,
  setSelectedUnit,
  statusFilter,
  setStatusFilter,
  totalCount,
}) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Live Search */}
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên mặt hàng, mã SKU hoặc Barcode..."
            className="w-full min-h-[44px] pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="min-h-[44px] min-w-[44px] absolute right-0 top-0 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Xóa nội dung tìm kiếm"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Unit Filter */}
        <div className="w-full md:w-56">
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            aria-label="Lọc theo quy cách đóng gói"
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="ALL">Tất cả quy cách ({totalCount})</option>
            {PACKAGING_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                Đóng gói: {unit}
              </option>
            ))}
          </select>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("ACTIVE")}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "ACTIVE"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Kinh doanh
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("INACTIVE")}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "INACTIVE"
                ? "bg-white text-slate-700 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Ngừng
          </button>
        </div>
      </div>
    </div>
  );
}
