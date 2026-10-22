import React, { useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { TimelineStylistRow } from "./components/TimelineStylistRow";
import { mapTimelineItems } from "./timeline.utils";

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
    const allOrders = [...checkedInOrders, ...inProgressOrders, ...readyOrPaidOrders];
    return mapTimelineItems({ bookings: upcomingBookings, orders: allOrders });
  }, [upcomingBookings, checkedInOrders, inProgressOrders, readyOrPaidOrders]);

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
            <div className="w-56 shrink-0 p-3 border-r border-slate-700/70 font-sans font-bold text-slate-200">
              Kỹ thuật viên / Stylist
            </div>

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
            {stylists.map((st) => (
              <TimelineStylistRow
                key={st.stylistId}
                stylist={st}
                items={items.filter((it) => it.staffId === st.stylistId)}
                getPositionPercent={getPositionPercent}
                isCheckingInId={isCheckingInId}
                onSelectOrder={onSelectOrder}
                onCheckInBooking={onCheckInBooking}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
