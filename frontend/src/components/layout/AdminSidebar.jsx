import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Sparkles, X, Building2 } from "lucide-react";
import { useBranch } from "../../features/branch/useBranch";
import { ADMIN_NAV_GROUPS } from "../../lib/navigation";

export function AdminSidebar({ isOpen, onClose }) {
  const { selectedBranch } = useBranch();
  const location = useLocation();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          role="presentation"
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="admin-sidebar"
        aria-label="Thanh điều hướng quản trị"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:shadow-none"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-400 text-white flex items-center justify-center shadow-md shadow-pink-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                  Smart<span className="text-pink-600">Salon</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-pink-50 text-pink-700 border border-pink-200/60">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Hệ thống Quản trị Salon</p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng thanh điều hướng"
            className="lg:hidden w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Group Items */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {ADMIN_NAV_GROUPS.map((group) => (
            <div key={group.groupTitle} className="space-y-1">
              <h2 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {group.groupTitle}
              </h2>
              <div className="space-y-1 pt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.to === "/admin"
                      ? location.pathname === "/" || location.pathname === "/admin"
                      : location.pathname === item.to || location.pathname.startsWith(item.to + "/");

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive: navActive }) => {
                        const active = isActive || navActive;
                        return `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500/30 ${
                          active
                            ? "bg-pink-50 text-pink-700 font-bold border border-pink-200/80 shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`;
                      }}
                    >
                      {({ isActive: navActive }) => {
                        const active = isActive || navActive;
                        return (
                          <>
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                active
                                  ? "text-pink-600"
                                  : "text-slate-400 group-hover:text-slate-600"
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </>
                        );
                      }}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: Active Branch Snapshot */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Chi nhánh hoạt động
              </p>
              <p className="text-xs font-bold text-slate-800 truncate" title={selectedBranch?.name}>
                {selectedBranch ? selectedBranch.name : "Đang tải chi nhánh..."}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
