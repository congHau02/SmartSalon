import React, { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function useToast() {
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };
  return { toastMessage, showToast, clearToast: () => setToastMessage(null) };
}

export function DispatchToast({ toast, onClose }) {
  if (!toast) return null;
  const isSuccess = toast.type === "success";
  return (
    <div
      className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-lg animate-in fade-in duration-200 ${
        isSuccess
          ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
          : "bg-rose-500/15 border border-rose-500/30 text-rose-300"
      }`}
    >
      <div className="flex items-center gap-2">
        {isSuccess ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <AlertCircle className="w-4 h-4 text-rose-400" />
        )}
        <span>{toast.message}</span>
      </div>
      <button onClick={onClose} className="text-xs hover:opacity-75 cursor-pointer">
        Đóng
      </button>
    </div>
  );
}
