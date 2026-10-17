import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  ArrowDownToLine,
  Scale,
  Search,
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Building2,
  History,
  RefreshCw,
  Loader2,
  PackageCheck,
  PackageOpen,
  Layers,
} from "lucide-react";
import { useBranch } from "../branch/useBranch";
import {
  useBranchInventory,
  useStockIn,
  useStockAdjustment,
} from "./useInventory";
import { StockInModal } from "./StockInModal";
import { StockAdjustmentModal } from "./StockAdjustmentModal";

export function BranchInventoryPage() {
  const { selectedBranch, isLoadingBranches } = useBranch();
  const branchId = selectedBranch?.id;

  // Filter state
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

  // Toast feedback state
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
      list = list.filter((item) => item.isLowStock || item.stockUnits <= (item.minStockAlertUnits ?? 0));
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

  // Modal Triggers
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
      <div className="p-16 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-600">Đang tải thông tin chi nhánh...</p>
      </div>
    );
  }

  if (!selectedBranch) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <Building2 className="w-8 h-8" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Chưa chọn chi nhánh làm việc</h2>
        <p className="text-sm text-slate-500">
          Vui lòng chọn một chi nhánh từ thanh điều hướng phía trên để kiểm tra và quản lý tồn kho hai cấp độ.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Alert Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border animate-in slide-in-from-top duration-300 ${
            toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" aria-hidden="true" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 hover:bg-black/5 rounded-xl ml-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-pink-50 text-pink-600 border border-pink-200">
              <PackageCheck className="w-5 h-5" aria-hidden="true" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Tồn kho Chi nhánh: {selectedBranch.name}
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Giám sát tồn kho hai cấp độ: Kiện nguyên seal thương mại & dung tích hoá chất đang mở nắp sử dụng tại quầy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
            title="Làm mới tồn kho"
            aria-label="Làm mới tồn kho"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </button>

          <Link
            to="/admin/inventory/transactions"
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <History className="w-4 h-4 text-slate-500" aria-hidden="true" />
            <span>Sổ nhật ký kho</span>
          </Link>

          <button
            type="button"
            onClick={() => handleOpenAdjustment()}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <Scale className="w-4 h-4 text-amber-600" aria-hidden="true" />
            <span>Kiểm kê / Cân đối</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenStockIn()}
            className="min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <ArrowDownToLine className="w-4 h-4" aria-hidden="true" />
            <span>Nhập hàng vào kho</span>
          </button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total catalog items */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tổng mặt hàng quản lý
            </span>
            <div className="text-2xl font-black text-slate-900">{stats.totalItems}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Package className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cảnh báo thiếu hàng
            </span>
            <div className={`text-2xl font-black ${stats.lowStockCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {stats.lowStockCount}
            </div>
          </div>
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
              stats.lowStockCount > 0
                ? "bg-rose-50 text-rose-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>

        {/* Sealed commercial units */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Kiện nguyên seal tồn
            </span>
            <div className="text-2xl font-black text-amber-700">
              {stats.totalSealedUnits} <span className="text-xs font-semibold text-slate-500">đơn vị</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Layers className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>

        {/* In-use active containers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Đang mở nắp dùng dở
            </span>
            <div className="text-2xl font-black text-purple-700">
              {stats.activeInUseCount} <span className="text-xs font-semibold text-slate-500">mặt hàng</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <PackageOpen className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm vật tư theo tên, SKU, barcode..."
            className="w-full min-h-[44px] pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="min-h-[44px] min-w-[44px] absolute right-0 top-0 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Xóa nội dung tìm kiếm"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterMode("ALL")}
            className={`flex-1 sm:flex-initial min-h-[36px] px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterMode === "ALL"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Tất cả tồn kho ({rawInventory.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("LOW_STOCK")}
            className={`flex-1 sm:flex-initial min-h-[36px] px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              filterMode === "LOW_STOCK"
                ? "bg-white text-rose-700 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
            <span>Sắp hết hàng ({stats.lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* Branch Inventory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-600">
              Đang tải dữ liệu tồn kho chi nhánh {selectedBranch.name}...
            </p>
          </div>
        ) : isError ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Không thể tải dữ liệu tồn kho</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {error?.message || "Đã xảy ra lỗi kết nối với máy chủ khi tải tồn kho chi nhánh."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
            >
              Thử lại ngay
            </button>
          </div>
        ) : inventoryList.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-pink-50 text-pink-500 flex items-center justify-center mx-auto border border-pink-100">
              <PackageCheck className="w-8 h-8" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">Không có dữ liệu tồn kho phù hợp</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchQuery || filterMode !== "ALL"
                  ? "Không tìm thấy mặt hàng nào khớp với bộ lọc."
                  : "Chi nhánh này chưa có tồn kho vật tư nào. Hãy thực hiện nhập kho lô hàng đầu tiên."}
              </p>
            </div>
            {searchQuery || filterMode !== "ALL" ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setFilterMode("ALL");
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Xóa tất cả bộ lọc
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenStockIn()}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                + Nhập kho lô hàng đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th scope="col" className="py-3.5 px-4 sm:px-6">
                    Mặt hàng & Mã định danh
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Cấp 1: Kiện nguyên Seal
                  </th>
                  <th scope="col" className="py-3.5 px-4 min-w-[200px]">
                    Cấp 2: Đang mở nắp dùng dở
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Tổng khả dụng
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-center">
                    Cảnh báo tồn
                  </th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6 text-right">
                    Thao tác nhanh
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {inventoryList.map((item) => {
                  const capacity = Number(item.volumeOrWeightPerUnit) || 1;
                  const currentVol = Number(item.currentVolume) || 0;
                  const inUsePercent = Math.min(100, Math.round((currentVol / capacity) * 100));
                  const isLow = item.isLowStock || item.stockUnits <= (item.minStockAlertUnits ?? 0);

                  return (
                    <tr
                      key={item.id || item.productId}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Name & SKU */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 text-sm group-hover:text-pink-600 transition-colors">
                            {item.productName}
                          </div>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded-sm text-slate-600 border border-slate-200">
                              {item.productSku}
                            </span>
                            <span className="text-slate-400">
                              1 {item.packagingUnit} = {item.volumeOrWeightPerUnit} {item.volumeUnit}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Level 1: Sealed Units */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border ${
                              item.stockUnits > (item.minStockAlertUnits ?? 0)
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : item.stockUnits > 0
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-rose-50 text-rose-800 border-rose-200"
                            }`}
                          >
                            <Package className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>
                              {item.stockUnits} {item.packagingUnit}
                            </span>
                          </span>
                          <div className="text-[10px] text-slate-400">
                            Nguyên seal chưa mở
                          </div>
                        </div>
                      </td>

                      {/* Level 2: In-use Volume Progress Bar */}
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-purple-700 flex items-center gap-1">
                              <PackageOpen className="w-3.5 h-3.5 text-purple-500" aria-hidden="true" />
                              {currentVol} / {capacity} {item.volumeUnit}
                            </span>
                            <span className="font-mono font-semibold text-slate-500">
                              {inUsePercent}%
                            </span>
                          </div>

                          {/* Progress Bar Track */}
                          <div
                            className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/80"
                            role="progressbar"
                            aria-valuenow={currentVol}
                            aria-valuemin={0}
                            aria-valuemax={capacity}
                            aria-label={`Dung tích đang mở nắp: ${currentVol} trên ${capacity} ${item.volumeUnit}`}
                          >
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                inUsePercent > 50
                                  ? "bg-purple-600"
                                  : inUsePercent > 20
                                  ? "bg-amber-500"
                                  : inUsePercent > 0
                                  ? "bg-rose-500"
                                  : "bg-slate-300"
                              }`}
                              style={{ width: `${inUsePercent}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {currentVol > 0
                              ? "Chai đang cắm bơm / mở nắp"
                              : "Không có chai dở (Sẽ tự bóc seal khi trừ BOM)"}
                          </div>
                        </div>
                      </td>

                      {/* Total Available Volume */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-slate-900 text-sm">
                            {Number(item.totalAvailableVolume).toLocaleString("vi-VN")}{" "}
                            <span className="text-xs font-semibold text-slate-500">
                              {item.volumeUnit}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Gồm cả seal + đang mở
                          </div>
                        </div>
                      </td>

                      {/* Low Stock Warning Badge */}
                      <td className="py-4 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-500" aria-hidden="true" />
                            Thiếu hàng (&le; {item.minStockAlertUnits})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" aria-hidden="true" />
                            Đủ định mức
                          </span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenStockIn(item.productId)}
                            className="min-h-[44px] px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 text-slate-600 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                            title="Nhập thêm kiện nguyên"
                            aria-label={`Nhập hàng thêm cho ${item.productName}`}
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Nhập</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenAdjustment(item.productId)}
                            className="min-h-[44px] px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-800 text-slate-600 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
                            title="Kiểm kê thực tế và cân đối hao hụt"
                            aria-label={`Kiểm kê cân đối cho ${item.productName}`}
                          >
                            <Scale className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Kiểm kê</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        {!isLoading && !isError && inventoryList.length > 0 && (
          <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Hiển thị <strong>{inventoryList.length}</strong> trên tổng số{" "}
              <strong>{rawInventory.length}</strong> dòng tồn kho
            </span>
            <span className="text-slate-400">
              Cơ chế Auto-Unseal tự động mở kiện mới khi dung tích dở hết
            </span>
          </div>
        )}
      </div>

      {/* Modal: Stock In */}
      <StockInModal
        isOpen={isStockInOpen}
        onClose={handleCloseModals}
        onSubmit={handleStockInSubmit}
        isSubmitting={stockInMutation.isPending}
        branchName={selectedBranch.name}
        preselectedProductId={selectedProductId}
      />

      {/* Modal: Stock Adjustment */}
      <StockAdjustmentModal
        isOpen={isAdjustmentOpen}
        onClose={handleCloseModals}
        onSubmit={handleAdjustmentSubmit}
        isSubmitting={stockAdjustmentMutation.isPending}
        branchName={selectedBranch.name}
        inventoryItems={rawInventory}
        preselectedProductId={selectedProductId}
      />
    </div>
  );
}
