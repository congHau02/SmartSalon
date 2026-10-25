import React from "react";
import { TIER_CONFIG } from "../../features/customer/customer.constants";

export function MembershipTierBadge({
  tier = "STANDARD",
  showDiscount = false,
  showName = true,
  size = "sm",
  className = "",
}) {
  const normalizedTier = tier?.toUpperCase() || "STANDARD";
  const config = TIER_CONFIG[normalizedTier] || TIER_CONFIG.STANDARD;
  const Icon = config.icon;

  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0.5 gap-1",
    sm: "text-xs px-2 py-0.5 gap-1.5",
    md: "text-sm px-2.5 py-1 gap-2",
  }[size] || "text-xs px-2 py-0.5 gap-1.5";

  const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
  }[size] || "w-3.5 h-3.5";

  return (
    <span
      className={`inline-flex items-center font-bold border rounded-full uppercase tracking-wider ${config.badgeClass} ${sizeClasses} ${className}`}
      title={`Hạng thành viên: ${config.label} (${config.discountPercent}% ưu đãi)`}
    >
      <Icon className={`${iconSizes} shrink-0`} />
      {showName && <span>{config.label}</span>}
      {showDiscount && config.discountPercent > 0 && (
        <span className="opacity-80 font-semibold text-[90%]">
          -{config.discountPercent}%
        </span>
      )}
    </span>
  );
}
