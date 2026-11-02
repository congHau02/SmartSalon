import React, { useState } from "react";
import { Search, X, AlertCircle, Loader2 } from "lucide-react";
import { bookingApi } from "../bookingApi";
import { RescheduleBookingModal } from "../../customer/components/RescheduleBookingModal";
import { BookingLookupItem } from "./BookingLookupItem";

export function getLookupErrorMessage(err) {
  if (
    err?.status === 429 ||
    err?.code === 2013 ||
    err?.code === "TOO_MANY_REQUESTS" ||
    err?.response?.status === 429
  ) {
    return "Bạn đã thực hiện quá nhiều yêu cầu tra cứu. Vui lòng thử lại sau 10 phút.";
  }
  return "Không tìm thấy lịch hẹn phù hợp hoặc hệ thống đang bận.";
}

export function BookingLookupModal({ isOpen, onClose, onSelectBooking }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e?.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSearched(true);

    try {
      if (cleanQuery.toUpperCase().startsWith("BK-")) {
        const res = await bookingApi.getBookingByCode(cleanQuery);
        setResults(res ? [res] : []);
      } else {
        const res = await bookingApi.lookupBookings(cleanQuery);
        setResults(res || []);
      }
    } catch (err) {
      setErrorMsg(getLookupErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestReschedule = async (payload) => {
    if (!rescheduleTarget) return;
    await bookingApi.rescheduleBooking({
      phone: rescheduleTarget.customerPhone,
      bookingCode: rescheduleTarget.bookingCode,
      newBookingTime: payload.newBookingTime,
      stylistId: payload.stylistId,
    });
  };

  return (
    <>
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

            {results.map((b) => (
              <BookingLookupItem
                key={b.id || b.bookingCode}
                booking={b}
                onSelect={(code) => {
                  onSelectBooking(code);
                  onClose();
                }}
                onReschedule={(booking) => setRescheduleTarget(booking)}
              />
            ))}
          </div>
        </div>
      </div>

      {rescheduleTarget && (
        <RescheduleBookingModal
          booking={rescheduleTarget}
          isOpen={Boolean(rescheduleTarget)}
          onClose={() => setRescheduleTarget(null)}
          onSuccess={() => {
            setRescheduleTarget(null);
            handleSearch();
          }}
          onReschedule={handleGuestReschedule}
        />
      )}
    </>
  );
}
