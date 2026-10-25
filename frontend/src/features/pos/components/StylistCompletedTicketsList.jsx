import React from "react";
import { CheckCircle2, UserCheck, ShieldCheck, Clock } from "lucide-react";
import { formatVND } from "../../../lib/utils";

export function StylistCompletedTicketsList({ tickets = [] }) {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
        <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-semibold text-slate-300">Chưa có phiếu cắt nào hoàn thành trong ngày</p>
        <p className="text-xs text-slate-500 mt-1">
          Bấm "Tạo phiếu cắt nhanh" hoặc nhận khách từ lịch hẹn để ghi nhận dịch vụ
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
      {tickets.map((t) => (
        <div
          key={t.orderId}
          className="bg-slate-900/80 border border-slate-700/70 hover:border-slate-600 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 transition-colors"
        >
          {/* Ticket & Customer Info */}
          <div className="min-w-[200px]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/20">
                {t.orderCode}
              </span>
              {t.bookingCode && (
                <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                  {t.bookingCode}
                </span>
              )}
            </div>
            <div className="text-xs font-semibold text-white mt-1">
              {t.customerName || "Khách vãng lai"}
              {t.customerPhone && (
                <span className="text-[11px] text-slate-400 font-mono ml-1.5 font-normal">
                  ({t.customerPhone})
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
              {t.serviceNames?.length > 0 ? t.serviceNames.join(", ") : "Dịch vụ"}
              {t.stepNames?.length > 0 && (
                <span className="text-slate-500 text-[10px] ml-1">
                  • Bước: {t.stepNames.join(", ")}
                </span>
              )}
            </div>
          </div>

          {/* Settlement Badge & Payment Method */}
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-semibold px-2 py-1 rounded-lg border flex items-center gap-1 ${
                t.settledByMe
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                  : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              {t.settledByMe ? (
                <>
                  <UserCheck className="w-3 h-3 text-emerald-400" />
                  <span>Tự thu tại ghế</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3 h-3 text-slate-400" />
                  <span>Lễ tân thu</span>
                </>
              )}
            </span>

            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
              {t.paymentMethod || "CASH"}
            </span>
          </div>

          {/* Amount & Earned Commission */}
          <div className="text-right">
            <div className="text-xs font-bold text-white font-mono">
              {formatVND(t.orderFinalAmount || 0)}
            </div>
            <div className="text-[11px] font-semibold text-amber-400 font-mono mt-0.5">
              + {formatVND(t.earnedCommission || 0)} hoa hồng
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
