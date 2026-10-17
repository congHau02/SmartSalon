import React, { useState, useMemo } from "react";
import {
  ArrowDownToLine,
  Scale,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  RefreshCw,
  Loader2,
} from "lucide-react";
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

export function BranchInventoryPage() {
  const { selectedBranch, isLoadingBranches } = useBranch();
  const branchId = selectedBranch?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("ALL"); // ALL or LOW_STOCK

  // TanStack Query: Fetch branch inventory
  const {
    data: rawInventory = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useBranchInventory(branchId);

  const stockInMutation = useStockIn(branchId);
  const stockAdjustmentMutation = useStockAdjustment(branchId);

  // Modals state
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

  // Client-side filtering & search
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

  // Statistics
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
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold tracking-wide transition-all animate-in slide-in-from-top-4 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-600 text-white shadow-emerald-600/25"
              : "bg-rose-600 text-white shadow-rose-600/25"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Đóng thông báo"
            className="ml-2 w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg flex items-center justify-center hover:bg-white/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Tồn kho Chi nhánh
            </h1>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200/80">
              <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{selectedBranch?.name || "Chưa chọn chi nhánh"}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi tồn kho 2 tầng: Số kiện nguyên seal và dung tích ml/gram đang mở nắp sử dụng dở
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            aria-label="Tải lại dữ liệu"
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shadow-xs min-h-[44px] min-w-[44px]"
            title="Tải lại tồn kho"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenStockIn()}
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
          >
            <ArrowDownToLine className="w-4 h-4" aria-hidden="true" />
            <span>Nhập kho</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAdjustment()}
            className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md shadow-slate-900/10 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
          >
            <Scale className="w-4 h-4" aria-hidden="true" />
            <span>Kiểm kê</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <InventoryMetricCards stats={stats} />

      {/* Main Content Card: Filter Bar + Table */}
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

        {/* Content Body */}
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

      {/* Stock In Modal */}
      <StockInModal
        isOpen={isStockInOpen}
        onClose={handleCloseModals}
        branchName={selectedBranch?.name}
        preselectedProductId={selectedProductId}
        onSubmit={handleStockInSubmit}
        isSubmitting={stockInMutation.isPending}
      />

      {/* Stock Adjustment Modal */}
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
