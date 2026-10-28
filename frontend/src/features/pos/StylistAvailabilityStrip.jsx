import React from "react";
import { Clock, AlertCircle } from "lucide-react";
import { StylistAvailabilityCard } from "./components/StylistAvailabilityCard";

export function StylistAvailabilityStrip({
  stylists = [],
  isLoading = false,
  onOpenAttendance,
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 overflow-x-auto py-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 w-64 bg-slate-800/60 rounded-xl border border-slate-700/60 animate-pulse flex-shrink-0"
          />
        ))}
      </div>
    );
  }

  if (!stylists.length) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/40 rounded-xl border border-slate-700/40 text-xs text-slate-400">
        <AlertCircle className="w-4 h-4 text-slate-400" />
        <span>Chưa có kỹ thuật viên nào được phân công tại chi nhánh này</span>
      </div>
    );
  }

  const isReady = (s) =>
    !s.isBusy &&
    s.isWorking !== false &&
    s.attendanceStatus !== "ABSENT" &&
    s.attendanceStatus !== "ON_BREAK" &&
    s.attendanceStatus !== "COMPLETED";

  const freeCount = stylists.filter(isReady).length;
  const busyCount = stylists.filter((s) => s.isBusy).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-medium text-slate-300">Tình trạng Stylist trực sàn ({stylists.length})</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {freeCount} đang rảnh
          </span>
          {busyCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {busyCount} đang phục vụ
            </span>
          )}
        </div>

        {onOpenAttendance && (
          <button
            type="button"
            onClick={() => onOpenAttendance()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30 font-semibold transition cursor-pointer shadow-sm text-xs"
          >
            <Clock className="w-3.5 h-3.5 text-pink-400" />
            <span>Chấm công PIN</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
        {stylists.map((stylist) => (
          <StylistAvailabilityCard key={stylist.stylistId} stylist={stylist} onOpenAttendance={onOpenAttendance} />
        ))}
      </div>
    </div>
  );
}
