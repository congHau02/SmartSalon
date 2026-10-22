import React from "react";
import { Link } from "react-router-dom";
import { History, ArrowLeft, RefreshCw } from "lucide-react";

export function TransactionsHeader({ branchName, onRefresh }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link
            to="/admin/inventory"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors mr-1 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
            title="Quay lại Quản lý Tồn kho"
            aria-label="Quay lại Quản lý Tồn kho"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </Link>
          <span className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
            <History className="w-5 h-5" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Sổ Nhật ký Biến động Kho
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          Kiểm toán toàn diện mọi phát sinh nhập kho, tự động bóc seal, trừ hao theo định mức dịch vụ và điều chỉnh kiểm kê tại {branchName}.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onRefresh}
          className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
          title="Làm mới nhật ký"
          aria-label="Làm mới nhật ký"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
        </button>

        <Link
          to="/admin/inventory"
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md shadow-slate-900/10 transition-colors flex items-center gap-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-900"
        >
          <span>Xem Bảng Tồn kho</span>
        </Link>
      </div>
    </div>
  );
}
