import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { TEMPLATE_BADGE_STYLES, formatTimeRange } from "../shifts.constants";

const ATTENDANCE_BADGES = {
  PRESENT: { label: "Đang trực", color: "bg-emerald-600 text-white" },
  ON_BREAK: { label: "Tạm nghỉ", color: "bg-amber-500 text-white" },
  COMPLETED: { label: "Đã tan ca", color: "bg-slate-600 text-white" },
  ABSENT: { label: "Vắng mặt", color: "bg-rose-600 text-white" },
};

export function RosterCell({ cell, templates, onUpdateCell }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const isOff = cell.status === "OFF" || !cell.shiftTemplateId;
  const currentCode = isOff ? "OFF" : cell.shiftTemplateCode;
  const style = TEMPLATE_BADGE_STYLES[currentCode] || TEMPLATE_BADGE_STYLES.OFF;
  const timeRange = !isOff ? formatTimeRange(cell.startTime, cell.endTime) : "";

  const handleSelectOption = (status, templateId) => {
    setIsOpen(false);
    onUpdateCell(status, templateId);
  };

  const attendanceBadge = cell.attendance?.status
    ? ATTENDANCE_BADGES[cell.attendance.status]
    : null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-[58px] p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-pink-500/30 ${style.bg}`}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
            <span className="text-xs font-bold truncate">
              {isOff ? "Nghỉ (OFF)" : cell.shiftTemplateName}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 opacity-40 shrink-0" />
        </div>

        <div className="flex items-center justify-between mt-1 text-[10px] font-semibold">
          <span className="opacity-75">{isOff ? "Không trực" : timeRange}</span>
          {attendanceBadge && (
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${attendanceBadge.color}`}
            >
              {attendanceBadge.label}
            </span>
          )}
        </div>
      </button>

      {/* Popover Shift Picker */}
      {isOpen && (
        <div className="absolute top-full left-0 z-30 mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
            Chọn Ca trực
          </div>

          <div className="space-y-0.5">
            {templates.map((t) => {
              const isSelected = !isOff && cell.shiftTemplateId === t.id;
              const tStyle = TEMPLATE_BADGE_STYLES[t.code] || {
                dot: "bg-blue-500",
              };
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectOption("WORKING", t.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-pink-50 text-pink-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${tStyle.dot}`} />
                    <span>{t.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {formatTimeRange(t.startTime, t.endTime)}
                    </span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-pink-600" />}
                </button>
              );
            })}

            {/* OFF option */}
            <button
              type="button"
              onClick={() => handleSelectOption("OFF", null)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isOff
                  ? "bg-pink-50 text-pink-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Nghỉ (OFF)</span>
              </div>
              {isOff && <Check className="w-3.5 h-3.5 text-pink-600" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
