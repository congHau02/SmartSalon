import React, { useState } from "react";
import { 
  Package, 
  RefreshCw, 
  AlertCircle,
  Building2,
  Calendar,
} from "lucide-react";
import { formatDate } from "../../../lib/utils";
import { StockAlertsTable } from "./StockAlertsTable";
import { BomWastageTable } from "./BomWastageTable";
import { StockInModal } from "../../inventory/StockInModal";
import { useDirectStockIn } from "../../inventory/useInventory";
import { InventoryAlertsKpis } from "./InventoryAlertsKpis";

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
  const [stockInModalOpen, setStockInModalOpen] = useState(false);
  const [preselectedProductId, setPreselectedProductId] = useState(null);
  const [targetBranchInfo, setTargetBranchInfo] = useState({ id: null, name: "" });
  const [stockInError, setStockInError] = useState("");

  const stockInMutation = useDirectStockIn({
    onSuccess: () => {
      onRefetch();
      handleCloseStockIn();
    },
    onError: (err) => {
      setStockInError(err?.response?.data?.message || "Nhập kho thất bại.");
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
      handleCloseStockIn();
      setStockInError("Vui lòng chọn chi nhánh trước khi thực hiện nhập kho.");
      return;
    }
    setStockInError("");
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900 outline-none transition-colors cursor-pointer"
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-pink-500 outline-none transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Làm mới
        </button>
      </div>

      <InventoryAlertsKpis
        totalProducts={totalProducts}
        outOfStockCount={outOfStockCount}
        lowStockCount={lowStockCount}
        nearThresholdCount={nearThresholdCount}
        healthyCount={healthyCount}
        totalWastageCostAmount={totalWastageCostAmount}
      />

      {stockInError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700"
        >
          <span>{stockInError}</span>
          <button
            type="button"
            onClick={() => setStockInError("")}
            aria-label="Đóng thông báo lỗi"
            className="font-bold text-rose-700 hover:text-rose-900 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

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
