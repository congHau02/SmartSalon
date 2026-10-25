import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Scissors,
  LayoutDashboard,
  Calendar,
  BadgeDollarSign,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";
import { WebSocketStatusBadge, NotificationBell } from "../../features/realtime";
import { ErrorBoundary } from "../common/ErrorBoundary";
import { PersonalPayrollModal } from "../../features/pos/components/PersonalPayrollModal";

export function PosLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isPayrollOpen, setIsPayrollOpen] = useState(false);

  const isAdminOrManager =
    user?.roles?.some((r) => ["ADMIN", "MANAGER", "ROLE_ADMIN", "ROLE_MANAGER"].includes(r));

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="h-14 bg-slate-800 border-b border-slate-700 px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Left Section: Role-aware Navigation & Brand */}
        <div className="flex items-center gap-3">
          {isAdminOrManager && (
            <Link
              to="/admin"
              className="text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 transition-colors cursor-pointer"
              title="Quay lại bảng quản trị"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-pink-400" />
              <span>Quản trị</span>
            </Link>
          )}

          <Link
            to="/customer/booking"
            className="text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 transition-colors cursor-pointer"
            title="Mở cổng đặt lịch khách hàng"
          >
            <Calendar className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden md:inline">Đặt lịch khách hàng</span>
          </Link>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-2 font-semibold text-sm">
            <Scissors className="w-4 h-4 text-pink-400 shrink-0" />
            <span className="hidden lg:inline">POS & Điều phối Ghế Thời Gian Thực</span>
            <span className="lg:hidden">POS</span>
          </div>
        </div>

        {/* Right Section: Personal Payroll, Realtime & User Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Personal Payroll Statement Button */}
          <button
            type="button"
            onClick={() => setIsPayrollOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 font-bold text-xs transition-colors cursor-pointer"
            title="Xem bảng lương & thu nhập cá nhân"
          >
            <BadgeDollarSign className="w-4 h-4 text-pink-400" />
            <span className="hidden sm:inline">Lương & Thu nhập của tôi</span>
          </button>

          <WebSocketStatusBadge />
          <NotificationBell />

          <div className="h-4 w-px bg-slate-700" />

          {/* User Profile Chip */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 text-white font-bold flex items-center justify-center text-xs">
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || <User className="w-3.5 h-3.5" />}
            </div>
            <div className="hidden xl:block text-left text-xs leading-tight">
              <div className="font-bold text-slate-200 truncate max-w-[100px]">
                {user?.fullName || user?.username || "Tài khoản"}
              </div>
              <div className="text-[10px] text-slate-400">{user?.roles?.[0] || "Staff"}</div>
            </div>

            {/* Logout Action */}
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Đăng xuất tài khoản"
              title="Đăng xuất"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6">
        <ErrorBoundary title="Cổng POS & Điều phối Thời Gian Thực" resetKeys={[location.pathname]}>
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* Personal Payroll Statement Modal */}
      <PersonalPayrollModal isOpen={isPayrollOpen} onClose={() => setIsPayrollOpen(false)} />
    </div>
  );
}
