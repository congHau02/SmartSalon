import React, { useState, useMemo } from "react";
import { ArrowDownToLine } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { StockTierBadge, StockDaysRemainingBadge } from "./StockAlertBadges";
import { StockAlertsFilterHeader } from "./StockAlertsFilterHeader";

export function StockAlertsTable({
  alerts = [],
  isLoading = false,
  onOpenStockIn,
  selectedBranch,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");

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

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      <StockAlertsFilterHeader
        alerts={alerts}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        tierFilter={tierFilter}
        setTierFilter={setTierFilter}
      />

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

                  <td className="py-3.5 px-3 text-center">
                    <div className="font-black text-slate-900">
                      {row.stockUnits} <span className="font-normal text-slate-500 text-[11px]">{row.unit}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Ngưỡng min: {row.minStockAlertUnits} {row.unit}
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <div className="font-semibold text-slate-700">
                      {row.currentVolume.toLocaleString("vi-VN")} <span className="text-[11px] text-slate-400">{row.volumeUnit}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <div className="font-black text-pink-700 bg-pink-50/80 px-2 py-1 rounded-lg inline-block border border-pink-100">
                      {row.totalAvailableVolume.toLocaleString("vi-VN")} {row.volumeUnit}
                    </div>
                  </td>

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

                  <td className="py-3.5 px-3 text-center">
                    <StockDaysRemainingBadge days={row.estimatedDaysRemaining} level={row.alertLevel} />
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <StockTierBadge level={row.alertLevel} />
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenStockIn(row.productId, row.branchId, row.branchName)}
                      className="text-xs font-bold gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 shadow-2xs focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none cursor-pointer"
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
