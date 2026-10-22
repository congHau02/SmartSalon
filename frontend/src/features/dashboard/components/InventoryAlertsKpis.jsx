import React from "react";
import {
  Layers,
  AlertOctagon,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Flame,
} from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export function InventoryAlertsKpis({
  totalProducts = 0,
  outOfStockCount = 0,
  lowStockCount = 0,
  nearThresholdCount = 0,
  healthyCount = 0,
  totalWastageCostAmount = 0,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {/* Card 1: Total Products */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Tổng mặt hàng
          </span>
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-black text-slate-900 leading-tight">
            {totalProducts.toLocaleString("vi-VN")}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Đang quản lý trong kho
          </div>
        </div>
      </div>

      {/* Card 2: Out of Stock (Critical Alert) */}
      <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-rose-600">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
            Hết hàng
          </span>
          <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-black text-rose-700 leading-tight">
            {outOfStockCount.toLocaleString("vi-VN")}
          </div>
          <div className="text-[11px] text-rose-600 mt-1 font-semibold">
            0 chai seal & 0 thể tích
          </div>
        </div>
      </div>

      {/* Card 3: Low Stock (Warning) */}
      <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-amber-600">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
            Sắp hết hàng
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-black text-amber-700 leading-tight">
            {lowStockCount.toLocaleString("vi-VN")}
          </div>
          <div className="text-[11px] text-amber-600 mt-1 font-semibold">
            Tồn seal ≤ ngưỡng an toàn
          </div>
        </div>
      </div>

      {/* Card 4: Near Threshold (Pre-warning) */}
      <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-purple-600">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
            Tiệm cận ngưỡng
          </span>
          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-black text-purple-700 leading-tight">
            {nearThresholdCount.toLocaleString("vi-VN")}
          </div>
          <div className="text-[11px] text-purple-600 mt-1 font-semibold">
            Dự báo cạn ≤ 7 ngày
          </div>
        </div>
      </div>

      {/* Card 5: Healthy Stock */}
      <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-emerald-600">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Kho an toàn
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-black text-emerald-700 leading-tight">
            {healthyCount.toLocaleString("vi-VN")}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-semibold">
            Đủ khả năng cung ứng
          </div>
        </div>
      </div>

      {/* Card 6: Total BOM & Audit Wastage VND Loss */}
      <div className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl p-4 border border-rose-300/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-rose-600">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
            Thiệt hại Hao hụt
          </span>
          <div className="w-7 h-7 rounded-lg bg-rose-200 text-rose-800 flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-black text-rose-900 leading-tight">
            {formatCurrency(totalWastageCostAmount || 0)}
          </div>
          <div className="text-[11px] text-rose-700 mt-1 font-bold">
            Thất thoát BOM + rò rỉ kiểm kê
          </div>
        </div>
      </div>
    </div>
  );
}
