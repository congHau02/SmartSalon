import React, { useMemo } from "react";
import { Sparkles, User, Calendar, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { useBookingStylists, useAvailableSlots } from "../useBooking";
import { SlotPicker } from "./SlotPicker";

// Helper generate next 7 days in YYYY-MM-DD
function generateNextDays(count = 7) {
  const days = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    let label = `Th ${d.getDay() + 1}`;
    if (d.getDay() === 0) label = "Chủ nhật";
    if (i === 0) label = "Hôm nay";
    if (i === 1) label = "Ngày mai";

    days.push({
      dateStr,
      label,
      dayNum: d.getDate(),
      monthNum: d.getMonth() + 1,
    });
  }
  return days;
}

export function StylistAndSlotStep({
  selectedBranchId,
  selectedServices = [],
  selectedStylistId,
  onSelectStylist,
  selectedDate,
  onSelectDate,
  selectedSlotTime,
  onSelectSlotTime,
  onBack,
  onNext,
}) {
  const nextDays = useMemo(() => generateNextDays(7), []);

  const serviceIds = useMemo(
    () => selectedServices.map((s) => s.id),
    [selectedServices]
  );

  const totalDurationMinutes = useMemo(
    () => selectedServices.reduce((sum, s) => sum + (s.durationMinutes || 0), 0),
    [selectedServices]
  );

  // Fetch stylists for selected branch
  const { data: stylists = [], isLoading: isLoadingStylists } = useBookingStylists(selectedBranchId);

  // Fetch available slots
  const {
    data: slotData,
    isLoading: isLoadingSlots,
    isFetching: isFetchingSlots,
  } = useAvailableSlots({
    branchId: selectedBranchId,
    date: selectedDate,
    serviceIds,
    stylistId: selectedStylistId,
  });

  const slots = slotData?.slots || [];

  return (
    <div className="space-y-8">
      {/* 1. Stylist Selection */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Chọn Kỹ thuật viên (Stylist)</h3>
            <p className="text-xs text-slate-500">
              Bạn có thể chọn Stylist yêu thích hoặc để hệ thống tự động sắp xếp chuyên viên phù hợp
            </p>
          </div>
        </div>

        {isLoadingStylists ? (
          <div className="grid sm:grid-cols-3 gap-3 animate-pulse">
            <div className="h-20 bg-slate-100 rounded-2xl" />
            <div className="h-20 bg-slate-100 rounded-2xl" />
            <div className="h-20 bg-slate-100 rounded-2xl" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Auto-assign Option */}
            <div
              onClick={() => onSelectStylist(null)}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                selectedStylistId === null
                  ? "border-pink-500 bg-pink-50/50 ring-2 ring-pink-100 shadow-xs"
                  : "border-slate-200 bg-white hover:border-pink-200"
              }`}
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                  selectedStylistId === null
                    ? "bg-gradient-to-br from-pink-500 to-rose-600 text-white"
                    : "bg-pink-100 text-pink-600"
                }`}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-slate-900 truncate">Bất kỳ Stylist nào</div>
                <div className="text-[11px] text-pink-600 font-medium">Tự động phân bổ lịch trống</div>
              </div>
            </div>

            {/* Individual Stylists */}
            {stylists.map((st) => {
              const isSelected = selectedStylistId === st.id;
              const initials = st.fullName
                ? st.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .slice(-2)
                    .join("")
                : "ST";

              return (
                <div
                  key={st.id}
                  onClick={() => onSelectStylist(st.id)}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                    isSelected
                      ? "border-pink-500 bg-pink-50/50 ring-2 ring-pink-100 shadow-xs"
                      : "border-slate-200 bg-white hover:border-pink-200"
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                      isSelected
                        ? "bg-gradient-to-br from-pink-500 to-rose-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900 truncate">{st.fullName}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {st.phone ? `KTV • ${st.phone.slice(-4)}` : "Chuyên viên"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Date Strip */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Chọn Ngày phục vụ</h3>
            <p className="text-xs text-slate-500">Salon phục vụ liên tục từ 08:30 đến 20:30 mỗi ngày</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {nextDays.map((d) => {
            const isSelected = selectedDate === d.dateStr;

            return (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => onSelectDate(d.dateStr)}
                className={`flex-1 min-w-[76px] py-3 px-2 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  isSelected
                    ? "bg-pink-600 border-pink-600 text-white shadow-md shadow-pink-200"
                    : "bg-white border-slate-200 text-slate-700 hover:border-pink-300"
                }`}
              >
                <span className={`text-[11px] font-semibold ${isSelected ? "text-pink-100" : "text-slate-400"}`}>
                  {d.label}
                </span>
                <span className="text-lg font-extrabold tracking-tight">{d.dayNum}</span>
                <span className={`text-[10px] ${isSelected ? "text-pink-200" : "text-slate-400"}`}>
                  Thg {d.monthNum}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Slot Picker Grid */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Chọn Khung giờ bắt đầu</h3>
              <p className="text-xs text-slate-500">Khung giờ mỗi 30 phút, cập nhật theo thời gian thực</p>
            </div>
          </div>
          {isFetchingSlots && (
            <span className="text-xs text-pink-600 font-medium animate-pulse">Đang cập nhật...</span>
          )}
        </div>

        <SlotPicker
          slots={slots}
          selectedSlotTime={selectedSlotTime}
          onSelectSlot={onSelectSlotTime}
          isLoading={isLoadingSlots}
          totalDurationMinutes={totalDurationMinutes}
        />
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 cursor-pointer flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Dịch vụ</span>
        </button>

        <button
          type="button"
          disabled={!selectedSlotTime}
          onClick={onNext}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
            selectedSlotTime
              ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-200 hover:from-pink-600 hover:to-rose-700 cursor-pointer"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          <span>Tiếp tục: Xác nhận</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
