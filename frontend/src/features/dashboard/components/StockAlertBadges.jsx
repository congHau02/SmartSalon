import React from "react";
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert } from "lucide-react";

export function StockTierBadge({ level }) {
  switch (level) {
    case "OUT_OF_STOCK":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          Hết hàng
        </span>
      );
    case "LOW_STOCK":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          Sắp hết hàng
        </span>
      );
    case "NEAR_THRESHOLD":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-300">
          <Clock className="w-3.5 h-3.5 text-purple-600" />
          Tiệm cận ngưỡng
        </span>
      );
    case "HEALTHY":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          An toàn
        </span>
      );
  }
}

export function StockDaysRemainingBadge({ days, level }) {
  if (level === "OUT_OF_STOCK" || days === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
        0 ngày (Đã hết)
      </span>
    );
  }
  if (days === null || days === undefined) {
    return <span className="text-xs text-slate-400">Chưa có phát sinh</span>;
  }
  if (days <= 3) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
        <Clock className="w-3 h-3 text-rose-600" />
        Còn ~{days} ngày
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
        <Clock className="w-3 h-3 text-amber-600" />
        Còn ~{days} ngày
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
      ~{days} ngày
    </span>
  );
}
