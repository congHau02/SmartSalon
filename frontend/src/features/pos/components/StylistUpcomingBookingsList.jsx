import React from "react";
import { Calendar, Clock, CheckCircle, Zap } from "lucide-react";
import { formatVND } from "../../../lib/utils";

export function StylistUpcomingBookingsList({ bookings = [], onQuickComplete, completingId }) {
  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
        <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-semibold text-slate-300">Không có lịch hẹn nào sắp tới cho ngày này</p>
        <p className="text-xs text-slate-500 mt-1">
          Tất cả lịch hẹn đã hoàn tất hoặc chưa có khách đặt trước
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
      {bookings.map((b) => (
        <div
          key={b.id}
          className="bg-slate-900/80 border border-slate-700/70 hover:border-slate-600 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 transition-colors"
        >
          {/* Booking Info */}
          <div className="min-w-[200px]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                {b.bookingCode}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-300 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{b.bookingTime ? new Date(b.bookingTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}</span>
              </span>
            </div>
            <div className="text-xs font-semibold text-white mt-1">
              {b.customerName || "Khách hẹn"}
              {b.customerPhone && (
                <span className="text-[11px] text-slate-400 font-mono ml-1.5 font-normal">
                  ({b.customerPhone})
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
              {b.serviceNames?.length > 0 ? b.serviceNames.join(", ") : "Dịch vụ hẹn"}
            </div>
          </div>

          {/* Deposit & Financials */}
          <div className="text-right">
            <div className="text-xs font-bold text-white font-mono">
              {formatVND(b.totalPrice || 0)}
            </div>
            {b.depositAmount > 0 && (
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 mt-1 inline-block">
                Đã cọc {formatVND(b.depositAmount)}
              </span>
            )}
          </div>

          {/* Quick Complete Action */}
          <div>
            <button
              onClick={() => onQuickComplete(b)}
              disabled={completingId === b.id}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-emerald-950 transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{completingId === b.id ? "Đang chốt..." : "Nhận khách & Chốt phiếu"}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
