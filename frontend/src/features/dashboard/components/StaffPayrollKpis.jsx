import React from "react";
import { Users, DollarSign, Award, Wallet, Sparkles, HeartHandshake } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export function StaffPayrollKpis({ data }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {/* 1. Tổng nhân sự */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Tổng nhân sự
          </span>
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {data.totalStaffCount || 0} <span className="text-xs font-normal text-slate-500">nhân sự</span>
          </div>
          <span className="text-[10px] text-slate-400">Đang hoạt động tại chi nhánh</span>
        </div>
      </div>

      {/* 2. Tổng lương cứng (Base Salary) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Tổng lương cứng
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {formatCurrency(data.totalBaseSalary)}
          </div>
          <span className="text-[10px] text-slate-400">Định mức chi phí cố định</span>
        </div>
      </div>

      {/* 3. Tổng hoa hồng lũy kế */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Tổng hoa hồng
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-black text-emerald-600 tracking-tight">
            +{formatCurrency(data.totalCommission)}
          </div>
          <span className="text-[10px] text-slate-400">Từ Commission Ledger</span>
        </div>
      </div>

      {/* 4. Tổng chi trả lương & hoa hồng */}
      <div className="bg-white rounded-2xl border border-pink-200/90 bg-linear-to-br from-white to-pink-50/30 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-pink-700 uppercase tracking-wider">
            Tổng chi trả (Payout)
          </span>
          <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {formatCurrency(data.totalPayrollPayout)}
          </div>
          <span className="text-[10px] text-pink-600 font-semibold">Lương cứng + Hoa hồng</span>
        </div>
      </div>

      {/* 5. Tỷ lệ chỉ định stylist TB */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Chỉ định thợ TB
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {(data.averageRequestedStylistRate || 0).toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-400">Khách đặt thợ đích danh</span>
        </div>
      </div>

      {/* 6. Tỷ lệ khách quay lại TB */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Khách quen TB
          </span>
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <HeartHandshake className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {(data.averageRebookingRate || 0).toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-400">Khách thực hiện ≥2 đơn</span>
        </div>
      </div>
    </div>
  );
}
