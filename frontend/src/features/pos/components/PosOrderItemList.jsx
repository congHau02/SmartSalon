import React from "react";
import { Plus, Scissors, ShoppingBag, Percent, Trash2 } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";
import { PosStepAssignmentRow } from "./PosStepAssignmentRow";

export function PosOrderItemList({
  items = [],
  isOrderSettled,
  stylists = [],
  itemActions,
  stepActions,
  // Graceful fallbacks for legacy prop shape
  onOpenAddService = itemActions?.onOpenAddService,
  onOpenAddProduct = itemActions?.onOpenAddProduct,
  onRemoveItem = itemActions?.onRemoveItem,
  isRemovingItem = itemActions?.isRemovingItem,
  onUpdateAssignment = stepActions?.onUpdateAssignment,
  onUpdateStatus = stepActions?.onUpdateStatus,
  isStatusPending = stepActions?.isStatusPending,
}) {
  return (
    <div className="space-y-6">
      {/* Item Action Buttons */}
      {!isOrderSettled && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">
            Thêm dịch vụ làm tóc hoặc sản phẩm bán lẻ vào đơn:
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAddService}
              className="px-3 py-1.5 rounded-lg bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Dịch vụ</span>
            </button>
            <button
              type="button"
              onClick={onOpenAddProduct}
              className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Sản phẩm lẻ</span>
            </button>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Danh mục đơn hàng ({items.length})
        </h3>

        {items.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
            Đơn hàng hiện chưa có dịch vụ hay sản phẩm nào.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 space-y-3.5 shadow-sm"
            >
              {/* Item Main Info Row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      item.itemType === "SERVICE"
                        ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                        : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    }`}
                  >
                    {item.itemType === "SERVICE" ? (
                      <Scissors className="w-4 h-4" />
                    ) : (
                      <ShoppingBag className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">
                        {item.serviceName || item.productName}
                      </h4>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          item.itemType === "SERVICE"
                            ? "bg-pink-500/20 text-pink-300"
                            : "bg-purple-500/20 text-purple-300"
                        }`}
                      >
                        {item.itemType === "SERVICE" ? "Dịch vụ" : "Bán lẻ"}
                      </span>
                    </div>

                    {item.productSku && (
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        SKU: {item.productSku}
                      </p>
                    )}

                    {item.itemType === "SERVICE" && item.commissionPoolRate && (
                      <div className="flex items-center gap-1.5 text-[11px] text-pink-300/80 mt-1">
                        <Percent className="w-3 h-3 text-pink-400" />
                        <span>
                          Quỹ hoa hồng dịch vụ: <strong>{item.commissionPoolRate}%</strong> (
                          {formatCurrency((item.totalPrice * item.commissionPoolRate) / 100)})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price & Remove Button */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-white block">
                      {formatCurrency(item.totalPrice)}
                    </span>
                    {item.quantity > 1 && (
                      <span className="text-[11px] text-slate-400 block font-mono">
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                      </span>
                    )}
                  </div>

                  {!isOrderSettled && (
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      disabled={isRemovingItem}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Xóa mục này"
                      aria-label={`Xóa mục ${item.serviceName || item.productName} khỏi đơn hàng`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Service Steps Breakdown & Staff Assignment */}
              {item.itemType === "SERVICE" && item.steps?.length > 0 && (
                <div className="mt-2 pt-3 border-t border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    <span>Phân chia công đoạn ({item.steps.length} bước)</span>
                    <span>Tỷ lệ & Hoa hồng dự kiến (VND)</span>
                  </div>

                  <div className="space-y-2">
                    {item.steps.map((step) => (
                      <PosStepAssignmentRow
                        key={step.id}
                        step={step}
                        stylists={stylists}
                        isOrderSettled={isOrderSettled}
                        onUpdateAssignment={onUpdateAssignment}
                        onUpdateStatus={onUpdateStatus}
                        isStatusPending={isStatusPending}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
