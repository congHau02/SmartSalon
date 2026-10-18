import React, { useState, useMemo } from "react";
import { 
  AlertTriangle, 
  Search, 
  Package, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  ArrowDownToLine,
  TrendingDown,
  Building2
} from "lucide-react";
import { Button } from "../../../components/ui/button";

/**
 * Renders the 3-Tier Smart Inventory Depletion Alerts table.
 * Classifies products into OUT_OF_STOCK, LOW_STOCK, NEAR_THRESHOLD, and HEALTHY.
 * Computes burn-rate consumption velocity and days-to-depletion.
 */
export function StockAlertsTable({
  alerts = [],
  isLoading = false,
  onOpenStockIn,
  selectedBranch,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL"); // ALL | OUT_OF_STOCK | LOW_STOCK | NEAR_THRESHOLD | HEALTHY

  const filteredAlerts = useMemo(() => {
    return alerts.filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase());

      const matchTier = tierFilter === "ALL" || item.alertLevel === tierFilter;

      return matchSearch && matchTier;
    });
  }, [alerts, searchTerm, tierFilter]);

  const renderTierBadge = (level) => {
    switch (level) {
      case "OUT_OF_STOCK":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            Hết hàng
          </span>
        );
      case "LOW_STOCK":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Sắp hết hàng
          </span>
        );
      case "NEAR_THRESHOLD":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-300">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            Tiệm cận ngưỡng
          </span>
        );
      case "HEALTHY":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            An toàn
          </span>
        );
    }
  };

  const renderDaysBadge = (days, level) => {
    if (level === "OUT_OF_STOCK" || days === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
          0 ngày (Đã hết)
        </span>
      );
    }
    if (days === null || days === undefined) {
      return (
        <span className="text-xs text-slate-400">
          Chưa có phát sinh
        </span>
      );
    }
    if (days <= 3) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
          <Clock className="w-3 h-3 text-rose-600" />
          Còn ~{days} ngày
        </span>
      );
    }
    if (days <= 7) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          Còn ~{days} ngày
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
        ~{days} ngày
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header & Controls */}
      <div className="p-5 border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Danh mục Cảnh báo Cạn kho & Tốc độ Tiêu hao
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Phân loại 3 cấp độ cảnh báo (Hết hàng, Sắp hết, Tiệm cận) và dự báo số ngày còn lại theo tốc độ dùng hàng ngày.
            </p>
          </div>
        </div>

        {/* Search & Filter Pills */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm, mã SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Alert Tier Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTierFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 outline-none ${
                tierFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tất cả ({alerts.length})
            </button>
            <button
              type="button"
              onClick={() => setTierFilter("OUT_OF_STOCK")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 outline-none ${
                tierFilter === "OUT_OF_STOCK"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60"
              }`}
            >
              Hết hàng ({alerts.filter((a) => a.alertLevel === "OUT_OF_STOCK").length})
            </button>
            <button
              type="button"
              onClick={() => setTierFilter("LOW_STOCK")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 outline-none ${
                tierFilter === "LOW_STOCK"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60"
              }`}
            >
              Sắp hết ({alerts.filter((a) => a.alertLevel === "LOW_STOCK").length})
            </button>
            <button
              type="button"
              onClick={() => setTierFilter("NEAR_THRESHOLD")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 outline-none ${
                tierFilter === "NEAR_THRESHOLD"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60"
              }`}
            >
              Tiệm cận ({alerts.filter((a) => a.alertLevel === "NEAR_THRESHOLD").length})
            </button>
            <button
              type="button"
              onClick={() => setTierFilter("HEALTHY")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 outline-none ${
                tierFilter === "HEALTHY"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60"
              }`}
            >
              An toàn ({alerts.filter((a) => a.alertLevel === "HEALTHY").length})
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" role="table">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Sản phẩm & SKU</th>
              <th className="py-3.5 px-3 text-center">Tồn Seal</th>
              <th className="py-3.5 px-3 text-center">Thể tích Mở</th>
              <th className="py-3.5 px-3 text-center">Khả dụng</th>
              <th className="py-3.5 px-3 text-center">Tốc độ tiêu hao</th>
              <th className="py-3.5 px-3 text-center">Dự báo cạn kho</th>
              <th className="py-3.5 px-3 text-center">Cấp độ cảnh báo</th>
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan="8" className="py-12 text-center text-slate-400">
                  <div className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                    <span>Đang tính toán tốc độ tiêu hao và phân tích tồn kho...</span>
                  </div>
                </td>
              </tr>
            ) : filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-12 text-center text-slate-400">
                  Không tìm thấy mặt hàng nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              filteredAlerts.map((row) => (
                <tr
                  key={row.branchId ? `${row.branchId}-${row.productId}` : row.productId}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    row.alertLevel === "OUT_OF_STOCK"
                      ? "bg-rose-50/20"
                      : row.alertLevel === "LOW_STOCK"
                      ? "bg-amber-50/15"
                      : ""
                  }`}
                >
                  {/* Product & SKU */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 leading-tight flex items-center gap-2">
                      <span>{row.productName}</span>
                      {!selectedBranch && row.branchName && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {row.branchName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {row.sku}
                      </span>
                      <span>•</span>
                      <span>
                        Quy cách: {row.volumeOrWeightPerUnit} {row.volumeUnit}/{row.unit}
                      </span>
                    </div>
                  </td>

                  {/* Sealed Stock Units vs Safety Stock */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="font-black text-slate-900">
                      {row.stockUnits} <span className="font-normal text-slate-500 text-[11px]">{row.unit}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Ngưỡng min: {row.minStockAlertUnits} {row.unit}
                    </div>
                  </td>

                  {/* Opened Volume */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="font-semibold text-slate-700">
                      {row.currentVolume.toLocaleString("vi-VN")} <span className="text-[11px] text-slate-400">{row.volumeUnit}</span>
                    </div>
                  </td>

                  {/* Total Available Volume */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="font-black text-pink-700 bg-pink-50/80 px-2 py-1 rounded-lg inline-block border border-pink-100">
                      {row.totalAvailableVolume.toLocaleString("vi-VN")} {row.volumeUnit}
                    </div>
                  </td>

                  {/* Average Daily Consumption Rate */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="font-medium text-slate-700">
                      {row.avgDailyConsumptionVolume > 0 ? (
                        <>
                          <strong className="text-slate-900">{row.avgDailyConsumptionVolume.toLocaleString("vi-VN")}</strong>{" "}
                          <span className="text-[11px] text-slate-400">{row.volumeUnit}/ngày</span>
                        </>
                      ) : (
                        <span className="text-slate-400 text-[11px]">0 {row.volumeUnit}/ngày</span>
                      )}
                    </div>
                  </td>

                  {/* Estimated Days Remaining */}
                  <td className="py-3.5 px-3 text-center">
                    {renderDaysBadge(row.estimatedDaysRemaining, row.alertLevel)}
                  </td>

                  {/* Alert Level Badge */}
                  <td className="py-3.5 px-3 text-center">
                    {renderTierBadge(row.alertLevel)}
                  </td>

                  {/* Action: Stock In Button */}
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenStockIn(row.productId, row.branchId, row.branchName)}
                      className="text-xs font-bold gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 shadow-2xs focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 outline-none cursor-pointer"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      <span>Nhập kho ngay</span>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
