import React, { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";
import { useBranch } from "../../features/branch/useBranch";
import { getBreadcrumbTrail } from "../../lib/navigation";
import { NotificationBell, WebSocketStatusBadge } from "../../features/realtime";
import { AdminBreadcrumb } from "./AdminBreadcrumb";
import { AdminBranchSelector } from "./AdminBranchSelector";
import { AdminUserMenu } from "./AdminUserMenu";

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

  const breadcrumbs = useMemo(() => getBreadcrumbTrail(location.pathname), [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left Section: Mobile toggle & Hierarchical Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Mở menu điều hướng"
          className="lg:hidden w-11 h-11 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <AdminBreadcrumb breadcrumbs={breadcrumbs} />
      </div>

      {/* Right Section: STOMP Badge, Notification Bell, Branch Selector & User Profile Menu */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        <WebSocketStatusBadge />
        <NotificationBell />

        <AdminBranchSelector
          branches={branches}
          selectedBranch={selectedBranch}
          selectedBranchId={selectedBranchId}
          onSelectBranch={setSelectedBranchId}
          isLoadingBranches={isLoadingBranches}
          canSwitchBranch={canSwitchBranch}
          fallbackBranchName={user?.branchName}
        />

        <AdminUserMenu user={user} onLogout={handleLogout} />
      </div>
    </header>
  );
}
