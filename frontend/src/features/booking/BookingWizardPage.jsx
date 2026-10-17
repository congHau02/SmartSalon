import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, CalendarCheck, ShieldCheck } from "lucide-react";
import { axiosClient } from "../../api/axiosClient";
import { useBookingStylists, useCreateBooking } from "./useBooking";
import { BookingStepIndicator } from "./components/BookingStepIndicator";
import { BranchAndServiceStep } from "./components/BranchAndServiceStep";
import { StylistAndSlotStep } from "./components/StylistAndSlotStep";
import { CustomerConfirmStep } from "./components/CustomerConfirmStep";

// Helper get today in YYYY-MM-DD
function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function BookingWizardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Step state
  const stepParam = parseInt(searchParams.get("step") || "1", 10);
  const [currentStep, setCurrentStep] = useState(stepParam >= 1 && stepParam <= 4 ? stepParam : 1);

  // Wizard selections
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedStylistId, setSelectedStylistId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [selectedSlotTime, setSelectedSlotTime] = useState(null);
  const [bookingCode, setBookingCode] = useState(searchParams.get("code") || null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Sync step with URL
  useEffect(() => {
    const step = parseInt(searchParams.get("step") || "1", 10);
    if (step >= 1 && step <= 4 && step !== currentStep) {
      setCurrentStep(step);
    }
    const code = searchParams.get("code");
    if (code) {
      setBookingCode(code);
    }
  }, [searchParams]);

  const goToStep = (step, code = bookingCode) => {
    setCurrentStep(step);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("step", step.toString());
    if (code) {
      newParams.set("code", code);
    }
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Pre-load active branches to set initial branch
  const { data: branches = [] } = useQuery({
    queryKey: ["branches", "active"],
    queryFn: async () => {
      const res = await axiosClient.get("/branches");
      const list = res?.result || res?.data || [];
      return list.filter((b) => b.isActive && !b.isDeleted);
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!selectedBranchId && branches.length > 0) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  // Selected branch object
  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === selectedBranchId) || null,
    [branches, selectedBranchId]
  );

  // Stylists for branch
  const { data: stylists = [] } = useBookingStylists(selectedBranchId);
  const selectedStylist = useMemo(
    () => stylists.find((s) => s.id === selectedStylistId) || null,
    [stylists, selectedStylistId]
  );

  // Service toggle handler
  const handleToggleService = (service) => {
    setSelectedServices((prev) => {
      const exists = prev.some((s) => s.id === service.id);
      if (exists) {
        return prev.filter((s) => s.id !== service.id);
      }
      return [...prev, service];
    });
    // Reset selected slot since total duration changes
    setSelectedSlotTime(null);
  };

  // Create booking mutation
  const createBookingMutation = useCreateBooking();

  const handleConfirmBooking = async ({ customerName, customerPhone, notes }) => {
    setErrorMessage(null);

    if (!selectedBranchId || !selectedSlotTime || selectedServices.length === 0) {
      setErrorMessage("Vui lòng hoàn tất chọn chi nhánh, dịch vụ và khung giờ trước khi xác nhận.");
      return;
    }

    const payload = {
      branchId: selectedBranchId,
      stylistId: selectedStylistId || null,
      serviceIds: selectedServices.map((s) => s.id),
      bookingTime: `${selectedDate}T${selectedSlotTime}:00`,
      customerName,
      customerPhone,
      notes,
    };

    try {
      const response = await createBookingMutation.mutateAsync(payload);
      const code = response?.bookingCode || response?.code;
      if (code) {
        setBookingCode(code);
        goToStep(4, code);
      } else {
        throw new Error("Không nhận được mã đặt hẹn từ máy chủ");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Khung giờ này vừa có khách khác giữ chỗ. Vui lòng chọn khung giờ khác.";
      setErrorMessage(msg);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Page Header */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-700 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Đặt lịch hẹn thông minh SmartSalon</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Đặt Lịch Làm Tóc & Spa Trực Tuyến
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-lg mx-auto">
          Chọn chi nhánh, kỹ thuật viên yêu thích và nhận lịch hẹn chuẩn xác theo thời gian thực.
        </p>
      </div>

      {/* Step Indicator */}
      <BookingStepIndicator currentStep={currentStep} onStepClick={goToStep} />

      {/* Step Contents */}
      {currentStep === 1 && (
        <BranchAndServiceStep
          selectedBranchId={selectedBranchId}
          onSelectBranch={(id) => {
            setSelectedBranchId(id);
            setSelectedStylistId(null);
            setSelectedSlotTime(null);
          }}
          selectedServices={selectedServices}
          onToggleService={handleToggleService}
          onNext={() => goToStep(2)}
        />
      )}

      {currentStep === 2 && (
        <StylistAndSlotStep
          selectedBranchId={selectedBranchId}
          selectedServices={selectedServices}
          selectedStylistId={selectedStylistId}
          onSelectStylist={(id) => {
            setSelectedStylistId(id);
            setSelectedSlotTime(null);
          }}
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setSelectedSlotTime(null);
          }}
          selectedSlotTime={selectedSlotTime}
          onSelectSlotTime={setSelectedSlotTime}
          onBack={() => goToStep(1)}
          onNext={() => goToStep(3)}
        />
      )}

      {currentStep === 3 && (
        <CustomerConfirmStep
          branch={selectedBranch}
          stylist={selectedStylist}
          selectedServices={selectedServices}
          selectedDate={selectedDate}
          selectedSlotTime={selectedSlotTime}
          onBack={() => goToStep(2)}
          onSubmitBooking={handleConfirmBooking}
          isSubmitting={createBookingMutation.isPending}
          errorMessage={errorMessage}
        />
      )}

      {currentStep === 4 && (
        <div className="p-8 text-center bg-white rounded-2xl border border-pink-200 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mx-auto">
            <CalendarCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Giữ chỗ thành công trong 5 phút!</h2>
          <p className="text-sm text-slate-600">
            Mã đặt hẹn của bạn: <strong className="text-pink-600 text-base">{bookingCode}</strong>
          </p>
          <p className="text-xs text-slate-500">
            Tính năng thanh toán cọc VietQR và vé hẹn điện tử đang được hoàn thiện ở Issue 06.
          </p>
        </div>
      )}
    </div>
  );
}
