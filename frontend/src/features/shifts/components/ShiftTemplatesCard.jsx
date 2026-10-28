import React from "react";
import { Clock, Plus, Edit2, ShieldAlert } from "lucide-react";
import { TEMPLATE_BADGE_STYLES, formatTimeRange } from "../shifts.constants";

export function ShiftTemplatesCard({ templates, onAddTemplate, onEditTemplate }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-pink-600" />
          <h2 className="text-sm font-bold text-slate-800">
            Mẫu Ca làm việc Chi nhánh (Shift Templates)
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            ({templates.length} mẫu chuẩn)
          </span>
        </div>
        <button
          type="button"
          onClick={onAddTemplate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-pink-700 bg-pink-50 hover:bg-pink-100/80 rounded-xl border border-pink-200 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm mẫu ca</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {templates.map((tmpl) => {
          const style = TEMPLATE_BADGE_STYLES[tmpl.code] || {
            bg: "bg-blue-50 text-blue-700 border-blue-200",
            dot: "bg-blue-500",
          };
          const timeRange = formatTimeRange(tmpl.startTime, tmpl.endTime);

          return (
            <div
              key={tmpl.id}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all hover:shadow-xs ${style.bg}`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                  <span className="text-xs font-bold">{tmpl.name}</span>
                </div>
                <div className="text-[11px] font-medium opacity-80 mt-1 flex items-center gap-1.5">
                  <span>{timeRange}</span>
                  {tmpl.maxOvertimeMinutes > 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-white/80 text-[10px] font-bold border border-current">
                      +{tmpl.maxOvertimeMinutes}m OT
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onEditTemplate(tmpl)}
                className="w-7 h-7 rounded-lg bg-white/70 hover:bg-white flex items-center justify-center transition-colors cursor-pointer"
                title="Sửa mẫu ca"
              >
                <Edit2 className="w-3.5 h-3.5 opacity-70 hover:opacity-100" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
