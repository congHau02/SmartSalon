import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  CalendarPlus,
  RefreshCw,
  Scissors,
} from "lucide-react";
import { useRealtime } from "./RealtimeContext";
import { NotificationDropdownHeader } from "./NotificationDropdownHeader";
import { NotificationItem } from "./NotificationItem";

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
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Thông báo thời gian thực"
        className="relative w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 hover:border-pink-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500/30"
      >
        <Bell className="w-5 h-5" />

        <span
          className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
            isConnected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
          }`}
          title={isConnected ? "WebSocket STOMP: Đã kết nối" : "WebSocket STOMP: Đang kết nối..."}
        />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-pink-600 text-white font-bold text-[10px] flex items-center justify-center shadow-xs animate-in zoom-in-50 duration-200">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Hộp thông báo trực tiếp"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-800"
        >
          <NotificationDropdownHeader
            realtime={{
              isConnected,
              isSoundEnabled,
              toggleSound,
              unreadCount,
              markAllAsRead,
              hasNotifications: notifications.length > 0,
              clearAll,
              selectedBranchName,
            }}
          />

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
              notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onSelect={handleOpenBooking}
                  badge={getEventBadge(notif.eventType)}
                />
              ))
            )}
          </div>

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
