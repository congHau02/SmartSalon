import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { getPasswordStrength } from "../register.utils";

export function RegisterPasswordInputs({
  password,
  confirmPassword,
  onChange,
  errors = {},
  disabled,
  // Graceful fallbacks for legacy props
  showPassword: controlledShowPassword,
  setShowPassword: controlledSetShowPassword,
  showConfirmPassword: controlledShowConfirmPassword,
  setShowConfirmPassword: controlledSetShowConfirmPassword,
}) {
  const [localShowPassword, setLocalShowPassword] = useState(false);
  const [localShowConfirm, setLocalShowConfirm] = useState(false);

  const showPassword = controlledShowPassword !== undefined ? controlledShowPassword : localShowPassword;
  const setShowPassword = controlledSetShowPassword || setLocalShowPassword;
  const showConfirmPassword = controlledShowConfirmPassword !== undefined ? controlledShowConfirmPassword : localShowConfirm;
  const setShowConfirmPassword = controlledSetShowConfirmPassword || setLocalShowConfirm;
  const strength = getPasswordStrength(password);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label
          htmlFor="password"
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
        >
          Mật khẩu <span className="text-pink-600">*</span>
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => onChange("password", e.target.value)}
            placeholder="Tối thiểu 6 ký tự"
            autoComplete="new-password"
            disabled={disabled}
            className={`w-full h-11 pl-3.5 pr-12 rounded-xl border bg-slate-50/50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:bg-white transition-all ${
              errors.password ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-pink-500"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="absolute right-0.5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-all cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}

        {/* Password Strength Indicator */}
        {password && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Độ mạnh mật khẩu:</span>
              <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 h-1.5">
              <div
                className={`rounded-full transition-colors ${
                  strength.score >= 1 ? strength.color : "bg-slate-200"
                }`}
              />
              <div
                className={`rounded-full transition-colors ${
                  strength.score >= 2 ? strength.color : "bg-slate-200"
                }`}
              />
              <div
                className={`rounded-full transition-colors ${
                  strength.score >= 3 ? strength.color : "bg-slate-200"
                }`}
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
        >
          Xác nhận mật khẩu <span className="text-pink-600">*</span>
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => onChange("confirmPassword", e.target.value)}
            placeholder="Nhập lại mật khẩu"
            autoComplete="new-password"
            disabled={disabled}
            className={`w-full h-11 pl-3.5 pr-12 rounded-xl border bg-slate-50/50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:bg-white transition-all ${
              errors.confirmPassword
                ? "border-red-400 bg-red-50/20"
                : "border-slate-200 focus:border-pink-500"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? "Ẩn xác nhận mật khẩu" : "Hiện xác nhận mật khẩu"}
            className="absolute right-0.5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-all cursor-pointer"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
        )}
      </div>
    </div>
  );
}
