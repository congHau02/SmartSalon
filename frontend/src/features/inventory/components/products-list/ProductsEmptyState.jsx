import React from "react";
import { Package } from "lucide-react";

export function ProductsEmptyState() {
  return (
    <div className="p-16 text-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto border border-amber-100">
        <Package className="w-8 h-8" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-800">Không tìm thấy mặt hàng nào</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Chưa có sản phẩm nào phù hợp hoặc danh mục đang trống.
        </p>
      </div>
    </div>
  );
}
