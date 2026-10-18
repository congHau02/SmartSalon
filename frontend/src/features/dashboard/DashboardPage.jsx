import React, { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useBranch } from "../branch/useBranch";
import { analyticsApi } from "../../api/analyticsApi";
import { ExecutiveHeader } from "./components/ExecutiveHeader";
import { PnlDashboardTab } from "./components/PnlDashboardTab";
import { StaffPayrollTab } from "./components/StaffPayrollTab";
import { 
  Users, 
  AlertTriangle, 
  Scissors, 
  Calendar, 
  ArrowRight, 
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import { Button } from "../../components/ui/Button";

function toLocalDateStr(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateDatesForPreset(preset) {
  const today = new Date();
  if (preset === "today") {
    const s = toLocalDateStr(today);
    return { startDate: s, endDate: s };
  }
  if (preset === "7days") {
    const past = new Date(today);
    past.setDate(today.getDate() - 6);
    return { startDate: toLocalDateStr(past), endDate: toLocalDateStr(today) };
  }
  if (preset === "thisMonth") {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: toLocalDateStr(firstDay), endDate: toLocalDateStr(today) };
  }
  const s = toLocalDateStr(today);
  return { startDate: s, endDate: s };
}

export function DashboardPage() {
  const { selectedBranch, branches, switchBranch } = useBranch();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "pnl";

  const [datePreset, setDatePreset] = useState("thisMonth");
  const initialDates = useMemo(() => calculateDatesForPreset("thisMonth"), []);
  const [startDate, setStartDate] = useState(initialDates.startDate);
  const [endDate, setEndDate] = useState(initialDates.endDate);

  const handleTabChange = (newTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", newTab);
      return next;
    });
  };

  const handlePresetChange = (newPreset) => {
    setDatePreset(newPreset);
    if (newPreset !== "custom") {
      const calculated = calculateDatesForPreset(newPreset);
      setStartDate(calculated.startDate);
      setEndDate(calculated.endDate);
    }
  };

  const handleCustomDateChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  // TanStack Query for Realized P&L Report
  const {
    data: pnlData,
    isLoading: isPnlLoading,
    isError: isPnlError,
    error: pnlError,
    refetch: refetchPnl,
  } = useQuery({
    queryKey: ["analytics-pnl", selectedBranch?.id, startDate, endDate],
    queryFn: () => analyticsApi.getPnlReport(selectedBranch?.id, startDate, endDate),
    enabled: activeTab === "pnl",
    staleTime: 60000,
  });

  // TanStack Query for Staff Payroll & Performance Report
  const {
    data: staffPayrollData,
    isLoading: isStaffPayrollLoading,
    isError: isStaffPayrollError,
    error: staffPayrollError,
    refetch: refetchStaffPayroll,
  } = useQuery({
    queryKey: ["analytics-staff-payroll", selectedBranch?.id, startDate, endDate],
    queryFn: () => analyticsApi.getStaffPayrollReport(selectedBranch?.id, startDate, endDate),
    enabled: activeTab === "staff",
    staleTime: 60000,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Executive Command Center Header */}
      <ExecutiveHeader
        selectedBranch={selectedBranch}
        branches={branches}
        onSelectBranch={switchBranch}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        datePreset={datePreset}
        onPresetChange={handlePresetChange}
        startDate={startDate}
        endDate={endDate}
        onCustomDateChange={handleCustomDateChange}
      />

      {/* Main Tab Panels */}
      {activeTab === "pnl" && (
        <PnlDashboardTab
          data={pnlData}
          isLoading={isPnlLoading}
          isError={isPnlError}
          error={pnlError}
          onRefetch={refetchPnl}
        />
      )}

      {/* Tab 2: Hiệu suất Nhân sự & Bảng Lương (Staff Performance & Payroll) */}
      {activeTab === "staff" && (
        <StaffPayrollTab
          data={staffPayrollData}
          isLoading={isStaffPayrollLoading}
          isError={isStaffPayrollError}
          error={staffPayrollError}
          onRefetch={refetchStaffPayroll}
        />
      )}

      {/* Tab 3: Cảnh báo Kho & Hao hụt BOM Placeholder (Phase 5 Ticket 03) */}
      {activeTab === "inventory" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="max-w-lg mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200/60">
              <Sparkles className="w-3.5 h-3.5" /> Phase 5 - Ticket 03 Đang chuẩn bị kích hoạt
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Tab 3: Cảnh báo Tồn kho & Hao hụt Định mức BOM (Inventory & Wastage Watchdog)
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cảnh báo mặt hàng dưới ngưỡng tối thiểu (safety_stock), bóc tách chênh lệch giữa BOM lý thuyết 
              và lượng hóa chất thực tế nhân viên ghi nhận tại Visual Technical Log, cùng giá trị tồn kho theo giá vốn snapshot.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => handleTabChange("pnl")}
              className="text-xs font-bold gap-2 text-slate-700 hover:text-pink-600"
            >
              Quay lại Báo cáo Lãi/Lỗ P&L <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Quick Launch & System Navigation Shortcuts */}
      <div className="pt-4 border-t border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Lối tắt vận hành Salon
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/pos">
              <Button variant="secondary" className="text-xs font-bold gap-2 bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200/60">
                <Scissors className="w-3.5 h-3.5" /> Bảng điều phối POS
              </Button>
            </Link>
            <Link to="/customer">
              <Button variant="outline" className="text-xs font-bold gap-2 text-slate-700 hover:text-pink-600">
                <Calendar className="w-3.5 h-3.5" /> Cổng khách hàng <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
