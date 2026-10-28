import React, { useMemo } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useBookingStylists, useAvailableSlots } from "../useBooking";
import { SlotPicker } from "./SlotPicker";
import { StylistSelectorSection } from "./StylistSelectorSection";

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

  const { data: stylists = [], isLoading: isLoadingStylists } =
    useBookingStylists(selectedBranchId, selectedDate);

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
      <StylistSelectorSection
        isLoadingStylists={isLoadingStylists}
        stylists={stylists}
        selectedStylistId={selectedStylistId}
        onSelectStylist={onSelectStylist}
      />

      {/* 2. Date Strip */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Chọn ngày làm dịch vụ</h3>
            <p className="text-xs text-slate-500">Khung lịch 7 ngày tới</p>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {nextDays.map((d) => {
            const isSelected = selectedDate === d.dateStr;
            return (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => {
                  onSelectDate(d.dateStr);
                  onSelectSlotTime(null);
                }}
                className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                  isSelected
                    ? "border-pink-500 bg-pink-600 text-white shadow-sm"
                    : "border-slate-200 bg-white hover:border-pink-200 text-slate-700"
                }`}
              >
                <span className={`text-[11px] block font-semibold uppercase ${
                  isSelected ? "text-pink-100" : "text-slate-400"
                }`}>
                  {d.label}
                </span>
                <span className="text-base font-extrabold block mt-0.5">{d.dayNum}</span>
                <span className={`text-xs ${isSelected ? "text-pink-200" : "text-slate-400"}`}>
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
              <p className="text-xs text-slate-500">
                Khung giờ mỗi 30 phút, cập nhật theo thời gian thực
              </p>
            </div>
          </div>
          {isFetchingSlots && (
            <span className="text-xs text-pink-600 font-medium animate-pulse">
              Đang cập nhật...
            </span>
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
