import React, { useState, useMemo } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useBranch } from "../branch/useBranch";
import {
  useBranchInventory,
  useStockIn,
  useStockAdjustment,
} from "./useInventory";
import { StockInModal } from "./StockInModal";
import { StockAdjustmentModal } from "./StockAdjustmentModal";
import {
  InventoryMetricCards,
  InventoryFilterBar,
  InventoryTable,
  InventoryEmptyState,
} from "./components/branch-inventory";
import { BranchInventoryHeader } from "./components/branch-inventory/BranchInventoryHeader";
import { BranchInventoryToast } from "./components/branch-inventory/BranchInventoryToast";

export function BranchInventoryPage() {
  const { selectedBranch, isLoadingBranches } = useBranch();
  const branchId = selectedBranch?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("ALL"); // ALL or LOW_STOCK

  const {
    data: rawInventory = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useBranchInventory(branchId);

  const stockInMutation = useStockIn(branchId);
  const stockAdjustmentMutation = useStockAdjustment(branchId);

  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast(message ? { message, type } : null);
    if (message) {
      setTimeout(() => {
        setToast((current) => (current?.message === message ? null : current));
      }, 4000);
    }
  };

  const inventoryList = useMemo(() => {
    if (!Array.isArray(rawInventory)) return [];
    let list = rawInventory;

    if (filterMode === "LOW_STOCK") {
      list = list.filter(
        (item) => item.isLowStock || item.stockUnits <= (item.minStockAlertUnits ?? 0)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          (item.productName && item.productName.toLowerCase().includes(q)) ||
          (item.productSku && item.productSku.toLowerCase().includes(q)) ||
          (item.barcode && item.barcode.toLowerCase().includes(q))
      );
    }

    return list;
  }, [rawInventory, filterMode, searchQuery]);

  const stats = useMemo(() => {
    if (!Array.isArray(rawInventory)) {
      return { totalItems: 0, lowStockCount: 0, totalSealedUnits: 0, activeInUseCount: 0 };
    }
    const totalItems = rawInventory.length;
    const lowStockCount = rawInventory.filter(
      (item) => item.isLowStock || item.stockUnits <= (item.minStockAlertUnits ?? 0)
    ).length;
    const totalSealedUnits = rawInventory.reduce(
      (sum, item) => sum + (Number(item.stockUnits) || 0),
      0
    );
    const activeInUseCount = rawInventory.filter(
      (item) => Number(item.currentVolume) > 0
    ).length;

    return { totalItems, lowStockCount, totalSealedUnits, activeInUseCount };
  }, [rawInventory]);

  const handleOpenStockIn = (productId = null) => {
    setSelectedProductId(productId);
    setIsStockInOpen(true);
  };

  const handleOpenAdjustment = (productId = null) => {
    setSelectedProductId(productId);
    setIsAdjustmentOpen(true);
  };

  const handleCloseModals = () => {
    setIsStockInOpen(false);
    setIsAdjustmentOpen(false);
    setSelectedProductId(null);
  };

  const handleStockInSubmit = async (data) => {
    try {
      await stockInMutation.mutateAsync(data);
      showToast("Nhập kho chi nhánh thành công!");
      handleCloseModals();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi nhập kho. Vui lòng kiểm tra lại.";
      showToast(msg, "error");
    }
  };

  const handleAdjustmentSubmit = async (data) => {
    try {
      await stockAdjustmentMutation.mutateAsync(data);
      showToast("Cập nhật cân đối kiểm kê kho thành công!");
      handleCloseModals();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi cập nhật kiểm kê. Vui lòng thử lại.";
      showToast(msg, "error");
    }
  };

  if (isLoadingBranches) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" aria-hidden="true" />
        <p className="text-xs font-medium">Đang tải thông tin chi nhánh...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <BranchInventoryToast toast={toast} onClose={() => setToast(null)} />

      <BranchInventoryHeader
        branchName={selectedBranch?.name}
        isLoading={isLoading}
        onRefresh={() => refetch()}
        onOpenStockIn={() => handleOpenStockIn()}
        onOpenAdjustment={() => handleOpenAdjustment()}
      />

      <InventoryMetricCards stats={stats} />

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <InventoryFilterBar
          rawInventory={rawInventory}
          stats={stats}
          filterMode={filterMode}
          setFilterMode={setFilterMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          branchId={branchId}
        />

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-pink-600" aria-hidden="true" />
            <p className="text-xs font-medium">Đang kiểm tra tồn kho chi nhánh...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" aria-hidden="true" />
            <h3 className="text-sm font-bold text-slate-800">Không thể tải dữ liệu tồn kho</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {error?.message || "Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau"}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 min-h-[40px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        ) : inventoryList.length === 0 ? (
          <InventoryEmptyState
            searchQuery={searchQuery}
            filterMode={filterMode}
            onClearFilter={() => {
              setSearchQuery("");
              setFilterMode("ALL");
            }}
            onOpenStockIn={() => handleOpenStockIn()}
          />
        ) : (
          <InventoryTable
            inventoryList={inventoryList}
            handleOpenStockIn={handleOpenStockIn}
            handleOpenAdjustment={handleOpenAdjustment}
          />
        )}
      </div>

      <StockInModal
        isOpen={isStockInOpen}
        onClose={handleCloseModals}
        branchName={selectedBranch?.name}
        preselectedProductId={selectedProductId}
        onSubmit={handleStockInSubmit}
        isSubmitting={stockInMutation.isPending}
      />

      <StockAdjustmentModal
        isOpen={isAdjustmentOpen}
        onClose={handleCloseModals}
        branchName={selectedBranch?.name}
        inventoryItems={rawInventory}
        preselectedProductId={selectedProductId}
        onSubmit={handleAdjustmentSubmit}
        isSubmitting={stockAdjustmentMutation.isPending}
      />
    </div>
  );
}
