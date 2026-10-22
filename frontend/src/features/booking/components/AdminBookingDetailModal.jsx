import React from "react";
import { X } from "lucide-react";
import { ConfirmedBookingView } from "./ConfirmedBookingView";

export function AdminBookingDetailModal({ booking, onClose }) {
  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Chi tiết phiếu xác nhận đặt hẹn
            </h3>
            <p className="text-xs text-slate-500">
              Mã lịch hẹn: {booking.bookingCode}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ chi tiết"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ConfirmedBookingView
          booking={booking}
          onNewBooking={onClose}
        />
      </div>
    </div>
  );
}
