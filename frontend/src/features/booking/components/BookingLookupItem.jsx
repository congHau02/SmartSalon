import React from "react";
import { Calendar, Clock, MapPin, ExternalLink, RotateCcw } from "lucide-react";
import { formatCurrency, formatDate } from "../../../lib/utils";

export const STATUS_BADGES = {
  PENDING_PAYMENT: { label: "Chờ cọc 20%", bg: "bg-amber-100 text-amber-800 border-amber-200" },
  CONFIRMED: { label: "Đã xác nhận", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  CHECKED_IN: { label: "Đã check-in", bg: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  IN_PROGRESS: { label: "Đang phục vụ", bg: "bg-blue-100 text-blue-800 border-blue-200" },
  COMPLETED: { label: "Hoàn thành", bg: "bg-slate-100 text-slate-800 border-slate-200" },
  CANCELLED: { label: "Đã hủy", bg: "bg-rose-100 text-rose-800 border-rose-200" },
  EXPIRED: { label: "Đã hết hạn", bg: "bg-slate-100 text-slate-500 border-slate-200" },
  NO_SHOW: { label: "Vắng mặt", bg: "bg-rose-100 text-rose-800 border-rose-200" },
};

export function BookingLookupItem({ booking, onSelect, onReschedule }) {
  const badge = STATUS_BADGES[booking.status] || {
    label: booking.status,
    bg: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const isEligibleForReschedule =
    booking.status === "CONFIRMED" && Boolean(booking.canRescheduleOnline);

  return (
    <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-pink-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-900 text-sm">{booking.bookingCode}</span>
          <span className={`px-2 py-0.5 rounded-md font-bold text-xs border ${badge.bg}`}>
            {badge.label}
          </span>
        </div>

        <div className="text-slate-600 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {formatDate(booking.bookingTime)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {booking.totalDurationMinutes} phút
          </span>
        </div>

        <div className="text-slate-500 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-pink-500" />
          <span>{booking.branchName}</span>
          {booking.staffName && (
            <>
              <span className="text-slate-300">•</span>
              <span>Stylist: {booking.staffName}</span>
            </>
          )}
        </div>
      </div>

      <div className="sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 space-y-1.5">
        <div className="font-extrabold text-slate-900 text-sm">{formatCurrency(booking.totalPrice)}</div>
        <div className="flex items-center gap-2 sm:justify-end flex-wrap">
          {booking.status === "CONFIRMED" &&
            (isEligibleForReschedule ? (
              <button
                type="button"
                onClick={() => onReschedule(booking)}
                className="px-2.5 py-1 rounded-lg border border-pink-200 text-pink-700 bg-pink-50 hover:bg-pink-100 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Dời lịch</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 italic">
                {booking.reschedulePolicyNotice ||
                  (booking.rescheduleCount > 0 ? "Đã dời lịch 1 lần" : "Không thể dời lịch (< 2h)")}
              </span>
            ))}

          <button
            type="button"
            onClick={() => onSelect(booking.bookingCode)}
            className="font-bold text-xs text-pink-600 hover:text-pink-700 flex items-center gap-1 cursor-pointer"
          >
            <span>{booking.status === "CONFIRMED" ? "Xem phiếu xác nhận" : "Xem chi tiết"}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
