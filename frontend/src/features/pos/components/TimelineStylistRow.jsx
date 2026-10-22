import React from "react";
import { formatCurrency } from "../../../lib/utils";

export function TimelineStylistRow({
  stylist,
  items,
  timeSlotsCount = 24,
  getPositionPercent,
  isCheckingInId,
  onSelectOrder,
  onCheckInBooking,
}) {
  return (
    <div className="flex min-h-[80px] hover:bg-slate-800/30 transition-colors">
      {/* Stylist Profile Column */}
      <div className="w-56 shrink-0 p-3 border-r border-slate-700/70 flex items-center gap-2.5 bg-slate-850/40">
        <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
          {stylist.fullName?.split(" ").slice(-1)[0]?.[0] || "S"}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-200 truncate">{stylist.fullName}</p>
          <span
            className={`inline-block text-[10px] px-1.5 py-0.2 rounded mt-0.5 font-medium ${
              stylist.isBusy
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}
          >
            {stylist.isBusy ? "Đang bận" : "Đang rảnh"}
          </span>
        </div>
      </div>

      {/* Timeline Lane */}
      <div className="flex-1 relative bg-slate-900/30">
        {/* Background Grid Lines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ display: "grid", gridTemplateColumns: `repeat(${timeSlotsCount}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: timeSlotsCount }).map((_, i) => (
            <div key={i} className="border-r border-slate-800/60 h-full" />
          ))}
        </div>

        {/* Timeline Event Blocks */}
        {items.map((item, idx) => {
          const left = getPositionPercent(item.startTime);
          const right = getPositionPercent(item.endTime);
          const width = Math.max(3.5, right - left);

          const isBooking = item.type === "BOOKING";
          const isOrder = item.type === "ORDER";
          const isCheckingIn = isCheckingInId === item.id;

          return (
            <div
              key={idx}
              onClick={() => {
                if (isOrder && onSelectOrder) onSelectOrder(item.raw);
                if (isBooking && onCheckInBooking && !isCheckingIn) {
                  onCheckInBooking(item.id);
                }
              }}
              style={{
                left: `${left}%`,
                width: `${width}%`,
              }}
              title={
                isBooking
                  ? `Lịch hẹn: ${item.customerName} - Bấm để Check-in`
                  : `Đơn POS: ${item.code} - ${item.customerName}`
              }
              className={`absolute top-2 bottom-2 rounded-lg p-2 text-xs border shadow-md overflow-hidden cursor-pointer transition-all hover:z-20 hover:scale-[1.02] flex flex-col justify-between ${
                isBooking
                  ? "bg-blue-600/20 border-blue-500/50 text-blue-200 hover:border-blue-400 hover:bg-blue-600/30"
                  : "bg-pink-600/25 border-pink-500/50 text-pink-200 hover:border-pink-400"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-[10px] font-bold px-1 rounded bg-black/30 truncate">
                  {item.code}
                </span>
                <span className="text-[10px] font-mono text-slate-300">
                  {new Date(item.startTime).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="truncate font-semibold text-white text-[11px] mt-0.5">
                {item.customerName}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-300 truncate font-mono">
                <span>{formatCurrency(item.totalPrice)}</span>
                {isBooking && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/30 text-blue-300 font-sans font-medium">
                    {isCheckingIn ? "Đang xử lý..." : "Check-in"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
