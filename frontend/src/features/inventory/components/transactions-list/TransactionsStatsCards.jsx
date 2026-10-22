import React from "react";
import { History, ArrowDownToLine, FlaskConical, Scale } from "lucide-react";

export function TransactionsStatsCards({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Tổng số biến động
          </span>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
          <History className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Lượt nhập kho mới
          </span>
          <div className="text-2xl font-black text-emerald-600">{stats.stockIn}</div>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <ArrowDownToLine className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Bóc seal & Tiêu hao
          </span>
          <div className="text-2xl font-black text-purple-600">{stats.consumption}</div>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
          <FlaskConical className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Cân đối / Kiểm kê
          </span>
          <div className="text-2xl font-black text-amber-600">{stats.adjustment}</div>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Scale className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
