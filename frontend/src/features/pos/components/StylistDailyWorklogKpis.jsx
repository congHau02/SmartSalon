import React from "react";
import { Scissors, CheckCircle2, DollarSign, Award, Banknote, QrCode, Wallet } from "lucide-react";
import { formatVND } from "../../../lib/utils";

export function StylistDailyWorklogKpis({ data }) {
  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Production KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Phiếu đã phục vụ</span>
            <Scissors className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">{data.totalTicketCount || 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">đơn hàng hoàn thành</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Công đoạn hoàn tất</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">{data.totalCompletedStepCount || 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">bước kỹ thuật đã làm</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Doanh thu dịch vụ</span>
            <DollarSign className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-lg font-bold text-sky-300 font-mono">
            {formatVND(data.totalServiceRevenue || 0)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">tổng giá trị dịch vụ</div>
        </div>

        <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-3 shadow-sm bg-gradient-to-br from-amber-500/10 to-transparent">
          <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
            <span>Hoa hồng thực nhận</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-amber-400 font-mono">
            {formatVND(data.totalEarnedCommission || 0)}
          </div>
          <div className="text-[10px] text-amber-300/60 mt-0.5">ghi nhận vào sổ cái</div>
        </div>
      </div>

      {/* Shift Handover Cash & Transfer Reconciliation */}
      <div className="bg-gradient-to-r from-slate-900/95 via-slate-800/90 to-slate-900/95 border border-indigo-500/30 rounded-2xl p-4 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Đối soát tiền thu hộ cuối ca (Tự thu tại ghế)
              </h4>
              <p className="text-[11px] text-slate-400">
                Phân biệt tiền thợ trực tiếp thu với tiền lễ tân thu tại quầy ({data.selfSettledOrderCount || 0} đơn tự thu)
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Tổng tiền tự thu hộ:</span>
            <span className="text-base font-bold text-white font-mono">
              {formatVND(data.totalSelfCollectedAmount || 0)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-700/60">
          <div className="flex items-center justify-between bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-2.5">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[11px] font-semibold text-emerald-300 block">Tiền mặt cần nộp lại</span>
                <span className="text-[10px] text-slate-400">Bàn giao cho Quản lý / Lễ tân</span>
              </div>
            </div>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {formatVND(data.cashCollectedToHandover || 0)}
            </span>
          </div>

          <div className="flex items-center justify-between bg-sky-950/30 border border-sky-500/30 rounded-xl p-2.5">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <span className="text-[11px] font-semibold text-sky-300 block">Chuyển khoản VietQR / Thẻ</span>
                <span className="text-[10px] text-slate-400">Đã vào tài khoản salon</span>
              </div>
            </div>
            <span className="text-sm font-bold text-sky-400 font-mono">
              {formatVND(data.transferCollectedAmount || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
