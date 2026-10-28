import React from "react";
import { Clock, CalendarDays, CheckCircle2, Coffee, LogOut } from "lucide-react";
import { getAttendanceBadge, getShiftBadgeClasses } from "../attendance.constants";
import { toLocalDateISO } from "../../../lib/utils";

export function StylistWorklogShiftBanner({
  worklogData,
  onOpenAttendance,
}) {
  if (!worklogData) return null;

  const {
    shiftCode,
    shiftName,
    shiftStartTime,
    shiftEndTime,
    isWorking,
    attendanceStatus,
    clockInAt,
    clockOutAt,
    overtimeMinutes,
    weeklySchedule = [],
  } = worklogData;

  const attBadge = getAttendanceBadge(attendanceStatus, isWorking);
  const shiftBadgeClass = getShiftBadgeClasses(shiftCode);
  const todayISO = toLocalDateISO();

  const formatClockTime = (dtStr) => {
    if (!dtStr) return "";
    try {
      const d = new Date(dtStr);
      return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/70 space-y-3">
      {/* Top row: Shift info, Presence badge & Quick PIN Action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <Clock className="w-4 h-4 text-pink-400" />
            <span>Ca hôm nay:</span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${shiftBadgeClass}`}>
            {shiftName || "Ca Cả ngày"}
            {shiftStartTime && shiftEndTime ? ` (${shiftStartTime}–${shiftEndTime})` : ""}
          </span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${attBadge.badgeClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${attBadge.dotClass}`} />
            {attBadge.label}
          </span>
          {clockInAt && (
            <span className="text-[11px] text-slate-400 font-mono">
              Vào ca: <strong className="text-slate-200">{formatClockTime(clockInAt)}</strong>
            </span>
          )}
          {overtimeMinutes > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              +{overtimeMinutes}p tăng ca
            </span>
          )}
        </div>

        {onOpenAttendance && (
          <button
            type="button"
            onClick={onOpenAttendance}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/20 to-rose-500/20 hover:from-pink-500/30 hover:to-rose-500/30 text-pink-300 border border-pink-500/30 text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-pink-400" />
            <span>Chấm công PIN</span>
          </button>
        )}
      </div>

      {/* 7-Day Weekly Shift Schedule Summary */}
      {weeklySchedule.length > 0 && (
        <div className="pt-2 border-t border-slate-700/50">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-2">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
            <span>Lịch trực tuần này:</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {weeklySchedule.map((day) => {
              const isToday = day.date === todayISO;
              const dayShiftClass = getShiftBadgeClasses(day.shiftCode);
              const dayAttBadge = day.attendanceStatus ? getAttendanceBadge(day.attendanceStatus, day.isWorking) : null;

              return (
                <div
                  key={day.date}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    isToday
                      ? "bg-pink-950/30 border-pink-500/50 shadow-sm shadow-pink-950/50"
                      : "bg-slate-900/60 border-slate-800"
                  }`}
                >
                  <p className={`text-[11px] font-bold ${isToday ? "text-pink-300" : "text-slate-300"}`}>
                    {day.dayOfWeek}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mb-1">
                    {day.date ? day.date.slice(5) : ""}
                  </p>
                  <span
                    className={`block text-[10px] font-semibold px-1 py-0.5 rounded truncate border ${dayShiftClass}`}
                    title={day.shiftName}
                  >
                    {day.shiftCode === "MORNING"
                      ? "Sáng"
                      : day.shiftCode === "AFTERNOON"
                      ? "Chiều"
                      : day.shiftCode === "OFF"
                      ? "Nghỉ"
                      : "Cả ngày"}
                  </span>
                  {dayAttBadge && (
                    <span className={`block mt-1 text-[9px] font-medium px-1 rounded truncate border ${dayAttBadge.badgeClass}`}>
                      {dayAttBadge.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
