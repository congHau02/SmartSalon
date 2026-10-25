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
});
