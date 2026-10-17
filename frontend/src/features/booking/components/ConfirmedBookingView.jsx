import React from "react";
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Scissors,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../../lib/utils";

export function ConfirmedBookingView({ booking, onNewBooking }) {
  if (!booking) return null;

  const depositPaid = Number(booking.depositAmount || 0);
  const totalPrice = Number(booking.totalPrice || 0);
  const remainingAtSalon = Math.max(0, totalPrice - depositPaid);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 text-base">Lịch hẹn đã được xác nhận thành công!</h2>
          <p className="text-xs text-emerald-700">
            SmartSalon đã nhận tiền cọc 20% và khóa lịch chính thức cho bạn.
          </p>
        </div>
      </div>

      {/* Confirmation Card Container */}
      <div className="bg-white rounded-3xl border-2 border-pink-200 shadow-xl overflow-hidden relative print:border-slate-300 print:shadow-none">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 p-6 text-white relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xs font-semibold tracking-wider uppercase text-pink-100 block">
                  Phiếu Xác Nhận Đặt Hẹn Điện Tử
                </span>
                <span className="text-lg font-black tracking-tight">SmartSalon Vietnam</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase font-bold tracking-wider text-pink-200 block">Mã lịch hẹn</span>
              <span className="font-mono font-extrabold text-base bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-md">
                {booking.bookingCode}
              </span>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Date & Time Big Banner */}
          <div className="p-4 rounded-2xl bg-pink-50/70 border border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Thời gian phục vụ</div>
                <div className="text-lg font-black text-slate-900 tracking-tight">
                  {formatDate(booking.bookingTime)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-pink-700 bg-white px-3 py-1.5 rounded-full border border-pink-200 self-start sm:self-center shadow-2xs">
              <Clock className="w-3.5 h-3.5" />
              <span>Thời lượng: {booking.totalDurationMinutes} phút</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            {/* Branch */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3 text-pink-500" />
                Chi nhánh phục vụ
              </span>
              <div className="font-bold text-slate-900 text-sm">{booking.branchName}</div>
            </div>

            {/* Stylist */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-xs flex items-center gap-1">
                <Scissors className="w-3 h-3 text-pink-500" />
                Kỹ thuật viên (Stylist)
              </span>
              <div className="font-bold text-slate-900 text-sm">
                {booking.staffName || "Tự động phân bổ KTV"}
              </div>
            </div>

            {/* Customer */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-xs flex items-center gap-1">
                <User className="w-3 h-3 text-pink-500" />
                Khách hàng
              </span>
              <div className="font-bold text-slate-900 text-sm">{booking.customerName}</div>
            </div>

            {/* Phone */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-xs flex items-center gap-1">
                <Phone className="w-3 h-3 text-pink-500" />
                Số điện thoại
              </span>
              <div className="font-bold text-slate-900 text-sm">{booking.customerPhone}</div>
            </div>
          </div>

          {/* Services Table */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <div className="bg-slate-50/80 px-4 py-2 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Dịch vụ đăng ký ({booking.items?.length || 0})
            </div>
            <div className="divide-y divide-slate-100">
              {booking.items?.map((item) => (
                <div key={item.id} className="px-4 py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">{item.serviceName}</span>
                    <span className="text-slate-400 text-xs ml-2">({item.durationMinutes} phút)</span>
                  </div>
                  <span className="font-bold text-slate-900">{formatCurrency(item.price)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Perforated Separator */}
          <div className="relative py-2">
            <div className="border-t-2 border-dashed border-slate-200" />
            <div className="absolute -left-9 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-pink-50/20 border-r-2 border-pink-200" />
            <div className="absolute -right-9 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-pink-50/20 border-l-2 border-pink-200" />
          </div>

          {/* Payment Breakdown */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Tổng chi phí dịch vụ:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(totalPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-emerald-700 font-bold">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Đã đặt cọc (20% PayOS VietQR):
              </span>
              <span className="text-sm">-{formatCurrency(depositPaid)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-900 text-sm">Còn lại thanh toán tại quầy (80%):</span>
              <span className="font-extrabold text-pink-700 text-base">{formatCurrency(remainingAtSalon)}</span>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100 text-xs text-slate-500">
          Vui lòng đến trước giờ hẹn 10 phút và đưa mã <strong>{booking.bookingCode}</strong> cho lễ tân để được tiếp đón chu đáo nhất.
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          aria-label="In phiếu xác nhận hoặc lưu tệp PDF"
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-white flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
        >
          <Printer className="w-4 h-4" />
          <span>In phiếu xác nhận / Lưu PDF</span>
        </button>

        <button
          type="button"
          onClick={onNewBooking}
          aria-label="Đặt thêm lịch hẹn mới"
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-200 hover:from-pink-600 hover:to-rose-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <span>Đặt thêm lịch hẹn mới</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Alias for backwards-compatibility
export { ConfirmedBookingView as ConfirmedTicket };
