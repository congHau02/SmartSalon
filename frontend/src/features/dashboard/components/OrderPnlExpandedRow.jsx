import React from "react";
import { Scissors, ShoppingBag } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export function OrderPnlExpandedRow({ order }) {
  return (
    <tr className="bg-slate-50/80">
      <td colSpan="8" className="p-4 border-y border-slate-200/80">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Dịch vụ */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-2">
              <Scissors className="w-3.5 h-3.5 text-pink-600" />
              <span>Phân khúc Dịch vụ (Salon Services)</span>
            </div>
            <div className="space-y-1 text-slate-600 text-[11px]">
              <div className="flex justify-between">
                <span>Doanh thu dịch vụ gốc:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(order.grossServiceRevenue)}</span>
              </div>
              <div className="flex justify-between text-pink-600">
                <span>Chiết khấu phân bổ cho dịch vụ:</span>
                <span>-{formatCurrency(order.serviceDiscount)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-1">
                <span>Doanh thu thuần dịch vụ:</span>
                <span>{formatCurrency(order.netServiceRevenue)}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>Giá vốn hóa chất (Chemical COGS):</span>
                <span>-{formatCurrency(order.chemicalCogs)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-700 border-t border-slate-100 pt-1">
                <span>Lợi nhuận ròng dịch vụ (trước hoa hồng):</span>
                <span>{formatCurrency(order.serviceNetProfit)}</span>
              </div>
            </div>
          </div>

          {/* Hàng bán lẻ */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-2">
              <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
              <span>Phân khúc Bán lẻ Mỹ phẩm (Retail Products)</span>
            </div>
            <div className="space-y-1 text-slate-600 text-[11px]">
              <div className="flex justify-between">
                <span>Doanh thu bán lẻ gốc:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(order.grossRetailRevenue)}</span>
              </div>
              <div className="flex justify-between text-pink-600">
                <span>Chiết khấu phân bổ cho bán lẻ:</span>
                <span>-{formatCurrency(order.retailDiscount)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-1">
                <span>Doanh thu thuần bán lẻ:</span>
                <span>{formatCurrency(order.netRetailRevenue)}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>Giá vốn hàng bán lẻ (Retail COGS):</span>
                <span>-{formatCurrency(order.retailCogs)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-700 border-t border-slate-100 pt-1">
                <span>Lợi nhuận bán lẻ (trước hoa hồng):</span>
                <span>{formatCurrency(order.retailNetProfit)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Row inside expanded */}
        <div className="mt-3 px-3 py-2 bg-pink-50/50 rounded-lg border border-pink-100 flex flex-wrap items-center justify-between text-[11px]">
          <span className="text-slate-600">
            Công thức tính: <strong>LN Đơn hàng = Doanh thu thuần ({formatCurrency(order.totalNetRevenue)}) - Tổng COGS ({formatCurrency(order.totalCogs)}) - Hoa hồng thợ ({formatCurrency(order.staffCommissions)})</strong>
          </span>
          <span className="font-bold text-slate-900">
            = {formatCurrency(order.orderNetProfit)} ({order.netProfitMarginPercentage}%)
          </span>
        </div>
      </td>
    </tr>
  );
}
