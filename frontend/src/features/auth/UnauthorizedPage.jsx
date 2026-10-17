import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "./useAuth";

export function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-pink-50/30 to-purple-50/20 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-pink-100 p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          Không có quyền truy cập
        </h1>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          Tài khoản của bạn ({user?.username || "Ẩn danh"}) không có quyền truy cập vào phân hệ này.
          Vui lòng liên hệ Quản lý chi nhánh hoặc Quản trị viên để được cấp quyền.
        </p>

        {user?.roles && (
          <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Vai trò hiện tại:</span>{" "}
            {user.roles.join(", ")}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>

          <Link
            to={user?.roles?.includes("CUSTOMER") ? "/customer" : "/"}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-medium text-sm shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Trang chủ
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <button
            onClick={logout}
            className="text-xs text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
          >
            Đăng xuất tài khoản này
          </button>
        </div>
      </div>
    </div>
  );
}
