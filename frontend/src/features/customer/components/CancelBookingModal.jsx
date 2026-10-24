import React, { useState } from "react";
import { AlertTriangle, Clock, Wallet, X, Loader2 } from "lucide-react";
import { useCancelCustomerBooking } from "../useCustomer";
import { formatCurrency, formatDate } from "../../../lib/utils";

export function CancelBookingModal({ booking, isOpen, onClose, onSuccess }) {
  const [errorMessage, setErrorMessage] = useState(null);
  const cancelMutation = useCancelCustomerBooking();

  if (!isOpen || !booking) return null;

  const hasPaidDeposit = booking.depositStatus === "PAID" && Number(booking.depositAmount || 0) > 0;

  const handleConfirmCancel = async () => {
    setErrorMessage(null);
    try {
      await cancelMutation.mutateAsync(booking.id);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể hủy lịch hẹn. Vui lòng kiểm tra lại điều kiện hoặc liên hệ hotline.";
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-pink-100 space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          disabled={cancelMutation.isPending}
          className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">Xác nhận hủy lịch hẹn</h3>
            <p className="text-xs text-slate-500">
              Mã lịch hẹn: <span className="font-mono font-bold text-slate-800">{booking.bookingCode}</span>
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs text-slate-600">
          <div className="flex justify-between">
            <span className="text-slate-400">Chi nhánh:</span>
            <span className="font-bold text-slate-800">{booking.branchName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Thời gian:</span>
            <span className="font-bold text-slate-800">{formatDate(booking.bookingTime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Kỹ thuật viên:</span>
            <span className="font-bold text-slate-800">{booking.stylistName || "Tự động phân bổ"}</span>
          </div>
        </div>

        {hasPaidDeposit ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs">
              <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Chính sách bảo lưu cọc 100%</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Khoản cọc <strong>{formatCurrency(booking.depositAmount)}</strong> sẽ được chuyển thành <strong>Số dư đặt cọc bảo lưu</strong> vào tài khoản của bạn và tự động cấn trừ khi bạn đặt lịch mới hoặc làm dịch vụ tại quầy.
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-100/70 text-slate-600 text-xs flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Lịch hẹn chưa thanh toán cọc sẽ được giải phóng khung giờ ngay lập tức.</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={cancelMutation.isPending}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Giữ lại lịch hẹn
          </button>
          <button
            type="button"
            onClick={handleConfirmCancel}
            disabled={cancelMutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {cancelMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{cancelMutation.isPending ? "Đang hủy..." : "Đồng ý hủy"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
