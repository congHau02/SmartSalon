import React from "react";
import { CheckCircle2, Printer, Scissors } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export function PosReceiptView({ order, items = [], onPrint }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Paid banner */}
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Đơn hàng đã thanh toán thành công</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950">
                {order.paymentMethod || "PAID"}
              </span>
            </h4>
            <p className="text-xs text-emerald-400/80">
              Tồn kho đã trừ tự động & Hoa hồng đã ghi vào Sổ cái nhân viên.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onPrint}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-emerald-900/30"
        >
          <Printer className="w-4 h-4" />
          <span>In hóa đơn</span>
        </button>
      </div>

      {/* Printable Receipt Paper Container */}
      <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-6 shadow-inner print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        {/* Receipt Header */}
        <div className="text-center pb-5 border-b border-dashed border-slate-800">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Scissors className="w-5 h-5 text-pink-500" />
            <span className="font-black text-lg text-white tracking-wider">SMARTSALON</span>
          </div>
          <p className="text-xs text-slate-400">
            {order.branchName || "SmartSalon Flagship"}
          </p>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
            HÓA ĐƠN THANH TOÁN DỊCH VỤ / POS RECEIPT
          </p>
        </div>

        {/* Receipt Meta */}
        <div className="grid grid-cols-2 gap-3 text-xs border-b border-dashed border-slate-800 pb-4">
          <div>
            <span className="text-slate-500 block">Mã hóa đơn:</span>
            <strong className="text-white font-mono text-sm">{order.orderCode}</strong>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block">Ngày giờ:</span>
            <span className="text-slate-300 font-mono">
              {order.createdAt
                ? new Date(order.createdAt).toLocaleString("vi-VN", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })
                : "--"}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Khách hàng:</span>
            <strong className="text-white">{order.customerName || "Khách lẻ"}</strong>
            {order.customerPhone && (
              <span className="text-slate-400 block font-mono text-[11px]">
                {order.customerPhone}
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="text-slate-500 block">Phương thức:</span>
            <span className="font-semibold text-pink-400">
              {order.paymentMethod === "VIETQR"
                ? "Chuyển khoản VietQR"
                : order.paymentMethod === "CARD"
                ? "Thẻ ngân hàng (POS)"
                : "Tiền mặt (CASH)"}
            </span>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="space-y-3">
          <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
            <span>Khoản mục</span>
            <span className="text-right">Thành tiền</span>
          </div>
          {items.map((item) => (
            <div key={item.id} className="text-xs space-y-1">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-semibold text-white">
                    {item.itemType === "SERVICE" ? item.serviceName : item.productName}
                  </span>
                  <span className="text-slate-400 text-[11px] block">
                    {item.quantity} x {formatCurrency(item.unitPrice)}
                  </span>
                </div>
                <span className="font-mono font-bold text-white">
                  {formatCurrency(item.totalPrice)}
                </span>
              </div>
              {/* Steps and assigned staff */}
              {item.steps?.length > 0 && (
                <div className="pl-3 border-l-2 border-slate-800 space-y-0.5 text-[11px] text-slate-400">
                  {item.steps.map((s) => (
                    <div key={s.id} className="flex justify-between">
                      <span>• {s.stepName}: {s.staffName || "KTV"}</span>
                      <span className="text-amber-400/90 font-mono">
                        +{formatCurrency(s.commissionAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Financial Totals */}
        <div className="pt-4 border-t border-dashed border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Tổng tiền dịch vụ & sản phẩm:</span>
            <span className="font-mono text-white">{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-rose-400">
              <span>Giảm giá / Ưu đãi:</span>
              <span className="font-mono">-{formatCurrency(order.discountAmount)}</span>
            </div>
          )}
          {order.depositDeducted > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Đã trừ tiền cọc trước (20%):</span>
              <span className="font-mono">-{formatCurrency(order.depositDeducted)}</span>
            </div>
          )}
          <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-sm">
            <span className="font-bold text-white">Tổng thực thu đã thanh toán:</span>
            <span className="font-mono font-bold text-lg text-emerald-400">
              {formatCurrency(order.finalAmount)}
            </span>
          </div>
        </div>

        {/* Receipt Footer Message */}
        <div className="text-center pt-4 border-t border-dashed border-slate-800 space-y-1">
          <p className="text-xs font-semibold text-slate-300">
            Cảm ơn Quý khách & Hẹn gặp lại!
          </p>
          <p className="text-[10px] text-slate-500">
            Hotline hỗ trợ: 1900 6868 • smartsalon.vn
          </p>
        </div>
      </div>
    </div>
  );
}
