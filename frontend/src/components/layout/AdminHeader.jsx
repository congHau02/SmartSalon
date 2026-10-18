import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  Building2,
  ChevronDown,
  Check,
  LogOut,
  Shield,
  MapPin,
  Phone,
  Lock,
} from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";
import { useBranch } from "../../features/branch/useBranch";
import { getBreadcrumbTrail } from "../../lib/navigation";
import { NotificationBell, WebSocketStatusBadge } from "../../features/realtime";

export function AdminHeader({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const {
    branches,
    selectedBranch,
    selectedBranchId,
    setSelectedBranchId,
    isLoadingBranches,
    canSwitchBranch,
  } = useBranch();
  const navigate = useNavigate();
  const location = useLocation();

  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const branchMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  const breadcrumbs = useMemo(() => getBreadcrumbTrail(location.pathname), [location.pathname]);

  // Close menus when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (branchMenuRef.current && !branchMenuRef.current.contains(event.target)) {
        setIsBranchMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsBranchMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const handleSelectBranch = (branchId) => {
    setSelectedBranchId(branchId);
    setIsBranchMenuOpen(false);
  };

  const roleBadgeColor = {
    ADMIN: "bg-purple-50 text-purple-700 border-purple-200",
    MANAGER: "bg-blue-50 text-blue-700 border-blue-200",
    STAFF: "bg-emerald-50 text-emerald-700 border-emerald-200",
    STYLIST: "bg-pink-50 text-pink-700 border-pink-200",
  }[user?.roles?.[0]] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left Section: Mobile toggle & Hierarchical Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button with >= 44x44px touch target */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Mở menu điều hướng"
          className="lg:hidden w-11 h-11 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Hierarchical Breadcrumb Trail */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <span className="text-slate-300">/</span>}
                {crumb.to && !isLast ? (
                  <Link
                    to={crumb.to}
                    className="text-slate-500 hover:text-pink-600 transition-colors font-medium"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={
                      isLast ? "text-slate-900 font-semibold" : "text-slate-400 font-normal"
                    }
                  >
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right Section: STOMP Badge, Notification Bell, Branch Selector & User Profile Menu */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        <WebSocketStatusBadge />
        <NotificationBell />

        {/* Branch Selector (Interactive dropdown for ADMIN/MANAGER, fixed badge for STAFF) */}
        {canSwitchBranch ? (
          <div className="relative" ref={branchMenuRef}>
            <button
              type="button"
              onClick={() => setIsBranchMenuOpen((prev) => !prev)}
              aria-expanded={isBranchMenuOpen}
              aria-haspopup="listbox"
              aria-label="Chọn chi nhánh hoạt động"
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:border-pink-300 bg-slate-50/60 hover:bg-white text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500/30 min-h-[44px]"
            >
              <div className="w-6 h-6 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="text-left hidden sm:block max-w-[140px] md:max-w-[200px] truncate">
                <p className="text-[10px] text-slate-400 font-medium leading-none mb-0.5">Chi nhánh</p>
                <p className="font-bold text-slate-800 truncate leading-none">
                  {isLoadingBranches ? "Đang tải..." : selectedBranch?.name || "Chọn chi nhánh"}
                </p>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isBranchMenuOpen ? "rotate-180 text-pink-600" : ""
                }`}
              />
            </button>

            {/* Branch Dropdown Menu */}
            {isBranchMenuOpen && (
              <div
                role="listbox"
                aria-label="Danh sách chi nhánh"
                className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">Chi nhánh hoạt động</p>
                  <p className="text-[11px] text-slate-400">
                    Chuyển đổi chi nhánh để quản lý kho và dịch vụ tương ứng
                  </p>
                </div>

                <div className="max-h-64 overflow-y-auto py-1">
                  {branches.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-slate-400 text-center">
                      {isLoadingBranches ? "Đang tải chi nhánh..." : "Không có chi nhánh khả dụng"}
                    </p>
                  ) : (
                    branches.map((b) => {
                      const isSelected = b.id === selectedBranchId;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelectBranch(b.id)}
                          className={`w-full flex items-start gap-3 px-3.5 py-2.5 text-left text-xs transition-colors cursor-pointer hover:bg-slate-50 ${
                            isSelected ? "bg-pink-50/70" : ""
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? "bg-pink-600 text-white shadow-xs"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p
                                className={`font-semibold truncate ${
                                  isSelected ? "text-pink-700" : "text-slate-800"
                                }`}
                              >
                                {b.name}
                              </p>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                              )}
                            </div>
                            {b.address && (
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {b.address}
                              </p>
                            )}
                            {b.phone && (
                              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5" />
                                <span>{b.phone}</span>
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Fixed branch badge for non-admin staff locked to assigned branch */
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 min-h-[44px]"
            title="Chi nhánh trực thuộc (Cố định theo tài khoản)"
          >
            <div className="w-6 h-6 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-left hidden sm:block max-w-[140px] truncate">
              <p className="text-[10px] text-slate-400 font-medium leading-none mb-0.5">Chi nhánh</p>
              <p className="font-bold text-slate-800 truncate leading-none">
                {selectedBranch?.name || user?.branchName || "Chi nhánh trực thuộc"}
              </p>
            </div>
            <Lock className="w-3 h-3 text-slate-400 ml-1" />
          </div>
        )}

        {/* User Profile Dropdown Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
            aria-label="Menu tài khoản người dùng"
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500/30 min-h-[44px]"
          >
            {/* User Avatar Initial */}
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
                isUserMenuOpen ? "rotate-180 text-pink-600" : ""
              }`}
            />
          </button>

          {/* User Menu Popover */}
          {isUserMenuOpen && (
            <div
              role="menu"
              aria-label="Tùy chọn tài khoản"
              className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              {/* User details card */}
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

              {/* Menu Actions */}
              <div className="py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer min-h-[44px]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất tài khoản</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
