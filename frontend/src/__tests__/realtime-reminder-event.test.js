import { describe, it, expect } from "vitest";
import { getEventBadge } from "../features/realtime/NotificationBell";
import { Clock, CalendarPlus, CheckCircle2, RefreshCw, Scissors } from "lucide-react";

describe("Phase 11 - Ticket 04: 24h Booking Reminder Event Badge Mapping", () => {
  it("maps BOOKING_REMINDER_DUE to 24h reminder badge with Clock icon and rose color theme", () => {
    const badge = getEventBadge("BOOKING_REMINDER_DUE");
    expect(badge.tag).toBe("Nhắc hẹn 24h");
    expect(badge.bg).toContain("bg-rose-50");
    expect(badge.bg).toContain("text-rose-700");
    expect(badge.icon).toBe(Clock);
  });

  it("retains existing event badge mappings correctly", () => {
    expect(getEventBadge("BOOKING_CREATED")).toMatchObject({
      tag: "Lịch hẹn mới",
      icon: CalendarPlus,
    });
    expect(getEventBadge("BOOKING_CONFIRMED")).toMatchObject({
      tag: "Đã cọc 20%",
      icon: CheckCircle2,
    });
    expect(getEventBadge("BOOKING_STATUS_CHANGED")).toMatchObject({
      tag: "Đổi trạng thái",
      icon: RefreshCw,
    });
    expect(getEventBadge("UNKNOWN_EVENT")).toMatchObject({
      tag: "Điều phối",
      icon: Scissors,
    });
  });
});
