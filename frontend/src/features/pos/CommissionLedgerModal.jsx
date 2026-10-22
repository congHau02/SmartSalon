import React, { useState } from "react";
import {
  X,
  Coins,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Download,
} from "lucide-react";
import { formatCurrency, toLocalDateISO, shiftLocalDateISO } from "../../lib/utils";
import { CommissionLedgerEntriesTable } from "../../components/shared/CommissionLedgerEntriesTable";
import { CommissionLedgerKpis } from "./components/CommissionLedgerKpis";
import { useCommissionLedgerDaily } from "./usePosQueries";

export function CommissionLedgerModal({ isOpen, onClose, branchId, stylists = [] }) {
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateISO());
  const [activeTab, setActiveTab] = useState("staff"); // 'staff' | 'entries'

  const handlePrevDay = () => setSelectedDate((prev) => shiftLocalDateISO(prev, -1));
  const handleNextDay = () => setSelectedDate((prev) => shiftLocalDateISO(prev, 1));
  const handleToday = () => setSelectedDate(toLocalDateISO());

  const { data: ledgerData, isLoading } = useCommissionLedgerDaily(branchId, selectedDate, {
    enabled: isOpen && !!branchId,
  });

  if (!isOpen) return null;

  const entries = ledgerData?.entries || [];
  const staffSummaries = ledgerData?.staffSummaries || [];
  const totalCommission = ledgerData?.totalCommission || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl text-slate-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-inner">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Sổ Cái Hoa Hồng Kỹ Thuật Viên</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Minh bạch 100%
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Theo dõi và đối soát thu nhập hoa hồng theo từng công đoạn kỹ thuật trong ngày
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Filter & Tab Switcher Bar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-850/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-700/80">
              <button
                onClick={handlePrevDay}
                aria-label="Ngày trước"
                className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-white px-2 py-1 focus:outline-none cursor-pointer"
              />
              <button
                onClick={handleNextDay}
                aria-label="Ngày sau"
                className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-2 py-1 text-[11px] font-semibold text-pink-400 hover:bg-pink-500/10 rounded-md transition cursor-pointer"
              >
                Hôm nay
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700/80 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("staff")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "staff"
                  ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Theo Nhân Sự ({staffSummaries.length})
            </button>
            <button
              onClick={() => setActiveTab("entries")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "entries"
                  ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Nhật Ký Chi Tiết ({entries.length})
            </button>
          </div>
        </div>

        <CommissionLedgerKpis
          totalCommission={totalCommission}
          entriesCount={entries.length}
          staffCount={staffSummaries.length}
        />

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
                      <h4 className="text-sm font-bold text-white truncate">{staff.staffName}</h4>
                      <p className="text-xs text-slate-400">{staff.stepCount} công đoạn hoàn thành</p>
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
            <CommissionLedgerEntriesTable entries={entries} showStaffColumn variant="dark" />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-400">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Dữ liệu hoa hồng được kết xuất tự động từ giao dịch POS</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>In bảng kê</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
