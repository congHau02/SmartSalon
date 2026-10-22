import React from "react";
import {
  Clock,
  Phone,
  MapPin,
  Scissors,
  Zap,
  UserCheck,
  Play,
  Check,
  RotateCcw,
  Eye,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../../lib/utils";

export function AdminBookingTableRow({
  booking: b,
  statusConfig = {},
  actions,
}) {
  const {
    onSimulateDeposit,
    isSimulating,
    onQuickStatusUpdate,
    isUpdatingStatus,
    onOpenStatusModal,
    onOpenDetail,
  } = actions;

  const statusCfg = statusConfig[b.status] || {
    label: b.status,
    color: "text-slate-700 bg-slate-100 border-slate-200",
  };

  return (
    <tr className="hover:bg-pink-50/20 transition-colors">
      {/* Code & Time */}
      <td className="py-3 px-4">
        <span className="font-mono font-bold text-slate-900 block">
          {b.bookingCode}
        </span>
        <span className="text-xs font-semibold text-pink-700 flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3" />
          <span>{formatDate(b.bookingTime)}</span>
        </span>
        <span className="text-xs text-slate-400 block mt-0.5">
          Thời lượng: {b.totalDurationMinutes} phút
        </span>
      </td>

      {/* Customer */}
      <td className="py-3 px-4">
        <div className="font-bold text-slate-900">{b.customerName}</div>
        <div className="text-slate-500 font-mono text-xs flex items-center gap-1 mt-0.5">
          <Phone className="w-3 h-3 text-slate-400" />
          <span>{b.customerPhone}</span>
        </div>
      </td>

      {/* Branch & Stylist */}
      <td className="py-3 px-4">
        <div className="font-semibold text-slate-800 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-pink-500 shrink-0" />
          <span className="truncate max-w-[150px]">{b.branchName}</span>
        </div>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
          <Scissors className="w-3 h-3 text-slate-400 shrink-0" />
          <span>{b.staffName || "Tự động phân bổ"}</span>
        </div>
      </td>

      {/* Services */}
      <td className="py-3 px-4">
        <div className="flex flex-wrap gap-1 max-w-[220px]">
          {b.items?.map((item) => (
            <span
              key={item.id}
              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-xs"
            >
              {item.serviceName}
            </span>
          ))}
        </div>
      </td>

      {/* Financials */}
      <td className="py-3 px-4">
        <div className="font-bold text-slate-900">
          {formatCurrency(b.totalPrice)}
        </div>
        <div className="mt-0.5 flex items-center gap-1">
          <span
            className={`px-1.5 py-0.2 rounded text-xs font-bold ${
              b.depositStatus === "PAID"
                ? "bg-emerald-100 text-emerald-800"
                : b.depositStatus === "REFUNDED"
                ? "bg-purple-100 text-purple-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {b.depositStatus === "PAID" ? "Đã cọc 20%" : "Chưa cọc"}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {formatCurrency(b.depositAmount)}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        <span
          className={`px-2.5 py-1 rounded-full font-bold text-xs border inline-flex items-center gap-1 ${statusCfg.color}`}
        >
          {statusCfg.label}
        </span>
      </td>

      {/* Actions */}
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {b.status === "PENDING_PAYMENT" && (
            <button
              type="button"
              onClick={() => onSimulateDeposit(b.bookingCode)}
              disabled={isSimulating}
              aria-label="Giả lập thanh toán cọc PayOS"
              title="Giả lập thanh toán cọc PayOS"
              className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 cursor-pointer transition-colors"
            >
              <Zap className="w-3.5 h-3.5 fill-amber-600" />
            </button>
          )}

          {b.status === "CONFIRMED" && (
            <button
              type="button"
              onClick={() => onQuickStatusUpdate(b, "CHECKED_IN")}
              disabled={isUpdatingStatus}
              title="Check-in khách đến salon"
              className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <UserCheck className="w-3 h-3" />
              <span>Check-in</span>
            </button>
          )}

          {b.status === "CHECKED_IN" && (
            <button
              type="button"
              onClick={() => onQuickStatusUpdate(b, "IN_PROGRESS")}
              disabled={isUpdatingStatus}
              title="Bắt đầu phục vụ"
              className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Play className="w-3 h-3" />
              <span>Bắt đầu</span>
            </button>
          )}

          {b.status === "IN_PROGRESS" && (
            <button
              type="button"
              onClick={() => onQuickStatusUpdate(b, "COMPLETED")}
              disabled={isUpdatingStatus}
              title="Hoàn thành dịch vụ"
              className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Check className="w-3 h-3" />
              <span>Xong</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenStatusModal(b)}
            aria-label="Đổi trạng thái chi tiết"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors"
            title="Đổi trạng thái chi tiết"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onOpenDetail(b)}
            aria-label="Xem chi tiết & In phiếu xác nhận"
            className="p-1.5 rounded-lg text-pink-600 hover:text-pink-700 hover:bg-pink-50 cursor-pointer transition-colors"
            title="Xem chi tiết & In phiếu xác nhận"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
