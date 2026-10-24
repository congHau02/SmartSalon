import React from "react";
import { User, Phone, Mail, Award, Wallet, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { formatCurrency } from "../../lib/utils";
import { MembershipTierBadge, TIER_CONFIG } from "../../components/common/MembershipTierBadge";

export function CustomerProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Vui lòng đăng nhập để xem thông tin hồ sơ và hạng thành viên.
      </div>
    );
  }

  const tier = user.membershipTier || "STANDARD";
  const tierInfo = TIER_CONFIG[tier] || TIER_CONFIG.STANDARD;
  const totalSpent = Number(user.totalSpent || 0);
  const nextTier = user.nextTier;
  const amountToNext = Number(user.amountToNextTier || 0);

  // Compute progress percentage
  const nextTierThreshold = totalSpent + amountToNext;
  const progressPct =
    nextTier && nextTierThreshold > 0
      ? Math.min(100, Math.round((totalSpent / nextTierThreshold) * 100))
      : 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center text-2xl font-black shadow-md shadow-pink-200">
              {user.fullName?.[0] || "U"}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-extrabold text-slate-900">{user.fullName}</h1>
                <MembershipTierBadge tier={tier} size="sm" showDiscount />
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {user.phone}
                </span>
                {user.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {user.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Loyalty Spend Progression */}
        <div className="space-y-4">
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
                Ưu đãi hiện tại
              </span>
              <span className="text-base font-bold text-pink-600">
                {tierInfo.discountPercent > 0 ? `Giảm ${tierInfo.discountPercent}% dịch vụ` : "Giá niêm yết"}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-rose-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>Hạng hiện tại: {tier}</span>
              {nextTier ? (
                <span>
                  Cần thêm <strong>{formatCurrency(amountToNext)}</strong> để lên <strong>{nextTier}</strong>
                </span>
              ) : (
                <span className="text-emerald-600 font-bold">★ Đạt hạng cao nhất (DIAMOND)</span>
              )}
            </div>
          </div>
        </div>

        {/* Balance & Benefits Quick Info */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Wallet className="w-4 h-4 text-pink-600" />
              <span>Số dư khả dụng</span>
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {formatCurrency(user.creditBalance || 0)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Tài khoản chính thức</span>
            </div>
            <div className="text-sm font-semibold text-slate-800">
              {user.isProvisional ? "Tài khoản tạm" : "Đã kích hoạt bảo mật"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
