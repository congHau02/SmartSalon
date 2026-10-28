import React from "react";
import { UserCheck, Clock, Scissors, AlertCircle } from "lucide-react";

export function StylistAvailabilityStrip({ stylists = [], isLoading = false }) {
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

  const freeCount = stylists.filter((s) => !s.isBusy).length;
  const busyCount = stylists.filter((s) => s.isBusy).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
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
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
        {stylists.map((stylist) => {
          const isBusy = stylist.isBusy;
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
              className={`flex-shrink-0 w-64 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                isBusy
                  ? "bg-slate-800/90 border-amber-500/30 shadow-sm hover:border-amber-500/60"
                  : "bg-slate-800/80 border-slate-700/70 hover:border-emerald-500/50 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isBusy
                      ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white"
                      : "bg-gradient-to-br from-emerald-600 to-teal-800 text-white"
                  }`}
                >
                  {stylist.avatarUrl ? (
                    <img
                      src={stylist.avatarUrl}
                      alt={stylist.fullName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                      isBusy ? "bg-amber-400" : "bg-emerald-400"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-semibold text-slate-100 truncate">{stylist.fullName}</p>
                    {stylist.shiftName && (
                      <span
                        className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
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
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                    {isBusy ? (
                      <span className="text-amber-300 font-medium truncate flex items-center gap-1">
                        <Scissors className="w-3 h-3 shrink-0" />
                        <span>{stylist.currentStepName || "Đang làm dịch vụ"}</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <UserCheck className="w-3 h-3 shrink-0" />
                        <span>Sẵn sàng nhận khách</span>
                      </span>
                    )}
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
