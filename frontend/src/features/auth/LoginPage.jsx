import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";
import { ROLES } from "../../lib/roles";
import { Sparkles, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, UserCheck, CheckCircle2 } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || null;

  const showToast = (message, type = "error") => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      const msg = "Vui lòng nhập Tên đăng nhập hoặc Số điện thoại";
      setError(msg);
      showToast(msg, "error");
      return;
    }
    if (!password) {
      const msg = "Vui lòng nhập mật khẩu";
      setError(msg);
      showToast(msg, "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await login(identifier, password);
      showToast("Đăng nhập thành công!", "success");

      setTimeout(() => {
        if (from) {
          navigate(from, { replace: true });
        } else if (
          loggedUser?.roles?.includes(ROLES.ADMIN) ||
          loggedUser?.roles?.includes(ROLES.MANAGER)
        ) {
          navigate("/admin", { replace: true });
        } else if (loggedUser?.roles?.includes(ROLES.STYLIST)) {
          navigate("/pos", { replace: true });
        } else {
          navigate("/customer", { replace: true });
        }
      }, 350);
    } catch (err) {
      const msg = err?.message || "Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (demoIdentifier, demoPassword) => {
    setIdentifier(demoIdentifier);
    setPassword(demoPassword);
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-pink-50/40 to-purple-50/30 p-4 sm:p-6 lg:p-8 relative">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold tracking-wide transition-all animate-in slide-in-from-top-4 duration-250 ${
            toastMessage.type === "success"
              ? "bg-emerald-600 text-white shadow-emerald-500/20"
              : "bg-rose-600 text-white shadow-rose-500/20"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-400 text-white shadow-lg shadow-pink-500/25 mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Smart<span className="text-pink-600">Salon</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Hệ thống quản lý salon tóc và chuỗi chi nhánh thông minh
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-pink-100 p-6 sm:p-8 transition-all">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Đăng nhập</h2>
            <p className="text-slate-500 text-xs mt-1">
              Nhập tên tài khoản hoặc số điện thoại đã đăng ký để tiếp tục
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
              <div className="leading-relaxed font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4.5">
            {/* Dual Identifier Field */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Tên đăng nhập hoặc Số điện thoại <span className="text-pink-600">*</span>
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin hoặc 0988888888"
                autoComplete="username"
                disabled={isSubmitting}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 focus:bg-white transition-all disabled:opacity-60"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                >
                  Mật khẩu <span className="text-pink-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setError("Vui lòng liên hệ quản trị viên để cấp lại mật khẩu.")}
                  className="text-xs text-pink-600 hover:text-pink-700 font-medium transition-colors cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  className="w-full h-11 pl-3.5 pr-12 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 focus:bg-white transition-all disabled:opacity-60"
                />
                {/* Accessible password visibility toggle button with 44x44px touch target */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-all cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-semibold text-sm shadow-md shadow-pink-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
              Tài khoản mẫu thử nghiệm
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin", "Admin@123")}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-50 hover:bg-pink-50/60 border border-slate-200/80 hover:border-pink-200 text-xs font-medium text-slate-700 hover:text-pink-700 transition-all cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-pink-500" />
                <span>Super Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("0988888888", "Admin@123")}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-50 hover:bg-pink-50/60 border border-slate-200/80 hover:border-pink-200 text-xs font-medium text-slate-700 hover:text-pink-700 transition-all cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-pink-500" />
                <span>Số ĐT Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Khách hàng mới chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="font-semibold text-pink-600 hover:text-pink-700 transition-colors"
          >
            Đăng ký tài khoản ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
