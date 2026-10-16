import React from "react";
import { Outlet, Link } from "react-router-dom";
import { Scissors, Calendar, Users, Package, Settings, LogOut } from "lucide-react";

export function AdminLayout() {
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

        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">v0.0.1 Phase 1</div>
          <button
            type="button"
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <div className="text-sm font-medium text-slate-500">
            Hạ tầng & Hệ thống Quản trị Salon
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              API Connected
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
