import React from "react";
import { Scissors, ShoppingBag, ChevronRight } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export function OrderKanbanCard({ order, onSelect }) {
  const allSteps = order.items?.flatMap((i) => i.steps || []) || [];
  const completedSteps = allSteps.filter((s) => s.status === "COMPLETED").length;
  const inProgressSteps = allSteps.filter((s) => s.status === "IN_PROGRESS").length;
  const totalSteps = allSteps.length;

  const isPaid = order.status === "PAID";
  const isReady = order.status === "READY_FOR_CHECKOUT";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect?.();
        }
      }}
      className={`p-3.5 rounded-xl border transition-all shadow-sm space-y-3 cursor-pointer ${
        isPaid
          ? "bg-slate-800/60 border-slate-700/60 opacity-80 hover:opacity-100"
          : isReady
          ? "bg-slate-800 border-emerald-500/40 hover:border-emerald-500 shadow-emerald-500/5"
          : "bg-slate-800 border-slate-700/80 hover:border-slate-600"
      }`}
    >
      {/* Top Header: Code & Status */}
      <div className="flex items-center justify-between gap-1 text-xs">
        <span className="font-mono text-[11px] font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
          {order.orderCode}
        </span>
        {order.bookingCode && (
          <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
            Từ {order.bookingCode}
          </span>
        )}
      </div>

      {/* Customer Info */}
      <div>
        <p className="text-sm font-bold text-white truncate">{order.customerName}</p>
        {order.customerPhone && order.customerPhone !== "0000000000" && (
          <p className="text-xs text-slate-400 font-mono mt-0.5">{order.customerPhone}</p>
        )}
      </div>

      {/* Items Preview */}
      <div className="space-y-1">
        {order.items?.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between text-xs text-slate-300 truncate"
          >
            <span className="truncate flex items-center gap-1">
              {item.itemType === "PRODUCT" ? (
                <ShoppingBag className="w-3 h-3 text-purple-400 shrink-0" />
              ) : (
                <Scissors className="w-3 h-3 text-pink-400 shrink-0" />
              )}
              <span className="truncate">{item.serviceName || item.productName}</span>
            </span>
            <span className="font-mono text-slate-400 shrink-0 ml-2">
              {formatCurrency(item.totalPrice)}
            </span>
          </div>
        ))}
      </div>

      {/* Step Progress Bar (for in-progress/checked-in orders) */}
      {totalSteps > 0 && !isPaid && (
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Tiến độ kỹ thuật</span>
            <span className="font-mono text-slate-300 font-semibold">
              {completedSteps}/{totalSteps} bước
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden flex">
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

      {/* Bottom Financial & Action strip */}
      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
        <div>
          {order.depositDeducted > 0 && (
            <span className="text-[10px] text-emerald-400 block font-mono">
              Đã trừ cọc: -{formatCurrency(order.depositDeducted)}
            </span>
          )}
          <span className="text-sm font-bold font-mono text-white">
            {formatCurrency(order.finalAmount)}
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-400 hover:text-white text-xs font-semibold">
          <span>{isPaid ? "Đã thanh toán" : "Chi tiết"}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
