import React from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { Scissors, Calendar, Users, Package, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-500 text-white flex items-center justify-center shadow-sm">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight">SmartSalon</h1>
            <p className="text-xs text-slate-400">Admin Portal</p>
          </div>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Lịch hẹn (Booking)
          </Link>
          <Link
            to="/pos"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
          >
            <Scissors className="w-4 h-4" />
            Điều phối POS
          </Link>
          <Link
            to="/staff"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
          >
            <Users className="w-4 h-4" />
            Nhân sự & Hoa hồng
          </Link>
          <Link
            to="/inventory"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
          >
            <Package className="w-4 h-4" />
            Kho định mức (BOM)
          </Link>
        </nav>

        {/* User Status & Logout */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-700 font-bold flex items-center justify-center text-xs shrink-0">
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {user?.fullName || user?.username || "Nhân viên"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.roles?.[0] || "User"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
            <span>Hạ tầng & Hệ thống Quản trị Salon</span>
            {user?.branchName && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                {user.branchName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              {user?.username ? `@${user.username}` : "API Connected"}
            </span>
          </div>
        </header>
        <div className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
