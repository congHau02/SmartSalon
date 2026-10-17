import React from "react";
import { Check, MapPin, Scissors, Calendar, ShieldCheck, QrCode } from "lucide-react";

const STEPS = [
  { step: 1, title: "Dịch vụ", subtitle: "Chi nhánh & Dịch vụ", icon: Scissors },
  { step: 2, title: "Giờ hẹn", subtitle: "Stylist & Khung giờ", icon: Calendar },
  { step: 3, title: "Xác nhận", subtitle: "Thông tin & Giữ chỗ", icon: ShieldCheck },
  { step: 4, title: "Thanh toán", subtitle: "Cọc VietQR & Nhận vé", icon: QrCode },
];

export function BookingStepIndicator({ currentStep = 1, onStepClick }) {
  return (
    <div className="w-full bg-white rounded-2xl border border-pink-100 shadow-xs p-4 mb-8">
      <div className="grid grid-cols-4 gap-2 relative">
        {STEPS.map((s, idx) => {
          const isCompleted = currentStep > s.step;
          const isCurrent = currentStep === s.step;
          const isAccessible = s.step < currentStep;
          const Icon = s.icon;

          return (
            <button
              key={s.step}
              type="button"
              disabled={!isAccessible}
              onClick={() => isAccessible && onStepClick && onStepClick(s.step)}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                isCurrent
                  ? "bg-pink-50/80 border border-pink-200"
                  : isCompleted
                  ? "hover:bg-slate-50 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm transition-all shadow-xs ${
                  isCompleted
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                    ? "bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-pink-200"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
              </div>

              <div className="hidden sm:block min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Bước {s.step}
                </div>
                <div
                  className={`text-sm font-semibold truncate ${
                    isCurrent ? "text-pink-900" : isCompleted ? "text-slate-800" : "text-slate-400"
                  }`}
                >
                  {s.title}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
