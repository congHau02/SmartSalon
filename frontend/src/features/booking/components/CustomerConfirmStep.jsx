import React, { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import { useLoyaltyPreview } from "../../customer/useCustomer";
import { guestBookingSchema } from "../booking.schema";
import { CustomerInfoForm } from "./CustomerInfoForm";
import { BookingBreakdownReviewCard } from "./BookingBreakdownReviewCard";

export function CustomerConfirmStep({
  branch,
  stylist,
  selectedServices = [],
  selectedDate,
  selectedSlotTime,
  onBack,
  onSubmitBooking,
  isSubmitting = false,
  errorMessage = null,
}) {
  const { user } = useAuth();

  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + (s.durationMinutes || 0), 0),
    [selectedServices]
  );

  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + Number(s.basePrice || 0), 0),
    [selectedServices]
  );

  const depositAmount = useMemo(() => Math.round(totalPrice * 0.2), [totalPrice]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(guestBookingSchema),
    defaultValues: {
      customerName: user?.fullName || "",
      customerPhone: user?.phone || "",
      notes: "",
    },
  });

  useEffect(() => {
    if (user) {
      if (user.fullName) setValue("customerName", user.fullName);
      if (user.phone) setValue("customerPhone", user.phone);
    }
  }, [user, setValue]);

  const watchedPhone = useWatch({ control, name: "customerPhone" });
  const lookupPhone = user?.phone || watchedPhone;

  const { data: loyaltyData } = useLoyaltyPreview(lookupPhone);

  const effectiveTier = user?.membershipTier || loyaltyData?.membershipTier || "STANDARD";
  const effectiveDiscountPercent = user?.discountPercent ?? loyaltyData?.discountPercent ?? 0;

  const onGuestSubmit = (data) => {
    onSubmitBooking({
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      notes: data.notes || undefined,
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (user) {
      onSubmitBooking({
        customerName: user.fullName || "Khách hàng",
        customerPhone: user.phone || "0900000000",
        notes: getValues("notes") || undefined,
      });
      return;
    }
    handleSubmit(onGuestSubmit)(e);
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-8">
        <div className="grid lg:grid-cols-12 gap-8">
          <CustomerInfoForm user={user} register={register} errors={errors} />

          <BookingBreakdownReviewCard
            bookingSummary={{
              branch,
              stylist,
              selectedServices,
              selectedDate,
              selectedSlotTime,
              totalDuration,
              totalPrice,
              depositAmount,
              membershipTier: effectiveTier,
              discountPercent: effectiveDiscountPercent,
              creditBalance: Number(user?.creditBalance ?? loyaltyData?.creditBalance ?? 0),
            }}
            isSubmitting={isSubmitting}
          />
        </div>

        <div className="pt-4 border-t border-slate-200">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 cursor-pointer flex items-center gap-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Chọn giờ</span>
          </button>
        </div>
      </form>
    </div>
  );
}
