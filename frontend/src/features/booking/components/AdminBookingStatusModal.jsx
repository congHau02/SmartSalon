import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";

export function AdminBookingStatusModal({
  booking,
  onClose,
  onConfirm,
  isUpdating,
}) {
  const [newStatus, setNewStatus] = useState(booking?.status || "CONFIRMED");
  const [statusNote, setStatusNote] = useState("");

  if (!booking) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ status: newStatus, note: statusNote });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Cập nhật trạng thái</h3>
            <p className="text-xs text-slate-500">Mã: {booking.bookingCode}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ cập nhật trạng thái"
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Trạng thái mới</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-pink-500 font-semibold text-slate-800 bg-white"
            >
              <option value="CONFIRMED">Đã xác nhận cọc (CONFIRMED)</option>
              <option value="CHECKED_IN">Đã check-in tại quầy (CHECKED_IN)</option>
              <option value="IN_PROGRESS">Đang phục vụ làm tóc (IN_PROGRESS)</option>
              <option value="COMPLETED">Hoàn thành dịch vụ (COMPLETED)</option>
              <option value="NO_SHOW">Khách vắng mặt (NO_SHOW)</option>
              <option value="CANCELLED">Hủy lịch hẹn (CANCELLED)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Ghi chú điều phối</label>
            <textarea
              rows={3}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Lý do hủy, ghi chú kỹ thuật viên, hoặc thông tin phục vụ..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-pink-500 bg-white"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2 rounded-xl font-bold bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              {isUpdating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span>Lưu cập nhật</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
