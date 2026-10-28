export const SHIFT_STATUS = {
  WORKING: "WORKING",
  OFF: "OFF",
};

export const TEMPLATE_BADGE_STYLES = {
  MORNING: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    label: "Ca Sáng",
    time: "08:30 - 15:00",
  },
  AFTERNOON: {
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    label: "Ca Chiều",
    time: "14:00 - 20:30",
  },
  FULL_DAY: {
    bg: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
    label: "Ca Cả ngày",
    time: "08:30 - 20:30",
  },
  OFF: {
    bg: "bg-slate-100 text-slate-500 border-slate-200",
    dot: "bg-slate-400",
    label: "Nghỉ (OFF)",
    time: "Không trực",
  },
};

export const VI_DAYS_OF_WEEK = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ Nhật",
];

export function formatTimeRange(start, end) {
  if (!start || !end) return "";
  const s = typeof start === "string" ? start.slice(0, 5) : "";
  const e = typeof end === "string" ? end.slice(0, 5) : "";
  return `${s} - ${e}`;
}

export function formatDateVi(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}
