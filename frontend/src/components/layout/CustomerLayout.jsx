import React from "react";
import { Outlet, Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function CustomerLayout() {
  return (
    <div className="min-h-screen bg-pink-50/30 text-slate-800 flex flex-col">
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-pink-100 px-6 flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">SmartSalon</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link to="/booking" className="hover:text-pink-600 transition-colors">Đặt lịch hẹn</Link>
          <Link to="/services" className="hover:text-pink-600 transition-colors">Bảng giá dịch vụ</Link>
        </nav>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full p-6">
        <Outlet />
      </main>
    </div>
  );
}
