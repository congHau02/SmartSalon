import React, { useState } from "react";
import {
  Search,
  X,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Scissors,
} from "lucide-react";
import { bookingApi } from "../bookingApi";
import { formatCurrency, formatDate } from "../../../lib/utils";

const STATUS_BADGES = {
  PENDING_PAYMENT: { label: "Chờ cọc 20%", bg: "bg-amber-100 text-amber-800 border-amber-200" },
  CONFIRMED: { label: "Đã xác nhận", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  CHECKED_IN: { label: "Đã check-in", bg: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  IN_PROGRESS: { label: "Đang phục vụ", bg: "bg-blue-100 text-blue-800 border-blue-200" },
  COMPLETED: { label: "Hoàn thành", bg: "bg-slate-100 text-slate-800 border-slate-200" },
  CANCELLED: { label: "Đã hủy", bg: "bg-rose-100 text-rose-800 border-rose-200" },
  EXPIRED: { label: "Đã hết hạn", bg: "bg-slate-100 text-slate-500 border-slate-200" },
  NO_SHOW: { label: "Vắng mặt", bg: "bg-rose-100 text-rose-800 border-rose-200" },
};

export function BookingLookupModal({ isOpen, onClose, onSelectBooking }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e?.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSearched(true);
    setResults([]);

    try {
      if (cleanQuery.toUpperCase().startsWith("BK-")) {
        // Direct booking code lookup
        const res = await bookingApi.getBookingByCode(cleanQuery);
        if (res) {
          setResults([res]);
        }
      } else {
        // Phone lookup
        const res = await bookingApi.lookupBookings(cleanQuery);
        setResults(res || []);
      }
    } catch (err) {
      setErrorMsg("Không tìm thấy lịch hẹn phù hợp hoặc hệ thống đang bận.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-pink-100 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Tra cứu lịch hẹn</h3>
              <p className="text-xs text-slate-500">Tìm kiếm bằng Số điện thoại hoặc Mã đặt hẹn (BK-xxxx)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ tra cứu"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nhập số điện thoại (09xxx) hoặc mã BK-..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Tìm kiếm</span>}
            </button>
          </div>
        </form>

        {/* Results List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {searched && !isLoading && results.length === 0 && !errorMsg && (
            <div className="p-8 text-center text-slate-400 text-xs">
              Không tìm thấy lịch hẹn nào cho thông tin tìm kiếm này.
            </div>
          )}

          {results.map((b) => {
            const badge = STATUS_BADGES[b.status] || {
              label: b.status,
              bg: "bg-slate-100 text-slate-700 border-slate-200",
            };

            return (
              <div
                key={b.id || b.bookingCode}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-pink-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">{b.bookingCode}</span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-xs border ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="text-slate-600 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(b.bookingTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {b.totalDurationMinutes} phút
                    </span>
                  </div>

                  <div className="text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-pink-500" />
                    <span>{b.branchName}</span>
                    {b.staffName && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>Stylist: {b.staffName}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="font-extrabold text-slate-900 text-sm">{formatCurrency(b.totalPrice)}</div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectBooking(b.bookingCode);
                      onClose();
                    }}
                    className="mt-1.5 font-bold text-xs text-pink-600 hover:text-pink-700 flex items-center gap-1 sm:justify-end cursor-pointer"
                  >
                    <span>{b.status === "CONFIRMED" ? "Xem phiếu xác nhận" : "Xem chi tiết"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
