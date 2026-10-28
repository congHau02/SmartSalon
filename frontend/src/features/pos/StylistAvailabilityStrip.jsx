import React from "react";
import { UserCheck, Clock, Scissors, AlertCircle, Coffee, LogOut } from "lucide-react";
import { getAttendanceBadge } from "./attendance.constants";

function getStylistAvailabilityStatus(stylist) {
  if (stylist.isBusy) {
    return {
      label: stylist.currentStepName || "Đang phục vụ",
      className: "text-amber-300",
      icon: Scissors,
    };
  }
  if (stylist.isWorking === false) {
    return {
      label: "Nghỉ ca (OFF)",
      className: "text-slate-400",
      icon: AlertCircle,
    };
  }
  if (stylist.attendanceStatus === "ABSENT") {
    return {
      label: "Vắng mặt",
      className: "text-rose-400",
      icon: AlertCircle,
    };
  }
  if (stylist.attendanceStatus === "ON_BREAK") {
    return {
      label: "Tạm nghỉ",
      className: "text-amber-400",
      icon: Coffee,
    };
  }
  if (stylist.attendanceStatus === "COMPLETED") {
    return {
      label: "Đã tan ca",
      className: "text-slate-400",
      icon: LogOut,
    };
  }
  return {
    label: "Sẵn sàng",
    className: "text-emerald-400",
    icon: UserCheck,
  };
}

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
        {stylists.map((stylist) => {
          const isBusy = stylist.isBusy;
          const attBadge = getAttendanceBadge(stylist.attendanceStatus, stylist.isWorking);
          const availStatus = getStylistAvailabilityStatus(stylist);
          const StatusIcon = availStatus.icon;

          const initials = stylist.fullName
            ? stylist.fullName
                .split(" ")
                .filter(Boolean)
                .slice(-2)
                .map((n) => n[0])
                .join("")
                .toUpperCase()
            : "ST";

          return (
            <div
              key={stylist.stylistId}
              onClick={() => onOpenAttendance?.(stylist)}
              className={`flex-shrink-0 w-64 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                isBusy
                  ? "bg-slate-800/90 border-amber-500/30 shadow-sm hover:border-amber-500/60"
                  : stylist.attendanceStatus === "ABSENT"
                  ? "bg-slate-850/80 border-rose-500/30 opacity-75"
                  : stylist.attendanceStatus === "ON_BREAK"
                  ? "bg-slate-800/80 border-amber-500/40"
                  : "bg-slate-800/80 border-slate-700/70 hover:border-emerald-500/50 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isBusy
                      ? "bg-amber-500/20 text-amber-300 ring-2 ring-amber-500/30"
                      : "bg-slate-700 text-slate-200 ring-2 ring-slate-600/50"
                  }`}
                >
                  {stylist.avatarUrl ? (
                    <img
                      src={stylist.avatarUrl}
                      alt={stylist.fullName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-slate-800 ${
                      isBusy
                        ? "bg-amber-400"
                        : stylist.attendanceStatus === "PRESENT"
                        ? "bg-emerald-400"
                        : stylist.attendanceStatus === "ON_BREAK"
                        ? "bg-amber-400"
                        : stylist.attendanceStatus === "ABSENT"
                        ? "bg-rose-400"
                        : "bg-slate-500"
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-semibold text-xs text-white truncate">
                      {stylist.fullName || `Stylist #${stylist.stylistId}`}
                    </p>
                    {/* Live Presence Badge */}
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${attBadge.badgeClass}`}
                    >
                      <span className={`w-1 h-1 rounded-full ${attBadge.dotClass}`} />
                      {attBadge.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1 mt-1">
                    {/* Shift template tag */}
                    {stylist.shiftName && (
                      <span
                        className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                          stylist.isWorking === false
                            ? "bg-slate-700/60 text-slate-400 border border-slate-600/60"
                            : stylist.shiftCode === "MORNING"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : stylist.shiftCode === "AFTERNOON"
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {stylist.shiftName}
                      </span>
                    )}

                    <span className={`${availStatus.className} font-medium flex items-center gap-1 text-[11px]`}>
                      <StatusIcon className="w-3 h-3 shrink-0" />
                      <span>{availStatus.label}</span>
                    </span>
                  </div>
                </div>
              </div>

              {isBusy && stylist.currentCustomerName && (
                <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate">Khách: <strong className="text-slate-200">{stylist.currentCustomerName}</strong></span>
                  {stylist.currentOrderCode && (
                    <span className="font-mono text-[10px] text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded border border-pink-500/20 shrink-0">
                      {stylist.currentOrderCode}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
