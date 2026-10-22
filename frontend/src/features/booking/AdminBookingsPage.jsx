import React, { useState } from "react";
import {
  CalendarDays,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCw,
} from "lucide-react";
import {
  useAdminBookings,
  useUpdateBookingStatus,
  useSimulateDepositWebhook,
  useActiveBranches,
} from "./useBooking";
import { STATUS_CONFIG } from "./booking.constants";
import { AdminBookingsFilterBar } from "./components/AdminBookingsFilterBar";
import { AdminBookingsTable } from "./components/AdminBookingsTable";
import { AdminBookingDetailModal } from "./components/AdminBookingDetailModal";
import { AdminBookingStatusModal } from "./components/AdminBookingStatusModal";

export function AdminBookingsPage() {
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [detailBooking, setDetailBooking] = useState(null);
  const [statusModalBooking, setStatusModalBooking] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  const { data: branches = [] } = useActiveBranches();

  const {
    data: bookings = [],
    isLoading,
    refetch,
    isRefetching,
  } = useAdminBookings({
    branchId: selectedBranchId || undefined,
    status: selectedStatus || undefined,
    date: selectedDate || undefined,
    search: searchQuery.trim() || undefined,
  });

  const updateStatusMutation = useUpdateBookingStatus();
  const simulateMutation = useSimulateDepositWebhook();

  const handleSimulateDeposit = async (bookingCode) => {
    try {
      await simulateMutation.mutateAsync(bookingCode);
      showToast(`Giả lập nộp cọc PayOS thành công cho đơn ${bookingCode}!`, "success");
      refetch();
    } catch (err) {
      showToast(err?.message || "Giả lập nộp cọc thất bại", "error");
    }
  };

  const handleQuickStatusUpdate = async (booking, targetStatus) => {
    try {
      await updateStatusMutation.mutateAsync({
        bookingId: booking.id,
        status: targetStatus,
        notes: `Cập nhật nhanh sang ${targetStatus}`,
      });
      showToast(`Đã chuyển lịch hẹn ${booking.bookingCode} sang ${targetStatus}`);
      refetch();
    } catch (err) {
      showToast(err?.message || "Lỗi khi cập nhật trạng thái", "error");
    }
  };

  const handleConfirmStatusModal = async ({ status, note }) => {
    if (!statusModalBooking || !status) return;

    try {
      await updateStatusMutation.mutateAsync({
        bookingId: statusModalBooking.id,
        status,
        notes: note?.trim() || undefined,
      });
      showToast(`Đã cập nhật trạng thái ${statusModalBooking.bookingCode} thành ${status}`);
      setStatusModalBooking(null);
      refetch();
    } catch (err) {
      showToast(err?.message || "Cập nhật trạng thái thất bại", "error");
    }
  };

  const metrics = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "PENDING_PAYMENT").length,
    confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
    inProgress: bookings.filter((b) => b.status === "IN_PROGRESS" || b.status === "CHECKED_IN")
      .length,
    completed: bookings.filter((b) => b.status === "COMPLETED").length,
  };

  const hasActiveFilters = Boolean(
    selectedBranchId || selectedStatus || selectedDate || searchQuery
  );

  const handleResetFilters = () => {
    setSelectedBranchId("");
    setSelectedStatus("");
    setSelectedDate("");
    setSearchQuery("");
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between shadow-lg text-xs font-semibold animate-in fade-in ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-xs hover:opacity-75 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Quản lý Đặt lịch Hẹn (Bookings)
              </h2>
              <p className="text-xs text-slate-500">
                Theo dõi điều phối lịch hẹn toàn hệ thống, đối soát cọc và trạng thái phục vụ
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin text-pink-600" : ""}`} />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      <AdminBookingsFilterBar
        metrics={metrics}
        branches={branches}
        selectedBranchId={selectedBranchId}
        setSelectedBranchId={setSelectedBranchId}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusConfig={STATUS_CONFIG}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      />

      <AdminBookingsTable
        isLoading={isLoading}
        bookings={bookings}
        statusConfig={STATUS_CONFIG}
        onSimulateDeposit={handleSimulateDeposit}
        isSimulating={simulateMutation.isPending}
        onQuickStatusUpdate={handleQuickStatusUpdate}
        isUpdatingStatus={updateStatusMutation.isPending}
        onOpenStatusModal={(b) => {
          setStatusModalBooking(b);
          setNewStatus(b.status);
          setStatusNote(b.notes || "");
        }}
        onOpenDetail={(b) => setDetailBooking(b)}
      />

      <AdminBookingDetailModal
        booking={detailBooking}
        onClose={() => setDetailBooking(null)}
      />

      <AdminBookingStatusModal
        booking={statusModalBooking}
        onClose={() => setStatusModalBooking(null)}
        onConfirm={handleConfirmStatusModal}
        isUpdating={updateStatusMutation.isPending}
      />
    </div>
  );
}
