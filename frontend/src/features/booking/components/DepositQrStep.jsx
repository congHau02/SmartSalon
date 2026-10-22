import React, { useState, useEffect } from "react";
import {
  Clock,
  AlertTriangle,
  RotateCcw,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { useBookingDetail, usePaymentInfo, useSimulateDepositWebhook } from "../useBooking";
import { ConfirmedBookingView } from "./ConfirmedBookingView";
import { formatCurrency, copyToClipboard } from "../../../lib/utils";
import { DepositQrCard } from "./DepositQrCard";
import { DepositBankDetailsPanel } from "./DepositBankDetailsPanel";

export function DepositQrStep({ bookingCode, onRestartBooking }) {
  const [copiedField, setCopiedField] = useState(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(300); // 5 minutes default

  const { data: booking, isLoading: isLoadingBooking } = useBookingDetail(bookingCode, {
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "PENDING_PAYMENT" ? 2500 : false;
    },
  });

  const { data: paymentInfo, isLoading: isLoadingPayment } = usePaymentInfo(bookingCode);
  const simulateMutation = useSimulateDepositWebhook();

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

  const isExpired =
    booking?.status === "EXPIRED" ||
    (timeLeftSeconds <= 0 && booking?.status === "PENDING_PAYMENT");

  const handleCopy = async (text, fieldName) => {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleSimulate = async () => {
    if (!bookingCode) return;
    try {
      await simulateMutation.mutateAsync(bookingCode);
    } catch (err) {
      console.error("Simulation failed:", err);
    }
  };

  if (isLoadingBooking && !booking) {
    return (
      <div className="p-12 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600 mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Đang chuẩn bị cổng thanh toán cọc...</p>
      </div>
    );
  }

  if (booking?.status === "CONFIRMED" || booking?.depositStatus === "PAID") {
    return <ConfirmedBookingView booking={booking} onNewBooking={onRestartBooking} />;
  }

  if (isExpired) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-red-200 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-extrabold text-lg text-slate-900">Hết thời gian giữ chỗ (Slot Lock)</h3>
          <p className="text-xs text-slate-500 mt-1">
            Thời hạn 5 phút giữ chỗ cho khung giờ đã kết thúc. Khung giờ này đã được giải phóng trên hệ thống.
          </p>
        </div>
        <button
          type="button"
          onClick={onRestartBooking}
          className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
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
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Đang tạm khóa giữ chỗ (5 phút)
            </h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Vui lòng chuyển cọc 20% ({formatCurrency(booking?.depositAmount || 0)}) để hoàn tất giữ chỗ.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-amber-800 font-semibold">Còn lại:</span>
          <div className="font-mono text-xl font-black bg-white px-3 py-1 rounded-xl border border-amber-300 text-amber-900 shadow-2xs">
            {timeFormatted}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-6 items-start">
        <DepositQrCard isLoadingPayment={isLoadingPayment} paymentInfo={paymentInfo} />
        <DepositBankDetailsPanel
          paymentInfo={paymentInfo}
          booking={booking}
          copiedField={copiedField}
          onCopy={handleCopy}
          onSimulate={handleSimulate}
          isSimulating={simulateMutation.isPending}
        />
      </div>
    </div>
  );
}
