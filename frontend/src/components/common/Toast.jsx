import React from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold tracking-wide transition-all animate-in slide-in-from-top-4 duration-200 ${
        toast.type === "success"
          ? "bg-emerald-600 text-white shadow-emerald-600/25"
          : "bg-rose-600 text-white shadow-rose-600/25"
      }`}
    >
      {toast.type === "success" ? (
        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
      ) : (
        <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
      )}
      <span>{toast.message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng thông báo"
        className="ml-2 w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg flex items-center justify-center hover:bg-white/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
