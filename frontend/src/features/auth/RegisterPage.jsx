import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { Sparkles, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { validateRegisterForm } from "./register.utils";
import { RegisterPasswordInputs } from "./components/RegisterPasswordInputs";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    const validationErrors = validateRegisterForm(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        fullName: formData.fullName,
        phone: formData.phone,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      navigate("/customer", { replace: true });
    } catch (err) {
      setApiError(err?.message || "Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-pink-50/40 to-purple-50/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-lg w-full">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-400 text-white shadow-lg shadow-pink-500/25 mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Smart<span className="text-pink-600">Salon</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Đăng ký tài khoản khách hàng để đặt lịch và nhận ưu đãi độc quyền
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-pink-100 p-6 sm:p-8 transition-all">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Tạo tài khoản mới</h2>
            <p className="text-slate-500 text-xs mt-1">
              Điền thông tin cá nhân bên dưới để hoàn tất đăng ký thành viên
            </p>
          </div>

          {apiError && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
              <div className="leading-relaxed font-medium">{apiError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
              >
                Họ và tên <span className="text-pink-600">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                placeholder="Nguyễn Thị Mai"
                disabled={isSubmitting}
                className={`w-full h-11 px-3.5 rounded-xl border bg-slate-50/50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:bg-white transition-all ${
                  errors.fullName ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-pink-500"
                }`}
              />
              {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
            </div>

            {/* Grid: Phone + Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Số điện thoại <span className="text-pink-600">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="0912345678"
                  disabled={isSubmitting}
                  className={`w-full h-11 px-3.5 rounded-xl border bg-slate-50/50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:bg-white transition-all ${
                    errors.phone ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-pink-500"
                  }`}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Tên đăng nhập <span className="text-pink-600">*</span>
                </label>
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  placeholder="mainguyen22"
                  autoComplete="username"
                  disabled={isSubmitting}
                  className={`w-full h-11 px-3.5 rounded-xl border bg-slate-50/50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:bg-white transition-all ${
                    errors.username ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-pink-500"
                  }`}
                />
                {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
              </div>
            </div>

            {/* Email (Optional) */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
              >
                Email (không bắt buộc)
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="mai.nguyen@example.com"
                disabled={isSubmitting}
                className={`w-full h-11 px-3.5 rounded-xl border bg-slate-50/50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:bg-white transition-all ${
                  errors.email ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-pink-500"
                }`}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            <RegisterPasswordInputs
              password={formData.password}
              confirmPassword={formData.confirmPassword}
              onChange={handleChange}
              errors={errors}
              disabled={isSubmitting}
            />

            {/* Terms note */}
            <p className="text-[11px] text-slate-500 leading-normal pt-1">
              Bằng việc đăng ký, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của SmartSalon.
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 mt-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-semibold text-sm shadow-md shadow-pink-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý đăng ký...</span>
                </>
              ) : (
                <>
                  <span>Đăng ký thành viên</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Đã có tài khoản thành viên?{" "}
          <Link
            to="/login"
            className="font-semibold text-pink-600 hover:text-pink-700 transition-colors"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
