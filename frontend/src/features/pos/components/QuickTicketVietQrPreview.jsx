import React, { useState } from "react";
import { QrCode, Copy, Check } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export function QuickTicketVietQrPreview({
  amount = 0,
  description = "THANH TOAN DICH VU",
  bankId = "MB",
  accountNo = "0988888888",
  accountName = "SMART SALON VIETNAM",
}) {
  const [copied, setCopied] = useState(null);

  const safeAmount = Math.max(0, Math.round(Number(amount) || 0));
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${safeAmount}&addInfo=${encodeURIComponent(
    description
  )}&accountName=${encodeURIComponent(accountName)}`;

  const handleCopy = (text, field) => {
    navigator.clipboard?.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-pink-500/30 text-white space-y-3 shadow-md animate-in zoom-in-95">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5">
          <QrCode className="w-4 h-4 text-pink-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-pink-300">
            Mã VietQR chuyển khoản tại ghế
          </span>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 font-bold">
          {formatCurrency(safeAmount)}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* QR Code image */}
        <div className="w-36 h-36 p-1.5 rounded-xl border border-dashed border-pink-400/40 bg-white flex items-center justify-center shrink-0">
          <img src={qrUrl} alt="Quick Ticket VietQR" className="w-full h-full object-contain" />
        </div>

        {/* Bank & Transfer details */}
        <div className="space-y-2 text-xs flex-1 w-full">
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-[10px] text-slate-400 block">Ngân hàng & Chủ TK:</span>
            <span className="font-bold text-slate-200">
              {bankId} - {accountName}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <div>
              <span className="text-[10px] text-slate-400 block">Số tài khoản:</span>
              <span className="font-mono font-bold text-white">{accountNo}</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(accountNo, "acc")}
              className="p-1 px-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copied === "acc" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied === "acc" ? "Đã chép" : "Chép"}</span>
            </button>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-pink-950/30 border border-pink-500/30">
            <div>
              <span className="text-[10px] text-pink-300 block">Nội dung chuyển khoản:</span>
              <span className="font-mono font-bold text-pink-200 text-[11px]">{description}</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(description, "desc")}
              className="p-1 px-2 rounded-lg bg-pink-900/60 hover:bg-pink-800 text-pink-200 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copied === "desc" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied === "desc" ? "Đã chép" : "Chép"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
