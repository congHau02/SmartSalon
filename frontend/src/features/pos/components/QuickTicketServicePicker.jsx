import React from "react";
import { Check } from "lucide-react";
import { formatVND } from "../../../lib/utils";

export function QuickTicketServicePicker({ services = [], selectedServiceIds = [], onToggleService }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
        Chọn dịch vụ đã thực hiện ({selectedServiceIds.length})
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
        {services.map((svc) => {
          const isSelected = selectedServiceIds.includes(svc.id);
          return (
            <button
              key={svc.id}
              type="button"
              onClick={() => onToggleService(svc.id)}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? "bg-pink-600/15 border-pink-500/50 text-white"
                  : "bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600"
              }`}
            >
              <div>
                <div className="text-xs font-semibold">{svc.name}</div>
                <div className="text-[10px] text-slate-400">{svc.durationMinutes} phút</div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-pink-400">
                  {formatVND(svc.basePrice || svc.price)}
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-pink-400" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
