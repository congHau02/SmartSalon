import React, { useState, useMemo } from "react";
import { Calendar, Clock, ArrowRight, X, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { useRescheduleCustomerBooking } from "../useCustomer";
import { useBookingStylists, useAvailableSlots } from "../../booking/useBooking";
import { SlotPicker } from "../../booking/components/SlotPicker";
import { StylistSelectorSection } from "../../booking/components/StylistSelectorSection";
import { getRescheduleErrorMessage } from "../rescheduleErrorMessages";
import { formatCurrency, formatDate } from "../../../lib/utils";

export function RescheduleBookingModal({ booking, isOpen, onClose, onSuccess }) {
  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <RescheduleBookingModalContent
        booking={booking}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </div>
  );
}

function RescheduleBookingModalContent({ booking, onClose, onSuccess }) {
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState(tomorrow);
  const [selectedStylistId, setSelectedStylistId] = useState(booking.stylistId || null);
  const [selectedSlotTime, setSelectedSlotTime] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const rescheduleMutation = useRescheduleCustomerBooking();

  const serviceIds = useMemo(() => {
    return (booking.items || []).map((it) => it.serviceId || it.id).filter(Boolean);
  }, [booking.items]);

  const { data: stylists = [], isLoading: isLoadingStylists } = useBookingStylists(
    booking.branchId,
    selectedDate
  );

  const { data: slotData, isLoading: isLoadingSlots } = useAvailableSlots(
    {
      branchId: booking.branchId,
      date: selectedDate,
      serviceIds,
      stylistId: selectedStylistId,
    },
    { enabled: Boolean(booking.branchId && selectedDate && serviceIds.length) }
  );

  const availableSlots = useMemo(() => {
    if (!slotData) return [];
    if (Array.isArray(slotData)) return slotData;
    return slotData.slots || [];
  }, [slotData]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedSlotTime(null);
    setErrorMessage(null);
  };

  const handleSelectStylist = (stylistId) => {
    setSelectedStylistId(stylistId);
    setSelectedSlotTime(null);
    setErrorMessage(null);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedDate || !selectedSlotTime) {
      setErrorMessage("Vui lòng chọn ngày và khung giờ mới trước khi xác nhận.");
      return;
    }
    setErrorMessage(null);

    const newBookingTime = `${selectedDate}T${selectedSlotTime}:00`;
    const payload = {
      newBookingTime,
      stylistId: selectedStylistId,
    };

    try {
      await rescheduleMutation.mutateAsync({ bookingId: booking.id, payload });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(getRescheduleErrorMessage(err));
    }
  };

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-pink-100 space-y-5 relative my-8 max-h-[90vh] overflow-y-auto">
      <button
        type="button"
        onClick={onClose}
        disabled={rescheduleMutation.isPending}
        className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-extrabold text-lg text-slate-900">Dời lịch hẹn làm đẹp</h3>
          <p className="text-xs text-slate-500">
            Mã lịch hẹn: <span className="font-mono font-bold text-slate-800">{booking.bookingCode}</span> • Chi nhánh: <strong>{booking.branchName}</strong>
          </p>
        </div>
      </div>

      {/* Reassurance Banner */}
      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Bảo toàn tiền cọc & dịch vụ 100%:</span>
          <span className="text-emerald-800 leading-relaxed block mt-0.5">
            Tiền cọc <strong>{formatCurrency(booking.depositAmount)}</strong> và toàn bộ {booking.items?.length || 0} dịch vụ đã chọn được chuyển nguyên vẹn sang giờ mới. Mỗi lịch hẹn được dời tối đa 1 lần.
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Date Picker */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          1. Chọn ngày làm đẹp mới
        </label>
        <input
          type="date"
          min={minDate}
          value={selectedDate}
          onChange={handleDateChange}
          className="w-full sm:w-64 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
        />
      </div>

      {/* Stylist Selector */}
      <StylistSelectorSection
        isLoadingStylists={isLoadingStylists}
        stylists={stylists}
        selectedStylistId={selectedStylistId}
        onSelectStylist={handleSelectStylist}
      />

      {/* Slot Picker */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          2. Chọn khung giờ mới
        </label>
        <SlotPicker
          slots={availableSlots}
          selectedSlotTime={selectedSlotTime}
          onSelectSlot={(time) => {
            setSelectedSlotTime(time);
            setErrorMessage(null);
          }}
          isLoading={isLoadingSlots}
          totalDurationMinutes={booking.totalDurationMinutes || 30}
        />
      </div>

      {/* Summary Comparison */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Giờ hẹn ban đầu:</span>
          <span className="font-semibold text-slate-600">{formatDate(booking.bookingTime)}</span>
        </div>
        {selectedSlotTime && (
          <div className="flex items-center justify-between text-pink-700 font-bold">
            <span className="flex items-center gap-1">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Giờ hẹn mới:</span>
            </span>
            <span>{selectedSlotTime} ngày {selectedDate}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          disabled={rescheduleMutation.isPending}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Giữ nguyên lịch cũ
        </button>
        <button
          type="button"
          onClick={handleConfirmReschedule}
          disabled={!selectedSlotTime || rescheduleMutation.isPending}
          className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {rescheduleMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{rescheduleMutation.isPending ? "Đang xử lý dời lịch..." : "Xác nhận dời lịch"}</span>
        </button>
      </div>
    </div>
  );
}
