import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Scissors,
  ShoppingBag,
  Plus,
  Trash2,
  User,
  Check,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Percent,
  Loader2,
  Coins,
  FileText,
  Camera,
  CreditCard,
  Save,
} from "lucide-react";
import { posApi } from "../../api/posApi";
import { formatCurrency } from "../../lib/utils";
import { VisualLogTab } from "./VisualLogTab";

export function PosOrderDrawer({
  isOpen,
  onClose,
  orderId,
  branchId,
  stylists = [],
  services = [],
  products = [],
}) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("cart"); // 'cart' | 'visuallog' | 'checkout'

  // Discount & notes local draft state
  const [discountInput, setDiscountInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [isEditingFinancials, setIsEditingFinancials] = useState(false);

  // Modals for adding items
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [selectedAddServiceId, setSelectedAddServiceId] = useState("");
  const [selectedAddStaffId, setSelectedAddStaffId] = useState("");
  const [selectedAddProductId, setSelectedAddProductId] = useState("");
  const [addProductQty, setAddProductQty] = useState(1);

  // Feedback toast
  const [actionNotice, setActionNotice] = useState(null);

  // 1. Fetch live order details
  const {
    data: order,
    isLoading: isLoadingOrder,
    refetch: refetchOrder,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => posApi.getOrderById(orderId),
    enabled: !!orderId && isOpen,
  });

  // Sync order state into form drafts
  useEffect(() => {
    if (order) {
      setDiscountInput(order.discountAmount ? order.discountAmount.toString() : "0");
      setNotesInput(order.notes || "");
    }
  }, [order]);

  // Invalidate queries and broadcast feedback
  const invalidateAll = (msg) => {
    queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    queryClient.invalidateQueries({ queryKey: ["dispatch"] });
    if (msg) {
      setActionNotice({ type: "success", text: msg });
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  // 2. Mutations
  const addServiceMutation = useMutation({
    mutationFn: (data) => posApi.addServiceItem(orderId, data),
    onSuccess: () => {
      setIsAddServiceOpen(false);
      setSelectedAddServiceId("");
      invalidateAll("Đã thêm dịch vụ vào đơn hàng thành công!");
    },
    onError: (err) => {
      setActionNotice({
        type: "error",
        text: err?.response?.data?.message || "Không thể thêm dịch vụ.",
      });
    },
  });

  const addProductMutation = useMutation({
    mutationFn: (data) => posApi.addProductItem(orderId, data),
    onSuccess: () => {
      setIsAddProductOpen(false);
      setSelectedAddProductId("");
      setAddProductQty(1);
      invalidateAll("Đã thêm sản phẩm bán lẻ vào đơn hàng!");
    },
    onError: (err) => {
      setActionNotice({
        type: "error",
        text: err?.response?.data?.message || "Không thể thêm sản phẩm.",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId) => posApi.removeOrderItem(orderId, itemId),
    onSuccess: () => {
      invalidateAll("Đã xóa mục hàng khỏi đơn!");
    },
    onError: (err) => {
      setActionNotice({
        type: "error",
        text: err?.response?.data?.message || "Không thể xóa mục hàng.",
      });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: (data) => posApi.updateOrder(orderId, data),
    onSuccess: () => {
      setIsEditingFinancials(false);
      invalidateAll("Cập nhật giảm giá và ghi chú thành công!");
    },
    onError: (err) => {
      setActionNotice({
        type: "error",
        text: err?.response?.data?.message || "Không thể cập nhật đơn.",
      });
    },
  });

  const updateStepAssignmentMutation = useMutation({
    mutationFn: ({ stepId, data }) => posApi.updateStepAssignment(orderId, stepId, data),
    onSuccess: () => {
      invalidateAll("Đã cập nhật phân công và tính lại hoa hồng!");
    },
    onError: (err) => {
      setActionNotice({
        type: "error",
        text: err?.response?.data?.message || "Không thể cập nhật phân công bước.",
      });
    },
  });

  const updateStepStatusMutation = useMutation({
    mutationFn: ({ stepId, data }) => posApi.updateStepStatus(orderId, stepId, data),
    onSuccess: () => {
      invalidateAll("Đã cập nhật tiến độ bước kỹ thuật!");
    },
    onError: (err) => {
      setActionNotice({
        type: "error",
        text: err?.response?.data?.message || "Không thể cập nhật trạng thái bước.",
      });
    },
  });

  if (!isOpen) return null;

  const isOrderSettled = order?.status === "PAID" || order?.status === "CANCELLED";

  // Calculate overall steps progress
  const allSteps = order?.items?.flatMap((i) => i.steps || []) || [];
  const completedSteps = allSteps.filter((s) => s.status === "COMPLETED").length;
  const inProgressSteps = allSteps.filter((s) => s.status === "IN_PROGRESS").length;
  const totalSteps = allSteps.length;
  const isAllStepsCompleted = totalSteps > 0 && completedSteps === totalSteps;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-order-title"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                id="drawer-order-title"
                className="font-mono text-base sm:text-lg font-bold text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-lg border border-pink-500/20"
              >
                {order?.orderCode || "..."}
              </span>
              {order?.bookingCode && (
                <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  Lịch hẹn: {order.bookingCode}
                </span>
              )}
              {/* Order Status Badge */}
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  order?.status === "PAID"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : order?.status === "READY_FOR_CHECKOUT"
                    ? "bg-teal-500/10 border-teal-500/30 text-teal-300 animate-pulse"
                    : order?.status === "IN_PROGRESS"
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-slate-700/40 border-slate-600 text-slate-300"
                }`}
              >
                {order?.status === "PAID"
                  ? "Đã thanh toán"
                  : order?.status === "READY_FOR_CHECKOUT"
                  ? "Chờ thanh toán"
                  : order?.status === "IN_PROGRESS"
                  ? "Đang phục vụ"
                  : "Đã check-in"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-white">{order?.customerName}</span>
              {order?.customerPhone && order?.customerPhone !== "0000000000" && (
                <>
                  <span>•</span>
                  <span className="font-mono">{order.customerPhone}</span>
                </>
              )}
              {order?.branchName && (
                <>
                  <span>•</span>
                  <span className="text-slate-400">{order.branchName}</span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Đóng bảng đơn hàng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Notice Toast */}
        {actionNotice && (
          <div
            className={`mx-4 mt-3 p-3 rounded-xl border flex items-center justify-between text-xs animate-in fade-in ${
              actionNotice.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionNotice.text}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              className="text-xs hover:opacity-75"
              aria-label="Đóng thông báo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Ready for checkout alert banner */}
        {order?.status === "READY_FOR_CHECKOUT" && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-teal-400" />
              <span>
                <strong>Hoàn thành toàn bộ công đoạn!</strong> Đơn đã tự động chuyển sang trạng thái sẵn sàng thanh toán.
              </span>
            </div>
          </div>
        )}

        {/* Step Progress Mini-Bar in Header */}
        {totalSteps > 0 && (
          <div className="px-4 py-2 bg-slate-850/60 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-pink-400" />
              <span className="text-slate-300 font-medium">Tiến độ quy trình:</span>
              <span className="font-mono text-pink-400 font-bold">
                {completedSteps}/{totalSteps} bước ({Math.round((completedSteps / totalSteps) * 100)}%)
              </span>
            </div>
            <div className="w-36 h-2 bg-slate-700 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 transition-all duration-300"
                style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
              />
              <div
                className="bg-amber-400 transition-all duration-300"
                style={{ width: `${(inProgressSteps / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900 px-4 pt-1 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("cart")}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "cart"
                ? "border-pink-500 text-pink-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>1. Dịch vụ & Chia công đoạn</span>
            {order?.items?.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                {order.items.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("visuallog")}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "visuallog"
                ? "border-pink-500 text-pink-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>2. Visual Log (BOM & Ảnh)</span>
          </button>

          <button
            onClick={() => setActiveTab("checkout")}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "checkout"
                ? "border-pink-500 text-pink-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>3. Thanh toán</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {isLoadingOrder ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
              <p className="text-sm">Đang tải thông tin đơn hàng...</p>
            </div>
          ) : activeTab === "cart" ? (
            /* ==========================================
               TAB 1: DỊCH VỤ, SẢN PHẨM & CHIA CÔNG ĐOẠN
               ========================================== */
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
                      onClick={() => setIsAddServiceOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm Dịch vụ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddProductOpen(true)}
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
                  Danh mục đơn hàng ({order?.items?.length || 0})
                </h3>

                {order?.items?.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                    Đơn hàng hiện chưa có dịch vụ hay sản phẩm nào.
                  </div>
                ) : (
                  order?.items?.map((item) => (
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
                                  {formatCurrency(
                                    (item.totalPrice * item.commissionPoolRate) / 100
                                  )}
                                  )
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
                              onClick={() => removeItemMutation.mutate(item.id)}
                              disabled={removeItemMutation.isPending}
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
                            {item.steps.map((step) => {
                              const isStepInProgress = step.status === "IN_PROGRESS";
                              const isStepCompleted = step.status === "COMPLETED";

                              return (
                                <div
                                  key={step.id}
                                  className={`p-2.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
                                    isStepCompleted
                                      ? "bg-slate-900/60 border-emerald-500/20 text-slate-300"
                                      : isStepInProgress
                                      ? "bg-slate-900 border-amber-500/40 text-white shadow-amber-500/5 shadow-md"
                                      : "bg-slate-900/40 border-slate-750 text-slate-300"
                                  }`}
                                >
                                  {/* Step Name & Status */}
                                  <div className="flex items-center gap-2 min-w-[140px]">
                                    <span
                                      className={`w-2 h-2 rounded-full shrink-0 ${
                                        isStepCompleted
                                          ? "bg-emerald-400"
                                          : isStepInProgress
                                          ? "bg-amber-400 animate-pulse"
                                          : "bg-slate-600"
                                      }`}
                                    />
                                    <span className="font-semibold text-slate-200">
                                      {step.stepName}
                                    </span>
                                  </div>

                                  {/* Staff Selector */}
                                  <div className="flex items-center gap-1.5 flex-1 max-w-xs">
                                    <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                    <select
                                      disabled={isOrderSettled}
                                      value={step.staffId || ""}
                                      aria-label={`Chỉ định nhân sự cho bước ${step.stepName}`}
                                      onChange={(e) => {
                                        const newStaffId = e.target.value ? Number(e.target.value) : null;
                                        if (newStaffId && newStaffId !== step.staffId) {
                                          updateStepAssignmentMutation.mutate({
                                            stepId: step.id,
                                            data: { staffId: newStaffId, commissionRate: step.commissionRate },
                                          });
                                        }
                                      }}
                                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-pink-500 cursor-pointer disabled:opacity-50"
                                    >
                                      <option value="">-- Chọn Stylist/Thợ --</option>
                                      {stylists.map((st) => (
                                        <option key={st.stylistId || st.id} value={st.stylistId || st.id}>
                                          {st.fullName || st.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Commission % Input & Live VND Preview */}
                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="5"
                                        disabled={isOrderSettled}
                                        defaultValue={step.commissionRate}
                                        aria-label={`Tỷ lệ hoa hồng cho bước ${step.stepName}`}
                                        onBlur={(e) => {
                                          const newRate = Number(e.target.value);
                                          if (!isNaN(newRate) && newRate !== step.commissionRate) {
                                            updateStepAssignmentMutation.mutate({
                                              stepId: step.id,
                                              data: {
                                                staffId: step.staffId,
                                                commissionRate: newRate,
                                              },
                                            });
                                          }
                                        }}
                                        className="w-12 text-center bg-transparent text-xs font-mono font-bold text-pink-400 focus:outline-none"
                                      />
                                      <span className="text-[11px] text-slate-400 font-semibold">%</span>
                                    </div>

                                    {/* Preview VND */}
                                    <div className="text-right min-w-[70px]">
                                      <span className="font-mono font-bold text-emerald-400 text-xs block">
                                        {formatCurrency(step.commissionAmount)}
                                      </span>
                                    </div>

                                    {/* Step Status Action Button */}
                                    {!isOrderSettled && (
                                      <div className="shrink-0">
                                        {step.status === "PENDING" && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              updateStepStatusMutation.mutate({
                                                stepId: step.id,
                                                data: { status: "IN_PROGRESS" },
                                              })
                                            }
                                            disabled={updateStepStatusMutation.isPending}
                                            className="px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                                            title="Bắt đầu thực hiện bước này"
                                          >
                                            <Play className="w-3 h-3 fill-current" />
                                            <span>Bắt đầu</span>
                                          </button>
                                        )}

                                        {step.status === "IN_PROGRESS" && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              updateStepStatusMutation.mutate({
                                                stepId: step.id,
                                                data: { status: "COMPLETED" },
                                              })
                                            }
                                            disabled={updateStepStatusMutation.isPending}
                                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                                            title="Đánh dấu hoàn thành bước này"
                                          >
                                            <Check className="w-3 h-3" />
                                            <span>Hoàn thành</span>
                                          </button>
                                        )}

                                        {step.status === "COMPLETED" && (
                                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                            <CheckCircle2 className="w-3 h-3" />
                                            <span>Đã xong</span>
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Order Financials & Adjustments Section */}
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
                        onClick={() => {
                          const disc = parseFloat(discountInput) || 0;
                          updateOrderMutation.mutate({
                            discountAmount: disc,
                            notes: notesInput,
                          });
                        }}
                        disabled={updateOrderMutation.isPending}
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
            </div>
          ) : activeTab === "visuallog" ? (
            /* ==========================================
               TAB 2: VISUAL LOG & BOM OVERRIDES (Ticket 04)
               ========================================== */
            <VisualLogTab
              orderId={orderId}
              order={order}
              stylists={stylists}
              products={products}
              onNotice={(notice) => {
                setActionNotice(notice);
                setTimeout(() => setActionNotice(null), 4000);
              }}
            />
          ) : (
            /* ==========================================
               TAB 3: THANH TOÁN (Ticket 5 Preview)
               ========================================== */
            <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl space-y-3">
              <CreditCard className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">
                Tab 3: Thanh toán POS & Trừ tồn kho tự động
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Quy trình trừ tồn kho hóa chất (ml) + sản phẩm bán lẻ, thanh toán Tiền mặt / VietQR động / Thẻ, và chốt Sổ cái Hoa hồng thợ sẽ được hoàn thiện ở Ticket 05.
              </p>
              <div className="pt-2 text-sm font-bold font-mono text-emerald-400">
                Cần thanh toán: {formatCurrency(order?.finalAmount)}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Mã đơn: <strong>{order?.orderCode}</strong></span>
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

      {/* Modal: Thêm Dịch Vụ */}
      {isAddServiceOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-pink-400" />
                <span>Thêm Dịch Vụ vào Đơn Hàng</span>
              </h4>
              <button
                onClick={() => setIsAddServiceOpen(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Đóng cửa sổ thêm dịch vụ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Chọn Dịch vụ</label>
                <select
                  value={selectedAddServiceId}
                  onChange={(e) => setSelectedAddServiceId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="">-- Chọn dịch vụ từ danh mục --</option>
                  {services.map((svc) => (
                    <option key={svc.id} value={svc.id}>
                      {svc.name} - {formatCurrency(svc.basePrice)} ({svc.durationMinutes} phút)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Chỉ định Stylist thực hiện (mặc định cho các bước)
                </label>
                <select
                  value={selectedAddStaffId}
                  onChange={(e) => setSelectedAddStaffId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="">-- Stylist phụ trách chính --</option>
                  {stylists.map((st) => (
                    <option key={st.stylistId || st.id} value={st.stylistId || st.id}>
                      {st.fullName || st.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddServiceOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!selectedAddServiceId || addServiceMutation.isPending}
                onClick={() => {
                  addServiceMutation.mutate({
                    serviceId: Number(selectedAddServiceId),
                    staffId: selectedAddStaffId ? Number(selectedAddStaffId) : undefined,
                  });
                }}
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {addServiceMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Thêm Dịch Vụ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Thêm Sản Phẩm Bán Lẻ */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-purple-400" />
                <span>Thêm Sản Phẩm Bán Lẻ</span>
              </h4>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Đóng cửa sổ thêm sản phẩm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Chọn Sản phẩm</label>
                <select
                  value={selectedAddProductId}
                  onChange={(e) => setSelectedAddProductId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="">-- Chọn sản phẩm bán lẻ --</option>
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} ({prod.sku}) - {formatCurrency(prod.retailPrice)} / {prod.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Số lượng bán</label>
                <input
                  type="number"
                  min="1"
                  value={addProductQty}
                  onChange={(e) => setAddProductQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!selectedAddProductId || addProductMutation.isPending}
                onClick={() => {
                  addProductMutation.mutate({
                    productId: Number(selectedAddProductId),
                    quantity: addProductQty,
                  });
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {addProductMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Thêm Sản Phẩm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
