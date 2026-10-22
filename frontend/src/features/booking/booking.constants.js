export const STATUS_CONFIG = Object.freeze({
  ALL: { label: "Tất cả trạng thái", color: "text-slate-600 bg-slate-100" },
  PENDING_PAYMENT: { label: "Chờ cọc 20%", color: "text-amber-800 bg-amber-50 border-amber-200" },
  CONFIRMED: { label: "Đã xác nhận", color: "text-emerald-800 bg-emerald-50 border-emerald-200" },
  CHECKED_IN: { label: "Đã check-in", color: "text-indigo-800 bg-indigo-50 border-indigo-200" },
  IN_PROGRESS: { label: "Đang phục vụ", color: "text-blue-800 bg-blue-50 border-blue-200" },
  COMPLETED: { label: "Hoàn thành", color: "text-slate-700 bg-slate-100 border-slate-200" },
  CANCELLED: { label: "Đã hủy", color: "text-rose-800 bg-rose-50 border-rose-200" },
  EXPIRED: { label: "Hết hạn giữ", color: "text-slate-500 bg-slate-50 border-slate-200" },
  NO_SHOW: { label: "Vắng mặt", color: "text-red-700 bg-red-50 border-red-200" },
});
