import React from "react";
import { Wifi, WifiOff, Volume2, VolumeX, Check, Trash2 } from "lucide-react";

export function NotificationDropdownHeader({
  realtime,
  isConnected = realtime?.isConnected ?? (realtime?.connectionStatus === "CONNECTED"),
  isSoundEnabled = realtime?.isSoundEnabled,
  toggleSound = realtime?.toggleSound,
  unreadCount = realtime?.unreadCount,
  markAllAsRead = realtime?.markAllAsRead,
  hasNotifications = realtime?.hasNotifications ?? (realtime?.notifications?.length > 0),
  clearAll = realtime?.clearAll,
  selectedBranchName = realtime?.selectedBranchName,
}) {
  return (
    <>
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-slate-900">Thông báo trực tiếp</span>
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

        <div className="flex items-center gap-1.5">
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

          {hasNotifications && (
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

      {selectedBranchName && (
        <div className="px-4 py-1.5 bg-pink-50/50 border-b border-pink-100/50 text-[11px] text-pink-700 flex items-center justify-between">
          <span className="truncate">Theo dõi: {selectedBranchName}</span>
          <span className="shrink-0 font-medium text-[10px] text-pink-500">Phạm vi Chi nhánh</span>
        </div>
      )}
    </>
  );
}
