import React from "react";
import { Outlet, Link } from "react-router-dom";
import { Scissors, ArrowLeft } from "lucide-react";

export function PosLayout() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="h-14 bg-slate-800 border-b border-slate-700 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-slate-400 hover:text-white flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </Link>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2 font-semibold">
            <Scissors className="w-4 h-4 text-pink-400" />
            <span>POS & Điều phối Ghế Thời Gian Thực</span>
          </div>
        </div>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
