import React, { useState } from "react";
import {
  Sparkles,
  AlertCircle,
  Scissors,
  CheckCircle2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/useAuth";
import { useBranch } from "../branch/useBranch";
import { StylistAvailabilityStrip } from "./StylistAvailabilityStrip";
import { KanbanBoard } from "./KanbanBoard";
import { TimelineBoard } from "./TimelineBoard";
import { WalkInModal } from "./WalkInModal";
import { PosOrderDrawer } from "./PosOrderDrawer";
import { CommissionLedgerModal } from "./CommissionLedgerModal";
import { StylistDailyWorklogModal } from "./StylistDailyWorklogModal";
import { DispatchBoardHeader } from "./components/DispatchBoardHeader";
import { toLocalDateISO, shiftLocalDateISO } from "../../lib/utils";
import { useDispatchBoard, useCheckInBooking } from "./usePosQueries";
import { QUERY_KEYS } from "../../lib/queryKeys";

export function DispatchBoardPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { selectedBranchId, selectedBranch, branches, setSelectedBranchId, canSwitchBranch } =
    useBranch();

  const [selectedDate, setSelectedDate] = useState(() => toLocalDateISO());
  const [viewMode, setViewMode] = useState("kanban"); // 'kanban' | 'timeline'
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [isCommissionLedgerOpen, setIsCommissionLedgerOpen] = useState(false);
  const [isStylistWorklogOpen, setIsStylistWorklogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [checkingInBookingId, setCheckingInBookingId] = useState(null);

  const handlePrevDay = () => setSelectedDate((prev) => shiftLocalDateISO(prev, -1));
  const handleNextDay = () => setSelectedDate((prev) => shiftLocalDateISO(prev, 1));
  const handleToday = () => setSelectedDate(toLocalDateISO());

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const {
    data: boardData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useDispatchBoard(selectedBranchId, selectedDate);

  const checkInMutation = useCheckInBooking({
    branchId: selectedBranchId,
    date: selectedDate,
    onSuccess: (data) => {
      showToast(`Check-in thành công! Đơn hàng ${data.orderCode} đã được khởi tạo.`);
      setSelectedOrder(data);
    },
    onError: (err) => {
      showToast(err?.response?.data?.message || "Check-in thất bại. Vui lòng thử lại!", "error");
    },
    onSettled: () => setCheckingInBookingId(null),
  });

  const stylists = boardData?.stylists || [];
  const upcomingBookings = boardData?.upcomingBookings || [];
  const checkedInOrders = boardData?.checkedInOrders || [];
  const inProgressOrders = boardData?.inProgressOrders || [];
  const readyOrPaidOrders = boardData?.readyOrPaidOrders || [];
  const services = boardData?.services || [];
  const products = boardData?.products || [];

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-lg animate-in fade-in duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toastMessage.message}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs hover:opacity-75 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      <DispatchBoardHeader
        branchContext={{
          canSwitch: canSwitchBranch,
          branches,
          selectedId: selectedBranchId,
          onChange: setSelectedBranchId,
          current: selectedBranch,
        }}
        dateControl={{
          date: selectedDate,
          onChange: setSelectedDate,
          onPrev: handlePrevDay,
          onNext: handleNextDay,
          onToday: handleToday,
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        actions={{
          onRefresh: refetch,
          isRefreshing,
          onOpenCommissionLedger: () => setIsCommissionLedgerOpen(true),
          onOpenStylistWorklog: () => setIsStylistWorklogOpen(true),
          onOpenWalkIn: () => setIsWalkInOpen(true),
        }}
      />

      <StylistAvailabilityStrip stylists={stylists} />

      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold">Đang tải dữ liệu điều phối thời gian thực...</p>
        </div>
      ) : isError ? (
        <div className="p-8 text-center bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-400" />
          <p className="font-bold">Không thể tải dữ liệu điều phối chi nhánh.</p>
          <p className="mt-1 text-rose-400/80">{error?.message || "Lỗi máy chủ hoặc mất mạng."}</p>
        </div>
      ) : viewMode === "kanban" ? (
        <KanbanBoard
          upcomingBookings={upcomingBookings}
          checkedInOrders={checkedInOrders}
          inProgressOrders={inProgressOrders}
          readyOrPaidOrders={readyOrPaidOrders}
          onSelectOrder={(order) => setSelectedOrder(order)}
          onCheckInBooking={(bookingId) => checkInMutation.mutate(bookingId)}
          isCheckingInId={checkingInBookingId}
        />
      ) : (
        <TimelineBoard
          stylists={stylists}
          upcomingBookings={upcomingBookings}
          checkedInOrders={checkedInOrders}
          inProgressOrders={inProgressOrders}
          readyOrPaidOrders={readyOrPaidOrders}
          onSelectOrder={(order) => setSelectedOrder(order)}
          onCheckInBooking={(bookingId) => checkInMutation.mutate(bookingId)}
          isCheckingInId={checkingInBookingId}
        />
      )}

      <WalkInModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        branchId={selectedBranchId}
        services={services}
        stylists={stylists}
        products={products}
        onSuccess={(createdOrder) => {
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.posBoard(selectedBranchId, selectedDate),
          });
          showToast(`Đã mở đơn khách vãng lai: ${createdOrder.orderCode}`);
          setSelectedOrder(createdOrder);
        }}
      />

      <PosOrderDrawer
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        orderId={selectedOrder?.id}
        branchId={selectedBranchId}
        stylists={stylists}
        services={services}
        products={products}
        onOrderUpdated={() => {
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.posBoard(selectedBranchId, selectedDate),
          });
        }}
      />

      <CommissionLedgerModal
        isOpen={isCommissionLedgerOpen}
        onClose={() => setIsCommissionLedgerOpen(false)}
        branchId={selectedBranchId}
        stylists={stylists}
      />

      <StylistDailyWorklogModal
        isOpen={isStylistWorklogOpen}
        onClose={() => setIsStylistWorklogOpen(false)}
        branchId={selectedBranchId}
        currentUserId={user?.id}
        userRoles={user?.roles || []}
        stylists={stylists}
        services={services}
        onOrderCompleted={(order) => {
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.posBoard(selectedBranchId, selectedDate),
          });
          showToast(`Đã hoàn thành đơn hàng ${order.orderCode}`);
          setSelectedOrder(order);
        }}
      />
    </div>
  );
}
