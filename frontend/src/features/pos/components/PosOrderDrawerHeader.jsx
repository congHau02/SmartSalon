import React from "react";
import { X, CheckCircle2, Sparkles, Clock, Scissors, Camera, CreditCard } from "lucide-react";
import { MembershipTierBadge } from "../../../components/common/MembershipTierBadge";
import { formatCurrency } from "../../../lib/utils";

export function PosOrderDrawerHeader({
  order,
  notice,
  stepStats,
  tabState,
  onClose,
  // Graceful fallbacks for legacy prop shape
  actionNotice = notice?.value,
  setActionNotice = notice?.onDismiss,
  completedSteps = stepStats?.completed || 0,
  totalSteps = stepStats?.total || 0,
  inProgressSteps = stepStats?.inProgress || 0,
  activeTab = tabState?.activeTab,
  setActiveTab = tabState?.setActiveTab,
}) {
  return (
    <>
      {/* Drawer Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              id="drawer-order-title"
              className="font-mono text-base sm:text-lg font-bold text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-lg border border-pink-500/20"
            >
              {order?.orderCode || "..."}
            </span>
            {order?.bookingCode && (
              <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                Lịch hẹn: {order.bookingCode}
              </span>
            )}
            {/* Order Status Badge */}
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                order?.status === "PAID"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : order?.status === "READY_FOR_CHECKOUT"
                  ? "bg-teal-500/10 border-teal-500/30 text-teal-300 animate-pulse"
                  : order?.status === "IN_PROGRESS"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-slate-700/40 border-slate-600 text-slate-300"
              }`}
            >
              {order?.status === "PAID"
                ? "Đã thanh toán"
                : order?.status === "READY_FOR_CHECKOUT"
                ? "Chờ thanh toán"
                : order?.status === "IN_PROGRESS"
                ? "Đang phục vụ"
                : "Đã check-in"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-white">{order?.customerName}</span>
            {order?.customerPhone && order?.customerPhone !== "0000000000" && (
              <>
                <span>•</span>
                <span className="font-mono">{order.customerPhone}</span>
              </>
            )}
            {order?.customerMembershipTier && order?.customerPhone !== "0000000000" && (
              <MembershipTierBadge
                tier={order.customerMembershipTier}
                size="xs"
                showDiscount={order.customerDiscountPercent > 0}
              />
            )}
            {Number(order?.customerCreditBalance) > 0 && (
              <span className="text-emerald-300 font-semibold">
                Tiền cọc bảo lưu: {formatCurrency(order.customerCreditBalance)}
              </span>
            )}
            {order?.branchName && (
              <>
                <span>•</span>
                <span className="text-slate-400">{order.branchName}</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Đóng bảng đơn hàng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Action Notice Toast */}
      {actionNotice && (
        <div
          className={`mx-4 mt-3 p-3 rounded-xl border flex items-center justify-between text-xs animate-in fade-in ${
            actionNotice.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionNotice.text}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-xs hover:opacity-75 cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Ready for checkout alert banner */}
      {order?.status === "READY_FOR_CHECKOUT" && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-teal-400" />
            <span>
              <strong>Hoàn thành toàn bộ công đoạn!</strong> Đơn đã tự động chuyển sang trạng thái sẵn sàng thanh toán.
            </span>
          </div>
        </div>
      )}

      {/* Step Progress Mini-Bar in Header */}
      {totalSteps > 0 && (
        <div className="px-4 py-2 bg-slate-850/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-pink-400" />
            <span className="text-slate-300 font-medium">Tiến độ quy trình:</span>
            <span className="font-mono text-pink-400 font-bold">
              {completedSteps}/{totalSteps} bước ({Math.round((completedSteps / totalSteps) * 100)}%)
            </span>
          </div>
          <div className="w-36 h-2 bg-slate-700 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 transition-all duration-300"
              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
            />
            <div
              className="bg-amber-400 transition-all duration-300"
              style={{ width: `${(inProgressSteps / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-900 px-4 pt-1 gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("cart")}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === "cart"
              ? "border-pink-500 text-pink-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span>1. Dịch vụ & Chia công đoạn</span>
          {order?.items?.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {order.items.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("visuallog")}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === "visuallog"
              ? "border-pink-500 text-pink-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>2. Visual Log (BOM & Ảnh)</span>
        </button>

        <button
          onClick={() => setActiveTab("checkout")}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === "checkout"
              ? "border-pink-500 text-pink-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>3. Thanh toán</span>
        </button>
      </div>
    </>
  );
}
