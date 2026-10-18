import React, { useState, useMemo } from "react";
import { 
  Flame, 
  TrendingUp, 
  AlertTriangle, 
  Search, 
  HelpCircle, 
  Sparkles, 
  DollarSign,
  Scale,
  Droplets
} from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export function BomWastageTable({
  bomWastages = [],
  totalWastageCostAmount = 0,
  isLoading = false,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [overrunOnly, setOverrunOnly] = useState(false);

  const filteredItems = useMemo(() => {
    if (!bomWastages) return [];
    let list = bomWastages;

    if (overrunOnly) {
      list = list.filter((item) => item.wastageVolume > 0);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (item) =>
          (item.productName && item.productName.toLowerCase().includes(q)) ||
          (item.sku && item.sku.toLowerCase().includes(q))
      );
    }

    return list;
  }, [bomWastages, overrunOnly, searchTerm]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Table Header & Explanation */}
      <div className="p-5 border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Phân tích Hao hụt Định mức Hóa chất (BOM Wastage Variance Analytics)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Đối soát giữa <strong>Định mức BOM Chuẩn</strong> (tổng lượng kỹ thuật cam kết trên các đơn dịch vụ đã thanh toán) 
              với <strong>Lượng Tiêu hao Thực tế</strong> (hóa chất ghi nhận tại Visual Log + hao hụt rò rỉ kiểm kê) 
              để định lượng mức thất thoát thành tiền (VND).
            </p>
          </div>

          <div className="bg-rose-50 border border-rose-200/70 rounded-2xl p-3 shrink-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                Tổng Thất thoát BOM
              </div>
              <div className="text-lg font-black text-rose-900 leading-tight">
                {formatCurrency(totalWastageCostAmount || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Search & Overrun Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên hóa chất, mã SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={overrunOnly}
                onChange={(e) => setOverrunOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500 rounded border-slate-300"
              />
              <span>Chỉ hiển thị mặt hàng bị hao hụt quá định mức</span>
            </label>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" role="table">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Hóa chất / Vật tư</th>
              <th className="py-3.5 px-3 text-right">Giá vốn snapshot</th>
              <th className="py-3.5 px-3 text-center">BOM Chuẩn</th>
              <th className="py-3.5 px-3 text-center">Pha chế thực tế</th>
              <th className="py-3.5 px-3 text-center">Hao hụt kiểm kê</th>
              <th className="py-3.5 px-3 text-center">Tổng xuất kho</th>
              <th className="py-3.5 px-3 text-center">Lệch chuẩn</th>
              <th className="py-3.5 px-3 text-center">Tỷ lệ hao hụt (%)</th>
              <th className="py-3.5 px-4 text-right">Giá trị thất thoát (VND)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan="9" className="py-12 text-center text-slate-400">
                  <div className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                    <span>Đang trích xuất định mức BOM và bóc tách hao hụt hóa chất...</span>
                  </div>
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-12 text-center text-slate-400">
                  Không có dữ liệu tiêu hao hóa chất hoặc hao hụt nào trong chu kỳ này.
                </td>
              </tr>
            ) : (
              filteredItems.map((row) => {
                const isOverrun = row.wastageVolume > 0;
                return (
                  <tr
                    key={row.productId}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isOverrun ? "bg-rose-50/15" : ""
                    }`}
                  >
                    {/* Product Name & SKU */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 leading-tight">
                        {row.productName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                        {row.sku}
                      </div>
                    </td>

                    {/* Unit Cost Snapshot */}
                    <td className="py-3.5 px-3 text-right font-medium text-slate-600">
                      {formatCurrency(row.unitCostSnapshot)}
                      <span className="text-[10px] text-slate-400">/{row.volumeUnit}</span>
                    </td>

                    {/* Standard BOM Volume */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-semibold text-slate-800">
                        {row.standardBomVolume.toLocaleString("vi-VN")} {row.volumeUnit}
                      </span>
                    </td>

                    {/* Service Consumption Volume */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-medium text-slate-700">
                        {row.serviceConsumptionVolume.toLocaleString("vi-VN")} {row.volumeUnit}
                      </span>
                    </td>

                    {/* Adjustment Loss Volume */}
                    <td className="py-3.5 px-3 text-center">
                      {row.adjustmentLossVolume > 0 ? (
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                          +{row.adjustmentLossVolume.toLocaleString("vi-VN")} {row.volumeUnit}
                        </span>
                      ) : (
                        <span className="text-slate-400">0 {row.volumeUnit}</span>
                      )}
                    </td>

                    {/* Actual Total Volume */}
                    <td className="py-3.5 px-3 text-center">
                      <strong className="text-slate-900">
                        {row.actualTotalVolume.toLocaleString("vi-VN")} {row.volumeUnit}
                      </strong>
                    </td>

                    {/* Variance Volume */}
                    <td className="py-3.5 px-3 text-center">
                      {row.varianceVolume > 0 ? (
                        <span className="font-bold text-rose-700">
                          +{row.varianceVolume.toLocaleString("vi-VN")} {row.volumeUnit}
                        </span>
                      ) : row.varianceVolume < 0 ? (
                        <span className="font-bold text-emerald-700">
                          {row.varianceVolume.toLocaleString("vi-VN")} {row.volumeUnit}
                        </span>
                      ) : (
                        <span className="text-slate-400">0 {row.volumeUnit}</span>
                      )}
                    </td>

                    {/* Wastage Percentage Badge */}
                    <td className="py-3.5 px-3 text-center">
                      {row.varianceVolume > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                          <Flame className="w-3 h-3 text-rose-600" /> +{row.wastagePercentage}%
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          Chuẩn định mức
                        </span>
                      )}
                    </td>

                    {/* Monetary Wastage Loss in VND */}
                    <td className="py-3.5 px-4 text-right">
                      {row.wastageCostAmount > 0 ? (
                        <span className="font-black text-rose-700 text-sm">
                          {formatCurrency(row.wastageCostAmount)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">0 ₫</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
