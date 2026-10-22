import React from "react";
import { X, Zap, UserCheck, Calendar } from "lucide-react";

export function WalkInHeader({ tab, setTab, onClose }) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Tiếp nhận Khách Vãng lai (Walk-in)</h3>
            <p className="text-xs text-slate-400">Tạo đơn dịch vụ nhanh tại quầy không qua đặt hẹn</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Đóng cửa sổ"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tab Selection */}
      <div className="grid grid-cols-2 p-1.5 m-4 mb-0 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setTab("anonymous")}
          className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            tab === "anonymous"
              ? "bg-pink-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Khách lẻ nhanh (Ẩn danh)</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("detail")}
          className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            tab === "detail"
              ? "bg-pink-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Nhập thông tin & Tích điểm</span>
        </button>
      </div>
    </>
  );
}
