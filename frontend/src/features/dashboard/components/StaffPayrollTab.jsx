import React, { useState, useMemo } from "react";
import { 
  Users, 
  Search, 
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { StaffPerformanceTable } from "./StaffPerformanceTable";
import { EditBaseSalaryModal } from "./EditBaseSalaryModal";
import { CommissionLedgerModal } from "./CommissionLedgerModal";
import { useReportExport } from "../hooks/useReportExport";
import { StaffPayrollKpis } from "./StaffPayrollKpis";
import { StaffPayrollActionBar } from "./StaffPayrollActionBar";

export function StaffPayrollTab({
  data,
  isLoading,
  isError,
  error,
  onRefetch,
  selectedBranch,
  startDate,
  endDate,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [editingStaff, setEditingStaff] = useState(null);
  const [viewingLedgerStaff, setViewingLedgerStaff] = useState(null);
  const { exportingXlsx, exportingPdf, exportStatus, clearExportStatus, exportReport: handleExport } =
    useReportExport({ reportType: "staff-payroll", branchId: selectedBranch?.id, startDate, endDate });

  const filteredStaff = useMemo(() => {
    if (!data || !data.staffMembers) return [];
    let list = data.staffMembers;

    if (roleFilter !== "ALL") {
      list = list.filter((s) => s.roles && s.roles.includes(roleFilter));
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((s) =>
        (s.fullName && s.fullName.toLowerCase().includes(q)) ||
        (s.username && s.username.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q))
      );
    }

    return list;
  }, [data, roleFilter, searchTerm]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">
            Không thể tải dữ liệu hiệu suất & bảng lương nhân sự
          </h3>
          <p className="text-xs text-rose-600">
            {error?.response?.data?.message || error?.message || "Đã xảy ra lỗi khi kết nối với máy chủ."}
          </p>
        </div>
        <Button onClick={onRefetch} variant="outline" className="text-xs font-bold gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Thử lại
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <StaffPayrollActionBar
        startDate={startDate}
        endDate={endDate}
        selectedBranch={selectedBranch}
        isLoading={isLoading}
        exportingXlsx={exportingXlsx}
        exportingPdf={exportingPdf}
        handleExport={handleExport}
        exportStatus={exportStatus}
        clearExportStatus={clearExportStatus}
      />

      <StaffPayrollKpis data={data} />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, tài khoản, SĐT..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
            />
          </div>

          <div className="flex items-center gap-1">
            {[
              { id: "ALL", label: "Tất cả vai trò" },
              { id: "STYLIST", label: "Thợ chính (Stylist)" },
              { id: "STAFF", label: "Kỹ thuật viên" },
              { id: "MANAGER", label: "Quản lý" },
            ].map((rf) => (
              <button
                key={rf.id}
                type="button"
                onClick={() => setRoleFilter(rf.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === rf.id
                    ? "bg-pink-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {rf.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Hiển thị <strong>{filteredStaff.length}</strong> / {data.staffMembers?.length || 0} nhân sự</span>
          <button
            onClick={() => onRefetch()}
            className="p-1.5 rounded-xl text-slate-400 hover:text-pink-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Staff Performance Table */}
      <StaffPerformanceTable
        staffMembers={filteredStaff}
        onEditBaseSalary={(staff) => setEditingStaff(staff)}
        onViewCommissionLedgers={(staff) => setViewingLedgerStaff(staff)}
      />

      {/* Edit Base Salary Modal */}
      <EditBaseSalaryModal
        staff={editingStaff}
        isOpen={Boolean(editingStaff)}
        onClose={() => setEditingStaff(null)}
      />

      {/* Itemized Commission Ledger Drill-down Modal */}
      <CommissionLedgerModal
        staff={viewingLedgerStaff}
        isOpen={Boolean(viewingLedgerStaff)}
        onClose={() => setViewingLedgerStaff(null)}
      />
    </div>
  );
}
