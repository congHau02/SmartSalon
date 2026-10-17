import React from "react";
import { ArrowDownToLine, Scale, AlertTriangle, CheckCircle2 } from "lucide-react";

export function InventoryTable({
  inventoryList,
  handleOpenStockIn,
  handleOpenAdjustment,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <th className="py-3.5 pl-6 pr-4">Sản phẩm master</th>
            <th className="py-3.5 px-4">Tồn nguyên seal</th>
            <th className="py-3.5 px-4">Đang dùng dở</th>
            <th className="py-3.5 px-4">Tổng khả dụng</th>
            <th className="py-3.5 px-4 text-center">Trạng thái</th>
            <th className="py-3.5 pl-4 pr-6 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
          {inventoryList.map((item) => {
            const isLow =
              item.isLowStock || item.stockUnits <= (item.minStockAlertUnits ?? 0);
            const inUsePct =
              item.volumeOrWeightPerUnit && item.volumeOrWeightPerUnit > 0
                ? Math.min(
                    100,
                    Math.round(
                      ((item.currentVolume ?? 0) / item.volumeOrWeightPerUnit) * 100
                    )
                  )
                : 0;

            return (
              <tr
                key={item.id}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                {/* Product Info */}
                <td className="py-4 pl-6 pr-4">
                  <div className="font-bold text-slate-900 group-hover:text-pink-600 transition-colors">
                    {item.productName}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span>SKU: {item.productSku}</span>
                    <span>•</span>
                    <span>
                      1 {item.packagingUnit} = {item.volumeOrWeightPerUnit}{" "}
                      {item.volumeUnit}
                    </span>
                  </div>
                </td>

                {/* Sealed Units */}
                <td className="py-4 px-4">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-base font-extrabold ${
                        isLow ? "text-rose-600" : "text-slate-900"
                      }`}
                    >
                      {item.stockUnits}
                    </span>
                    <span className="text-slate-500 font-medium text-[11px]">
                      {item.packagingUnit}
                    </span>
                  </div>
                  {item.minStockAlertUnits > 0 && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Định mức tối thiểu: {item.minStockAlertUnits}
                    </p>
                  )}
                </td>

                {/* Opened / In-Use Volume */}
                <td className="py-4 px-4">
                  <div className="space-y-1.5 max-w-[140px]">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">
                        {item.currentVolume} {item.volumeUnit}
                      </span>
                      <span className="text-slate-400 text-[10px]">{inUsePct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          inUsePct < 20
                            ? "bg-amber-500"
                            : inUsePct < 50
                            ? "bg-emerald-500"
                            : "bg-pink-500"
                        }`}
                        style={{ width: `${inUsePct}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Total Available Volume */}
                <td className="py-4 px-4">
                  <div className="font-extrabold text-slate-900 text-sm">
                    {new Intl.NumberFormat("vi-VN").format(
                      item.totalAvailableVolume ?? 0
                    )}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      {item.volumeUnit}
                    </span>
                  </div>
                </td>

                {/* Low Stock Badge */}
                <td className="py-4 px-4 text-center">
                  {isLow ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                      <AlertTriangle className="w-3 h-3 text-rose-600" aria-hidden="true" />
                      <span>Sắp hết</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                      <span>Đủ hàng</span>
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-4 pl-4 pr-6 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenStockIn(item.productId)}
                      aria-label={`Nhập thêm ${item.productName}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] min-w-[44px] rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      title="Nhập thêm hàng"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Nhập</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenAdjustment(item.productId)}
                      aria-label={`Kiểm kê ${item.productName}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      title="Kiểm kê thực tế"
                    >
                      <Scale className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Cân đối</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
