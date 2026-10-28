import React from "react";
import { Sparkles, Star } from "lucide-react";

export function StylistSelectorSection({
  isLoadingStylists,
  stylists = [],
  selectedStylistId,
  onSelectStylist,
}) {
  return (
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
              <div className="text-xs text-pink-600 font-medium">Tự động phân bổ lịch trống</div>
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

            const rating = Number(st.averageRating) || 0;
            const reviewCount = Number(st.reviewCount) || 0;
            const isWorking = st.isWorking !== false;

            return (
              <div
                key={st.id}
                onClick={() => onSelectStylist(st.id)}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                  isSelected
                    ? "border-pink-500 bg-pink-50/50 ring-2 ring-pink-100 shadow-xs"
                    : !isWorking
                    ? "border-slate-200 bg-slate-50/60 opacity-80 hover:border-slate-300"
                    : "border-slate-200 bg-white hover:border-pink-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                      isSelected
                        ? "bg-gradient-to-br from-pink-500 to-rose-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-slate-900 truncate">{st.fullName}</div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate mt-0.5">
                      {rating > 0 ? (
                        <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{rating.toFixed(1)}</span>
                          {reviewCount > 0 && (
                            <span className="text-[10px] text-slate-400 font-normal">({reviewCount})</span>
                          )}
                        </span>
                      ) : (
                        <span>{st.phone ? `KTV • ${st.phone.slice(-4)}` : "Chuyên viên"}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shift Badge on Stylist Card */}
                {st.shiftName && (
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold ${
                        !isWorking
                          ? "bg-slate-200 text-slate-600"
                          : st.shiftCode === "MORNING"
                          ? "bg-amber-100 text-amber-800"
                          : st.shiftCode === "AFTERNOON"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      <span>{st.shiftName}</span>
                      {st.shiftStartTime && st.shiftEndTime && (
                        <span className="text-[10px] opacity-80">
                          {st.shiftStartTime.slice(0, 5)}–{st.shiftEndTime.slice(0, 5)}
                          {st.maxOvertimeMinutes > 0 ? ` (+${st.maxOvertimeMinutes}p OT)` : ""}
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
