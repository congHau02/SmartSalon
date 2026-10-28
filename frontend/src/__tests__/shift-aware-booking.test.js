import { describe, it, expect, vi } from "vitest";
import { bookingApi } from "../features/booking/bookingApi";
import { BOOKING_QUERY_KEYS } from "../features/booking/useBooking";
import { axiosClient } from "../api/axiosClient";

describe("Phase 10 - Issue 02: Shift-Aware Slot Calculation Engine & 60-Minute Overtime Window", () => {
  describe("bookingApi.getStylists with date-aware shifts", () => {
    it("passes branchId and date query parameters when both are provided", async () => {
      const getSpy = vi.spyOn(axiosClient, "get").mockResolvedValueOnce({
        result: [
          {
            id: 1,
            fullName: "Nguyễn Văn Stylist",
            shiftCode: "MORNING",
            shiftName: "Ca Sáng",
            shiftStartTime: "08:30:00",
            shiftEndTime: "15:00:00",
            maxOvertimeMinutes: 60,
            isWorking: true,
          },
        ],
      });

      const res = await bookingApi.getStylists(10, "2026-11-05");
      expect(getSpy).toHaveBeenCalledWith("/bookings/stylists", {
        params: { branchId: 10, date: "2026-11-05" },
      });
      expect(res).toHaveLength(1);
      expect(res[0].shiftCode).toBe("MORNING");
      expect(res[0].shiftName).toBe("Ca Sáng");
      expect(res[0].isWorking).toBe(true);

      getSpy.mockRestore();
    });

    it("omits date parameter when date is undefined for backward compatibility", async () => {
      const getSpy = vi.spyOn(axiosClient, "get").mockResolvedValueOnce({
        result: [],
      });

      await bookingApi.getStylists(5);
      expect(getSpy).toHaveBeenCalledWith("/bookings/stylists", {
        params: { branchId: 5 },
      });

      getSpy.mockRestore();
    });
  });

  describe("BOOKING_QUERY_KEYS.stylists", () => {
    it("isolates stylist query caches by branchId and date", () => {
      const keyToday = BOOKING_QUERY_KEYS.stylists(1, "2026-10-28");
      const keyTomorrow = BOOKING_QUERY_KEYS.stylists(1, "2026-10-29");
      const keyBranch2 = BOOKING_QUERY_KEYS.stylists(2, "2026-10-28");

      expect(keyToday).toEqual(["booking", "stylists", 1, "2026-10-28"]);
      expect(keyTomorrow).toEqual(["booking", "stylists", 1, "2026-10-29"]);
      expect(keyBranch2).toEqual(["booking", "stylists", 2, "2026-10-28"]);

      // Cache keys must differ
      expect(keyToday).not.toEqual(keyTomorrow);
      expect(keyToday).not.toEqual(keyBranch2);
    });

    it("gracefully falls back to empty string when date is omitted", () => {
      const key = BOOKING_QUERY_KEYS.stylists(1);
      expect(key).toEqual(["booking", "stylists", 1, ""]);
    });
  });

  describe("Shift Overtime Window Eligibility Logic (Domain Rules)", () => {
    // Pure domain evaluation function matching backend ShiftSlotEligibilityHelper
    function isSlotEligible({
      slotStartTimeStr,
      durationMinutes,
      shiftStartTimeStr,
      shiftEndTimeStr,
      maxOvertimeMinutes = 0,
      isWorking = true,
      closingTimeStr = "20:30",
    }) {
      if (!isWorking) return false;

      const toMinutes = (timeStr) => {
        const [h, m] = timeStr.split(":").map(Number);
        return h * 60 + m;
      };

      const slotStart = toMinutes(slotStartTimeStr);
      const slotEnd = slotStart + durationMinutes;
      const shiftStart = toMinutes(shiftStartTimeStr);
      const shiftEnd = toMinutes(shiftEndTimeStr);
      const closing = toMinutes(closingTimeStr);

      const maxAllowedEnd = Math.min(closing, shiftEnd + maxOvertimeMinutes);

      // 1. Strict shift start: slotStartTime >= shift.startTime and slotStartTime < shift.endTime
      if (slotStart < shiftStart || slotStart >= shiftEnd) {
        return false;
      }

      // 2. Overtime slot window: slotEndTime <= min(20:30, shift.endTime + shift.maxOvertimeMinutes)
      if (slotEnd > maxAllowedEnd) {
        return false;
      }

      return true;
    }

    it("Ca Sáng 08:30–15:00 (+60p OT): 90m service at 14:00 (ends 15:30 <= 16:00) is AVAILABLE", () => {
      const eligible = isSlotEligible({
        slotStartTimeStr: "14:00",
        durationMinutes: 90,
        shiftStartTimeStr: "08:30",
        shiftEndTimeStr: "15:00",
        maxOvertimeMinutes: 60,
        isWorking: true,
      });
      expect(eligible).toBe(true);
    });

    it("Ca Sáng 08:30–15:00 (+60p OT): 150m service at 14:00 (ends 16:30 > 16:00) is BLOCKED", () => {
      const eligible = isSlotEligible({
        slotStartTimeStr: "14:00",
        durationMinutes: 150,
        shiftStartTimeStr: "08:30",
        shiftEndTimeStr: "15:00",
        maxOvertimeMinutes: 60,
        isWorking: true,
      });
      expect(eligible).toBe(false);
    });

    it("Ca Sáng 08:30–15:00: slot starting at 15:00 is BLOCKED (starts at/after shift end)", () => {
      const eligible = isSlotEligible({
        slotStartTimeStr: "15:00",
        durationMinutes: 30,
        shiftStartTimeStr: "08:30",
        shiftEndTimeStr: "15:00",
        maxOvertimeMinutes: 60,
        isWorking: true,
      });
      expect(eligible).toBe(false);
    });

    it("Ca Sáng 08:30–15:00: slot starting at 08:00 is BLOCKED (starts before shift start)", () => {
      const eligible = isSlotEligible({
        slotStartTimeStr: "08:00",
        durationMinutes: 30,
        shiftStartTimeStr: "08:30",
        shiftEndTimeStr: "15:00",
        maxOvertimeMinutes: 60,
        isWorking: true,
      });
      expect(eligible).toBe(false);
    });

    it("Ca Chiều 14:00–20:30 (maxOvertime 0): service ending at 21:00 is BLOCKED by salon closing time (20:30)", () => {
      const eligible = isSlotEligible({
        slotStartTimeStr: "20:00",
        durationMinutes: 60,
        shiftStartTimeStr: "14:00",
        shiftEndTimeStr: "20:30",
        maxOvertimeMinutes: 0,
        isWorking: true,
        closingTimeStr: "20:30",
      });
      expect(eligible).toBe(false);
    });

    it("Stylist scheduled OFF is blocked for any slot on that date", () => {
      const eligible = isSlotEligible({
        slotStartTimeStr: "10:00",
        durationMinutes: 30,
        shiftStartTimeStr: "08:30",
        shiftEndTimeStr: "15:00",
        maxOvertimeMinutes: 60,
        isWorking: false,
      });
      expect(eligible).toBe(false);
    });
  });
});
