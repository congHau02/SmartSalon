import React from "react";
import { Scissors } from "lucide-react";

export function ServiceEmptyState({ searchQuery, onClearSearch, onOpenCreateModal }) {
  return (
    <div className="py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
        <Scissors className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-800">Không có dịch vụ nào phù hợp</h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
        {searchQuery
          ? `Không tìm thấy dịch vụ nào khớp với từ khóa "${searchQuery}"`
          : "Danh mục này hiện chưa có dịch vụ nào. Hãy bắt đầu bằng cách thêm dịch vụ mới."}
      </p>
      {searchQuery ? (
        <button
          type="button"
          onClick={onClearSearch}
          className="px-4 py-2 min-h-[40px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
        >
          Xóa bộ lọc tìm kiếm
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="px-4 py-2 min-h-[44px] rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
        >
          + Thêm dịch vụ đầu tiên
        </button>
      )}
    </div>
  );
}
