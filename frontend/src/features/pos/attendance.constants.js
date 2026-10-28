export const ATTENDANCE_STATUS = {
  PRESENT: "PRESENT",
  ON_BREAK: "ON_BREAK",
  COMPLETED: "COMPLETED",
  ABSENT: "ABSENT",
};

export const ATTENDANCE_ACTIONS = {
  CLOCK_IN: "CLOCK_IN",
  TOGGLE_BREAK: "TOGGLE_BREAK",
  CLOCK_OUT: "CLOCK_OUT",
  MARK_ABSENT: "MARK_ABSENT",
};

export const ATTENDANCE_META = {
  PRESENT: {
    label: "Đang trực",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    dotClass: "bg-emerald-400 animate-pulse",
  },
  ON_BREAK: {
    label: "Tạm nghỉ",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    dotClass: "bg-amber-400",
  },
  COMPLETED: {
    label: "Đã tan ca",
    badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    dotClass: "bg-purple-400",
  },
  ABSENT: {
    label: "Vắng mặt",
    badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    dotClass: "bg-rose-400",
  },
};

export function getAttendanceBadge(status, isWorking = true) {
  if (status && ATTENDANCE_META[status]) {
    return ATTENDANCE_META[status];
  }
  if (isWorking === false) {
    return {
      label: "Nghỉ (OFF)",
      badgeClass: "bg-slate-700/60 text-slate-400 border-slate-600/60",
      dotClass: "bg-slate-500",
    };
  }
  return {
    label: "Chưa vào ca",
    badgeClass: "bg-slate-700/50 text-slate-300 border-slate-600/40",
    dotClass: "bg-slate-400",
  };
}

export function getShiftBadgeClasses(shiftCode) {
  switch (shiftCode) {
    case "MORNING":
      return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    case "AFTERNOON":
      return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
    case "FULL_DAY":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    case "OFF":
    default:
      return "bg-slate-700/60 text-slate-400 border-slate-600/60";
  }
}
