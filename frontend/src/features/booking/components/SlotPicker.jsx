import React, { useMemo } from "react";
import { Sun, Sunset, Moon, Lock, Clock } from "lucide-react";

export function SlotPicker({
  slots = [],
  selectedSlotTime,
  onSelectSlot,
  isLoading = false,
  totalDurationMinutes = 30,
}) {
  const groups = useMemo(() => {
    const morning = [];
    const afternoon = [];
    const evening = [];

    slots.forEach((s) => {
      const slotTime = s.time || s.startTime || "";
      if (!slotTime) return;

      const [hourStr] = slotTime.split(":");
      const hour = parseInt(hourStr, 10);
      if (isNaN(hour)) return;

      const normalizedSlot = {
        ...s,
        slotTime,
        isAvailable: (s.available ?? true) && s.status === "AVAILABLE",
      };

      if (hour < 12) {
        morning.push(normalizedSlot);
      } else if (hour < 17 || (hour === 17 && slotTime <= "17:30")) {
        afternoon.push(normalizedSlot);
      } else {
        evening.push(normalizedSlot);
      }
    });

    return [
      { label: "Buổi Sáng (08:30 - 12:00)", icon: Sun, slots: morning },
      { label: "Buổi Chiều (12:00 - 17:30)", icon: Sunset, slots: afternoon },
      { label: "Buổi Tối (17:30 - 20:30)", icon: Moon, slots: evening },
    ];
  }, [slots]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-slate-100 rounded-2xl" />
        <div className="h-24 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (!slots.length) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
        Không tìm thấy khung giờ nào phù hợp trong ngày này. Vui lòng chọn ngày khác hoặc Stylist khác.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-50 border border-pink-100 text-xs text-pink-800">
        <Clock className="w-4 h-4 text-pink-600 shrink-0" />
        <span>
          Thời gian phục vụ dự kiến: <strong>{totalDurationMinutes} phút</strong>. Khi chọn một khung giờ, hệ thống sẽ tự động giữ liên tục các khoảng thời gian cần thiết.
        </span>
      </div>

      {groups.map((group) => {
        if (!group.slots.length) return null;
        const Icon = group.icon;

        return (
          <div key={group.label} className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Icon className="w-3.5 h-3.5 text-pink-500" />
              <span>{group.label}</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {group.slots.map((s) => {
                const isSelected = selectedSlotTime === s.slotTime;
                const isAvailable = s.isAvailable;
                const isLocked = s.status === "LOCKED";
                const isPast = s.status === "PAST";

                if (isAvailable) {
                  return (
                    <button
                      key={s.slotTime}
                      type="button"
                      onClick={() => onSelectSlot(s.slotTime)}
                      className={`py-3 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border-2 cursor-pointer ${
                        isSelected
                          ? "bg-pink-600 border-pink-600 text-white shadow-md shadow-pink-200 scale-102"
                          : "bg-white border-slate-200 text-slate-700 hover:border-pink-400 hover:bg-pink-50/50 hover:text-pink-700"
                      }`}
                    >
                      <span className="text-sm tracking-tight">{s.slotTime}</span>
                      <span className="text-xs font-medium opacity-80">
                        {isSelected ? "Đã chọn" : "Còn chỗ"}
                      </span>
                    </button>
                  );
                }

                if (isLocked) {
                  return (
                    <div
                      key={s.slotTime}
                      title="Khung giờ đang có khách giữ chỗ trong 5 phút"
                      className="py-3 px-2 rounded-xl text-xs font-semibold bg-amber-50/70 border border-amber-200 text-amber-700 opacity-80 flex flex-col items-center justify-center gap-1 cursor-not-allowed"
                    >
                      <span className="text-sm line-through opacity-75">{s.slotTime}</span>
                      <span className="text-xs font-medium flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Giữ 5p
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={s.slotTime}
                    className="py-3 px-2 rounded-xl text-xs font-medium bg-slate-100 border border-slate-200 text-slate-400 flex flex-col items-center justify-center gap-1 cursor-not-allowed select-none"
                  >
                    <span className="text-sm opacity-60">{s.slotTime}</span>
                    <span className="text-xs opacity-75">{isPast ? "Đã qua" : "Đã kín"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
