import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  History,
  Building2,
  Search,
  X,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
  ArrowLeft,
  User,
  ArrowDownToLine,
  Scale,
  FlaskConical,
} from "lucide-react";
import { useBranch } from "../branch/useBranch";
import { useInventoryTransactions, useProducts } from "./useInventory";
import { TRANSACTION_TYPE_CONFIG } from "./constants";
import { formatDate } from "../../lib/utils";

export function InventoryTransactionsPage() {
  const { selectedBranch, isLoadingBranches } = useBranch();
  const branchId = selectedBranch?.id;

  // Filters State
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedProductId, setSelectedProductId] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // TanStack Query: Fetch branch transaction log
  const {
    data: transactions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useInventoryTransactions(
    branchId,
    selectedProductId !== "ALL" ? { productId: selectedProductId } : {}
  );

  // TanStack Query: Fetch products for filter selector
  const { data: products = [] } = useProducts();

  // Client-side filtering by type and search query
  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    let list = transactions;

    if (selectedType !== "ALL") {
      list = list.filter((t) => t.transactionType === selectedType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          (t.productName && t.productName.toLowerCase().includes(q)) ||
          (t.productSku && t.productSku.toLowerCase().includes(q)) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.createdBy && t.createdBy.toLowerCase().includes(q))
      );
    }

    return list;
  }, [transactions, selectedType, searchQuery]);

  // Metric stats
  const stats = useMemo(() => {
    if (!Array.isArray(transactions)) {
      return { total: 0, stockIn: 0, consumption: 0, adjustment: 0 };
    }
    const total = transactions.length;
    const stockIn = transactions.filter((t) => t.transactionType === "STOCK_IN").length;
    const consumption = transactions.filter(
      (t) => t.transactionType === "SERVICE_CONSUMPTION" || t.transactionType === "AUTO_UNSEAL"
    ).length;
    const adjustment = transactions.filter(
      (t) => t.transactionType === "STOCK_ADJUSTMENT"
    ).length;

    return { total, stockIn, consumption, adjustment };
  }, [transactions]);

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
          Vui lòng chọn một chi nhánh từ thanh điều hướng để xem lịch sử biến động và kiểm toán kho.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/admin/inventory"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors mr-1 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
              title="Quay lại Quản lý Tồn kho"
              aria-label="Quay lại Quản lý Tồn kho"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </Link>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
              <History className="w-5 h-5" aria-hidden="true" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Sổ Nhật ký Biến động Kho
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Kiểm toán toàn diện mọi phát sinh nhập kho, tự động bóc seal, trừ hao theo định mức dịch vụ và điều chỉnh kiểm kê tại {selectedBranch.name}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
            title="Làm mới nhật ký"
            aria-label="Làm mới nhật ký"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </button>

          <Link
            to="/admin/inventory"
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md shadow-slate-900/10 transition-colors flex items-center gap-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <span>Xem Bảng Tồn kho</span>
          </Link>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tổng số biến động
            </span>
            <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <History className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Lượt nhập kho mới
            </span>
            <div className="text-2xl font-black text-emerald-600">{stats.stockIn}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownToLine className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Bóc seal & Tiêu hao
            </span>
            <div className="text-2xl font-black text-purple-600">{stats.consumption}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <FlaskConical className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cân đối / Kiểm kê
            </span>
            <div className="text-2xl font-black text-amber-600">{stats.adjustment}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Scale className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Live Search */}
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo sản phẩm, mã SKU, ghi chú lý do hoặc người thao tác..."
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

          {/* Product Filter Selector */}
          <div className="w-full md:w-64">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              aria-label="Lọc theo mặt hàng cụ thể"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="ALL">Tất cả mặt hàng ({products.length})</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Transaction Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" aria-hidden="true" />
            Loại phát sinh:
          </span>

          <button
            type="button"
            onClick={() => setSelectedType("ALL")}
            className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedType === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tất cả loại
          </button>

          {Object.entries(TRANSACTION_TYPE_CONFIG).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedType(key)}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedType === key
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {config.icon && <config.icon className="w-3.5 h-3.5" aria-hidden="true" />}
              <span>{config.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Audit Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-600">Đang tải lịch sử giao dịch kho...</p>
          </div>
        ) : isError ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Không thể tải nhật ký kho</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {error?.message || "Đã xảy ra lỗi kết nối với máy chủ khi tải sổ nhật ký."}
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
        ) : filteredTransactions.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-500 flex items-center justify-center mx-auto border border-purple-100">
              <History className="w-8 h-8" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">Không tìm thấy biến động nào</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchQuery || selectedType !== "ALL" || selectedProductId !== "ALL"
                  ? "Không có bản ghi giao dịch nào khớp với bộ lọc đã chọn."
                  : "Chưa có phát sinh biến động kho nào tại chi nhánh này."}
              </p>
            </div>
            {(searchQuery || selectedType !== "ALL" || selectedProductId !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedType("ALL");
                  setSelectedProductId("ALL");
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th scope="col" className="py-3.5 px-4 sm:px-6">
                    Thời gian & Mã GD
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Mặt hàng
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Loại biến động
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Biến động kiện (Seal)
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Biến động dung tích
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Tồn sau GD
                  </th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6">
                    Ghi chú / Căn cứ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTransactions.map((tx) => {
                  const typeConfig = TRANSACTION_TYPE_CONFIG[tx.transactionType] || {
                    label: tx.transactionType,
                    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
                  };

                  const qtyDelta = tx.quantityUnits ?? 0;
                  const volDelta = Number(tx.volumeAmount) || 0;

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Timestamp & ID */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-800">
                            {formatDate(tx.createdAt)}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400">
                            Mã GD: #{tx.id}
                          </div>
                        </div>
                      </td>

                      {/* Product Name & SKU */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900">
                            {tx.productName}
                          </div>
                          <span className="inline-block font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-sm text-slate-600 border border-slate-200">
                            {tx.productSku}
                          </span>
                        </div>
                      </td>

                      {/* Transaction Type Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${typeConfig.badgeClass}`}
                        >
                          {typeConfig.icon ? (
                            <typeConfig.icon className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <History className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                          <span>{typeConfig.label}</span>
                        </span>
                      </td>

                      {/* Sealed Units Delta */}
                      <td className="py-4 px-4">
                        {qtyDelta !== 0 ? (
                          <span
                            className={`font-black text-xs ${
                              qtyDelta > 0 ? "text-emerald-600" : "text-purple-600"
                            }`}
                          >
                            {qtyDelta > 0 ? `+${qtyDelta}` : qtyDelta} kiện
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Volume Delta */}
                      <td className="py-4 px-4">
                        {volDelta !== 0 ? (
                          <span
                            className={`font-black text-xs ${
                              volDelta > 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {volDelta > 0 ? `+${volDelta}` : volDelta} {tx.unit}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">0 {tx.unit}</span>
                        )}
                      </td>

                      {/* Balance After */}
                      <td className="py-4 px-4">
                        <span className="font-extrabold text-slate-800">
                          {Number(tx.balanceAfterVolume).toLocaleString("vi-VN")} {tx.unit}
                        </span>
                      </td>

                      {/* Notes / Reference */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="space-y-1">
                          <div className="text-slate-700 max-w-xs truncate" title={tx.notes}>
                            {tx.notes || "Giao dịch hệ thống tự động"}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            {tx.createdBy && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" aria-hidden="true" />
                                {tx.createdBy}
                              </span>
                            )}
                            {tx.referenceOrderId && (
                              <span className="font-mono bg-purple-50 text-purple-700 px-1 rounded-sm border border-purple-200">
                                Đơn #{tx.referenceOrderId}
                              </span>
                            )}
                          </div>
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
        {!isLoading && !isError && filteredTransactions.length > 0 && (
          <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Hiển thị <strong>{filteredTransactions.length}</strong> trên tổng số{" "}
              <strong>{transactions.length}</strong> phát sinh ghi nhận
            </span>
            <span className="text-slate-400">
              Nhật ký bất biến (Immutable Audit Trail) phục vụ đối soát
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
