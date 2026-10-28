import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ATTENDANCE_STATUS,
  ATTENDANCE_ACTIONS,
  getAttendanceBadge,
  getShiftBadgeClasses,
} from "../features/pos/attendance.constants";
import { posApi } from "../api/posApi";
import { axiosClient } from "../api/axiosClient";

vi.mock("../api/axiosClient", () => ({
  axiosClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("POS Staff Attendance & PIN Timekeeping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Attendance Badges & Constants", () => {
    it("returns correct badge meta for PRESENT status", () => {
      const badge = getAttendanceBadge(ATTENDANCE_STATUS.PRESENT);
      expect(badge.label).toBe("Đang trực");
      expect(badge.badgeClass).toContain("emerald");
      expect(badge.dotClass).toContain("animate-pulse");
    });

    it("returns correct badge meta for ON_BREAK status", () => {
      const badge = getAttendanceBadge(ATTENDANCE_STATUS.ON_BREAK);
      expect(badge.label).toBe("Tạm nghỉ");
      expect(badge.badgeClass).toContain("amber");
    });

    it("returns correct badge meta for COMPLETED status", () => {
      const badge = getAttendanceBadge(ATTENDANCE_STATUS.COMPLETED);
      expect(badge.label).toBe("Đã tan ca");
      expect(badge.badgeClass).toContain("purple");
    });

    it("returns correct badge meta for ABSENT status", () => {
      const badge = getAttendanceBadge(ATTENDANCE_STATUS.ABSENT);
      expect(badge.label).toBe("Vắng mặt");
      expect(badge.badgeClass).toContain("rose");
    });

    it("returns 'Nghỉ (OFF)' badge when attendance is missing and isWorking is false", () => {
      const badge = getAttendanceBadge(null, false);
      expect(badge.label).toBe("Nghỉ (OFF)");
      expect(badge.badgeClass).toContain("slate-700");
    });

    it("returns 'Chưa vào ca' badge when attendance is missing and isWorking is true", () => {
      const badge = getAttendanceBadge(null, true);
      expect(badge.label).toBe("Chưa vào ca");
    });

    it("formats shift badge styling correctly across shift templates", () => {
      expect(getShiftBadgeClasses("MORNING")).toContain("amber");
      expect(getShiftBadgeClasses("AFTERNOON")).toContain("indigo");
      expect(getShiftBadgeClasses("FULL_DAY")).toContain("emerald");
      expect(getShiftBadgeClasses("OFF")).toContain("slate");
    });
  });

  describe("POS Attendance API Client", () => {
    it("calls GET /pos/attendance/today with branchId", async () => {
      const mockResult = [
        {
          userId: 10,
          fullName: "Stylist Test",
          shiftCode: "MORNING",
          attendanceStatus: "PRESENT",
          overtimeMinutes: 0,
        },
      ];
      axiosClient.get.mockResolvedValueOnce({ result: mockResult });

      const data = await posApi.getTodayAttendance(1);
      expect(axiosClient.get).toHaveBeenCalledWith("/pos/attendance/today", {
        params: { branchId: 1 },
      });
      expect(data).toEqual(mockResult);
    });

    it("calls POST /pos/attendance/action with payload", async () => {
      const actionPayload = {
        branchId: 1,
        userId: 10,
        action: ATTENDANCE_ACTIONS.CLOCK_IN,
        pin: "1234",
      };
      const mockResult = {
        userId: 10,
        attendanceStatus: "PRESENT",
        clockInAt: "2026-10-28T08:32:00",
      };
      axiosClient.post.mockResolvedValueOnce({ result: mockResult });

      const data = await posApi.submitAttendanceAction(actionPayload);
      expect(axiosClient.post).toHaveBeenCalledWith("/pos/attendance/action", actionPayload);
      expect(data).toEqual(mockResult);
    });
  });

  describe("Personal Weekly Schedule Mapping", () => {
    it("processes 7-day weekly schedule summary correctly", () => {
      const weeklySchedule = [
        { date: "2026-10-26", dayOfWeek: "T2", shiftCode: "MORNING", isWorking: true, attendanceStatus: "COMPLETED" },
        { date: "2026-10-27", dayOfWeek: "T3", shiftCode: "AFTERNOON", isWorking: true, attendanceStatus: "COMPLETED" },
        { date: "2026-10-28", dayOfWeek: "T4", shiftCode: "MORNING", isWorking: true, attendanceStatus: "PRESENT" },
        { date: "2026-10-29", dayOfWeek: "T5", shiftCode: "OFF", isWorking: false, attendanceStatus: null },
        { date: "2026-10-30", dayOfWeek: "T6", shiftCode: "FULL_DAY", isWorking: true, attendanceStatus: null },
        { date: "2026-10-31", dayOfWeek: "T7", shiftCode: "MORNING", isWorking: true, attendanceStatus: null },
        { date: "2026-11-01", dayOfWeek: "CN", shiftCode: "OFF", isWorking: false, attendanceStatus: null },
      ];

      expect(weeklySchedule).toHaveLength(7);
      const workingDays = weeklySchedule.filter((d) => d.isWorking);
      expect(workingDays).toHaveLength(5);

      const completedDays = weeklySchedule.filter((d) => d.attendanceStatus === "COMPLETED");
      expect(completedDays).toHaveLength(2);

      const today = weeklySchedule.find((d) => d.date === "2026-10-28");
      expect(today?.shiftCode).toBe("MORNING");
      expect(today?.attendanceStatus).toBe("PRESENT");
    });
  });
});
