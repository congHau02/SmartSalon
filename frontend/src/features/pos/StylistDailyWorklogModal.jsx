import React, { useState } from "react";
import { X, Calendar, ChevronLeft, ChevronRight, Plus, Loader2, Sparkles, User, RefreshCw } from "lucide-react";
import { toLocalDateISO, shiftLocalDateISO } from "../../lib/utils";
import { useStylistDailyWorklog, useQuickCompleteBooking } from "./useStylistWorklog";
import { StylistDailyWorklogKpis } from "./components/StylistDailyWorklogKpis";
import { StylistCompletedTicketsList } from "./components/StylistCompletedTicketsList";
import { StylistUpcomingBookingsList } from "./components/StylistUpcomingBookingsList";
import { QuickServiceTicketModal } from "./components/QuickServiceTicketModal";

export function StylistDailyWorklogModal({
  isOpen,
  onClose,
  branchId,
  currentUserId,
  userRoles = [],
  stylists = [],
  services = [],
  products = [],
  onOrderCompleted,
}) {
  const roles = userRoles.map((r) => r.replace("ROLE_", "")); // auth stores unprefixed names
  const isOnlyStylist = roles.includes("STYLIST") && !roles.includes("ADMIN") && !roles.includes("MANAGER");
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateISO());
  const [selectedStylistId, setSelectedStylistId] = useState(() => currentUserId || stylists[0]?.id || "");
  const [activeTab, setActiveTab] = useState("completed"); // "completed" | "upcoming"
  const [isQuickTicketOpen, setIsQuickTicketOpen] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [quickCompleteMethod, setQuickCompleteMethod] = useState("CASH");

  const {
    data: worklogData,
    isLoading,
    refetch,
    isRefetching,
  } = useStylistDailyWorklog({
    branchId,
    stylistId: selectedStylistId ? Number(selectedStylistId) : undefined,
    date: selectedDate,
    enabled: isOpen,
  });

  const quickCompleteMutation = useQuickCompleteBooking({
    onSuccess: (data) => {
      setCompletingId(null);
      refetch();
      onOrderCompleted?.(data);
    },
    onError: () => {
      setCompletingId(null);
    },
  });

  if (!isOpen) return null;

  const handlePrevDay = () => setSelectedDate((prev) => shiftLocalDateISO(prev, -1));
  const handleNextDay = () => setSelectedDate((prev) => shiftLocalDateISO(prev, 1));
  const handleToday = () => setSelectedDate(toLocalDateISO());

  const handleQuickComplete = (booking) => {
    setCompletingId(booking.id);
    quickCompleteMutation.mutate({
      bookingId: booking.id,
      data: { paymentMethod: quickCompleteMethod },
    });
  };

  const tickets = worklogData?.tickets || [];
  const upcomingBookings = worklogData?.upcomingBookings || [];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Modal Header */}
          <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-400 text-white flex items-center justify-center shadow-md shadow-pink-900/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Phiếu cắt & Tổng kết ngày</span>
                  {worklogData?.stylistName && (
                    <span className="text-xs font-normal text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                      {worklogData.stylistName}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">
                  Theo dõi năng suất làm việc, hoa hồng và đối soát tiền thu hộ ca trực
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                disabled={isRefetching}
                title="Làm mới"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin text-pink-400" : ""}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Controls Bar: Date navigation & Stylist selector */}
          <div className="p-3 bg-slate-850 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Date navigation */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={handlePrevDay}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs font-mono font-semibold text-white px-2 focus:outline-none cursor-pointer"
                />
                <button
                  onClick={handleNextDay}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-2 py-0.5 text-[11px] font-semibold text-pink-400 hover:text-pink-300 rounded cursor-pointer"
                >
                  Hôm nay
                </button>
              </div>

              {/* Stylist Selector (only for Admin/Manager/Staff) */}
              {!isOnlyStylist && stylists.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedStylistId}
                    onChange={(e) => setSelectedStylistId(e.target.value)}
                    className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                  >
                    {stylists.map((st) => (
                      <option key={st.id} value={st.id} className="bg-slate-800 text-white">
                        {st.fullName || st.username}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Quick Ticket Button */}
            <button
              onClick={() => setIsQuickTicketOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-bold text-xs shadow-md shadow-pink-900/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tạo phiếu cắt nhanh</span>
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-5 space-y-5 overflow-y-auto flex-1">
            {isLoading ? (
              <div className="text-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-pink-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Đang tải dữ liệu tổng kết ngày...</p>
              </div>
            ) : (
              <>
                {/* Production KPIs and Shift Handover */}
                <StylistDailyWorklogKpis data={worklogData} />

                {/* Tabs */}
                <div>
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
                    <button
                      onClick={() => setActiveTab("completed")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "completed"
                          ? "bg-slate-800 text-pink-400 border border-slate-700"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Phiếu đã hoàn thành ({tickets.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("upcoming")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "upcoming"
                          ? "bg-slate-800 text-sky-400 border border-slate-700"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Lịch hẹn hôm nay ({upcomingBookings.length})
                    </button>
                  </div>

                  {activeTab === "completed" ? (
                    <StylistCompletedTicketsList tickets={tickets} />
                  ) : (
                    <>
                      <label className="flex items-center gap-2 text-[11px] text-slate-300 mb-2">
                        Thanh toán khi chốt phiếu:
                        <select
                          value={quickCompleteMethod}
                          onChange={(e) => setQuickCompleteMethod(e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white"
                        >
                          <option value="CASH">Tiền mặt</option>
                          <option value="VIETQR">VietQR</option>
                          <option value="CARD">Thẻ</option>
                        </select>
                      </label>
                      <StylistUpcomingBookingsList
                        bookings={upcomingBookings}
                        onQuickComplete={handleQuickComplete}
                        completingId={completingId}
                      />
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Quick Ticket Modal */}
      <QuickServiceTicketModal
        isOpen={isQuickTicketOpen}
        onClose={() => setIsQuickTicketOpen(false)}
        branchId={branchId}
        currentStylistId={Number(selectedStylistId)}
        stylists={stylists}
        services={services}
        products={products}
        onSuccess={(order) => {
          refetch();
          onOrderCompleted?.(order);
        }}
      />
    </>
  );
}
