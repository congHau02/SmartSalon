import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ExternalLink, X, Clock, Calendar } from "lucide-react";
import { formatTimeRange, formatDateVi } from "../shifts.constants";

export function BookingConflictModal({ isOpen, data, onClose }) {
  const navigate = useNavigate();

  if (!isOpen || !data) return null;

  const { bookings = [], message } = data;

  const handleGoToDispatch = () => {
    onClose();
    navigate("/pos");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-rose-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-rose-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Xung đột Lịch hẹn Stylist (HTTP 409)
              </h3>
              <p className="text-xs text-rose-600 font-medium mt-0.5">
                Không thể đổi ca trực do stylist có lịch hẹn khách hàng đang hoạt động
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <div className="py-4 text-xs text-slate-600 leading-relaxed">
          {message ||
            "Hệ thống tự động chặn thao tác để tránh hủy nhầm lịch hẹn đã xác nhận. Vui lòng kiểm tra danh sách lịch bên dưới và điều phối lại sang stylist khác trước khi đổi ca:"}
        </div>

        {/* Conflicting Bookings List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {bookings.map((b, idx) => {
            const startStr = typeof b.startTime === "string" ? b.startTime : "";
            const endStr = typeof b.endTime === "string" ? b.endTime : "";
            const datePart = startStr ? startStr.slice(0, 10) : "";
            const timePart = formatTimeRange(startStr.slice(11, 16), endStr.slice(11, 16));

            return (
              <div
                key={b.bookingCode || idx}
                className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-200/80 hover:border-rose-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded">
                      {b.bookingCode}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      {b.customerName || "Khách hàng"}
                    </span>
                    {b.customerPhone && (
                      <span className="text-[11px] text-slate-500">
                        ({b.customerPhone})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{timePart || "Giờ hẹn"}</span>
                  </div>
                </div>

                {b.reason && (
                  <p className="text-[11px] text-rose-700/90 mt-2 font-medium bg-white/70 p-2 rounded-lg border border-rose-100">
                    {b.reason}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleGoToDispatch}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 rounded-xl shadow-md shadow-pink-500/20 transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Mở Bàn điều phối (Dispatch Board)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
