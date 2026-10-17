import React from "react";
import { Package, ArrowDownToLine } from "lucide-react";

export function InventoryEmptyState({
  searchQuery,
  filterMode,
  onClearFilter,
  onOpenStockIn,
}) {
  return (
    <div className="py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
        <Package className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-bold text-slate-800">
        {filterMode === "LOW_STOCK"
          ? "Không có sản phẩm nào sắp hết hàng"
          : "Chưa có sản phẩm nào trong kho chi nhánh"}
      </h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
        {searchQuery
          ? `Không tìm thấy sản phẩm nào khớp với "${searchQuery}"`
          : filterMode === "LOW_STOCK"
          ? "Tất cả các mặt hàng tại chi nhánh này hiện đều đang đảm bảo định mức tồn kho tối thiểu."
          : "Chi nhánh này chưa có dữ liệu tồn kho. Hãy bắt đầu nhập kho đợt hàng đầu tiên."}
      </p>

      {searchQuery || filterMode === "LOW_STOCK" ? (
        <button
          type="button"
          onClick={onClearFilter}
          className="px-4 py-2 min-h-[40px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
        >
          Xóa bộ lọc
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onOpenStockIn()}
          className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
        >
          <ArrowDownToLine className="w-4 h-4" aria-hidden="true" />
          <span>Nhập kho đợt đầu</span>
        </button>
      )}
    </div>
  );
}
