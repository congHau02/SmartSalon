import React, { useState, useMemo } from "react";
import { Search, Receipt } from "lucide-react";
import { formatCurrency, formatDate } from "../../../lib/utils";

export function PersonalPayrollLedgerTable({ ledgers = [] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLedgers = useMemo(() => {
    if (!searchTerm.trim()) return ledgers;
    const q = searchTerm.toLowerCase();
    return ledgers.filter(
      (l) =>
        (l.orderCode && l.orderCode.toLowerCase().includes(q)) ||
        (l.serviceName && l.serviceName.toLowerCase().includes(q)) ||
        (l.stepName && l.stepName.toLowerCase().includes(q)) ||
        (l.calculationNotes && l.calculationNotes.toLowerCase().includes(q))
    );
  }, [ledgers, searchTerm]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-900">
      {/* Search Bar */}
      <div className="p-3 bg-slate-800/40 border-b border-slate-700/60 flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã đơn, dịch vụ, bước hoặc ghi chú..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-pink-500"
          />
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          Hiển thị <strong>{filteredLedgers.length}</strong> / {ledgers.length} bản ghi hoa hồng
        </span>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-y-auto">
        {filteredLedgers.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-300">Không có bản ghi hoa hồng nào</div>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Chưa có khoản hoa hồng nào được ghi nhận trong khoảng thời gian này hoặc không khớp với từ khóa tìm kiếm.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-950/80 sticky top-0 z-10 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Mã đơn & Thời gian</th>
                <th className="py-2.5 px-3">Dịch vụ & Bước thực hiện</th>
                <th className="py-2.5 px-3 text-center">Tỷ lệ %</th>
                <th className="py-2.5 px-3">Công thức hạch toán</th>
                <th className="py-2.5 px-3 text-right">Hoa hồng thực nhận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredLedgers.map((l, idx) => (
                <tr key={l.id || idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-mono font-bold text-pink-400">{l.orderCode || "—"}</div>
                    <div className="text-[10px] text-slate-400">{formatDate(l.createdAt)}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-100">{l.serviceName || "Dịch vụ"}</div>
                    <div className="text-[11px] text-slate-400">{l.stepName || "Công đoạn"}</div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono font-semibold">
                      {l.commissionRate != null ? `${Number(l.commissionRate)}%` : "—"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-400 max-w-xs truncate">
                    {l.calculationNotes || "Hạch toán theo bước dịch vụ"}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                    +{formatCurrency(l.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
