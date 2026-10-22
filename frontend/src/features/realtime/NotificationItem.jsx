import React from "react";
import { ExternalLink } from "lucide-react";
import { formatDate } from "../../lib/utils";

export function NotificationItem({ notification, onSelect, badge }) {
  const IconComponent = badge.icon;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(notification)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(notification);
        }
      }}
      className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50 focus:outline-none focus:bg-pink-50/40 ${
        !notification.isRead ? "bg-pink-50/30" : ""
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
            {formatDate(notification.timestamp, "HH:mm")}
          </span>
        </div>

        <p className="text-xs font-bold text-slate-900 truncate leading-tight">
          {notification.title}
        </p>
        <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
          {notification.message}
        </p>

        {/* Code Pill */}
        {notification.code && (
          <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400 font-mono">
            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
              {notification.code}
            </span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </div>
        )}
      </div>
    </div>
  );
}
