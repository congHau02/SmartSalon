import React from "react";
import { PnlSummaryCards } from "./PnlSummaryCards";
import { PnlTrendChart } from "./PnlTrendChart";
import { OrderPnlTable } from "./OrderPnlTable";
import { AlertCircle, RefreshCw } from "lucide-react";

export function PnlDashboardTab({ data, isLoading, isError, error, onRefetch }) {
  if (isError) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-sm font-bold text-rose-900">
          Không thể tải dữ liệu báo cáo Lãi/Lỗ P&L
        </h3>
        <p className="text-xs text-rose-700 max-w-md mx-auto">
          {error?.message || "Đã xảy ra lỗi khi kết nối với máy chủ phân tích tài chính."}
        </p>
        <button
          onClick={onRefetch}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tier 1 & Tier 2 KPI Cards */}
      <PnlSummaryCards data={data} isLoading={isLoading} />

      {/* Interactive Trend Chart */}
      <PnlTrendChart dailySeries={data?.dailySeries} isLoading={isLoading} />

      {/* Per-Order Breakdown Table */}
      <OrderPnlTable orders={data?.orders} isLoading={isLoading} />
    </div>
  );
}
