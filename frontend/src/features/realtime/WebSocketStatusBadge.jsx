import React from "react";
import { Wifi, WifiOff } from "lucide-react";
import { useRealtime } from "./RealtimeContext";

export function WebSocketStatusBadge() {
  const { connectionStatus, selectedBranchName } = useRealtime();

  const isConnected = connectionStatus === "connected";

  return (
    <div
      className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
        isConnected
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-amber-50 text-amber-700 border-amber-200"
      }`}
      title={
        isConnected
          ? `STOMP WebSocket đang trực tiếp đồng bộ chi nhánh: ${selectedBranchName || "Tất cả"}`
          : "Đang kết nối lại STOMP WebSocket..."
      }
    >
      <span className="relative flex h-2 w-2">
        {isConnected && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isConnected ? "bg-emerald-500" : "bg-amber-500"
          }`}
        />
      </span>
      {isConnected ? (
        <span className="text-[11px] font-bold">STOMP Live</span>
      ) : (
        <span className="text-[11px] font-bold">Kết nối lại</span>
      )}
    </div>
  );
}
