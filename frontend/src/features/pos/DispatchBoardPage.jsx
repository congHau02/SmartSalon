import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutGrid,
  Calendar,
  Clock,
  Plus,
  RotateCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MapPin,
  AlertCircle,
  Scissors,
  CheckCircle2,
} from "lucide-react";
import { useBranch } from "../branch/useBranch";
import { posApi } from "../../api/posApi";
import { StylistAvailabilityStrip } from "./StylistAvailabilityStrip";
import { KanbanBoard } from "./KanbanBoard";
import { TimelineBoard } from "./TimelineBoard";
import { WalkInModal } from "./WalkInModal";
import { formatCurrency } from "../../lib/utils";

export function DispatchBoardPage() {
  const queryClient = useQueryClient();
  const { selectedBranchId, selectedBranch, branches, setSelectedBranchId, canSwitchBranch } =
    useBranch();

  // Date state (defaults to today)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // View state: 'kanban' (default) | 'timeline'
  const [viewMode, setViewMode] = useState("kanban");

  // Modal state
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Quick check-in tracking
  const [checkingInBookingId, setCheckingInBookingId] = useState(null);

  // Date navigation handlers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  // 1. Fetch Dispatch Board Data
  const {
    data: boardData,
    isLoading: isLoadingBoard,
    isRefetching,
    refetch,
    error: boardError,
  } = useQuery({
    queryKey: ["dispatch", selectedBranchId, selectedDate],
    queryFn: () => posApi.getDispatchBoard(selectedBranchId, selectedDate),
    enabled: !!selectedBranchId,
  });

  // 2. Fetch Catalog Services & Products (for Walk-in modal)
  const { data: services = [] } = useQuery({
    queryKey: ["pos", "services"],
    queryFn: posApi.getServices,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["pos", "products"],
    queryFn: posApi.getProducts,
  });

  // 3. Check-In Mutation
  const checkInMutation = useMutation({
    mutationFn: (bookingId) => {
      setCheckingInBookingId(bookingId);
      return posApi.checkInBooking(bookingId);
    },
    onSuccess: (data) => {
      setSelectedOrder(data);
      setToastMessage({
        type: "success",
        text: `Check-in thành công! Đã tạo đơn POS ${data.orderCode} cho khách ${data.customerName}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["dispatch"] });
      queryClient.invalidateQueries({ queryKey: ["booking"] });
    },
    onError: (err) => {
      setToastMessage({
        type: "error",
        text: err?.response?.data?.message || err?.message || "Không thể thực hiện check-in.",
      });
    },
    onSettled: () => {
      setCheckingInBookingId(null);
      setTimeout(() => setToastMessage(null), 5000);
    },
  });

  // 4. Walk-In Order Mutation
  const walkInMutation = useMutation({
    mutationFn: (payload) => posApi.createWalkInOrder(payload),
    onSuccess: (data) => {
      setIsWalkInOpen(false);
      setSelectedOrder(data);
      setToastMessage({
        type: "success",
        text: `Mở đơn ${data.orderCode} cho khách ${data.customerName} thành công!`,
      });
      queryClient.invalidateQueries({ queryKey: ["dispatch"] });
    },
    onError: (err) => {
      setToastMessage({
        type: "error",
        text: err?.response?.data?.message || err?.message || "Không thể tạo đơn khách vãng lai.",
      });
    },
    onSettled: () => {
      setTimeout(() => setToastMessage(null), 5000);
    },
  });

  const upcomingBookings = boardData?.upcomingBookings || [];
  const checkedInOrders = boardData?.checkedInOrders || [];
  const inProgressOrders = boardData?.inProgressOrders || [];
  const readyOrPaidOrders = boardData?.readyOrPaidOrders || [];
  const stylists = boardData?.stylists || [];

  return (
    <div className="space-y-5">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Control Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/70 shadow-sm backdrop-blur-sm">
        {/* Branch Context & Date Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Picker */}
          {canSwitchBranch ? (
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <MapPin className="w-4 h-4 text-pink-400 shrink-0" />
              <select
                value={selectedBranchId || ""}
                onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                className="bg-transparent text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-800 text-white">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-200">
              <MapPin className="w-4 h-4 text-pink-400" />
              <span>{selectedBranch?.name || "Chi nhánh hiện tại"}</span>
            </div>
          )}

          {/* Date Picker Navigation */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={handlePrevDay}
              title="Hôm trước"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-mono font-semibold text-white px-2 py-1 focus:outline-none cursor-pointer"
            />
            <button
              onClick={handleNextDay}
              title="Hôm sau"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2 py-1 text-[11px] font-semibold text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 rounded-md transition-colors cursor-pointer"
            >
              Hôm nay
            </button>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-slate-800 text-pink-400 shadow-sm border border-slate-650"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "timeline"
                  ? "bg-slate-800 text-pink-400 shadow-sm border border-slate-650"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            title="Làm mới bảng điều phối"
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${isRefetching ? "animate-spin text-pink-400" : ""}`} />
          </button>

          {/* Walk-In Order Button */}
          <button
            onClick={() => setIsWalkInOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-bold text-xs shadow-lg shadow-pink-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Khách vãng lai (Walk-in)</span>
          </button>
        </div>
      </div>

      {/* Stylist Live Availability Strip */}
      <StylistAvailabilityStrip stylists={stylists} isLoading={isLoadingBoard} />

      {/* Main Board View */}
      {isLoadingBoard ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Đang tải dữ liệu điều phối sàn...</p>
        </div>
      ) : boardError ? (
        <div className="p-8 text-center bg-slate-850 rounded-2xl border border-rose-500/30 text-rose-300">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-semibold">Không thể tải dữ liệu bảng điều phối</p>
          <p className="text-xs text-slate-400 mt-1">
            {boardError?.response?.data?.message || boardError?.message}
          </p>
        </div>
      ) : viewMode === "kanban" ? (
        <KanbanBoard
          upcomingBookings={upcomingBookings}
          checkedInOrders={checkedInOrders}
          inProgressOrders={inProgressOrders}
          readyOrPaidOrders={readyOrPaidOrders}
          onCheckInBooking={(id) => checkInMutation.mutate(id)}
          isCheckingInId={checkingInBookingId}
          onSelectOrder={(order) => setSelectedOrder(order)}
        />
      ) : (
        <TimelineBoard
          stylists={stylists}
          upcomingBookings={upcomingBookings}
          checkedInOrders={checkedInOrders}
          inProgressOrders={inProgressOrders}
          readyOrPaidOrders={readyOrPaidOrders}
          onSelectOrder={(order) => setSelectedOrder(order)}
          onCheckInBooking={(id) => checkInMutation.mutate(id)}
          isCheckingInId={checkingInBookingId}
        />
      )}

      {/* Walk-in Order Modal */}
      <WalkInModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        branchId={selectedBranchId}
        stylists={stylists}
        services={services}
        products={products}
        onSubmit={(payload) => walkInMutation.mutate(payload)}
        isSubmitting={walkInMutation.isPending}
      />

      {/* Quick Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                  {selectedOrder.orderCode}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                  {selectedOrder.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-sm font-bold text-white">{selectedOrder.customerName}</p>
              {selectedOrder.customerPhone && (
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {selectedOrder.customerPhone}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Dịch vụ & Sản phẩm
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedOrder.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-850 border border-slate-800 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-200">
                        {item.serviceName || item.productName}
                      </p>
                      {item.steps?.length > 0 && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {item.steps.map((s) => s.stepName).join(" → ")}
                        </p>
                      )}
                    </div>
                    <span className="font-mono font-bold text-slate-300">
                      {formatCurrency(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Tạm tính</span>
                <span className="font-mono">{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              {selectedOrder.depositDeducted > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Trừ tiền cọc</span>
                  <span className="font-mono">
                    -{formatCurrency(selectedOrder.depositDeducted)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white pt-1">
                <span>Tổng thanh toán</span>
                <span className="font-mono text-pink-400">
                  {formatCurrency(selectedOrder.finalAmount)}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
