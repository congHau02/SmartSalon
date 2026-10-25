import React from "react";
import { Calendar, RotateCw } from "lucide-react";
import { PAYROLL_PERIOD_PRESETS } from "../useMyPayroll";

export function PersonalPayrollPeriodBar({ period, handlers, isRefreshing }) {
  const { preset, startDate, endDate } = period;
  const { onSelectPreset, onStartDateChange, onEndDateChange, onRefresh } = handlers;
  const presets = [
    { id: PAYROLL_PERIOD_PRESETS.THIS_MONTH, label: "Tháng này" },
    { id: PAYROLL_PERIOD_PRESETS.LAST_MONTH, label: "Tháng trước" },
    { id: PAYROLL_PERIOD_PRESETS.LAST_7_DAYS, label: "7 ngày qua" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-800/60 border-b border-slate-700/60">
      {/* Preset Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-pink-400" />
          Kỳ báo cáo:
        </span>
        {presets.map((p) => {
          const isActive = preset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPreset(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-pink-600 text-white shadow-xs"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Date Pickers & Refresh */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
          <span className="text-slate-400 text-[11px]">Từ:</span>
          <input
            type="date"
            value={startDate || ""}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="bg-transparent text-slate-200 font-mono text-xs focus:outline-none cursor-pointer"
          />
          <span className="text-slate-500 text-[11px] px-1">→</span>
          <span className="text-slate-400 text-[11px]">Đến:</span>
          <input
            type="date"
            value={endDate || ""}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="bg-transparent text-slate-200 font-mono text-xs focus:outline-none cursor-pointer"
          />
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Làm mới bảng lương"
          title="Làm mới dữ liệu"
          className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-60"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-pink-400" : ""}`} />
        </button>
      </div>
    </div>
  );
}
