import React from "react";
import {
  Wallet,
  Coins,
  BadgeDollarSign,
  Scissors,
  CheckCircle2,
  HeartHandshake,
  Repeat,
  Star,
} from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export function PersonalPayrollKpis({ payroll }) {
  const baseSalary = payroll?.baseSalary || 0;
  const totalCommission = payroll?.totalCommission || 0;
  const totalPayout = payroll?.totalPayout || baseSalary + totalCommission;
  const completedOrders = payroll?.completedOrderCount || 0;
  const completedSteps = payroll?.completedStepCount || 0;

  const requestedRate = payroll?.requestedStylistRate != null ? Number(payroll.requestedStylistRate) : 0;
  const rebookingRate = payroll?.rebookingRate != null ? Number(payroll.rebookingRate) : 0;
  const avgRating = payroll?.averageRating != null ? Number(payroll.averageRating).toFixed(1) : "0.0";
  const reviewCount = payroll?.reviewCount || 0;

  return (
    <div className="space-y-3 p-4 bg-slate-900/50">
      {/* 3 Main Compensation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span className="font-medium">Lương cơ bản tháng</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-black text-slate-100 font-mono">
            {formatCurrency(baseSalary)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Mức lương cứng hợp đồng</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-1.5">
            <span className="font-medium">Hoa hồng tích lũy kỳ này</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-emerald-400 font-mono">
            +{formatCurrency(totalCommission)}
          </div>
          <div className="text-[11px] text-emerald-300/70 mt-0.5">
            Từ {completedSteps} công đoạn hoàn thành
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-pink-950/40 to-rose-950/30 border border-pink-500/40">
          <div className="flex items-center justify-between text-pink-300 text-xs mb-1.5">
            <span className="font-semibold">Tổng thu nhập thực nhận</span>
            <BadgeDollarSign className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-xl font-black text-pink-400 font-mono">
            {formatCurrency(totalPayout)}
          </div>
          <div className="text-[11px] text-pink-300/70 mt-0.5">Lương cứng + Hoa hồng tích lũy</div>
        </div>
      </div>

      {/* Production & Loyalty KPI Badges Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400">Đơn hoàn thành</div>
            <div className="text-xs font-bold text-slate-100 font-mono">{completedOrders} đơn</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2.5">
          <Scissors className="w-4 h-4 text-pink-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400">Bước dịch vụ</div>
            <div className="text-xs font-bold text-slate-100 font-mono">{completedSteps} bước</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2.5">
          <HeartHandshake className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400">Khách yêu cầu</div>
            <div className="text-xs font-bold text-amber-400 font-mono">{requestedRate}%</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2.5">
          <Repeat className="w-4 h-4 text-purple-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400">Khách quay lại</div>
            <div className="text-xs font-bold text-purple-400 font-mono">{rebookingRate}%</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2.5 col-span-2 sm:col-span-1">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400">Đánh giá dịch vụ</div>
            <div className="text-xs font-bold text-yellow-400 font-mono">
              ★ {avgRating} <span className="text-[10px] text-slate-400 font-normal">({reviewCount})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
