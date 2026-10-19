import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Coins,
  Calendar,
  User,
  Users,
  CheckCircle2,
  FileText,
  Printer,
  RotateCw,
  Sparkles,
  Scissors,
  DollarSign,
  TrendingUp,
  Percent,
} from "lucide-react";
import { posApi } from "../../api/posApi";
import { formatCurrency, toLocalDateISO } from "../../lib/utils";
import { QUERY_KEYS } from "../../lib/queryKeys";
import { CommissionLedgerEntriesTable } from "../../components/shared/CommissionLedgerEntriesTable";

export function CommissionLedgerModal({ isOpen, onClose, branchId, branchName }) {
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateISO());
  const [activeTab, setActiveTab] = useState("staff"); // 'staff' | 'entries'

  const {
    data: ledgerData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.commissionLedger(branchId, selectedDate),
    queryFn: () => posApi.getCommissionLedger(branchId, selectedDate),
    enabled: isOpen && !!branchId,
  });

  if (!isOpen) return null;

  const staffSummaries = ledgerData?.staffSummaries || [];
  const entries = ledgerData?.entries || [];
  const totalCommission = ledgerData?.totalCommissionAmount || 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Sổ Cái Hoa Hồng Kỹ Thuật Viên</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium">
                  Commission Ledger
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Cơ sở: <strong>{branchName || "Chi nhánh SmartSalon"}</strong> • Tự động tính theo tỷ lệ quỹ hoa hồng 2 cấp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="In bảng kê hoa hồng"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">In sổ cái</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Đóng cửa sổ sổ cái hoa hồng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date Filter & Tab Switcher Bar */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-400 font-medium">Ngày xem:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin text-amber-400" : ""}`} />
            </button>
          </div>

          <div className="flex rounded-xl bg-slate-800/60 p-0.5 border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("staff")}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeTab === "staff"
                  ? "bg-amber-500 text-slate-950 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Theo Thợ ({staffSummaries.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("entries")}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeTab === "entries"
                  ? "bg-amber-500 text-slate-950 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Nhật Ký Chi Tiết ({entries.length})
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-800/80 bg-slate-900/60 shrink-0">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                Tổng hoa hồng chi trả
              </div>
              <div className="text-xl font-mono font-bold text-white mt-0.5">
                {formatCurrency(totalCommission)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
              <Coins className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
                Lượt công đoạn hoàn tất
              </div>
              <div className="text-xl font-mono font-bold text-white mt-0.5">
                {entries.length} công đoạn
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider">
                Kỹ thuật viên hưởng hoa hồng
              </div>
              <div className="text-xl font-mono font-bold text-white mt-0.5">
                {staffSummaries.length} nhân sự
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Modal Body / Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Đang tải dữ liệu sổ cái hoa hồng...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
                <Coins className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300">
                Chưa có dữ liệu hoa hồng trong ngày {selectedDate}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Khi thu ngân thực hiện thanh toán chốt đơn (Checkout) tại quầy POS, hệ thống sẽ tự động hạch toán hoa hồng cho từng bước thực hiện vào sổ cái này.
              </p>
            </div>
          ) : activeTab === "staff" ? (
            /* Staff Summary Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {staffSummaries.map((staff) => (
                <div
                  key={staff.staffId}
                  className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-amber-500/40 transition-colors space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold text-sm shrink-0">
                      {staff.staffName ? staff.staffName.charAt(0).toUpperCase() : "T"}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">
                        {staff.staffName}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {staff.stepCount} công đoạn hoàn thành
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Hoa hồng nhận:</span>
                    <span className="text-sm font-mono font-bold text-amber-400">
                      {formatCurrency(staff.totalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <CommissionLedgerEntriesTable
              entries={entries}
              showStaffColumn
              variant="dark"
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-400">
            Tổng cộng: <strong className="text-white">{entries.length}</strong> khoản hoa hồng ghi sổ
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
