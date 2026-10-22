import React from "react";
import { Search, X, Filter } from "lucide-react";
import { TRANSACTION_TYPE_CONFIG } from "../../constants";

export function TransactionsFilterBar({
  searchQuery,
  setSearchQuery,
  selectedProductId,
  setSelectedProductId,
  selectedType,
  setSelectedType,
  products = [],
}) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
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
            placeholder="Tìm theo sản phẩm, mã SKU, ghi chú lý do hoặc người thao tác..."
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

        {/* Product Filter Selector */}
        <div className="w-full md:w-64">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            aria-label="Lọc theo mặt hàng cụ thể"
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="ALL">Tất cả mặt hàng ({products.length})</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction Type Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
        <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" aria-hidden="true" />
          Loại phát sinh:
        </span>

        <button
          type="button"
          onClick={() => setSelectedType("ALL")}
          className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedType === "ALL"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Tất cả loại
        </button>

        {Object.entries(TRANSACTION_TYPE_CONFIG).map(([key, config]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSelectedType(key)}
            className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedType === key
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {config.icon && <config.icon className="w-3.5 h-3.5" aria-hidden="true" />}
            <span>{config.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
