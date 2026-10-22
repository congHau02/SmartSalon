import React from "react";
import { Coins, CheckCircle2, Users } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export function CommissionLedgerKpis({
  totalCommission,
  entriesCount,
  staffCount,
}) {
  return (
    <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-800/80 bg-slate-900/60 shrink-0">
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
            Tổng hoa hồng chi trả
          </div>
          <div className="text-xl font-mono font-bold text-white mt-0.5">
            {formatCurrency(totalCommission)}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
          <Coins className="w-5 h-5" />
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
            Lượt công đoạn hoàn tất
          </div>
          <div className="text-xl font-mono font-bold text-white mt-0.5">
            {entriesCount} công đoạn
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider">
            Kỹ thuật viên hưởng hoa hồng
          </div>
          <div className="text-xl font-mono font-bold text-white mt-0.5">
            {staffCount} nhân sự
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
