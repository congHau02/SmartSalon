import React, { useState, useEffect, useMemo } from "react";
import {
  QrCode,
  Clock,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  Zap,
  Loader2,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { useBookingDetail, usePaymentInfo, useSimulateDepositWebhook } from "../useBooking";
import { ConfirmedTicket } from "./ConfirmedTicket";
import { formatCurrency } from "../../../lib/utils";

export function DepositQrStep({ bookingCode, onRestartBooking }) {
  const [copiedField, setCopiedField] = useState(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(300); // 5 minutes default

  // Poll booking detail every 2.5s while PENDING_PAYMENT
  const { data: booking, isLoading: isLoadingBooking } = useBookingDetail(bookingCode, {
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "PENDING_PAYMENT" ? 2500 : false;
    },
  });

  // Fetch Payment VietQR info
  const { data: paymentInfo, isLoading: isLoadingPayment } = usePaymentInfo(bookingCode);

  // Sandbox simulation mutation
  const simulateMutation = useSimulateDepositWebhook();

  // Expiration calculation
  useEffect(() => {
    const expiresAtStr = booking?.slotLockExpiresAt || paymentInfo?.slotLockExpiresAt;
    if (!expiresAtStr) return;

    const targetTime = new Date(expiresAtStr).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((targetTime - now) / 1000));
      setTimeLeftSeconds(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [booking?.slotLockExpiresAt, paymentInfo?.slotLockExpiresAt]);

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const isExpired = booking?.status === "EXPIRED" || (timeLeftSeconds <= 0 && booking?.status === "PENDING_PAYMENT");

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSimulate = async () => {
    if (!bookingCode) return;
    try {
      await simulateMutation.mutateAsync(bookingCode);
    } catch (err) {
      console.error("Simulation failed:", err);
    }
  };

  // If no booking code, show restart prompt
  if (!bookingCode) {
    return (
      <div className="max-w-md mx-auto p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-sm animate-in fade-in duration-300">
        <h2 className="text-lg font-bold text-slate-900">Không tìm thấy thông tin lịch hẹn</h2>
        <p className="text-xs text-slate-500">Vui lòng tạo lịch hẹn mới để lấy mã giữ chỗ và thực hiện thanh toán.</p>
        <button
          type="button"
          onClick={onRestartBooking}
          className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-pink-600 text-white hover:bg-pink-700 transition-all cursor-pointer shadow-xs"
        >
          Đặt lịch ngay
        </button>
      </div>
    );
  }

  // If Confirmed, show Ticket
  if (booking?.status === "CONFIRMED" || booking?.depositStatus === "PAID") {
    return <ConfirmedTicket booking={booking} onNewBooking={onRestartBooking} />;
  }

  // If Expired, show Retry
  if (isExpired) {
    return (
      <div className="max-w-md mx-auto p-8 rounded-3xl bg-white border border-rose-200 text-center space-y-4 shadow-sm animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Thời gian giữ chỗ đã hết hạn</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Khoá giữ chỗ 5 phút cho lịch hẹn <strong>{bookingCode}</strong> đã hết thời gian hiệu lực. Khung giờ này đã được giải phóng để các khách hàng khác có thể đặt.
        </p>
        <button
          type="button"
          onClick={onRestartBooking}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-200 hover:from-pink-600 hover:to-rose-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Đặt lại lịch hẹn mới</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 5-minute countdown banner */}
      <div className="p-4 rounded-2xl bg-white border border-pink-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
              timeLeftSeconds < 60
                ? "bg-rose-500 text-white animate-pulse"
                : timeLeftSeconds < 120
                ? "bg-amber-500 text-white"
                : "bg-pink-600 text-white"
            }`}
          >
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Thời gian giữ chỗ trên hệ thống
            </div>
            <div className="text-xs text-slate-600">
              Khung giờ của bạn đang được khoá độc quyền trong vòng:
            </div>
          </div>
        </div>

        <div
          className={`px-4 py-2 rounded-xl font-mono text-2xl font-black text-center tracking-wider border ${
            timeLeftSeconds < 60
              ? "bg-rose-50 text-rose-600 border-rose-200 animate-pulse"
              : timeLeftSeconds < 120
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-pink-50 text-pink-700 border-pink-200"
          }`}
        >
          {timeFormatted}
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-6 items-start">
        {/* Left: VietQR Image */}
        <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-pink-200 shadow-sm text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-pink-50 text-pink-700">
            <QrCode className="w-3.5 h-3.5" />
            <span>VietQR Thanh Toán Tự Động</span>
          </div>

          <div className="relative mx-auto w-56 h-56 rounded-2xl border-2 border-dashed border-pink-200 p-2 flex items-center justify-center bg-white shadow-2xs">
            {isLoadingPayment ? (
              <div className="flex flex-col items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                <span>Đang tạo mã VietQR...</span>
              </div>
            ) : paymentInfo?.qrCodeUrl ? (
              <img
                src={paymentInfo.qrCodeUrl}
                alt="VietQR Deposit Code"
                className="w-full h-full object-contain rounded-xl"
              />
            ) : (
              <div className="text-xs text-slate-400">Không thể tải mã QR</div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Mở App ngân hàng bất kỳ (Vietcombank, MB, Techcombank, Momo, v.v.) và quét mã trên để thanh toán tức thì.
          </p>

          {paymentInfo?.paymentUrl && paymentInfo.paymentUrl !== paymentInfo.qrCodeUrl && (
            <a
              href={paymentInfo.paymentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-pink-600 hover:underline"
            >
              <span>Mở cổng thanh toán PayOS</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Right: Transfer details and manual bank info */}
        <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base">Thông tin chuyển khoản</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống sẽ tự động cập nhật ngay khi ngân hàng báo giao dịch thành công (Polling 2.5s)
            </p>
          </div>

          {/* Details list */}
          <div className="space-y-3 text-xs">
            {/* Bank Name */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
              <strong className="text-slate-900 font-bold">{paymentInfo?.bankId || "MB"} (Quân Đội)</strong>
            </div>

            {/* Account Number */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Số tài khoản:</span>
              <div className="flex items-center gap-2">
                <strong className="text-slate-900 font-mono text-sm">{paymentInfo?.accountNo || "0988888888"}</strong>
                <button
                  type="button"
                  onClick={() => handleCopy(paymentInfo?.accountNo || "0988888888", "accountNo")}
                  className="p-1 text-slate-400 hover:text-pink-600 rounded transition-colors"
                  title="Sao chép số tài khoản"
                >
                  {copiedField === "accountNo" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Account Name */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Chủ tài khoản:</span>
              <strong className="text-slate-900 uppercase">{paymentInfo?.accountName || "SMART SALON VIETNAM"}</strong>
            </div>

            {/* Deposit Amount */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-pink-50/70 border border-pink-200">
              <span className="text-pink-800 font-bold">Số tiền cọc (20%):</span>
              <div className="flex items-center gap-2">
                <strong className="text-pink-700 font-black text-base font-mono">
                  {formatCurrency(paymentInfo?.amount || booking?.depositAmount || 0)}
                </strong>
                <button
                  type="button"
                  onClick={() => handleCopy(paymentInfo?.amount || booking?.depositAmount || 0, "amount")}
                  className="p-1 text-pink-400 hover:text-pink-700 rounded transition-colors"
                  title="Sao chép số tiền"
                >
                  {copiedField === "amount" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Transfer Memo */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-pink-50/70 border border-pink-200">
              <div>
                <span className="text-pink-800 font-bold block">Nội dung chuyển khoản (bắt buộc):</span>
                <span className="text-[10px] text-pink-600">Giữ nguyên mã để hệ thống đối soát tự động</span>
              </div>
              <div className="flex items-center gap-2">
                <strong className="text-pink-900 font-mono text-sm bg-white px-2 py-0.5 rounded border border-pink-300">
                  {bookingCode}
                </strong>
                <button
                  type="button"
                  onClick={() => handleCopy(bookingCode, "bookingCode")}
                  className="p-1 text-pink-400 hover:text-pink-700 rounded transition-colors"
                  title="Sao chép nội dung chuyển khoản"
                >
                  {copiedField === "bookingCode" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Sandbox Testing Simulation Button */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={simulateMutation.isPending}
              onClick={handleSimulate}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold border-2 border-dashed border-amber-300 bg-amber-50/70 text-amber-800 hover:bg-amber-100/70 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              {simulateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  <span>Đang giả lập thanh toán PayOS...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-600 fill-amber-600" />
                  <span>⚡ Giả lập thanh toán thành công (Sandbox 1-Click)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
