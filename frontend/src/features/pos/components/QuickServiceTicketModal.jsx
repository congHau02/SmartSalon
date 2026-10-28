import React from "react";
import { X, Scissors, Loader2, Sparkles } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";
import { useQuickTicketForm } from "../useQuickTicketForm";
import { QuickTicketVietQrPreview } from "./QuickTicketVietQrPreview";
import { QuickTicketServicePicker } from "./QuickTicketServicePicker";
import { QuickTicketProductPicker } from "./QuickTicketProductPicker";

export function QuickServiceTicketModal({ isOpen, onClose, stylists = [], services = [], products = [], ...formOpts }) {
  const form = useQuickTicketForm({ ...formOpts, onClose, stylists, services, products });
  if (!isOpen) return null;

  const { selectedStylistId, quickGuest, customerPhone, customerName, selectedServiceIds, productQty, paymentMethod, discountAmount, notes } = form.values;
  const { setSelectedStylistId, setQuickGuest, setCustomerPhone, setCustomerName, setPaymentMethod, setDiscountAmount, setNotes } = form.set;
  const { finalAmount, errorMsg, toggleService, submit: handleSubmit } = form;
  const createMutation = { isPending: form.isPending };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Tạo phiếu cắt nhanh 1 bước</h3>
              <p className="text-[11px] text-slate-400">Tự động gán 100% công đoạn và thanh toán tại ghế</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Stylist & Customer Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Thợ cắt (Stylist)</label>
              <select
                value={selectedStylistId}
                onChange={(e) => setSelectedStylistId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
              >
                {stylists.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.fullName || st.username}{st.shiftName ? ` [${st.shiftName}]` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300">Khách hàng</label>
                <button
                  type="button"
                  onClick={() => setQuickGuest(!quickGuest)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    quickGuest ? "bg-pink-500/20 text-pink-300" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {quickGuest ? "Khách lẻ nhanh" : "Nhập SĐT"}
                </button>
              </div>
              {quickGuest ? (
                <div className="px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400">
                  Khách vãng lai (walkin.guest)
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    placeholder="SĐT..."
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                  <input
                    type="text"
                    placeholder="Tên khách..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Service Multi-Select via extracted sub-component */}
          <QuickTicketServicePicker
            services={services}
            selectedServiceIds={selectedServiceIds}
            onToggleService={toggleService}
          />

          <QuickTicketProductPicker products={products} quantities={productQty} onChange={form.setQty} />

          {/* Payment Method Selector */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">Hình thức thanh toán</label>
            <div className="grid grid-cols-3 gap-2">
              {["CASH", "VIETQR", "CARD"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    paymentMethod === m
                      ? "bg-gradient-to-r from-pink-600 to-pink-500 text-white border-pink-400 shadow-md shadow-pink-950"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  {m === "CASH" ? "Tiền mặt" : m === "VIETQR" ? "VietQR Chuyển khoản" : "Thẻ ngân hàng"}
                </button>
              ))}
            </div>
          </div>

          {/* Live VietQR Preview */}
          {paymentMethod === "VIETQR" && finalAmount > 0 && form.canPreviewQr && (
            <QuickTicketVietQrPreview
              amount={finalAmount}
              description={`PHIEU CAT NHANH ${Date.now() % 10000}`}
            />
          )}
          {paymentMethod === "VIETQR" && !form.canPreviewQr && (
            <p className="text-[11px] text-amber-300">
              Khách có tài khoản được tự động áp dụng ưu đãi hạng thành viên / tiền cọc giữ lại; số tiền chính xác sẽ hiển thị trên phiếu sau khi chốt.
            </p>
          )}

          {/* Discount & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Giảm giá thủ công (VNĐ)</label>
              <input
                type="number"
                min="0"
                step="10000"
                placeholder="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Ghi chú dịch vụ</label>
              <input
                type="text"
                placeholder="Ghi chú cắt/nhuộm..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          {/* Summary & Submit Button */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">Tổng tiền thanh toán:</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {formatCurrency(finalAmount)}
              </span>
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending || selectedServiceIds.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-bold text-xs shadow-lg shadow-pink-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{createMutation.isPending ? "Đang chốt đơn..." : "Chốt phiếu & Hoàn thành"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
