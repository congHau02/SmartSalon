import React from "react";
import { AlertCircle } from "lucide-react";
import { BookingKanbanCard } from "./components/BookingKanbanCard";
import { OrderKanbanCard } from "./components/OrderKanbanCard";

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
