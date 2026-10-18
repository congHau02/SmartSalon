import React from "react";
import { 
  TrendingUp, 
  FlaskConical, 
  Users, 
  Wallet, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  ShoppingBag,
  Building2
} from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export function PnlSummaryCards({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!data) return null;

  const isOpProfitPositive = (data.operationalNetProfit || 0) >= 0;
  const isNetProfitPositive = (data.netProfitAfterPayroll || 0) >= 0;

  return (
    <div className="space-y-4">
      {/* Tier 1 Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">
            Tier 1: Lợi nhuận vận hành theo đơn hàng (Operational P&L)
          </h2>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Tổng đơn đã thanh toán: <strong className="text-slate-900">{data.totalOrders || 0}</strong>
        </span>
      </div>

      {/* Tier 1 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Doanh thu thuần */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doanh thu thuần</span>
              <div className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
                {formatCurrency(data.totalNetRevenue)}
              </div>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Dịch vụ:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(data.netServiceRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span>Bán lẻ:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(data.netRetailRevenue)}</span>
            </div>
            {data.totalDiscounts > 0 && (
              <div className="flex justify-between text-pink-600 font-medium">
                <span>Đã giảm trừ:</span>
                <span>-{formatCurrency(data.totalDiscounts)}</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Tổng giá vốn (COGS) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng giá vốn (COGS)</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
                {formatCurrency(data.totalCogs)}
              </div>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <FlaskConical className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Hóa chất kỹ thuật (BOM):</span>
              <span className="font-semibold text-slate-800">{formatCurrency(data.chemicalCogs)}</span>
            </div>
            <div className="flex justify-between">
              <span>Hàng bán lẻ:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(data.retailCogs)}</span>
            </div>
            <div className="flex justify-between items-center pt-0.5">
              <span>Biên lợi nhuận gộp:</span>
              <span className="px-1.5 py-0.5 rounded font-bold text-emerald-700 bg-emerald-50 text-[10px]">
                {data.grossMarginPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* 3. Hoa hồng nhân sự */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hoa hồng thợ & CTV</span>
              <div className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
                {formatCurrency(data.totalCommissions)}
              </div>
            </div>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Từ Sổ hoa hồng (Ledger):</span>
              <span className="font-semibold text-slate-800">100% tự động</span>
            </div>
            <div className="flex justify-between">
              <span>Tỷ lệ trên doanh thu:</span>
              <span className="font-semibold text-purple-700">
                {data.totalNetRevenue > 0 
                  ? ((data.totalCommissions / data.totalNetRevenue) * 100).toFixed(1) 
                  : 0}%
              </span>
            </div>
            <div className="text-[10px] text-slate-400 italic">
              Bao gồm bước kỹ thuật & bán lẻ
            </div>
          </div>
        </div>

        {/* 4. Lợi nhuận vận hành (Tier 1 Net) */}
        <div className={`rounded-2xl border p-4 shadow-xs relative overflow-hidden flex flex-col justify-between ${
          isOpProfitPositive 
            ? "bg-gradient-to-br from-emerald-50/50 via-white to-white border-emerald-200" 
            : "bg-gradient-to-br from-rose-50/50 via-white to-white border-rose-200"
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Lợi nhuận vận hành</span>
              <div className={`text-2xl font-black mt-1 tracking-tight ${
                isOpProfitPositive ? "text-emerald-700" : "text-rose-600"
              }`}>
                {formatCurrency(data.operationalNetProfit)}
              </div>
            </div>
            <div className={`p-2.5 rounded-xl ${
              isOpProfitPositive ? "bg-emerald-100/70 text-emerald-700" : "bg-rose-100/70 text-rose-700"
            }`}>
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between items-center">
              <span>Biên LN vận hành:</span>
              <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                isOpProfitPositive 
                  ? "bg-emerald-100 text-emerald-800" 
                  : "bg-rose-100 text-rose-800"
              }`}>
                {data.netProfitMarginPercentage}%
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              = Doanh thu thuần - COGS - Hoa hồng
            </div>
          </div>
        </div>
      </div>

      {/* Tier 2 Banner: Fixed Base Salary & Net Profit After Payroll */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-5 text-white shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1 max-w-md">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-400/30">
                Tier 2: Sau Chi phí Cố định (Fixed Payroll)
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              Lợi nhuận Ròng Chi nhánh Sau Lương Cứng
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Khấu trừ quỹ lương cơ bản cố định của toàn bộ kỹ thuật viên, thợ phụ và quản lý đang công tác tại {data.branchName || "chi nhánh"}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
            {/* Lương cứng cố định */}
            <div>
              <div className="text-xs text-slate-400 font-medium">Lương cứng nhân sự (Base Salary)</div>
              <div className="text-xl font-black text-rose-300 mt-1">
                -{formatCurrency(data.fixedBaseSalaryCost)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Khấu trừ cố định định kỳ</div>
            </div>

            {/* Lợi nhuận ròng sau lương */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-300 font-medium">LN ròng sau lương cứng</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isNetProfitPositive ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                }`}>
                  {data.netProfitAfterPayrollMarginPercentage}%
                </span>
              </div>
              <div className={`text-xl font-black mt-1 ${
                isNetProfitPositive ? "text-emerald-400" : "text-rose-400"
              }`}>
                {formatCurrency(data.netProfitAfterPayroll)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                = LN Vận hành - Lương cứng
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
