import React from "react";
import { formatCurrency } from "../../../lib/utils";

export function PnlChartTooltip({ hoveredData }) {
  if (!hoveredData) return null;

  const totalCost =
    (hoveredData.chemicalCogs || 0) +
    (hoveredData.retailCogs || 0) +
    (hoveredData.totalCommissions || 0);

  return (
    <div className="absolute top-0 right-4 z-10 bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 pointer-events-none border border-slate-800 backdrop-blur-sm min-w-56">
      <div className="font-bold border-b border-slate-700 pb-1 text-slate-200 flex justify-between">
        <span>{hoveredData.date}</span>
        <span className="text-slate-400 font-normal">{hoveredData.orderCount} đơn hàng</span>
      </div>
      <div className="flex justify-between text-blue-300">
        <span>Doanh thu thuần:</span>
        <span className="font-bold">{formatCurrency(hoveredData.totalNetRevenue)}</span>
      </div>
      <div className="flex justify-between text-amber-300">
        <span>Tổng chi phí:</span>
        <span className="font-bold">{formatCurrency(totalCost)}</span>
      </div>
      <div className="pl-2 text-[10px] text-slate-400 space-y-0.5 border-l border-slate-700">
        <div className="flex justify-between">
          <span>- Giá vốn hóa chất:</span>
          <span>{formatCurrency(hoveredData.chemicalCogs)}</span>
        </div>
        <div className="flex justify-between">
          <span>- Giá vốn bán lẻ:</span>
          <span>{formatCurrency(hoveredData.retailCogs)}</span>
        </div>
        <div className="flex justify-between">
          <span>- Hoa hồng thợ:</span>
          <span>{formatCurrency(hoveredData.totalCommissions)}</span>
        </div>
      </div>
      <div className="flex justify-between pt-1 border-t border-slate-700 font-bold">
        <span className={hoveredData.operationalNetProfit >= 0 ? "text-emerald-400" : "text-rose-400"}>
          Lợi nhuận vận hành:
        </span>
        <span className={hoveredData.operationalNetProfit >= 0 ? "text-emerald-400" : "text-rose-400"}>
          {formatCurrency(hoveredData.operationalNetProfit)}
        </span>
      </div>
    </div>
  );
}
