import React, { useState, useMemo } from "react";
import {
  Scissors,
  Check,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "../../../lib/utils";
import { BookingBranchPicker } from "./BookingBranchPicker";
import { useActiveBranches, useActiveServices } from "../useBooking";

export function BranchAndServiceStep({
  selectedBranchId,
  onSelectBranch,
  selectedServices = [],
  onToggleService,
  onNext,
}) {
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const { data: branches = [], isLoading: isLoadingBranches } = useActiveBranches();
  const { data: services = [], isLoading: isLoadingServices } = useActiveServices();

  const categories = useMemo(() => {
    const set = new Set();
    services.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return ["ALL", ...Array.from(set)];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === "ALL") return services;
    return services.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + (s.durationMinutes || 0), 0),
    [selectedServices]
  );

  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + Number(s.basePrice || 0), 0),
    [selectedServices]
  );

  return (
    <div className="space-y-8">
      <BookingBranchPicker
        isLoadingBranches={isLoadingBranches}
        branches={branches}
        selectedBranchId={selectedBranchId}
        onSelectBranch={onSelectBranch}
      />

      {/* 2. Dịch vụ */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Chọn Gói Dịch vụ Làm đẹp</h3>
              <p className="text-xs text-slate-500">
                Có thể chọn nhiều dịch vụ cùng lúc. Hệ thống sẽ cộng dồn thời lượng để xếp giờ chuẩn xác.
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-pink-300 hover:text-pink-600"
              }`}
            >
              {cat === "ALL" ? "Tất cả dịch vụ" : cat}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {isLoadingServices ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3.5 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {filteredServices.map((svc) => {
              const isSelected = selectedServices.some((s) => s.id === svc.id);
              return (
                <div
                  key={svc.id}
                  onClick={() => onToggleService(svc)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between relative ${
                    isSelected
                      ? "border-pink-500 bg-pink-50/50 shadow-xs ring-2 ring-pink-100"
                      : "border-slate-200 bg-white hover:border-pink-200 hover:shadow-2xs"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {svc.category || "Dịch vụ"}
                      </span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-pink-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-2">{svc.name}</h4>
                    {svc.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {svc.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{svc.durationMinutes} phút</span>
                    </span>
                    <span className="font-extrabold text-pink-700 text-sm">
                      {formatCurrency(svc.basePrice)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Bottom Summary Bar */}
      <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-slate-900 text-white shadow-xl flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400">
            Đã chọn: <strong className="text-white">{selectedServices.length}</strong> dịch vụ (khoảng{" "}
            <strong className="text-pink-400">{totalDuration} phút</strong>)
          </div>
          <div className="text-base sm:text-lg font-black text-pink-400 mt-0.5">
            {formatCurrency(totalPrice)}
          </div>
        </div>

        <button
          type="button"
          disabled={!selectedBranchId || selectedServices.length === 0}
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-sm shadow-md shadow-pink-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer"
        >
          <span>Tiếp tục: Chọn giờ & Stylist</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
