import React, { useState, useMemo } from "react";
import { formatCurrency, formatDate } from "../../../lib/utils";
import { ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { OrderPnlTableHeader } from "./OrderPnlTableHeader";
import { OrderPnlExpandedRow } from "./OrderPnlExpandedRow";

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
      <OrderPnlTableHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        count={filteredOrders.length}
      />

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
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 font-mono text-[11px] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                          {order.orderCode}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {order.createdAt ? formatDate(order.createdAt) : "—"}
                        </div>
                      </td>

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

                      <td className="py-3 px-4">
                        <div className="font-semibold text-purple-700">
                          {formatCurrency(order.staffCommissions)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Từ sổ hoa hồng
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className={`font-black ${
                          isProfitable ? "text-emerald-700" : "text-rose-600"
                        }`}>
                          {formatCurrency(order.orderNetProfit)}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          isProfitable 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {order.netProfitMarginPercentage}%
                        </span>
                      </td>

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

                    {isExpanded && <OrderPnlExpandedRow order={order} />}
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
