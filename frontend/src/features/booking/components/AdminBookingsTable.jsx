import React from "react";
import { Loader2, CalendarCheck } from "lucide-react";
import { AdminBookingTableRow } from "./AdminBookingTableRow";

export function AdminBookingsTable({
  isLoading,
  bookings = [],
  statusConfig = {},
  onSimulateDeposit,
  isSimulating,
  onQuickStatusUpdate,
  isUpdatingStatus,
  onOpenStatusModal,
  onOpenDetail,
}) {
  const actions = {
    onSimulateDeposit,
    isSimulating,
    onQuickStatusUpdate,
    isUpdatingStatus,
    onOpenStatusModal,
    onOpenDetail,
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {isLoading ? (
        <div className="p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-pink-600 mx-auto" />
          <p className="text-xs text-slate-500">Đang tải danh sách lịch hẹn...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">Không có lịch hẹn nào phù hợp</p>
          <p className="text-xs text-slate-400">
            Thử thay đổi bộ lọc chi nhánh hoặc ngày hẹn để tìm kiếm.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs">
                <th className="py-3 px-4 font-bold">Mã & Giờ hẹn</th>
                <th className="py-3 px-4 font-bold">Khách hàng</th>
                <th className="py-3 px-4 font-bold">Chi nhánh & Stylist</th>
                <th className="py-3 px-4 font-bold">Dịch vụ</th>
                <th className="py-3 px-4 font-bold">Chi phí & Cọc</th>
                <th className="py-3 px-4 font-bold">Trạng thái</th>
                <th className="py-3 px-4 font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <AdminBookingTableRow
                  key={b.id}
                  booking={b}
                  statusConfig={statusConfig}
                  actions={actions}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
