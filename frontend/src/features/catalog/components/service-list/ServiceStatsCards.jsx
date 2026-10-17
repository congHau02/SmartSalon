import React from "react";
import { Scissors, CheckCircle2, FlaskConical, FolderKanban } from "lucide-react";
import { formatCurrency } from "../../../../lib/utils";

export function ServiceStatsCards({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
          <Scissors className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Tổng dịch vụ
          </p>
          <p className="text-lg font-bold text-slate-900">{stats.total}</p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Đang kinh doanh
          </p>
          <p className="text-lg font-bold text-slate-900">{stats.active}</p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <FlaskConical className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Đã cấu hình BOM
          </p>
          <p className="text-lg font-bold text-slate-900">{stats.withBom}</p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <FolderKanban className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Giá trung bình
          </p>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(stats.avgPrice)}</p>
        </div>
      </div>
    </div>
  );
}
