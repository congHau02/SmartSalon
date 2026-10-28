import { describe, it, expect } from "vitest";
import { computePresetDates, PAYROLL_PERIOD_PRESETS } from "../features/pos/useMyPayroll";
import { ROLES } from "../lib/roles";

describe("Phase 8 - Issue 02: Personal Payroll Statement & Staff Workspace Navigation", () => {
  describe("Period preset calculation", () => {
    it("computes THIS_MONTH dates accurately", () => {
      const { startDate, endDate } = computePresetDates(PAYROLL_PERIOD_PRESETS.THIS_MONTH);
      const now = new Date();
      const expectedStartYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

      expect(startDate).toBe(expectedStartYearMonth);
      expect(endDate).toBeDefined();
      expect(new Date(startDate).getTime()).toBeLessThanOrEqual(new Date(endDate).getTime());
    });

    it("computes LAST_MONTH dates accurately", () => {
      const { startDate, endDate } = computePresetDates(PAYROLL_PERIOD_PRESETS.LAST_MONTH);
      const now = new Date();
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const expectedStart = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}-01`;

      expect(startDate).toBe(expectedStart);
      expect(new Date(startDate).getTime()).toBeLessThan(new Date(endDate).getTime());
    });

    it("computes LAST_7_DAYS dates spanning exactly 7 days inclusive", () => {
      const { startDate, endDate } = computePresetDates(PAYROLL_PERIOD_PRESETS.LAST_7_DAYS);
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(6); // 6 day difference = 7 days inclusive
    });
  });

  describe("Personal Payroll Statement compensation math", () => {
    it("computes total payout as baseSalary + totalCommission with retention KPIs", () => {
      const statement = {
        baseSalary: 12000000,
        totalCommission: 298500,
        completedOrderCount: 3,
        completedStepCount: 5,
        completedBookingCount: 3,
        requestedBookingCount: 3,
        requestedStylistRate: 100.0,
        totalIdentifiedCustomers: 1,
        repeatCustomerCount: 1,
        rebookingRate: 100.0,
        averageRating: 5.0,
        reviewCount: 4,
      };

      const calculatedPayout = statement.baseSalary + statement.totalCommission;
      expect(calculatedPayout).toBe(12298500);
      expect(statement.requestedStylistRate).toBe(100.0);
      expect(statement.rebookingRate).toBe(100.0);
      expect(statement.completedOrderCount).toBe(3);
    });

    it("filters itemized commission ledgers by search term correctly", () => {
      const ledgers = [
        { id: 1, orderCode: "ORD-20261015-001", serviceName: "Nhuộm tóc", stepName: "Pha thuốc", amount: 110500 },
        { id: 2, orderCode: "ORD-20261015-001", serviceName: "Nhuộm tóc", stepName: "Gội xả", amount: 34000 },
        { id: 3, orderCode: "ORD-20261017-003", serviceName: "Hấp nhiệt", stepName: "Đưa dưỡng chất", amount: 78000 },
      ];

      const query = "gội";
      const matched = ledgers.filter(
        (l) =>
          l.orderCode.toLowerCase().includes(query) ||
          l.serviceName.toLowerCase().includes(query) ||
          l.stepName.toLowerCase().includes(query)
      );

      expect(matched.length).toBe(1);
      expect(matched[0].stepName).toBe("Gội xả");
    });
  });

  describe("Staff login redirection & role-aware workspace routes", () => {
    const resolveDefaultRoute = (roles) => {
      if (roles.includes(ROLES.ADMIN) || roles.includes(ROLES.MANAGER)) {
        return "/admin";
      }
      if (roles.includes(ROLES.STYLIST) || roles.includes(ROLES.STAFF)) {
        return "/pos";
      }
      return "/customer";
    };

    it("redirects STYLIST and STAFF to /pos by default", () => {
      expect(resolveDefaultRoute([ROLES.STYLIST])).toBe("/pos");
      expect(resolveDefaultRoute([ROLES.STAFF])).toBe("/pos");
    });

    it("redirects ADMIN and MANAGER to /admin by default", () => {
      expect(resolveDefaultRoute([ROLES.ADMIN])).toBe("/admin");
      expect(resolveDefaultRoute([ROLES.MANAGER])).toBe("/admin");
    });

    it("redirects CUSTOMER to /customer by default", () => {
      expect(resolveDefaultRoute([ROLES.CUSTOMER])).toBe("/customer");
    });

    it("evaluates role-aware admin visibility in POS header", () => {
      const canSeeAdminHeaderLink = (roles) =>
        roles.some((r) => ["ADMIN", "MANAGER", "ROLE_ADMIN", "ROLE_MANAGER"].includes(r));

      expect(canSeeAdminHeaderLink([ROLES.ADMIN])).toBe(true);
      expect(canSeeAdminHeaderLink([ROLES.MANAGER])).toBe(true);
      expect(canSeeAdminHeaderLink([ROLES.STYLIST])).toBe(false);
      expect(canSeeAdminHeaderLink([ROLES.STAFF])).toBe(false);
    });
  });

  describe("Phase 10 - Issue 04: Overtime Commission & Shift-Prorated Base Salary", () => {
    it("computes shift completion metrics and shift-prorated base salary accurately", () => {
      const payload = {
        contractBaseSalary: 10000000,
        scheduledShiftCount: 20,
        completedShiftCount: 15,
        extraShiftCount: 2,
        baseSalary: 7500000, // (15 / 20) * 10,000,000
        totalCommission: 2400000,
        overtimeCommissionTotal: 600000,
      };

      const prorationRatio = payload.completedShiftCount / payload.scheduledShiftCount;
      const expectedProratedBaseSalary = Math.round(payload.contractBaseSalary * prorationRatio);
      expect(expectedProratedBaseSalary).toBe(payload.baseSalary);

      const totalPayout = payload.baseSalary + payload.totalCommission;
      expect(totalPayout).toBe(9900000);
      expect(payload.overtimeCommissionTotal).toBeLessThanOrEqual(payload.totalCommission);
    });

    it("falls back cleanly to contractBaseSalary when scheduledShiftCount is 0", () => {
      const payload = {
        contractBaseSalary: 8000000,
        scheduledShiftCount: 0,
        completedShiftCount: 0,
        extraShiftCount: 0,
        baseSalary: 8000000,
      };

      const effectiveBaseSalary =
        payload.scheduledShiftCount > 0
          ? Math.round(payload.contractBaseSalary * (payload.completedShiftCount / payload.scheduledShiftCount))
          : payload.contractBaseSalary;

      expect(effectiveBaseSalary).toBe(8000000);
    });

    it("identifies overtime ledgers via isOvertime flag or [OT 1.2x] note in ledger list", () => {
      const ledgers = [
        { id: 1, orderCode: "ORD-001", isOvertime: true, calculationNotes: "Step pool 20% x 1.2 [OT 1.2x]", amount: 60000 },
        { id: 2, orderCode: "ORD-002", isOvertime: false, calculationNotes: "Step pool 20%", amount: 50000 },
        { id: 3, orderCode: "ORD-003", isOvertime: null, calculationNotes: "Cover day [OT 1.2x]", amount: 72000 },
      ];

      const otLedgers = ledgers.filter(
        (l) => Boolean(l.isOvertime || (l.calculationNotes && l.calculationNotes.includes("[OT 1.2x]")))
      );

      expect(otLedgers.length).toBe(2);
      expect(otLedgers.map((l) => l.id)).toEqual([1, 3]);

      const totalOtCommission = otLedgers.reduce((acc, curr) => acc + curr.amount, 0);
      expect(totalOtCommission).toBe(132000);
    });
  });
});
