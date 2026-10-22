import React from "react";
import { Clock, Phone, User, Sparkles, Loader2 } from "lucide-react";

export function BookingKanbanCard({ booking, onCheckIn, isCheckingIn }) {
  const isDepositPaid = booking.depositStatus === "PAID";
  const timeStr = booking.bookingTime
    ? new Date(booking.bookingTime).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all shadow-sm space-y-3">
      {/* Top row: Code & Time */}
      <div className="flex items-center justify-between gap-1 text-xs">
        <span className="font-mono text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
          {booking.bookingCode}
        </span>
        <span className="flex items-center gap-1 font-mono text-slate-300 font-semibold bg-slate-700/60 px-2 py-0.5 rounded">
          <Clock className="w-3 h-3 text-blue-400" />
          {timeStr}
        </span>
      </div>

      {/* Customer info */}
      <div>
        <p className="text-sm font-bold text-white truncate">{booking.customerName}</p>
        {booking.customerPhone && (
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
            <Phone className="w-3 h-3" /> {booking.customerPhone}
          </p>
        )}
      </div>

      {/* Services list */}
      {booking.serviceNames?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {booking.serviceNames.map((name, i) => (
            <span
              key={i}
              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-750 text-slate-300 border border-slate-700 truncate max-w-full"
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Stylist & Deposit Strip */}
      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-400 truncate">
          <User className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="truncate">{booking.staffName || "Chưa chọn stylist"}</span>
        </div>

        {isDepositPaid ? (
          <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
            Đã cọc 20%
          </span>
        ) : (
          <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
            Chưa cọc
          </span>
        )}
      </div>

      {/* Check-In Action Button */}
      <button
        type="button"
        onClick={onCheckIn}
        disabled={isCheckingIn}
        className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-pink-600/20 transition-all disabled:opacity-50 cursor-pointer"
      >
        {isCheckingIn ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Đang check-in...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Check-in & Mở đơn</span>
          </>
        )}
      </button>
    </div>
  );
}
