import React from "react";
import { Wallet, Sparkles, Gift } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";
import { MembershipTierBadge } from "../../../components/common/MembershipTierBadge";
import { TIER_CONFIG } from "../customer.constants";
import { TIERS_MATRIX } from "../customer.constants";

export function MembershipTierCard({ summary, user }) {
  const tier = summary?.membershipTier || user?.membershipTier || "STANDARD";
  const tierInfo = TIER_CONFIG[tier] || TIER_CONFIG.STANDARD;
  const totalSpent = Number(summary?.totalSpent ?? user?.totalSpent ?? 0);
  const nextTier = summary?.nextTier || user?.nextTier;
  const amountToNext = Number(summary?.amountToNextTier ?? user?.amountToNextTier ?? 0);
  const creditBalance = Number(summary?.creditBalance ?? user?.creditBalance ?? 0);

  const nextTierThreshold = totalSpent + amountToNext;
  const progressPct =
    nextTier && nextTierThreshold > 0
      ? Math.min(100, Math.round((totalSpent / nextTierThreshold) * 100))
      : 100;

  return (
    <div className="space-y-6">
      {/* Interactive VIP Membership Card */}
      <div className={`p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden bg-gradient-to-br ${
        tier === "DIAMOND"
          ? "from-slate-900 via-indigo-950 to-purple-950 border border-purple-400/30"
          : tier === "GOLD"
          ? "from-amber-700 via-amber-600 to-yellow-600 border border-amber-300/40"
          : tier === "SILVER"
          ? "from-slate-700 via-slate-600 to-zinc-600 border border-slate-300/30"
          : "from-slate-800 to-slate-900 border border-slate-700"
      }`}>
        <div className="relative z-10 flex flex-col justify-between h-48 sm:h-52">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-sm tracking-wider uppercase">SmartSalon VIP Club</span>
            </div>
            <MembershipTierBadge tier={tier} size="md" showDiscount />
          </div>

          <div>
            <div className="text-xs uppercase tracking-widest text-white/70 font-mono mb-1">Thành viên chính thức</div>
            <div className="text-xl sm:text-2xl font-black tracking-tight">{user?.fullName || "Quý khách"}</div>
            <div className="text-xs text-white/80 font-mono mt-0.5">{user?.phone}</div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/20 text-xs">
            <span className="text-white/80">Ưu đãi dịch vụ:</span>
            <span className="font-extrabold text-sm font-mono">
              {tierInfo.discountPercent > 0 ? `Giảm ${tierInfo.discountPercent}% trọn đời` : "Giá chuẩn niêm yết"}
            </span>
          </div>
        </div>
      </div>

      {/* Spend Progression Bar */}
      <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Tổng chi tiêu tích lũy
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {formatCurrency(totalSpent)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Hạng tiếp theo
            </span>
            <span className="text-base font-bold text-pink-600 font-mono">
              {nextTier ? nextTier : "Đạt mức tối đa"}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-rose-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
            <span>Tiến độ: {progressPct}%</span>
            {nextTier ? (
              <span>Cần thêm <strong>{formatCurrency(amountToNext)}</strong> để thăng hạng <strong>{nextTier}</strong></span>
            ) : (
              <span className="text-emerald-600 font-bold">★ Bạn đang ở hạng cao nhất (DIAMOND)</span>
            )}
          </div>
        </div>
      </div>

      {/* Retained Deposit Callout Card */}
      <div className="bg-emerald-50/70 rounded-2xl p-6 border border-emerald-200/80 shadow-2xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
              Số dư đặt cọc bảo lưu
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {formatCurrency(creditBalance)}
            </span>
          </div>
        </div>
        <p className="text-xs text-emerald-800 leading-relaxed">
          Khoản tiền cọc bảo lưu phát sinh khi bạn hủy lịch hẹn trước ít nhất 2 tiếng. Số dư này <strong>tự động cấn trừ vào tiền cọc 20%</strong> khi bạn đặt lịch hẹn trực tuyến mới (không cần chuyển khoản VietQR nếu đủ tiền), hoặc trừ trực tiếp vào hóa đơn khi bạn đến salon làm đẹp.
        </p>
      </div>

      {/* 4-Tier Benefits Matrix */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50 border-b border-slate-100 font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <Gift className="w-4 h-4 text-pink-600" />
          <span>Bảng đặc quyền 4 hạng thành viên SmartSalon</span>
        </div>
        <div className="divide-y divide-slate-100">
          {TIERS_MATRIX.map((m) => (
            <TierMatrixRow key={m.tier} matrixItem={m} isCurrent={m.tier === tier} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TierMatrixRow({ matrixItem, isCurrent }) {
  return (
    <div className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${isCurrent ? "bg-pink-50/40" : ""}`}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <MembershipTierBadge tier={matrixItem.tier} size="xs" />
          <span className="font-extrabold text-slate-900">{matrixItem.name}</span>
          {isCurrent && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-700">
              Hạng của bạn
            </span>
          )}
        </div>
        <p className="text-slate-500 text-[11px]">{matrixItem.perks}</p>
      </div>
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0">
        <span className="text-slate-400 font-mono text-[11px]">
          Từ {formatCurrency(matrixItem.minSpend)}
        </span>
        <span className="font-extrabold text-pink-600 text-sm">
          {matrixItem.discountPercent > 0 ? `Giảm ${matrixItem.discountPercent}%` : "0%"}
        </span>
      </div>
    </div>
  );
}
