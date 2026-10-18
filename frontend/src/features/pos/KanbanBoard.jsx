import React from "react";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Scissors,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Loader2,
  DollarSign,
  ChevronRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../lib/utils";

export function KanbanBoard({
  upcomingBookings = [],
  checkedInOrders = [],
  inProgressOrders = [],
  readyOrPaidOrders = [],
  onCheckInBooking,
  isCheckingInId,
  onSelectOrder,
}) {
  const columns = [
    {
      id: "upcoming",
      title: "Sắp đến / Chờ Check-in",
      count: upcomingBookings.length,
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      headerBorder: "border-blue-500/30",
      content: upcomingBookings.map((b) => (
        <BookingKanbanCard
          key={b.id}
          booking={b}
          onCheckIn={() => onCheckInBooking(b.id)}
          isCheckingIn={isCheckingInId === b.id}
        />
      )),
      emptyText: "Không có lịch hẹn chờ check-in",
    },
    {
      id: "checked_in",
      title: "Đã Check-in / Chờ phục vụ",
      count: checkedInOrders.length,
      badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      headerBorder: "border-indigo-500/30",
      content: checkedInOrders.map((o) => (
        <OrderKanbanCard key={o.id} order={o} onSelect={() => onSelectOrder(o)} />
      )),
      emptyText: "Chưa có khách chờ tại sảnh",
    },
    {
      id: "in_progress",
      title: "Đang thực hiện",
      count: inProgressOrders.length,
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      headerBorder: "border-amber-500/30",
      content: inProgressOrders.map((o) => (
        <OrderKanbanCard key={o.id} order={o} onSelect={() => onSelectOrder(o)} />
      )),
      emptyText: "Hiện không có ca làm đang thực hiện",
    },
    {
      id: "checkout",
      title: "Chờ thanh toán & Hoàn tất",
      count: readyOrPaidOrders.length,
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      headerBorder: "border-emerald-500/30",
      content: readyOrPaidOrders.map((o) => (
        <OrderKanbanCard key={o.id} order={o} onSelect={() => onSelectOrder(o)} />
      )),
      emptyText: "Không có đơn chờ thanh toán",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
      {columns.map((col) => (
        <div
          key={col.id}
          className="bg-slate-850/60 rounded-2xl border border-slate-700/60 flex flex-col max-h-[calc(100vh-230px)] overflow-hidden shadow-lg backdrop-blur-sm"
        >
          {/* Column Header */}
          <div
            className={`px-4 py-3 border-b bg-slate-800/80 flex items-center justify-between ${col.headerBorder}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200 tracking-wide uppercase">
                {col.title}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border font-mono font-bold ${col.badgeColor}`}
              >
                {col.count}
              </span>
            </div>
          </div>

          {/* Column Cards Container */}
          <div className="p-3 overflow-y-auto space-y-3 flex-1 scrollbar-thin scrollbar-thumb-slate-700 min-h-[300px]">
            {col.content.length > 0 ? (
              col.content
            ) : (
              <div className="py-12 px-4 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <AlertCircle className="w-6 h-6 stroke-1 text-slate-600" />
                <p className="text-xs">{col.emptyText}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function BookingKanbanCard({ booking, onCheckIn, isCheckingIn }) {
  const isDepositPaid = booking.depositStatus === "PAID";
  const timeStr = booking.bookingTime
    ? new Date(booking.bookingTime).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all shadow-sm space-y-3">
      {/* Top row: Code & Time */}
      <div className="flex items-center justify-between gap-1 text-xs">
        <span className="font-mono text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
          {booking.bookingCode}
        </span>
        <span className="flex items-center gap-1 font-mono text-slate-300 font-semibold bg-slate-700/60 px-2 py-0.5 rounded">
          <Clock className="w-3 h-3 text-blue-400" />
          {timeStr}
        </span>
      </div>

      {/* Customer info */}
      <div>
        <p className="text-sm font-bold text-white truncate">{booking.customerName}</p>
        {booking.customerPhone && (
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
            <Phone className="w-3 h-3" /> {booking.customerPhone}
          </p>
        )}
      </div>

      {/* Services list */}
      {booking.serviceNames?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {booking.serviceNames.map((name, i) => (
            <span
              key={i}
              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-750 text-slate-300 border border-slate-700 truncate max-w-full"
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Stylist & Deposit Strip */}
      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-400 truncate">
          <User className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="truncate">{booking.staffName || "Chưa chọn stylist"}</span>
        </div>

        {isDepositPaid ? (
          <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
            Đã cọc 20%
          </span>
        ) : (
          <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
            Chưa cọc
          </span>
        )}
      </div>

      {/* Check-In Action Button */}
      <button
        type="button"
        onClick={onCheckIn}
        disabled={isCheckingIn}
        className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-pink-600/20 transition-all disabled:opacity-50 cursor-pointer"
      >
        {isCheckingIn ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Đang check-in...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Check-in & Mở đơn</span>
          </>
        )}
      </button>
    </div>
  );
}

function OrderKanbanCard({ order, onSelect }) {
  // Aggregate step progress
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
