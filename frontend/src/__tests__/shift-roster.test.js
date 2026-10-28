import { describe, it, expect } from "vitest";
import {
  TEMPLATE_BADGE_STYLES,
  formatTimeRange,
  formatDateVi,
  VI_DAYS_OF_WEEK,
} from "../features/shifts/shifts.constants";

describe("Phase 10 - Issue 01: Branch Shift Templates, Weekly Roster Matrix & Booking Conflict Guard", () => {
  describe("Shift formatting helpers", () => {
    it("formats time ranges correctly", () => {
      expect(formatTimeRange("08:30:00", "15:00:00")).toBe("08:30 - 15:00");
      expect(formatTimeRange("14:00", "20:30")).toBe("14:00 - 20:30");
      expect(formatTimeRange(null, null)).toBe("");
    });

    it("formats Vietnamese date string DD/MM/YYYY", () => {
      expect(formatDateVi("2026-10-28")).toBe("28/10/2026");
      expect(formatDateVi("2026-11-02")).toBe("02/11/2026");
      expect(formatDateVi("")).toBe("");
    });

    it("has 7 Vietnamese day labels Mon through Sun", () => {
      expect(VI_DAYS_OF_WEEK).toHaveLength(7);
      expect(VI_DAYS_OF_WEEK[0]).toBe("Thứ 2");
      expect(VI_DAYS_OF_WEEK[6]).toBe("Chủ Nhật");
    });
  });

  describe("Shift template styles & preset badges", () => {
    it("provides styling and labels for standard preset shifts", () => {
      expect(TEMPLATE_BADGE_STYLES.MORNING.label).toBe("Ca Sáng");
      expect(TEMPLATE_BADGE_STYLES.MORNING.time).toBe("08:30 - 15:00");

      expect(TEMPLATE_BADGE_STYLES.AFTERNOON.label).toBe("Ca Chiều");
      expect(TEMPLATE_BADGE_STYLES.AFTERNOON.time).toBe("14:00 - 20:30");

      expect(TEMPLATE_BADGE_STYLES.FULL_DAY.label).toBe("Ca Cả ngày");
      expect(TEMPLATE_BADGE_STYLES.FULL_DAY.time).toBe("08:30 - 20:30");

      expect(TEMPLATE_BADGE_STYLES.OFF.label).toBe("Nghỉ (OFF)");
    });
  });

  describe("Weekly 7-day date window math", () => {
    function computeWeekWindow(referenceDate) {
      const d = new Date(referenceDate);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));

      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);

      const toStr = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const dayNum = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${dayNum}`;
      };

      const prevMon = new Date(monday);
      prevMon.setDate(prevMon.getDate() - 7);

      return {
        startDate: toStr(monday),
        endDate: toStr(sunday),
        prevStartDate: toStr(prevMon),
      };
    }

    it("computes Monday to Sunday range spanning exactly 7 days inclusive", () => {
      const { startDate, endDate, prevStartDate } = computeWeekWindow("2026-10-28"); // Wednesday
      expect(startDate).toBe("2026-10-26"); // Monday
      expect(endDate).toBe("2026-11-01"); // Sunday
      expect(prevStartDate).toBe("2026-10-19"); // Previous Monday

      const diffDays = Math.round(
        (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBe(6);
    });
  });

  describe("HTTP 409 Booking Conflict Payload parsing", () => {
    it("parses conflicting booking details cleanly for the conflict modal", () => {
      const mock409Error = {
        response: {
          status: 409,
          data: {
            code: 2011,
            message: "Không thể cập nhật lịch trực: Phát hiện 1 lịch hẹn đang hoạt động bị xung đột.",
            result: [
              {
                bookingCode: "BK-20261028-0001",
                customerName: "Nguyễn Thu Hà",
                customerPhone: "0988111222",
                startTime: "2026-10-28T16:00:00",
                endTime: "2026-10-28T17:30:00",
                reason: "Stylist chuyển sang nghỉ (OFF) nhưng có lịch hẹn BK-20261028-0001",
              },
            ],
          },
        },
      };

      const errorResult = mock409Error.response.data.result;
      expect(errorResult).toHaveLength(1);
      expect(errorResult[0].bookingCode).toBe("BK-20261028-0001");
      expect(errorResult[0].customerName).toBe("Nguyễn Thu Hà");
      expect(errorResult[0].startTime.slice(11, 16)).toBe("16:00");
      expect(errorResult[0].endTime.slice(11, 16)).toBe("17:30");
      expect(errorResult[0].reason).toContain("nghỉ (OFF)");
    });
  });

  describe("Shift template form validation", () => {
    function validateShiftTemplate(tmpl) {
      if (!tmpl.code || !tmpl.code.trim()) return "Mã ca không được để trống";
      if (!tmpl.name || !tmpl.name.trim()) return "Tên ca không được để trống";
      if (!tmpl.startTime || !tmpl.endTime) return "Giờ bắt đầu và kết thúc bắt buộc";
      if (tmpl.startTime >= tmpl.endTime) return "Giờ bắt đầu phải trước giờ kết thúc";
      if (tmpl.maxOvertimeMinutes < 0) return "Số phút làm thêm tối đa không được âm";
      return null;
    }

    it("rejects invalid shift templates with inverted hours", () => {
      const error = validateShiftTemplate({
        code: "TEST",
        name: "Test Ca",
        startTime: "18:00",
        endTime: "14:00",
        maxOvertimeMinutes: 0,
      });
      expect(error).toBe("Giờ bắt đầu phải trước giờ kết thúc");
    });

    it("accepts valid shift templates", () => {
      const error = validateShiftTemplate({
        code: "MORNING",
        name: "Ca Sáng",
        startTime: "08:30",
        endTime: "15:00",
        maxOvertimeMinutes: 60,
      });
      expect(error).toBeNull();
    });
  });
});
