import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  CalendarCheck,
  Clock,
  MapPin,
  User,
  Phone,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Scissors,
  Check,
  ChevronRight,
  Eye,
  Zap,
  Printer,
  Sparkles,
  ArrowRight,
  UserCheck,
  Play,
  RotateCcw,
  Ban,
  Loader2,
  X,
} from "lucide-react";
import { axiosClient } from "../../api/axiosClient";
import { useAdminBookings, useUpdateBookingStatus, useSimulateDepositWebhook } from "./useBooking";
import { formatCurrency, formatDate } from "../../lib/utils";
import { ConfirmedBookingView } from "./components/ConfirmedBookingView";

const STATUS_CONFIG = {
  ALL: { label: "Tất cả trạng thái", color: "text-slate-600 bg-slate-100" },
  PENDING_PAYMENT: { label: "Chờ cọc 20%", color: "text-amber-800 bg-amber-50 border-amber-200" },
  CONFIRMED: { label: "Đã xác nhận", color: "text-emerald-800 bg-emerald-50 border-emerald-200" },
  CHECKED_IN: { label: "Đã check-in", color: "text-indigo-800 bg-indigo-50 border-indigo-200" },
  IN_PROGRESS: { label: "Đang phục vụ", color: "text-blue-800 bg-blue-50 border-blue-200" },
  COMPLETED: { label: "Hoàn thành", color: "text-slate-700 bg-slate-100 border-slate-200" },
  CANCELLED: { label: "Đã hủy", color: "text-rose-800 bg-rose-50 border-rose-200" },
  EXPIRED: { label: "Hết hạn giữ", color: "text-slate-500 bg-slate-50 border-slate-200" },
  NO_SHOW: { label: "Vắng mặt", color: "text-red-700 bg-red-50 border-red-200" },
};

