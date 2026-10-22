import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { usePosOrder } from "./usePosOrder";
import { VisualLogTab } from "./VisualLogTab";
import { PosCheckoutTab } from "./PosCheckoutTab";
import { PosOrderDrawerHeader } from "./components/PosOrderDrawerHeader";
import { PosOrderItemList } from "./components/PosOrderItemList";
import { PosOrderFinancials } from "./components/PosOrderFinancials";
import { AddServiceModal } from "./components/AddServiceModal";
import { AddProductModal } from "./components/AddProductModal";

export function PosOrderDrawer({
  isOpen,
  onClose,
  orderId,
  branchId,
  stylists = [],
  services = [],
  products = [],
  onOrderUpdated,
}) {
  const [activeTab, setActiveTab] = useState("cart"); // 'cart' | 'visuallog' | 'checkout'
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditingFinancials, setIsEditingFinancials] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  const showNotice = (notice) => {
    setActionNotice(notice);
    if (notice?.type === "success") {
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const {
    order,
    isLoadingOrder,
    discountInput,
    setDiscountInput,
    notesInput,
    setNotesInput,
    liveFinalAmount,
    completedSteps,
    inProgressSteps,
    totalSteps,
    isOrderSettled,
    invalidateOrderWorkspace,
    addServiceMutation,
    addProductMutation,
    removeItemMutation,
    updateOrderMutation,
    updateStepAssignmentMutation,
    updateStepStatusMutation,
  } = usePosOrder(orderId, isOpen, { onNotice: showNotice });

  if (!isOpen) return null;

  const handleUpdateOrder = (data, onSuccess) => {
    updateOrderMutation.mutate(data, {
      onSuccess: () => {
        if (onSuccess) onSuccess();
        if (onOrderUpdated) onOrderUpdated();
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col h-full shadow-2xl">
        <PosOrderDrawerHeader
          order={order}
          notice={{ value: actionNotice, onDismiss: () => setActionNotice(null) }}
          stepStats={{
            completed: completedSteps,
            total: totalSteps,
            inProgress: inProgressSteps,
          }}
          tabState={{ activeTab, setActiveTab }}
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoadingOrder ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
              <p className="text-sm">Đang tải chi tiết đơn hàng...</p>
            </div>
          ) : activeTab === "cart" ? (
            <div className="space-y-6">
              <PosOrderItemList
                items={order?.items || []}
                isOrderSettled={isOrderSettled}
                stylists={stylists}
                itemActions={{
                  onOpenAddService: () => setIsAddServiceOpen(true),
                  onOpenAddProduct: () => setIsAddProductOpen(true),
                  onRemoveItem: (itemId) => removeItemMutation.mutate(itemId),
                  isRemovingItem: removeItemMutation.isPending,
                }}
                stepActions={{
                  onUpdateAssignment: ({ stepId, data }) =>
                    updateStepAssignmentMutation.mutate({ stepId, data }),
                  onUpdateStatus: ({ stepId, data }) =>
                    updateStepStatusMutation.mutate({ stepId, data }),
                  isStatusPending: updateStepStatusMutation.isPending,
                }}
              />

              <PosOrderFinancials
                order={order}
                isOrderSettled={isOrderSettled}
                draft={{
                  discountInput,
                  setDiscountInput,
                  notesInput,
                  setNotesInput,
                }}
                onUpdateOrder={handleUpdateOrder}
                isUpdatingOrder={updateOrderMutation.isPending}
              />
            </div>
          ) : activeTab === "visuallog" ? (
            <VisualLogTab
              orderId={orderId}
              order={order}
              stylists={stylists}
              products={products}
              onNotice={showNotice}
            />
          ) : (
            <PosCheckoutTab
              orderId={orderId}
              order={order}
              branchId={branchId}
              discountInput={discountInput}
              setDiscountInput={setDiscountInput}
              notesInput={notesInput}
              setNotesInput={setNotesInput}
              liveFinalAmount={liveFinalAmount}
              onNotice={showNotice}
              onCheckoutSuccess={() => {
                invalidateOrderWorkspace("Thanh toán thành công! Hóa đơn đã hoàn tất.");
                if (onOrderUpdated) onOrderUpdated();
              }}
            />
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span>
              Mã đơn: <strong>{order?.orderCode}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      <AddServiceModal
        isOpen={isAddServiceOpen}
        onClose={() => setIsAddServiceOpen(false)}
        services={services}
        stylists={stylists}
        onAddService={(payload) => {
          addServiceMutation.mutate(payload, {
            onSuccess: () => setIsAddServiceOpen(false),
          });
        }}
        isPending={addServiceMutation.isPending}
      />

      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        products={products}
        onAddProduct={(payload) => {
          addProductMutation.mutate(payload, {
            onSuccess: () => setIsAddProductOpen(false),
          });
        }}
        isPending={addProductMutation.isPending}
      />
    </div>
  );
}
