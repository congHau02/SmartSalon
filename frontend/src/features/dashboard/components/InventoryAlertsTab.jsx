import React, { useState } from "react";
import { 
  Package, 
  AlertTriangle, 
  AlertOctagon, 
  Clock, 
  CheckCircle2, 
  Flame, 
  RefreshCw, 
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  Sparkles
} from "lucide-react";
import { formatCurrency, formatDate } from "../../../lib/utils";
import { StockAlertsTable } from "./StockAlertsTable";
import { BomWastageTable } from "./BomWastageTable";
import { StockInModal } from "../../inventory/StockInModal";
import { inventoryApi } from "../../inventory/inventoryApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Tab 3: Cảnh báo Kho thông minh & Hao hụt BOM (Smart Inventory & BOM Wastage Watchdog)
 * Provides 6 high-contrast KPI cards, 3-tier stock alerts with burn-rate predictions,
 * one-click Stock In action, and BOM chemical usage variance auditing.
 */
export function InventoryAlertsTab({
  data,
  isLoading,
  isError,
  error,
  onRefetch,
  selectedBranch,
  startDate,
  endDate,
}) {
  const queryClient = useQueryClient();
  const [stockInModalOpen, setStockInModalOpen] = useState(false);
  const [preselectedProductId, setPreselectedProductId] = useState(null);
  const [targetBranchInfo, setTargetBranchInfo] = useState({ id: null, name: "" });

  const stockInMutation = useMutation({
    mutationFn: ({ branchId, data }) => inventoryApi.stockIn(branchId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["analytics-inventory-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["branchInventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryTransactions", variables.branchId] });
      onRefetch();
      handleCloseStockIn();
    },
  });

  const handleOpenStockIn = (productId, branchId, branchName) => {
    const resolvedBranchId = branchId || selectedBranch?.id;
    const resolvedBranchName = branchName || selectedBranch?.name || "Chi nhánh";
    setTargetBranchInfo({ id: resolvedBranchId, name: resolvedBranchName });
    setPreselectedProductId(productId);
    setStockInModalOpen(true);
  };

  const handleCloseStockIn = () => {
    setStockInModalOpen(false);
    setPreselectedProductId(null);
    setTargetBranchInfo({ id: null, name: "" });
  };

  const handleStockInSubmit = async (formData) => {
    const branchIdToUse = targetBranchInfo.id || selectedBranch?.id;
    if (!branchIdToUse) {
      alert("Vui lòng chọn chi nhánh trước khi thực hiện nhập kho.");
      return;
    }
    try {
      await stockInMutation.mutateAsync({ branchId: branchIdToUse, data: formData });
    } catch (err) {
      console.error("Failed to stock in:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-100 rounded-2xl" />
        <div className="h-96 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 shadow-xs text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">
            Không thể tải dữ liệu cảnh báo kho & hao hụt BOM
          </h3>
          <p className="text-xs text-rose-600">
            {error?.message || "Đã xảy ra lỗi khi tính toán tồn kho và định mức tiêu hao hóa chất."}
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={onRefetch}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 outline-none transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Thử lại ngay
          </button>
        </div>
      </div>
    );
  }

  const {
    branchName = "Tất cả chi nhánh",
    totalProducts = 0,
    outOfStockCount = 0,
    lowStockCount = 0,
    nearThresholdCount = 0,
    healthyCount = 0,
    totalWastageCostAmount = 0,
    alerts = [],
    bomWastages = [],
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Scope & Period Sub-Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-700 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900">
                Phân tích Tồn kho Thông minh & Hao hụt Kỹ thuật BOM
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-100 text-pink-700">
                Tab 3
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-0.5">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Chi nhánh: <strong className="text-slate-700">{branchName}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Chu kỳ đo: <strong className="text-slate-700">{formatDate(startDate)}</strong> – <strong className="text-slate-700">{formatDate(endDate)}</strong>
                </span>
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefetch}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 outline-none transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Làm mới
        </button>
      </div>

      {/* 6 High-Contrast KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Total Products */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tổng mặt hàng
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 leading-tight">
              {totalProducts.toLocaleString("vi-VN")}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">
              Đang quản lý trong kho
            </div>
          </div>
        </div>

        {/* Card 2: Out of Stock (Critical Alert) */}
        <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
              Hết hàng
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-700 leading-tight">
              {outOfStockCount.toLocaleString("vi-VN")}
            </div>
            <div className="text-[11px] text-rose-600 mt-1 font-semibold">
              0 chai seal & 0 thể tích
            </div>
          </div>
        </div>

        {/* Card 3: Low Stock (Warning) */}
        <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Sắp hết hàng
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-700 leading-tight">
              {lowStockCount.toLocaleString("vi-VN")}
            </div>
            <div className="text-[11px] text-amber-600 mt-1 font-semibold">
              Tồn seal ≤ ngưỡng an toàn
            </div>
          </div>
        </div>

        {/* Card 4: Near Threshold (Pre-warning) */}
        <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
              Tiệm cận ngưỡng
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-purple-700 leading-tight">
              {nearThresholdCount.toLocaleString("vi-VN")}
            </div>
            <div className="text-[11px] text-purple-600 mt-1 font-semibold">
              Dự báo cạn ≤ 7 ngày
            </div>
          </div>
        </div>

        {/* Card 5: Healthy Stock */}
        <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Kho an toàn
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-700 leading-tight">
              {healthyCount.toLocaleString("vi-VN")}
            </div>
            <div className="text-[11px] text-emerald-600 mt-1 font-semibold">
              Đủ khả năng cung ứng
            </div>
          </div>
        </div>

        {/* Card 6: Total BOM & Audit Wastage VND Loss */}
        <div className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl p-4 border border-rose-300/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
              Thiệt hại Hao hụt
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-200 text-rose-800 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-rose-900 leading-tight">
              {formatCurrency(totalWastageCostAmount || 0)}
            </div>
            <div className="text-[11px] text-rose-700 mt-1 font-bold">
              Thất thoát BOM + rò rỉ kiểm kê
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: 3-Tier Stock Alert Table */}
      <StockAlertsTable
        alerts={alerts}
        isLoading={isLoading}
        onOpenStockIn={handleOpenStockIn}
        selectedBranch={selectedBranch}
      />

      {/* Section 2: BOM Wastage Variance Table */}
      <BomWastageTable
        bomWastages={bomWastages}
        totalWastageCostAmount={totalWastageCostAmount}
        isLoading={isLoading}
      />

      {/* One-Click Stock In Modal */}
      <StockInModal
        isOpen={stockInModalOpen}
        onClose={handleCloseStockIn}
        branchName={targetBranchInfo.name || branchName}
        preselectedProductId={preselectedProductId}
        onSubmit={handleStockInSubmit}
        isSubmitting={stockInMutation.isPending}
      />
    </div>
  );
}