export function AdminBookingsPage() {
  // Filter state
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [detailBooking, setDetailBooking] = useState(null);
  const [statusModalBooking, setStatusModalBooking] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  // Load branches for filter
  const { data: branches = [] } = useQuery({
    queryKey: ["branches", "all"],
    queryFn: async () => {
      const res = await axiosClient.get("/branches");
      const list = res?.result || res?.data || [];
      return list.filter((b) => !b.isDeleted);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Query params
  const filters = useMemo(() => {
    const f = {};
    if (selectedBranchId) f.branchId = selectedBranchId;
    if (selectedStatus) f.status = selectedStatus;
    if (selectedDate) f.date = selectedDate;
    if (searchQuery.trim()) f.search = searchQuery.trim();
    return f;
  }, [selectedBranchId, selectedStatus, selectedDate, searchQuery]);

  // Load bookings
  const {
    data: bookings = [],
    isLoading,
    isRefetching,
    refetch,
  } = useAdminBookings(filters);

  // Mutations
  const updateStatusMutation = useUpdateBookingStatus();
  const simulateMutation = useSimulateDepositWebhook();

  // Metrics calculation
  const metrics = useMemo(() => {
    let pending = 0;
    let confirmed = 0;
    let inProgress = 0;
    let completed = 0;
    let cancelledOrExpired = 0;

    bookings.forEach((b) => {
      if (b.status === "PENDING_PAYMENT") pending++;
      else if (b.status === "CONFIRMED") confirmed++;
      else if (b.status === "CHECKED_IN" || b.status === "IN_PROGRESS") inProgress++;
      else if (b.status === "COMPLETED") completed++;
      else if (b.status === "CANCELLED" || b.status === "EXPIRED" || b.status === "NO_SHOW")
        cancelledOrExpired++;
    });

    return {
      total: bookings.length,
      pending,
      confirmed,
      inProgress,
      completed,
      cancelledOrExpired,
    };
  }, [bookings]);

  // Fast quick-update actions
  const handleQuickStatusUpdate = async (booking, targetStatus) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: booking.id,
        statusData: { status: targetStatus, notes: `Chuyển trạng thái sang ${targetStatus}` },
      });
      showToast(`Đã chuyển lịch hẹn ${booking.bookingCode} sang ${STATUS_CONFIG[targetStatus]?.label || targetStatus}`);
      refetch();
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || "Cập nhật trạng thái thất bại", "error");
    }
  };

  // Submit modal status update
  const handleConfirmStatusModal = async (e) => {
    e.preventDefault();
    if (!statusModalBooking || !newStatus) return;

    try {
      await updateStatusMutation.mutateAsync({
        id: statusModalBooking.id,
        statusData: { status: newStatus, notes: statusNote || undefined },
      });
      showToast(`Đã cập nhật lịch hẹn ${statusModalBooking.bookingCode} thành công`);
      setStatusModalBooking(null);
      setNewStatus("");
      setStatusNote("");
      refetch();
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || "Không thể chuyển sang trạng thái này", "error");
    }
  };

  // Simulate PayOS deposit
  const handleSimulateDeposit = async (bookingCode) => {
    try {
      await simulateMutation.mutateAsync(bookingCode);
      showToast(`Đã giả lập thanh toán PayOS thành công cho ${bookingCode}!`);
      refetch();
    } catch (err) {
      showToast(err?.response?.data?.message || "Giả lập thất bại", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-3 ${
            toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-pink-100 text-pink-700">
              <CalendarCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Quản Lý Lịch Hẹn & Điều Phối
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi trạng thái giữ chỗ Redis, xác nhận cọc VietQR PayOS và tiếp đón khách hàng theo thời gian thực.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-pink-300 hover:text-pink-600 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin text-pink-600" : ""}`} />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Tổng lịch hẹn</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.total}</div>
          <div className="text-xs text-slate-400 mt-0.5">Trong bộ lọc hiện tại</div>
        </div>

        {/* Pending Deposit */}
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 shadow-2xs">
          <div className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Giữ chỗ 5 phút</span>
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">{metrics.pending}</div>
          <div className="text-xs text-amber-600 mt-0.5">Chờ thanh toán cọc 20%</div>
        </div>

        {/* Confirmed */}
        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 shadow-2xs">
          <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Đã cọc & Xác nhận</span>
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{metrics.confirmed}</div>
          <div className="text-xs text-emerald-600 mt-0.5">Sẵn sàng tiếp đón</div>
        </div>

        {/* In Progress */}
        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 shadow-2xs">
          <div className="text-xs font-semibold text-indigo-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Đang phục vụ / Check-in</span>
          </div>
          <div className="text-2xl font-black text-indigo-900 mt-1">{metrics.inProgress}</div>
          <div className="text-xs text-indigo-600 mt-0.5">Tại salon hiện tại</div>
        </div>

        {/* Completed */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Hoàn thành / Kết thúc</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.completed}</div>
          <div className="text-xs text-slate-400 mt-0.5">Đã thu đủ 100%</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Branch */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Chi nhánh</label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 bg-white"
            >
              <option value="">Tất cả chi nhánh</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Trạng thái</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 bg-white"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_CONFIG)
                .filter(([k]) => k !== "ALL")
                .map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Ngày hẹn</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 bg-white"
            >
            </input>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Tìm kiếm</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Mã BK-..., SĐT, tên khách..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Clear Filter */}
        {(selectedBranchId || selectedStatus || selectedDate || searchQuery) && (
          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={() => {
                setSelectedBranchId("");
                setSelectedStatus("");
                setSelectedDate("");
                setSearchQuery("");
              }}
              className="text-xs font-bold text-pink-600 hover:text-pink-700 cursor-pointer flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Xóa bộ lọc</span>
            </button>
          </div>
        )}
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-pink-600 mx-auto" />
            <p className="text-xs text-slate-500">Đang tải danh sách lịch hẹn...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Không có lịch hẹn nào phù hợp</p>
            <p className="text-xs text-slate-400">Thử thay đổi bộ lọc chi nhánh hoặc ngày hẹn để tìm kiếm.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs">
                  <th className="py-3 px-4 font-bold">Mã & Giờ hẹn</th>
                  <th className="py-3 px-4 font-bold">Khách hàng</th>
                  <th className="py-3 px-4 font-bold">Chi nhánh & Stylist</th>
                  <th className="py-3 px-4 font-bold">Dịch vụ</th>
                  <th className="py-3 px-4 font-bold">Chi phí & Cọc</th>
                  <th className="py-3 px-4 font-bold">Trạng thái</th>
                  <th className="py-3 px-4 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => {
                  const statusCfg = STATUS_CONFIG[b.status] || {
                    label: b.status,
                    color: "text-slate-700 bg-slate-100 border-slate-200",
                  };

                  return (
                    <tr key={b.id} className="hover:bg-pink-50/20 transition-colors">
                      {/* Code & Time */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{b.bookingCode}</span>
                        <span className="text-xs font-semibold text-pink-700 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(b.bookingTime)}</span>
                        </span>
                        <span className="text-xs text-slate-400 block mt-0.5">
                          Thời lượng: {b.totalDurationMinutes} phút
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{b.customerName}</div>
                        <div className="text-slate-500 font-mono text-xs flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{b.customerPhone}</span>
                        </div>
                      </td>

                      {/* Branch & Stylist */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-pink-500 shrink-0" />
                          <span className="truncate max-w-[150px]">{b.branchName}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Scissors className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{b.staffName || "Tự động phân bổ"}</span>
                        </div>
                      </td>

                      {/* Services */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {b.items?.map((item) => (
                            <span
                              key={item.id}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-xs"
                            >
                              {item.serviceName}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Financials */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{formatCurrency(b.totalPrice)}</div>
                        <div className="mt-0.5 flex items-center gap-1">
                          <span
                            className={`px-1.5 py-0.2 rounded text-xs font-bold ${
                              b.depositStatus === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : b.depositStatus === "REFUNDED"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {b.depositStatus === "PAID" ? "Đã cọc 20%" : "Chưa cọc"}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            {formatCurrency(b.depositAmount)}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-xs border inline-flex items-center gap-1 ${statusCfg.color}`}
                        >
                          {statusCfg.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Sandbox simulation button if pending */}
                          {b.status === "PENDING_PAYMENT" && (
                            <button
                              type="button"
                              onClick={() => handleSimulateDeposit(b.bookingCode)}
                              disabled={simulateMutation.isPending}
                              aria-label="Giả lập thanh toán cọc PayOS"
                              title="Giả lập thanh toán cọc PayOS"
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 cursor-pointer transition-colors"
                            >
                              <Zap className="w-3.5 h-3.5 fill-amber-600" />
                            </button>
                          )}

                          {/* Quick transition: CONFIRMED -> CHECKED_IN */}
                          {b.status === "CONFIRMED" && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusUpdate(b, "CHECKED_IN")}
                              disabled={updateStatusMutation.isPending}
                              title="Check-in khách đến salon"
                              className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Check-in</span>
                            </button>
                          )}

                          {/* Quick transition: CHECKED_IN -> IN_PROGRESS */}
                          {b.status === "CHECKED_IN" && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusUpdate(b, "IN_PROGRESS")}
                              disabled={updateStatusMutation.isPending}
                              title="Bắt đầu phục vụ"
                              className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Play className="w-3 h-3" />
                              <span>Bắt đầu</span>
                            </button>
                          )}

                          {/* Quick transition: IN_PROGRESS -> COMPLETED */}
                          {b.status === "IN_PROGRESS" && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusUpdate(b, "COMPLETED")}
                              disabled={updateStatusMutation.isPending}
                              title="Hoàn thành dịch vụ"
                              className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Check className="w-3 h-3" />
                              <span>Xong</span>
                            </button>
                          )}

                          {/* Open status edit modal for more options */}
                          <button
                            type="button"
                            onClick={() => {
                              setStatusModalBooking(b);
                              setNewStatus(b.status);
                              setStatusNote(b.notes || "");
                            }}
                            aria-label="Đổi trạng thái chi tiết"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors"
                            title="Đổi trạng thái chi tiết"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {/* View details & Ticket */}
                          <button
                            type="button"
                            onClick={() => setDetailBooking(b)}
                            aria-label="Xem chi tiết & In phiếu xác nhận"
                            className="p-1.5 rounded-lg text-pink-600 hover:text-pink-700 hover:bg-pink-50 cursor-pointer transition-colors"
                            title="Xem chi tiết & In phiếu xác nhận"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Booking Detail & Confirmation Card Modal */}
      {detailBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Chi tiết phiếu xác nhận đặt hẹn</h3>
                <p className="text-xs text-slate-500">Mã lịch hẹn: {detailBooking.bookingCode}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailBooking(null)}
                aria-label="Đóng cửa sổ chi tiết"
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Render confirmed booking card layout */}
            <ConfirmedBookingView
              booking={detailBooking}
              onNewBooking={() => setDetailBooking(null)}
            />
          </div>
        </div>
      )}

      {/* Modal 2: Change Status Modal */}
      {statusModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Cập nhật trạng thái</h3>
                <p className="text-xs text-slate-500">Mã: {statusModalBooking.bookingCode}</p>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalBooking(null)}
                aria-label="Đóng cửa sổ cập nhật trạng thái"
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmStatusModal} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Trạng thái mới</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-pink-500 font-semibold text-slate-800 bg-white"
                >
                  <option value="CONFIRMED">Đã xác nhận cọc (CONFIRMED)</option>
                  <option value="CHECKED_IN">Đã check-in tại quầy (CHECKED_IN)</option>
                  <option value="IN_PROGRESS">Đang phục vụ làm tóc (IN_PROGRESS)</option>
                  <option value="COMPLETED">Hoàn thành dịch vụ (COMPLETED)</option>
                  <option value="NO_SHOW">Khách vắng mặt (NO_SHOW)</option>
                  <option value="CANCELLED">Hủy lịch hẹn (CANCELLED)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi chú điều phối</label>
                <textarea
                  rows={3}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Lý do hủy, ghi chú kỹ thuật viên, hoặc thông tin phục vụ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-pink-500 bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStatusModalBooking(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                  className="px-5 py-2 rounded-xl font-bold bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Lưu cập nhật</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
