import React from "react";
import { QrCode, Loader2, Copy, Check } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export function PosVietQrPanel({
  vietQrData,
  isLoadingVietQr,
  liveFinalAmount,
  orderCode,
  onCopy,
  copiedField,
}) {
  return (
    <div className="p-4 rounded-2xl bg-white border border-pink-200 text-slate-900 space-y-4 shadow-sm animate-in zoom-in-95">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <QrCode className="w-4 h-4 text-pink-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-pink-700">
            Mã VietQR thanh toán tự động
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          Đúng số tiền {formatCurrency(liveFinalAmount)}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* QR Code Canvas */}
        <div className="w-44 h-44 p-2 rounded-xl border border-dashed border-pink-300 bg-white flex items-center justify-center shrink-0">
          {isLoadingVietQr ? (
            <div className="flex flex-col items-center gap-1 text-[11px] text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
              <span>Đang tải QR...</span>
            </div>
          ) : vietQrData?.qrCodeUrl ? (
            <img
              src={vietQrData.qrCodeUrl}
              alt="POS VietQR Code"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-[11px] text-slate-400">Không thể tạo mã QR</div>
          )}
        </div>

        {/* Bank details & Copy controls */}
        <div className="space-y-2 text-xs flex-1 w-full">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-[11px] text-slate-500">Ngân hàng thụ hưởng:</div>
            <div className="font-bold text-slate-800">
              {vietQrData?.bankId || "MB"} - {vietQrData?.accountName || "SMART SALON VIETNAM"}
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-[10px] text-slate-500">Số tài khoản:</div>
              <div className="font-mono font-bold text-slate-900">
                {vietQrData?.accountNo || "0988888888"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onCopy(vietQrData?.accountNo || "0988888888", "acc")}
              className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 hover:text-pink-600 hover:border-pink-300 text-xs flex items-center gap-1 cursor-pointer"
            >
              {copiedField === "acc" ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedField === "acc" ? "Đã chép" : "Sao chép"}</span>
            </button>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-pink-50/60 border border-pink-200">
            <div>
              <div className="text-[10px] text-pink-700 font-semibold">
                Nội dung chuyển khoản:
              </div>
              <div className="font-mono font-bold text-pink-900">
                {vietQrData?.description || orderCode}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onCopy(vietQrData?.description || orderCode, "desc")}
              className="p-1.5 rounded-lg bg-white border border-pink-300 text-pink-700 hover:bg-pink-50 text-xs flex items-center gap-1 cursor-pointer"
            >
              {copiedField === "desc" ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedField === "desc" ? "Đã chép" : "Sao chép"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
