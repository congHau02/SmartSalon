import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Sparkles, Calendar, Scissors, Search, User, LogIn } from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";
import { BookingLookupModal } from "../../features/booking/components/BookingLookupModal";
import { ErrorBoundary } from "../common/ErrorBoundary";
import { MembershipTierBadge } from "../common/MembershipTierBadge";
import { formatCurrency } from "../../lib/utils";

export function CustomerLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLookupOpen, setIsLookupOpen] = useState(false);

  const isBookingActive = location.pathname.includes("/booking");
  const isServicesActive = location.pathname.includes("/services");
  const isProfileActive = location.pathname.includes("/profile");

  return (
    <div className="min-h-screen bg-pink-50/20 text-slate-800 flex flex-col font-sans">
      <header className="h-16 bg-white/90 backdrop-blur-md border-b border-pink-100 px-6 flex items-center justify-between sticky top-0 z-50 shadow-2xs">
        <div className="flex items-center gap-8">
          <Link to="/customer/booking" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">SmartSalon</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1 text-sm font-semibold">
            <Link
              to="/customer/booking"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                isBookingActive
                  ? "bg-pink-50 text-pink-700 font-bold"
                  : "text-slate-600 hover:text-pink-600 hover:bg-slate-50"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Đặt lịch hẹn</span>
            </Link>

            <Link
              to="/customer/services"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                isServicesActive
                  ? "bg-pink-50 text-pink-700 font-bold"
                  : "text-slate-600 hover:text-pink-600 hover:bg-slate-50"
              }`}
            >
              <Scissors className="w-4 h-4" />
              <span>Bảng giá dịch vụ</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsLookupOpen(true)}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-pink-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer font-semibold"
            >
              <Search className="w-4 h-4" />
              <span>Tra cứu lịch</span>
            </button>

            {user && (
              <Link
                to="/customer/profile"
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  isProfileActive
                    ? "bg-pink-50 text-pink-700 font-bold"
                    : "text-slate-600 hover:text-pink-600 hover:bg-slate-50"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Hồ sơ & Thành viên</span>
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <Link
              to="/customer/profile"
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-pink-50 hover:text-pink-700 px-3 py-1.5 rounded-full transition-colors border border-slate-200/80"
              title="Hồ sơ & Thành viên"
            >
              <div className="w-5 h-5 rounded-full bg-pink-600 text-white flex items-center justify-center text-[10px] font-bold">
                {user.fullName?.[0] || "U"}
              </div>
              <span className="hidden sm:inline font-medium">{user.fullName}</span>
              <MembershipTierBadge tier={user.membershipTier || "STANDARD"} size="xs" />
              {Number(user.creditBalance || 0) > 0 && (
                <span className="hidden md:inline px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Ví cọc: {formatCurrency(user.creditBalance)}
                </span>
              )}
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-xs font-bold text-slate-600 hover:text-pink-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-pink-300 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6">
        <ErrorBoundary title="Cổng Khách hàng" resetKeys={[location.pathname]}>
          <Outlet />
        </ErrorBoundary>
      </main>

      <footer className="border-t border-pink-100/60 bg-white/60 py-6 text-center text-xs text-slate-400">
        © 2026 SmartSalon Vietnam • Hệ thống Đặt lịch làm đẹp & Điều phối thông minh
      </footer>

      {/* Booking Lookup Modal */}
      <BookingLookupModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
        onSelectBooking={(code) => {
          setIsLookupOpen(false);
          navigate(`/customer/booking?step=4&code=${code}`);
        }}
      />
    </div>
  );
}
