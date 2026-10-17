import React from "react";
import { Search, X } from "lucide-react";

export function ServiceFilterBar({
  allServices,
  availableCategories,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  activeOnly,
  setActiveOnly,
}) {
  return (
    <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3.5">
      {/* Category Pills Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory("ALL")}
          className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
            selectedCategory === "ALL"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          }`}
        >
          Tất cả ({allServices.length})
        </button>

        {availableCategories.map((cat) => {
          const count = allServices.filter((s) => s.category === cat).length;
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                isSelected
                  ? "bg-pink-600 text-white shadow-xs shadow-pink-500/20"
                  : "bg-slate-100 text-slate-600 hover:bg-pink-50 hover:text-pink-700"
              }`}
            >
              <span>{cat}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Box & Quick Status Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 max-w-md">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm nhanh theo tên dịch vụ, mô tả..."
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

        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 select-none min-h-[40px]">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 border-slate-300 cursor-pointer"
          />
          <span>Chỉ hiển thị dịch vụ đang mở bán</span>
        </label>
      </div>
    </div>
  );
}
