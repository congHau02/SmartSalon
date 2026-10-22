import React from "react";
import { Package, X } from "lucide-react";

export function ProductModalHeader({ isEditMode, titleId, onClose, isSubmitting }) {
  return (
    <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/60">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
          <Package className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h2 id={titleId} className="text-lg font-bold text-slate-900 leading-tight">
            {isEditMode ? "Chỉnh sửa Sản phẩm Master" : "Tạo Sản phẩm / Vật tư Mới"}
          </h2>
          <p className="text-xs text-slate-500">
            Quy cách đóng gói, định mức thể tích và đơn giá dùng chung toàn hệ thống
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        aria-label="Đóng cửa sổ"
        className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
      >
        <X className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  );
}
