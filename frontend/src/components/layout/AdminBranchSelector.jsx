import React, { useState, useRef, useEffect } from "react";
import { Building2, ChevronDown, Check, MapPin, Phone, Lock } from "lucide-react";

export function AdminBranchSelector({
  branches = [],
  selectedBranch,
  selectedBranchId,
  onSelectBranch,
  isLoadingBranches,
  canSwitchBranch,
  fallbackBranchName,
}) {
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

  if (!canSwitchBranch) {
    return (
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
            {selectedBranch?.name || fallbackBranchName || "Chi nhánh trực thuộc"}
          </p>
        </div>
        <Lock className="w-3 h-3 text-slate-400 ml-1" />
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
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
            isOpen ? "rotate-180 text-pink-600" : ""
          }`}
        />
      </button>

      {isOpen && (
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
                    onClick={() => {
                      onSelectBranch(b.id);
                      setIsOpen(false);
                    }}
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
                        <p className={`font-semibold truncate ${isSelected ? "text-pink-700" : "text-slate-800"}`}>
                          {b.name}
                        </p>
                        {isSelected && <Check className="w-3.5 h-3.5 text-pink-600 shrink-0" />}
                      </div>
                      {b.address && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{b.address}</p>
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
  );
}
