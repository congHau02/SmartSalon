import React, { useState } from "react";
import { Calendar, Clock, MapPin, Scissors, AlertCircle, XCircle, CheckCircle2, RotateCcw, Wallet } from "lucide-react";
import { useCustomerBookings } from "../useCustomer";
import { formatCurrency, formatDate } from "../../../lib/utils";
import { CancelBookingModal } from "./CancelBookingModal";

export function CustomerBookingsTab() {
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);

  const { data: bookings = [], isLoading, error } = useCustomerBookings();

  const handleCancelSuccess = () => {
    // Queries are automatically invalidated by useCancelCustomerBooking
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        Đang tải danh sách lịch hẹn của bạn...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
        Không thể tải danh sách lịch hẹn. Vui lòng thử lại sau.
      </div>
    );
  }

  if (!bookings.length) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-pink-100 shadow-sm text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mx-auto">
          <Calendar className="w-7 h-7" />
        </div>
        <h3 className="font-extrabold text-slate-900 text-base">Chưa có lịch hẹn nào</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Bạn chưa có lịch hẹn nào sắp tới hoặc trong quá khứ. Hãy đặt lịch làm đẹp ngay hôm nay!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 2-Hour Cancellation Policy Banner */}
      <div className="p-4 rounded-2xl bg-pink-50/60 border border-pink-100 text-pink-900 text-xs flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Chính sách hủy lịch & bảo lưu cọc 100%:</span>
          <span className="text-pink-800 leading-relaxed block mt-0.5">
            Bạn có thể hủy lịch trực tuyến trước giờ hẹn <strong>ít nhất 2 tiếng</strong>. Khoản cọc 20% đã thanh toán sẽ được hoàn về <strong>Số dư đặt cọc bảo lưu</strong> để dùng cho lần đặt sau. Nếu dưới 2 tiếng, vui lòng liên hệ hotline chi nhánh để được hỗ trợ.
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {bookings.map((b) => (
          <BookingItemCard
            key={b.id}
            booking={b}
            onCancelRequest={() => setSelectedBookingForCancel(b)}
          />
        ))}
      </div>

      <CancelBookingModal
        booking={selectedBookingForCancel}
        isOpen={Boolean(selectedBookingForCancel)}
        onClose={() => setSelectedBookingForCancel(null)}
        onSuccess={handleCancelSuccess}
      />
    </div>
  );
}

function BookingItemCard({ booking, onCancelRequest }) {
  const isUpcoming = booking.status === "PENDING_PAYMENT" || booking.status === "CONFIRMED";

  const getStatusBadge = (status) => {
    switch (status) {
      case "CONFIRMED":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Đã xác nhận</span>;
      case "PENDING_PAYMENT":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Chờ đặt cọc</span>;
      case "CHECKED_IN":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">Đã check-in</span>;
      case "IN_PROGRESS":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">Đang phục vụ</span>;
      case "COMPLETED":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">Hoàn thành</span>;
      case "CANCELLED":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800">Đã hủy</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-slate-900 text-sm">{booking.bookingCode}</span>
              {getStatusBadge(booking.status)}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(booking.bookingTime)} ({booking.totalDurationMinutes} phút)
              </span>
            </div>
          </div>
        </div>

        <div className="text-right sm:self-center">
          <div className="text-xs text-slate-400">Tổng chi phí</div>
          <div className="text-sm font-extrabold text-slate-900 font-mono">{formatCurrency(booking.totalPrice)}</div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-pink-500 shrink-0" />
          <span>Chi nhánh: <strong>{booking.branchName}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Scissors className="w-3.5 h-3.5 text-pink-500 shrink-0" />
          <span>Stylist: <strong>{booking.stylistName || "Tự động phân bổ"}</strong></span>
        </div>
      </div>

      {booking.items?.length > 0 && (
        <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
          <span className="font-bold text-slate-500 text-[11px] block">Dịch vụ đã chọn:</span>
          <div className="flex flex-wrap gap-1.5">
            {booking.items.map((it) => (
              <span key={it.id} className="bg-white px-2.5 py-1 rounded-md border border-slate-200/80 text-slate-700 font-medium">
                {it.serviceName} ({formatCurrency(it.price)})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Deposit info & Cancel action footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Tiền cọc 20%:</span>
          <span className="font-bold text-slate-800 font-mono">{formatCurrency(booking.depositAmount)}</span>
          {booking.depositStatus === "PAID" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Đã cọc
            </span>
          )}
          {booking.depositStatus === "CREDITED" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
              Đã bảo lưu vào ví
            </span>
          )}
        </div>

        {isUpcoming && (
          <div>
            {booking.canCancelOnline ? (
              <button
                type="button"
                onClick={onCancelRequest}
                className="px-3.5 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Hủy lịch hẹn</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 italic">
                {booking.cancelPolicyNotice || "Không thể hủy trực tuyến (< 2h)"}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
