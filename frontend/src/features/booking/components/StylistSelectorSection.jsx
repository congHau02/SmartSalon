import React from "react";
import { Sparkles } from "lucide-react";

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
                  <div className="text-xs text-slate-500 truncate">
                    {st.phone ? `KTV • ${st.phone.slice(-4)}` : "Chuyên viên"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
