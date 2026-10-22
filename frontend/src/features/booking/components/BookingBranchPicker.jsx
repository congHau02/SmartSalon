import React from "react";
import { MapPin, Phone, Check } from "lucide-react";

export function BookingBranchPicker({
  isLoadingBranches,
  branches = [],
  selectedBranchId,
  onSelectBranch,
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm">
          1
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Chọn Chi nhánh Salon</h3>
          <p className="text-xs text-slate-500">
            Vui lòng chọn salon gần nhất để xem lịch trống của Stylist
          </p>
        </div>
      </div>

      {isLoadingBranches ? (
        <div className="grid sm:grid-cols-2 gap-4 animate-pulse">
          <div className="h-28 bg-slate-100 rounded-2xl" />
          <div className="h-28 bg-slate-100 rounded-2xl" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {branches.map((b) => {
            const isSelected = selectedBranchId === b.id;
            return (
              <div
                key={b.id}
                onClick={() => onSelectBranch(b.id)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? "border-pink-500 bg-pink-50/40 shadow-xs ring-2 ring-pink-100"
                    : "border-slate-200 bg-white hover:border-pink-200 hover:shadow-xs"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{b.name}</h4>
                    <p className="text-xs text-slate-600 mt-1 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{b.address}</span>
                    </p>
                  </div>
                  {isSelected && (
                    <span className="shrink-0 w-6 h-6 rounded-full bg-pink-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                {b.phone && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center gap-1.5 text-xs text-slate-500">
                    <Phone className="w-3 h-3 text-pink-500" />
                    <span>Hotline: {b.phone}</span>
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
