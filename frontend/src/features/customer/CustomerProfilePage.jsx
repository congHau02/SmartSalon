import React, { useState } from "react";
import { User, Phone, Mail, Calendar, Award, Camera, Wallet, Clock } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { useCustomerSummary } from "./useCustomer";
import { CUSTOMER_TABS as TABS } from "./customer.constants";
import { formatCurrency } from "../../lib/utils";
import { MembershipTierBadge } from "../../components/common/MembershipTierBadge";
import { CustomerBookingsTab } from "./components/CustomerBookingsTab";
import { CustomerLoyaltyTab } from "./components/CustomerLoyaltyTab";
import { CustomerOrdersTab } from "./components/CustomerOrdersTab";

export function CustomerProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("bookings");

  const { data: summary } = useCustomerSummary(Boolean(user));

  if (!user) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Vui lòng đăng nhập để xem thông tin hồ sơ và quản lý lịch hẹn.
      </div>
    );
  }

  const effectiveTier = summary?.membershipTier || user.membershipTier || "STANDARD";
  const creditBalance = Number(summary?.creditBalance ?? user.creditBalance ?? 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      {/* Customer Header Identity Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-pink-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center text-2xl font-black shadow-md shadow-pink-200 shrink-0">
            {user.fullName?.[0] || "U"}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-extrabold text-slate-900">{user.fullName}</h1>
              <MembershipTierBadge tier={effectiveTier} size="sm" showDiscount />
              {creditBalance > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Cọc bảo lưu: {formatCurrency(creditBalance)}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
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

        {summary && (
          <div className="flex items-center gap-3 self-start sm:self-center bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-xs">
            <div className="px-3 text-center border-r border-slate-200">
              <div className="font-extrabold text-slate-900 font-mono text-sm">{summary.upcomingBookingCount}</div>
              <div className="text-[10px] text-slate-400 font-medium">Sắp tới</div>
            </div>
            <div className="px-3 text-center">
              <div className="font-extrabold text-slate-900 font-mono text-sm">{summary.totalCompletedVisits}</div>
              <div className="text-[10px] text-slate-400 font-medium">Lần đến</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-pink-100 pb-1 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? "bg-pink-600 text-white shadow-md shadow-pink-200"
                  : "bg-white text-slate-600 hover:text-pink-600 hover:bg-pink-50 border border-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      {activeTab === "bookings" && <CustomerBookingsTab />}
      {activeTab === "orders" && <CustomerOrdersTab />}
      {activeTab === "loyalty" && <CustomerLoyaltyTab summary={summary} user={user} />}
    </div>
  );
}
