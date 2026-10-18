import React, { useMemo } from "react";
import { Clock, User, Scissors, CheckCircle2, AlertCircle } from "lucide-react";
import { formatCurrency } from "../../lib/utils";

// Generate 30-min intervals from 08:30 to 20:30 (25 time points = 24 slots)
const TIME_SLOTS = [];
let hour = 8;
let min = 30;
while (hour < 20 || (hour === 20 && min <= 30)) {
  const hStr = hour.toString().padStart(2, "0");
  const mStr = min.toString().padStart(2, "0");
  TIME_SLOTS.push(`${hStr}:${mStr}`);
  min += 30;
  if (min === 60) {
    min = 0;
    hour++;
  }
}

export function TimelineBoard({
  stylists = [],
  upcomingBookings = [],
  checkedInOrders = [],
  inProgressOrders = [],
  readyOrPaidOrders = [],
  onSelectOrder,
  onCheckInBooking,
  isCheckingInId,
}) {
  // Aggregate all items with time info
  const items = useMemo(() => {
    const list = [];

    // Bookings
    upcomingBookings.forEach((b) => {
      if (b.bookingTime && b.staffId) {
        list.push({
          type: "BOOKING",
          id: b.id,
          code: b.bookingCode,
          staffId: b.staffId,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          startTime: new Date(b.bookingTime),
          endTime: b.endTime
            ? new Date(b.endTime)
            : new Date(new Date(b.bookingTime).getTime() + (b.totalDurationMinutes || 30) * 60000),
          status: b.status,
          totalPrice: b.totalPrice,
          services: b.serviceNames?.join(", "),
          raw: b,
        });
      }
    });

    // Orders
    const allOrders = [...checkedInOrders, ...inProgressOrders, ...readyOrPaidOrders];
    allOrders.forEach((o) => {
      const firstStep = o.items?.flatMap((i) => i.steps || [])[0];
      const staffId = firstStep?.staffId;
      if (staffId && o.createdAt) {
        const start = new Date(o.createdAt);
        // Estimate 45 min duration if not finished
        const end = new Date(start.getTime() + 45 * 60000);
        list.push({
          type: "ORDER",
          id: o.id,
          code: o.orderCode,
          staffId: staffId,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          startTime: start,
          endTime: end,
          status: o.status,
          totalPrice: o.finalAmount,
          raw: o,
        });
      }
    });

    return list;
  }, [upcomingBookings, checkedInOrders, inProgressOrders, readyOrPaidOrders]);

  // Convert time to percentage from 08:30 (0%) to 20:30 (100%)
  // Total window = 12 hours = 720 minutes
  const totalWindowMinutes = 12 * 60; // 720 min

  const getPositionPercent = (date) => {
    const d = new Date(date);
    const startWindow = new Date(d);
    startWindow.setHours(8, 30, 0, 0);

    const diffMinutes = (d.getTime() - startWindow.getTime()) / 60000;
    const clamped = Math.max(0, Math.min(totalWindowMinutes, diffMinutes));
    return (clamped / totalWindowMinutes) * 100;
  };

  if (!stylists.length) {
    return (
      <div className="p-12 text-center text-slate-500 bg-slate-850/50 rounded-2xl border border-slate-700/60">
        <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm">Chưa có kỹ thuật viên nào trực ca hôm nay để hiển thị Timeline.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-850/70 rounded-2xl border border-slate-700/60 shadow-xl overflow-hidden backdrop-blur-sm">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
        <div className="min-w-[1100px]">
          {/* Timeline Time Header */}
          <div className="flex border-b border-slate-700/80 bg-slate-800/90 text-xs text-slate-400 font-mono">
            {/* Stylist Name Header Column */}
            <div className="w-56 shrink-0 p-3 border-r border-slate-700/70 font-sans font-bold text-slate-200">
              Kỹ thuật viên / Stylist
            </div>

            {/* Time Slot Columns */}
            <div
              className="flex-1 relative"
              style={{ display: "grid", gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
            >
              {TIME_SLOTS.slice(0, 24).map((slot, i) => (
                <div
                  key={i}
                  className="p-3 text-center border-r border-slate-700/40 text-[11px] truncate"
                >
                  {slot}
                </div>
              ))}
            </div>
          </div>

          {/* Stylist Rows */}
          <div className="divide-y divide-slate-700/50">
            {stylists.map((st) => {
              const stylistItems = items.filter((it) => it.staffId === st.stylistId);

              return (
                <div key={st.stylistId} className="flex min-h-[80px] hover:bg-slate-800/30 transition-colors">
                  {/* Stylist Profile Column */}
                  <div className="w-56 shrink-0 p-3 border-r border-slate-700/70 flex items-center gap-2.5 bg-slate-850/40">
                    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
                      {st.fullName?.split(" ").slice(-1)[0]?.[0] || "S"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{st.fullName}</p>
                      <span
                        className={`inline-block text-[10px] px-1.5 py-0.2 rounded mt-0.5 font-medium ${
                          st.isBusy
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {st.isBusy ? "Đang bận" : "Đang rảnh"}
                      </span>
                    </div>
                  </div>

                  {/* Timeline Lane */}
                  <div className="flex-1 relative bg-slate-900/30">
                    {/* Background Grid Lines */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ display: "grid", gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
                    >
                      {TIME_SLOTS.slice(0, 24).map((_, i) => (
                        <div key={i} className="border-r border-slate-800/60 h-full" />
                      ))}
                    </div>

                    {/* Timeline Event Blocks */}
                    {stylistItems.map((item, idx) => {
                      const left = getPositionPercent(item.startTime);
                      const right = getPositionPercent(item.endTime);
                      const width = Math.max(3.5, right - left);

                      const isBooking = item.type === "BOOKING";
                      const isOrder = item.type === "ORDER";
                      const isCheckingIn = isCheckingInId === item.id;

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (isOrder && onSelectOrder) onSelectOrder(item.raw);
                            if (isBooking && onCheckInBooking && !isCheckingIn) {
                              onCheckInBooking(item.id);
                            }
                          }}
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                          }}
                          title={
                            isBooking
                              ? `Lịch hẹn: ${item.customerName} - Bấm để Check-in`
                              : `Đơn POS: ${item.code} - ${item.customerName}`
                          }
                          className={`absolute top-2 bottom-2 rounded-lg p-2 text-xs border shadow-md overflow-hidden cursor-pointer transition-all hover:z-20 hover:scale-[1.02] flex flex-col justify-between ${
                            isBooking
                              ? "bg-blue-600/20 border-blue-500/50 text-blue-200 hover:border-blue-400 hover:bg-blue-600/30"
                              : "bg-pink-600/25 border-pink-500/50 text-pink-200 hover:border-pink-400"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-[10px] font-bold px-1 rounded bg-black/30 truncate">
                              {item.code}
                            </span>
                            <span className="text-[10px] font-mono text-slate-300">
                              {new Date(item.startTime).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div className="truncate font-semibold text-white text-[11px] mt-0.5">
                            {item.customerName}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-300 truncate font-mono">
                            <span>{formatCurrency(item.totalPrice)}</span>
                            {isBooking && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/30 text-blue-300 font-sans font-medium">
                                {isCheckingIn ? "Đang xử lý..." : "Check-in"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
