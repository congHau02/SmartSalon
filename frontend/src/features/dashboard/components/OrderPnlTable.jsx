import React, { useState, useMemo } from "react";
import { formatCurrency, formatDate } from "../../../lib/utils";
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Receipt, 
  CreditCard, 
  ArrowUpDown, 
  Filter,
  CheckCircle2,
  Tag,
  Scissors,
  ShoppingBag,
  ExternalLink
} from "lucide-react";

export function OrderPnlTable({ orders = [], isLoading }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [sortField, setSortField] = useState("createdAt");
  const [sortAsc, setSortAsc] = useState(false);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    let list = [...orders];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderCode?.toLowerCase().includes(term) ||
          o.customerName?.toLowerCase().includes(term) ||
          o.customerPhone?.includes(term)
      );
    }

    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === "createdAt") {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [orders, searchTerm, sortField, sortAsc]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="h-6 w-56 bg-slate-100 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header & Search */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-pink-600" />
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              Bảng Kê Chi Tiết Lãi/Lỗ Từng Đơn Hàng (Per-Order P&L)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Bóc tách Doanh thu thuần, Giá vốn hóa chất (Chemical COGS), Giá vốn bán lẻ, Hoa hồng & Lợi nhuận từng đơn
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 w-56 sm:w-64"
            />
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {filteredOrders.length} đơn
          </span>
        </div>
      </div>

      {/* Table */}
      {filteredOrders.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs">
          Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Mã đơn & Thời gian</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => toggleSort("totalNetRevenue")}
                >
                  <div className="flex items-center gap-1">
                    <span>Doanh thu thuần</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Giá vốn (Hóa chất / Bán lẻ)</th>
                <th className="py-3 px-4">Hoa hồng thợ</th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => toggleSort("orderNetProfit")}
                >
                  <div className="flex items-center gap-1">
                    <span>Lợi nhuận ròng đơn</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Biên LN</th>
                <th className="py-3 px-3 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrderId === order.orderId;
                const isProfitable = (order.orderNetProfit || 0) >= 0;

                return (
                  <React.Fragment key={order.orderId || order.orderCode}>
                    <tr className={`hover:bg-slate-50/70 transition-colors ${
                      isExpanded ? "bg-pink-50/20" : ""
                    }`}>
                      {/* Mã đơn & Thời gian */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 font-mono text-[11px] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                          {order.orderCode}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {order.createdAt ? formatDate(order.createdAt) : "—"}
                        </div>
                      </td>

                      {/* Khách hàng */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {order.customerName || "Khách vãng lai"}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          {order.customerPhone || "—"}
                          {order.paymentMethod && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] font-bold">
                              {order.paymentMethod}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Doanh thu thuần */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {formatCurrency(order.totalNetRevenue)}
                        </div>
                        {order.totalDiscount > 0 && (
                          <div className="text-[10px] text-pink-600">
                            Giảm: -{formatCurrency(order.totalDiscount)}
                          </div>
                        )}
                      </td>

                      {/* Giá vốn (Hóa chất + Bán lẻ) */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {formatCurrency(order.totalCogs)}
                        </div>
                        <div className="text-[10px] text-slate-400 space-x-1">
                          <span>BOM: {formatCurrency(order.chemicalCogs)}</span>
                          <span>•</span>
                          <span>Bán lẻ: {formatCurrency(order.retailCogs)}</span>
                        </div>
                      </td>

                      {/* Hoa hồng thợ */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-purple-700">
                          {formatCurrency(order.staffCommissions)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Từ sổ hoa hồng
                        </div>
                      </td>

                      {/* Lợi nhuận ròng đơn hàng */}
                      <td className="py-3 px-4">
                        <div className={`font-black ${
                          isProfitable ? "text-emerald-700" : "text-rose-600"
                        }`}>
                          {formatCurrency(order.orderNetProfit)}
                        </div>
                      </td>

                      {/* Biên LN % */}
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          isProfitable 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {order.netProfitMarginPercentage}%
                        </span>
                      </td>

                      {/* Expand Button */}
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleExpand(order.orderId)}
                          className="p-1 rounded-lg text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
                          title="Xem bóc tách Dịch vụ & Bán lẻ"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-pink-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
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
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
