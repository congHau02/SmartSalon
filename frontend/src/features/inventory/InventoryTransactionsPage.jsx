import React, { useState, useMemo } from "react";
import { Building2, History, Loader2, AlertCircle } from "lucide-react";
import { useBranch } from "../branch/useBranch";
import { useInventoryTransactions, useProducts } from "./useInventory";
import { TransactionsHeader } from "./components/transactions-list/TransactionsHeader";
import { TransactionsStatsCards } from "./components/transactions-list/TransactionsStatsCards";
import { TransactionsFilterBar } from "./components/transactions-list/TransactionsFilterBar";
import { TransactionsTable } from "./components/transactions-list/TransactionsTable";

export function InventoryTransactionsPage() {
  const { selectedBranch, isLoadingBranches } = useBranch();
  const branchId = selectedBranch?.id;

  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedProductId, setSelectedProductId] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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

  const { data: products = [] } = useProducts();

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
      <TransactionsHeader
        branchName={selectedBranch.name}
        onRefresh={() => refetch()}
      />

      <TransactionsStatsCards stats={stats} />

      <TransactionsFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedProductId={selectedProductId}
        setSelectedProductId={setSelectedProductId}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        products={products}
      />

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
          </div>
        ) : (
          <TransactionsTable
            filteredTransactions={filteredTransactions}
            totalCount={transactions.length}
          />
        )}
      </div>
    </div>
  );
}
