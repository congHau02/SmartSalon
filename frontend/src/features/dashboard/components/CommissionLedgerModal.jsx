import React, { useState, useMemo } from "react";
import { formatCurrency } from "../../../lib/utils";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { CommissionLedgerEntriesTable } from "../../../components/shared/CommissionLedgerEntriesTable";
import {
  X,
  Receipt,
  Search,
} from "lucide-react";

export function CommissionLedgerModal({ staff, isOpen, onClose }) {
  const [search, setSearch] = useState("");

  const ledgers = useMemo(() => {
    if (!staff || !staff.commissionLedgers) return [];
    if (!search.trim()) return staff.commissionLedgers;
    const q = search.toLowerCase();
    return staff.commissionLedgers.filter((item) =>
      (item.orderCode && item.orderCode.toLowerCase().includes(q)) ||
      (item.stepName && item.stepName.toLowerCase().includes(q)) ||
      (item.calculationNotes && item.calculationNotes.toLowerCase().includes(q))
    );
  }, [staff, search]);

  if (!isOpen || !staff) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="commission-ledger-title"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="commission-ledger-title" className="text-sm font-black text-slate-900">
                  Sổ cái Hoa hồng (Commission Ledger)
                </h3>
                <Badge variant="pink">{staff.roles?.join(", ") || "STAFF"}</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Chi tiết bóc tách hoa hồng công đoạn cho <strong>{staff.fullName}</strong> (@{staff.username})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Bar */}
        <div className="px-6 py-3.5 bg-pink-50/30 border-b border-pink-100/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-500 font-medium">Tổng giao dịch hoa hồng:</span>{" "}
              <strong className="text-slate-900 font-bold">{staff.commissionLedgers?.length || 0} mục</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Tổng công đoạn hoàn thành:</span>{" "}
              <strong className="text-slate-900 font-bold">{staff.completedStepCount || 0} bước</strong>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-pink-200/80 shadow-xs">
            <span className="text-slate-500 font-medium">Tổng hoa hồng kỳ này:</span>
            <span className="text-sm font-black text-emerald-600">
              +{formatCurrency(staff.totalCommission)}
            </span>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="px-6 py-2.5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã đơn, công đoạn hoặc ghi chú..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
            />
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Hiển thị {ledgers.length} / {staff.commissionLedgers?.length || 0} bản ghi
          </span>
        </div>

        {/* Table Body with Scroll */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {ledgers.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Receipt className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-700">Chưa có giao dịch hoa hồng nào</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Nhân viên chưa có bản ghi hoa hồng nào trong khoảng thời gian đã chọn hoặc không khớp với từ khóa tìm kiếm.
              </p>
            </div>
          ) : (
            <CommissionLedgerEntriesTable
              entries={ledgers}
              showStaffColumn={false}
              variant="light"
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs text-slate-500">
            Dữ liệu được hạch toán bất biến từ <strong>Commission Ledger</strong>
          </span>
          <Button variant="outline" onClick={onClose} className="text-xs font-bold">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
