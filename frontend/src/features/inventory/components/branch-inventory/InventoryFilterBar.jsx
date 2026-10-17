import React from "react";
import { Link } from "react-router-dom";
import { Search, X, History } from "lucide-react";

export function InventoryFilterBar({
  rawInventory,
  stats,
  filterMode,
  setFilterMode,
  searchQuery,
  setSearchQuery,
  branchId,
}) {
  return (
    <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3.5">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterMode("ALL")}
            className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
              filterMode === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            Tất cả ({rawInventory.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode("LOW_STOCK")}
            className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
              filterMode === "LOW_STOCK"
                ? "bg-rose-600 text-white shadow-xs shadow-rose-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
            }`}
          >
            <span>Cảnh báo hết ({stats.lowStockCount})</span>
          </button>
        </div>

        {/* History Link */}
        <Link
          to={`/inventory/transactions?branchId=${branchId}`}
          className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <History className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
          <span>Lịch sử xuất nhập</span>
        </Link>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <Search
          className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm theo tên sản phẩm, mã SKU, barcode..."
          className="w-full h-10 pl-9.5 pr-10 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            aria-label="Xóa ô tìm kiếm"
            className="w-10 h-10 min-w-[40px] min-h-[40px] absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
