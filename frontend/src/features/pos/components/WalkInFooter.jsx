import React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export function WalkInFooter({
  totalEstimated,
  onClose,
  onSubmit,
  isPending,
}) {
  return (
    <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
      <div>
        <span className="text-[11px] text-slate-400 block">Tạm tính ước lượng:</span>
        <span className="text-lg font-bold font-mono text-pink-400">
          {formatCurrency(totalEstimated)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
        >
          Hủy bỏ
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending}
          className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-pink-600/25 transition-all cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang mở đơn...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Mở đơn & Bắt đầu làm</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
