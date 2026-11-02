import { useState, useMemo } from "react";
import { useRescheduleCustomerBooking } from "./useCustomer";
import { useBookingStylists, useAvailableSlots } from "../booking/useBooking";
import { getRescheduleErrorMessage } from "./rescheduleErrorMessages";

export function useRescheduleBooking({ booking, onClose, onSuccess, onReschedule }) {
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState(tomorrow);
  const [selectedStylistId, setSelectedStylistId] = useState(booking?.stylistId || null);
  const [selectedSlotTime, setSelectedSlotTime] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rescheduleMutation = useRescheduleCustomerBooking();
  const isPending = isSubmitting || rescheduleMutation.isPending;

  const serviceIds = useMemo(() => {
    return (booking?.items || []).map((it) => it.serviceId || it.id).filter(Boolean);
  }, [booking?.items]);

  const { data: stylists = [], isLoading: isLoadingStylists } = useBookingStylists(
    booking?.branchId,
    selectedDate
  );

  const { data: slotData, isLoading: isLoadingSlots } = useAvailableSlots(
    {
      branchId: booking?.branchId,
      date: selectedDate,
      serviceIds,
      stylistId: selectedStylistId,
    },
    { enabled: Boolean(booking?.branchId && selectedDate && serviceIds.length) }
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
      setIsSubmitting(true);
      if (onReschedule) {
        await onReschedule(payload);
      } else {
        await rescheduleMutation.mutateAsync({ bookingId: booking.id, payload });
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(getRescheduleErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const minDate = new Date().toISOString().split("T")[0];

  return {
    selectedDate,
    selectedStylistId,
    selectedSlotTime,
    setSelectedSlotTime,
    errorMessage,
    isPending,
    minDate,
    stylists,
    isLoadingStylists,
    availableSlots,
    isLoadingSlots,
    handleDateChange,
    handleSelectStylist,
    handleConfirmReschedule,
  };
}
