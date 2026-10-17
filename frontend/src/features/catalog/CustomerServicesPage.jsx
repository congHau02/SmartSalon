import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Clock, Scissors, Sparkles, ArrowRight } from "lucide-react";
import { catalogApi } from "./catalogApi";
import { formatCurrency } from "../../lib/utils";

export function CustomerServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["catalog", "services", "public-list"],
    queryFn: () => catalogApi.getServices({ activeOnly: true }),
    staleTime: 5 * 60 * 1000,
  });

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

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      <div className="text-center space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-700">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Menu Dịch Vụ Cao Cấp</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Bảng Giá Dịch Vụ SmartSalon
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Tất cả dịch vụ được thực hiện bởi các Master Stylist giàu kinh nghiệm cùng mỹ phẩm chính hãng.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
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

      {/* Service Cards */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4 animate-pulse">
          <div className="h-32 bg-slate-100 rounded-2xl" />
          <div className="h-32 bg-slate-100 rounded-2xl" />
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          Chưa có dịch vụ nào trong danh mục này.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filteredServices.map((svc) => (
            <div
              key={svc.id}
              className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-pink-300 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-pink-50 text-pink-700">
                    {svc.category || "Dịch vụ"}
                  </span>
                  <span className="font-extrabold text-base text-pink-700">
                    {formatCurrency(svc.basePrice)}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">{svc.name}</h3>
                {svc.description && (
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{svc.description}</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {svc.durationMinutes} phút
                </span>
                <Link
                  to={`/customer/booking?serviceId=${svc.id}`}
                  className="font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 transition-colors"
                >
                  <span>Đặt lịch ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
