import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Clock, Sparkles, Check, ArrowRight, AlertCircle } from "lucide-react";
import { axiosClient } from "../../../api/axiosClient";
import { catalogApi } from "../../catalog/catalogApi";
import { formatCurrency } from "../../../lib/utils";

export function BranchAndServiceStep({
  selectedBranchId,
  onSelectBranch,
  selectedServices = [],
  onToggleService,
  onNext,
}) {
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Load branches
  const { data: branches = [], isLoading: isLoadingBranches } = useQuery({
    queryKey: ["branches", "active"],
    queryFn: async () => {
      const res = await axiosClient.get("/branches");
      const list = res?.result || res?.data || [];
      return list.filter((b) => b.isActive && !b.isDeleted);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Load services
  const { data: services = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ["catalog", "services", "public"],
    queryFn: () => catalogApi.getServices({ activeOnly: true }),
    staleTime: 5 * 60 * 1000,
  });

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set();
    services.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return ["ALL", ...Array.from(set)];
  }, [services]);

  // Filter services by category
  const filteredServices = useMemo(() => {
    if (selectedCategory === "ALL") return services;
    return services.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  // Totals
  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + (s.durationMinutes || 0), 0),
    [selectedServices]
  );

  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + Number(s.basePrice || 0), 0),
    [selectedServices]
  );

  const depositAmount = useMemo(() => Math.round(totalPrice * 0.2), [totalPrice]);

  return (
    <div className="space-y-8">
      {/* 1. Chi nhánh */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Chọn Chi nhánh Salon</h3>
            <p className="text-xs text-slate-500">Vui lòng chọn salon gần nhất để xem lịch trống của Stylist</p>
          </div>
        </div>

        {isLoadingBranches ? (
          <div className="grid sm:grid-cols-2 gap-4 animate-pulse">
            <div className="h-28 bg-slate-100 rounded-2xl" />
            <div className="h-28 bg-slate-100 rounded-2xl" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {branches.map((b) => {
              const isSelected = selectedBranchId === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => onSelectBranch(b.id)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? "border-pink-500 bg-pink-50/40 shadow-xs ring-2 ring-pink-100"
                      : "border-slate-200 bg-white hover:border-pink-200 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{b.name}</h4>
                      <p className="text-xs text-slate-600 mt-1 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{b.address}</span>
                      </p>
                    </div>
                    {isSelected && (
                      <span className="shrink-0 w-6 h-6 rounded-full bg-pink-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  {b.phone && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center gap-1.5 text-xs text-slate-500">
                      <Phone className="w-3 h-3 text-pink-500" />
                      <span>Hotline: {b.phone}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Dịch vụ */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Chọn một hoặc nhiều Dịch vụ</h3>
              <p className="text-xs text-slate-500">
                Bạn có thể chọn combo cắt, gội, uốn/nhuộm cùng lúc (thời lượng sẽ được tính liên tục)
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-pink-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-pink-300"
              }`}
            >
              {cat === "ALL" ? "Tất cả dịch vụ" : cat}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {isLoadingServices ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            <div className="h-36 bg-slate-100 rounded-2xl" />
            <div className="h-36 bg-slate-100 rounded-2xl" />
            <div className="h-36 bg-slate-100 rounded-2xl" />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            Không có dịch vụ nào trong danh mục này.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((svc) => {
              const isSelected = selectedServices.some((s) => s.id === svc.id);

              return (
                <div
                  key={svc.id}
                  onClick={() => onToggleService(svc)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-pink-500 bg-pink-50/50 shadow-xs ring-2 ring-pink-100"
                      : "border-slate-200 bg-white hover:border-pink-300 hover:shadow-xs"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {svc.category || "Dịch vụ"}
                      </span>
                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-pink-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border border-slate-300" />
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-2 line-clamp-1">{svc.name}</h4>
                    {svc.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{svc.description}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {svc.durationMinutes} phút
                    </span>
                    <span className="font-bold text-sm text-pink-700">{formatCurrency(svc.basePrice)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Bottom Summary Bar */}
      <div className="sticky bottom-4 z-40 bg-white/95 backdrop-blur-md rounded-2xl border border-pink-200 p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Đã chọn:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-700">
              {selectedServices.length} dịch vụ
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Tổng: {totalDuration} phút
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-lg font-bold text-slate-900">{formatCurrency(totalPrice)}</span>
            {totalPrice > 0 && (
              <span className="text-xs font-medium text-pink-600">
                (Đặt cọc 20%: {formatCurrency(depositAmount)})
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={!selectedBranchId || selectedServices.length === 0}
          onClick={onNext}
          className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            selectedBranchId && selectedServices.length > 0
              ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-200 hover:from-pink-600 hover:to-rose-700 cursor-pointer"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          <span>Tiếp tục: Chọn giờ hẹn</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
