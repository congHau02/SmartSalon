import React from "react";
import { Badge } from "../../../components/ui/Badge";

function getProgressColor(rate, high = 80, mid = 50) {
  const num = Number(rate) || 0;
  if (num >= high) return "bg-emerald-500";
  if (num >= mid) return "bg-blue-500";
  if (num > 0) return "bg-amber-500";
  return "bg-slate-300";
}

function getBadgeVariant(rate, high = 80, mid = 50) {
  const num = Number(rate) || 0;
  if (num >= high) return "success";
  if (num >= mid) return "pink";
  if (num > 0) return "warning";
  return "default";
}

export function RateProgressBar({ rate, label, detail, high = 80, mid = 50 }) {
  const num = Number(rate) || 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-500 font-medium">{label}:</span>
        <Badge variant={getBadgeVariant(num, high, mid)} className="text-[10px] font-bold">
          {num.toFixed(1)}%
        </Badge>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getProgressColor(num, high, mid)}`}
          style={{ width: `${Math.min(num, 100)}%` }}
        />
      </div>
      {detail && <div className="text-[10px] text-slate-400">{detail}</div>}
    </div>
  );
}
