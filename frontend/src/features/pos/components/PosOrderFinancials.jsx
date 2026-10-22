import React, { useState } from "react";
import { Coins, Save } from "lucide-react";
import { formatCurrency, calculateClampedDiscount } from "../../../lib/utils";

export function PosOrderFinancials({
  order,
  isOrderSettled,
  draft,
  onUpdateOrder,
  isUpdatingOrder,
  // Graceful fallbacks for legacy prop shape
  discountInput = draft?.discountInput,
  setDiscountInput = draft?.setDiscountInput,
  notesInput = draft?.notesInput,
  setNotesInput = draft?.setNotesInput,
  isEditingFinancials: controlledIsEditing,
  setIsEditingFinancials: controlledSetIsEditing,
}) {
  const [internalEditing, setInternalEditing] = useState(false);
  const isEditingFinancials = controlledIsEditing !== undefined ? controlledIsEditing : internalEditing;
  const setIsEditingFinancials = controlledSetIsEditing || setInternalEditing;
  const handleSave = () => {
    const disc = calculateClampedDiscount(discountInput, order?.subtotal, order?.depositDeducted);
    onUpdateOrder(
      {
        discountAmount: disc,
        notes: notesInput,
      },
      () => setIsEditingFinancials(false)
    );
  };

  return (
    <div className="p-4 rounded-xl bg-slate-850/70 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5 text-pink-400" />
          <span>Chiết khấu & Tổng thanh toán</span>
        </h4>
        {!isOrderSettled && !isEditingFinancials && (
          <button
            type="button"
            onClick={() => setIsEditingFinancials(true)}
            className="text-xs text-pink-400 hover:text-pink-300 font-semibold cursor-pointer"
          >
            Sửa chiết khấu / ghi chú
          </button>
        )}
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>Tạm tính (Subtotal)</span>
          <span className="font-mono text-slate-200">
            {formatCurrency(order?.subtotal)}
          </span>
        </div>

        {/* Discount line */}
        <div className="flex justify-between items-center text-slate-300">
          <span>Giảm giá (Discount)</span>
          {isEditingFinancials ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                aria-label="Số tiền giảm giá"
                className="w-28 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-right font-mono text-white text-xs"
                placeholder="0"
              />
              <span className="text-[11px] text-slate-400">đ</span>
            </div>
          ) : (
            <span className="font-mono text-rose-400">
              -{formatCurrency(order?.discountAmount)}
            </span>
          )}
        </div>

        {/* Deposit Deducted line */}
        {order?.depositDeducted > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>Đã trừ tiền cọc trước (20%)</span>
            <span className="font-mono">
              -{formatCurrency(order.depositDeducted)}
            </span>
          </div>
        )}

        {/* Notes line */}
        <div className="pt-2 border-t border-slate-800">
          <span className="text-slate-400 block mb-1">Ghi chú đơn hàng:</span>
          {isEditingFinancials ? (
            <textarea
              rows={2}
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Nhập ghi chú cho thợ hoặc lễ tân..."
              aria-label="Ghi chú đơn hàng"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-pink-500"
            />
          ) : (
            <p className="text-slate-300 italic">
              {order?.notes || "Chưa có ghi chú."}
            </p>
          )}
        </div>

        {isEditingFinancials && (
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditingFinancials(false)}
              className="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isUpdatingOrder}
              className="px-3 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        )}

        {/* Final Amount */}
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-sm font-bold text-white">
          <span>Tổng thanh toán thực thu:</span>
          <span className="text-base sm:text-lg font-mono text-pink-400">
            {formatCurrency(order?.finalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}
