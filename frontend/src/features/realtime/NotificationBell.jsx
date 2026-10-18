import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  CalendarPlus,
  RefreshCw,
  Scissors,
  Volume2,
  VolumeX,
  Check,
  Trash2,
  ExternalLink,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useRealtime } from "./RealtimeContext";
import { formatDate } from "../../lib/utils";

export function NotificationBell() {
  const {
    connectionStatus,
    selectedBranchName,
    notifications,
    unreadCount,
    isSoundEnabled,
    toggleSound,
    markAllAsRead,
    markAsRead,
    clearAll,
  } = useRealtime();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Close when clicking outside or pressing Escape
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

  const handleOpenBooking = (notification) => {
    markAsRead(notification.id);
    setIsOpen(false);
    if (notification.channelType === "dispatch") {
      navigate(`/pos`);
    } else {
      navigate(`/admin/bookings`);
    }
  };

  const getEventBadge = (eventType) => {
    switch (eventType) {
      case "BOOKING_CREATED":
        return {
          icon: CalendarPlus,
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          tag: "Lịch hẹn mới",
        };
      case "BOOKING_CONFIRMED":
        return {
          icon: CheckCircle2,
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          tag: "Đã cọc 20%",
        };
      case "BOOKING_STATUS_CHANGED":
        return {
          icon: RefreshCw,
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          tag: "Đổi trạng thái",
        };
      default:
        return {
          icon: Scissors,
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          tag: "Điều phối",
        };
    }
  };

  const isConnected = connectionStatus === "connected";

  return (
    <div className="relative" ref={menuRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Thông báo thời gian thực"
        className="relative w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 hover:border-pink-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500/30"
      >
        <Bell className="w-5 h-5" />

        {/* Live WebSocket Connection Dot */}
        <span
          className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
            isConnected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
          }`}
          title={isConnected ? "WebSocket STOMP: Đã kết nối" : "WebSocket STOMP: Đang kết nối..."}
        />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-pink-600 text-white font-bold text-[10px] flex items-center justify-center shadow-xs animate-in zoom-in-50 duration-200">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Hộp thông báo trực tiếp"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-800"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900">Thông báo trực tiếp</span>
              {/* Connection Status Pill */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  isConnected
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {isConnected ? (
                  <>
                    <Wifi className="w-2.5 h-2.5 text-emerald-600" />
                    <span>STOMP Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-2.5 h-2.5 text-amber-600" />
                    <span>Kết nối lại...</span>
                  </>
                )}
              </span>
            </div>

            {/* Header Action Tools */}
            <div className="flex items-center gap-1.5">
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={toggleSound}
                title={isSoundEnabled ? "Tắt âm báo chime" : "Bật âm báo chime"}
                className={`min-w-[36px] min-h-[36px] w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  isSoundEnabled
                    ? "text-pink-600 hover:bg-pink-50"
                    : "text-slate-400 hover:bg-slate-200"
                }`}
                aria-label={isSoundEnabled ? "Tắt âm báo" : "Bật âm báo"}
              >
                {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Mark all as read */}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  title="Đánh dấu tất cả đã đọc"
                  className="min-w-[36px] min-h-[36px] w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                  aria-label="Đánh dấu tất cả đã đọc"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}

              {/* Clear all */}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  title="Xóa danh sách thông báo"
                  className="min-w-[36px] min-h-[36px] w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  aria-label="Xóa danh sách thông báo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Branch scope info bar */}
          {selectedBranchName && (
            <div className="px-4 py-1.5 bg-pink-50/50 border-b border-pink-100/50 text-[11px] text-pink-700 flex items-center justify-between">
              <span className="truncate">Theo dõi: {selectedBranchName}</span>
              <span className="shrink-0 font-medium text-[10px] text-pink-500">Phạm vi Chi nhánh</span>
            </div>
          )}

          {/* Notification List Feed */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700">Chưa có thông báo nào</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Lịch hẹn mới và thanh toán cọc sẽ hiển thị tức thì tại đây qua WebSocket STOMP
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const badge = getEventBadge(notif.eventType);
                const IconComponent = badge.icon;
                return (
                  <div
                    key={notif.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenBooking(notif)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleOpenBooking(notif);
                      }
                    }}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50 focus:outline-none focus:bg-pink-50/40 ${
                      !notif.isRead ? "bg-pink-50/30" : ""
                    }`}
                  >
                    {/* Icon Category Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${badge.bg}`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border ${badge.bg}`}
                        >
                          {badge.tag}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(notif.timestamp, "HH:mm")}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Code Pill */}
                      {notif.code && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400 font-mono">
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                            {notif.code}
                          </span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/admin/bookings");
                }}
                className="text-xs font-bold text-pink-600 hover:text-pink-700 transition-colors cursor-pointer"
              >
                Mở sổ quản lý lịch hẹn →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
