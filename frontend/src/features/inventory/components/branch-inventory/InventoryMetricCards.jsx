import React from "react";
import { Package, AlertTriangle, PackageCheck, PackageOpen } from "lucide-react";

export function InventoryMetricCards({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
          <Package className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Mặt hàng tại kho
          </p>
          <p className="text-lg font-bold text-slate-900">{stats.totalItems}</p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            stats.lowStockCount > 0
              ? "bg-rose-50 text-rose-600 animate-pulse"
              : "bg-emerald-50 text-emerald-600"
          }`}
        >
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Cảnh báo sắp hết
          </p>
          <p
            className={`text-lg font-bold ${
              stats.lowStockCount > 0 ? "text-rose-600" : "text-slate-900"
            }`}
          >
            {stats.lowStockCount}
          </p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <PackageCheck className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Chai nguyên seal
          </p>
          <p className="text-lg font-bold text-slate-900">{stats.totalSealedUnits}</p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <PackageOpen className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Đang dùng dở
          </p>
          <p className="text-lg font-bold text-slate-900">{stats.activeInUseCount}</p>
        </div>
      </div>
    </div>
  );
}
