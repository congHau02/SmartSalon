import React from "react";
import { Layers, CheckCircle2, AlertCircle } from "lucide-react";

export function ProductsStatsCards({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Tổng số mặt hàng
          </span>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Layers className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Đang kinh doanh
          </span>
          <div className="text-2xl font-black text-emerald-600">{stats.active}</div>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Ngừng kinh doanh
          </span>
          <div className="text-2xl font-black text-slate-400">{stats.inactive}</div>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
