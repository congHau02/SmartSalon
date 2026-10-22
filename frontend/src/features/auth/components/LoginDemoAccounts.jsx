import React from "react";
import { UserCheck } from "lucide-react";

export function LoginDemoAccounts({ onQuickLogin }) {
  if (!import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_ACCOUNTS !== "true") {
    return null;
  }

  return (
    <div className="mt-6 pt-5 border-t border-slate-100">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
        Tài khoản mẫu thử nghiệm
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onQuickLogin("admin", "Admin@123")}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-50 hover:bg-pink-50/60 border border-slate-200/80 hover:border-pink-200 text-xs font-medium text-slate-700 hover:text-pink-700 transition-all cursor-pointer"
        >
          <UserCheck className="w-3.5 h-3.5 text-pink-500" />
          <span>Super Admin</span>
        </button>
        <button
          type="button"
          onClick={() => onQuickLogin("0988888888", "Admin@123")}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-50 hover:bg-pink-50/60 border border-slate-200/80 hover:border-pink-200 text-xs font-medium text-slate-700 hover:text-pink-700 transition-all cursor-pointer"
        >
          <UserCheck className="w-3.5 h-3.5 text-pink-500" />
          <span>Số ĐT Admin</span>
        </button>
      </div>
    </div>
  );
}
