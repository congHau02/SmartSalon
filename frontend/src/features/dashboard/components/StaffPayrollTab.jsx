import React, { useState, useMemo } from "react";
import { 
  Users, 
  DollarSign, 
  Wallet, 
  Award, 
  Sparkles, 
  HeartHandshake, 
  TrendingUp, 
  Search, 
  Filter, 
  RefreshCw,
  AlertCircle,
  Building2,
  Calendar
} from "lucide-react";
import { formatCurrency, formatDate } from "../../../lib/utils";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { StaffPerformanceTable } from "./StaffPerformanceTable";
import { EditBaseSalaryModal } from "./EditBaseSalaryModal";
import { CommissionLedgerModal } from "./CommissionLedgerModal";

export function StaffPayrollTab({
  data,
  isLoading,
  isError,
  error,
  onRefetch,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [editingStaff, setEditingStaff] = useState(null);
  const [viewingLedgerStaff, setViewingLedgerStaff] = useState(null);

  // Filter staff members based on search and role
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
      {/* 6 Top KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Tổng nhân sự */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tổng nhân sự
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {data.totalStaffCount || 0} <span className="text-xs font-normal text-slate-500">nhân sự</span>
            </div>
            <span className="text-[10px] text-slate-400">Đang hoạt động tại chi nhánh</span>
          </div>
        </div>

        {/* 2. Tổng lương cứng (Base Salary) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tổng lương cứng
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 tracking-tight">
              {formatCurrency(data.totalBaseSalary)}
            </div>
            <span className="text-[10px] text-slate-400">Định mức chi phí cố định</span>
          </div>
        </div>

        {/* 3. Tổng hoa hồng lũy kế */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tổng hoa hồng
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-emerald-600 tracking-tight">
              +{formatCurrency(data.totalCommission)}
            </div>
            <span className="text-[10px] text-slate-400">Từ Commission Ledger</span>
          </div>
        </div>

        {/* 4. Tổng chi trả lương & hoa hồng */}
        <div className="bg-white rounded-2xl border border-pink-200/90 bg-linear-to-br from-white to-pink-50/30 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-pink-700 uppercase tracking-wider">
              Tổng chi trả (Payout)
            </span>
            <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 tracking-tight">
              {formatCurrency(data.totalPayrollPayout)}
            </div>
            <span className="text-[10px] text-pink-600 font-semibold">Lương cứng + Hoa hồng</span>
          </div>
        </div>

        {/* 5. Tỷ lệ chỉ định stylist TB */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Chỉ định thợ TB
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {(data.averageRequestedStylistRate || 0).toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-400">Khách đặt thợ đích danh</span>
          </div>
        </div>

        {/* 6. Tỷ lệ khách quay lại TB */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Khách quen TB
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {(data.averageRebookingRate || 0).toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-400">Khách thực hiện ≥2 đơn</span>
          </div>
        </div>
      </div>

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

          {/* Role Filter Pills */}
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
