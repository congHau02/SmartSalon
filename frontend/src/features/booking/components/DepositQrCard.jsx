import React from "react";
import { QrCode, Loader2, ExternalLink } from "lucide-react";

export function DepositQrCard({ isLoadingPayment, paymentInfo }) {
  return (
    <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-pink-200 shadow-sm text-center space-y-4">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-50 text-pink-700">
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

      <p className="text-xs text-slate-400 leading-relaxed">
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
  );
}
