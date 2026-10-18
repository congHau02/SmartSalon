import React from "react";
import { useNavigate } from "react-router-dom";
import { X, CalendarPlus, CheckCircle2, RefreshCw, Scissors, ArrowRight } from "lucide-react";
import { useRealtime } from "./RealtimeContext";

export function RealtimeToastContainer() {
  const { activeToasts, dismissToast, markAsRead } = useRealtime();
  const navigate = useNavigate();

  if (!activeToasts || activeToasts.length === 0) {
    return null;
  }

  const handleOpenToast = (toast) => {
    markAsRead(toast.id);
    dismissToast(toast.id);
    if (toast.channelType === "dispatch") {
      navigate("/pos");
    } else {
      navigate("/admin/bookings");
    }
  };

  const getToastIcon = (eventType) => {
    switch (eventType) {
      case "BOOKING_CREATED":
        return <CalendarPlus className="w-5 h-5 text-blue-600" />;
      case "BOOKING_CONFIRMED":
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case "BOOKING_STATUS_CHANGED":
        return <RefreshCw className="w-5 h-5 text-amber-600" />;
      default:
        return <Scissors className="w-5 h-5 text-pink-600" />;
    }
  };

  return (
    <aside
      aria-live="polite"
      aria-label="Thông báo nổi trực tiếp"
      className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {activeToasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-white rounded-2xl p-4 shadow-2xl border border-slate-200/90 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-200"
        >
          {/* Category Icon */}
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-2xs">
            {getToastIcon(toast.eventType)}
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                STOMP Real-Time
              </span>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Đóng thông báo"
                className="min-w-[32px] min-h-[32px] w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h4 className="text-xs font-bold text-slate-900 mt-0.5 truncate">
              {toast.title}
            </h4>
            <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
              {toast.message}
            </p>

            {/* Quick Actions */}
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenToast(toast)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <span>Xem ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              {toast.code && (
                <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
                  {toast.code}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </aside>
  );
}
