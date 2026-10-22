import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Shield, LogOut } from "lucide-react";

export function AdminUserMenu({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogoutClick = () => {
    setIsOpen(false);
    onLogout();
  };

  const roleBadgeColor = {
    ADMIN: "bg-purple-50 text-purple-700 border-purple-200",
    MANAGER: "bg-blue-50 text-blue-700 border-blue-200",
    STAFF: "bg-emerald-50 text-emerald-700 border-emerald-200",
    STYLIST: "bg-pink-50 text-pink-700 border-pink-200",
  }[user?.roles?.[0]] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Menu tài khoản người dùng"
        className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500/30 min-h-[44px]"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 text-white font-bold flex items-center justify-center text-xs shadow-xs">
          {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
        </div>

        <div className="hidden sm:block text-left max-w-[120px] truncate">
          <p className="text-xs font-bold text-slate-800 truncate leading-tight">
            {user?.fullName || user?.username || "Tài khoản"}
          </p>
          <p className="text-[10px] text-slate-400 truncate leading-tight">
            {user?.roles?.[0] || "User"}
          </p>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-pink-600" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Tùy chọn tài khoản"
          className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-900 truncate">
              {user?.fullName || "Chưa cập nhật tên"}
            </p>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              @{user?.username || "user"}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadgeColor}`}
              >
                <Shield className="w-3 h-3" />
                <span>{user?.roles?.[0] || "USER"}</span>
              </span>
              {user?.branchName && (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md truncate max-w-[130px]">
                  {user.branchName}
                </span>
              )}
            </div>
          </div>

          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogoutClick}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer min-h-[44px]"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất tài khoản</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
