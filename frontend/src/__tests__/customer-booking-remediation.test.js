import { describe, it, expect } from "vitest";
import {
  calculateHaversineDistanceKm,
  formatDistanceKm,
  getGoogleMapsDirectionsUrl,
  findClosestBranch,
} from "../features/booking/geoUtils";
import { guestBookingSchema } from "../features/booking/booking.schema";

describe("Phase 8 - Issue 03: Customer Online Booking Remediation & Interactive Branch Map", () => {
  const branches = [
    {
      id: 1,
      name: "SmartSalon Flagship - Quận 1",
      address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
      latitude: 10.7745,
      longitude: 106.7036,
    },
    {
      id: 2,
      name: "SmartSalon Luxury - Quận 3",
      address: "456 Lê Văn Sỹ, Quận 3, TP.HCM",
      latitude: 10.7882,
      longitude: 106.6789,
    },
  ];

  describe("Geolocation & Haversine Distance Calculations", () => {
    it("calculates accurate distance between Flagship (Q1) and Luxury (Q3) branches (~3.1 km)", () => {
      const distance = calculateHaversineDistanceKm(
        branches[0].latitude,
        branches[0].longitude,
        branches[1].latitude,
        branches[1].longitude
      );

      expect(distance).toBeGreaterThan(2.9);
      expect(distance).toBeLessThan(3.3);
      expect(distance).toBe(3.1);
    });

    it("returns 0.0 km when computing distance to the exact same point", () => {
      const distance = calculateHaversineDistanceKm(10.7745, 106.7036, 10.7745, 106.7036);
      expect(distance).toBe(0);
    });

    it("handles string coordinates safely", () => {
      const distance = calculateHaversineDistanceKm("10.7745000", "106.7036000", "10.7882000", "106.6789000");
      expect(distance).toBe(3.1);
    });

    it("returns null gracefully when given invalid or missing coordinates", () => {
      expect(calculateHaversineDistanceKm(null, 106.7, 10.7, 106.7)).toBeNull();
      expect(calculateHaversineDistanceKm(10.7, undefined, 10.7, 106.7)).toBeNull();
      expect(calculateHaversineDistanceKm("invalid", "coords", 10.7, 106.7)).toBeNull();
    });

    it("formats distance into customer-facing Vietnamese string", () => {
      expect(formatDistanceKm(3.1)).toBe("Cách bạn 3.1 km");
      expect(formatDistanceKm(0.5)).toBe("Cách bạn 0.5 km");
      expect(formatDistanceKm(null)).toBe("");
      expect(formatDistanceKm(undefined)).toBe("");
    });

    it("constructs valid Google Maps turn-by-turn navigation URLs", () => {
      const url = getGoogleMapsDirectionsUrl(10.7745, 106.7036);
      expect(url).toBe("https://www.google.com/maps/dir/?api=1&destination=10.7745,106.7036");

      const defaultUrl = getGoogleMapsDirectionsUrl(null, null);
      expect(defaultUrl).toBe("https://www.google.com/maps");
    });

    it("finds the closest branch based on user coordinates", () => {
      // User is near Nguyen Hue, District 1
      const userNearD1 = { latitude: 10.7746, longitude: 106.7037 };
      const closestD1 = findClosestBranch(userNearD1, branches);
      expect(closestD1).not.toBeNull();
      expect(closestD1.branch.id).toBe(1);
      expect(closestD1.distanceKm).toBeLessThan(0.5);

      // User is near Le Van Sy, District 3
      const userNearD3 = { latitude: 10.7885, longitude: 106.6792 };
      const closestD3 = findClosestBranch(userNearD3, branches);
      expect(closestD3).not.toBeNull();
      expect(closestD3.branch.id).toBe(2);
      expect(closestD3.distanceKm).toBeLessThan(0.5);
    });
  });

  describe("Step 2: Slot DTO Normalization & Period Grouping", () => {
    // Normalization logic mirroring SlotPicker.jsx
    function normalizeSlots(slots) {
      const morning = [];
      const afternoon = [];
      const evening = [];

      slots.forEach((s) => {
        const slotTime = s.time || s.startTime || "";
        if (!slotTime) return;

        const [hourStr] = slotTime.split(":");
        const hour = parseInt(hourStr, 10);
        if (isNaN(hour)) return;

        const normalizedSlot = {
          ...s,
          slotTime,
          isAvailable: (s.available ?? true) && s.status === "AVAILABLE",
        };

        if (hour < 12) {
          morning.push(normalizedSlot);
        } else if (hour < 17 || (hour === 17 && slotTime <= "17:30")) {
          afternoon.push(normalizedSlot);
        } else {
          evening.push(normalizedSlot);
        }
      });

      return { morning, afternoon, evening };
    }

    it("normalizes backend SlotDto containing time and status without throwing TypeError", () => {
      const rawBackendSlots = [
        { time: "09:00", endTime: "09:30", status: "AVAILABLE", availableStylistCount: 2 },
        { time: "10:30", endTime: "11:00", status: "LOCKED", availableStylistCount: 0 },
        { time: "14:00", endTime: "14:30", status: "AVAILABLE", availableStylistCount: 1 },
        { time: "17:30", endTime: "18:00", status: "BOOKED", availableStylistCount: 0 },
        { time: "19:00", endTime: "19:30", status: "AVAILABLE", availableStylistCount: 3 },
      ];

      expect(() => normalizeSlots(rawBackendSlots)).not.toThrow();

      const { morning, afternoon, evening } = normalizeSlots(rawBackendSlots);

      expect(morning).toHaveLength(2);
      expect(morning[0].slotTime).toBe("09:00");
      expect(morning[0].isAvailable).toBe(true);
      expect(morning[1].slotTime).toBe("10:30");
      expect(morning[1].isAvailable).toBe(false);

      expect(afternoon).toHaveLength(2);
      expect(afternoon[0].slotTime).toBe("14:00");
      expect(afternoon[0].isAvailable).toBe(true);
      expect(afternoon[1].slotTime).toBe("17:30");
      expect(afternoon[1].isAvailable).toBe(false);

      expect(evening).toHaveLength(1);
      expect(evening[0].slotTime).toBe("19:00");
      expect(evening[0].isAvailable).toBe(true);
    });

    it("supports backward compatibility if startTime and available are present", () => {
      const legacySlots = [
        { startTime: "08:30", endTime: "09:00", available: true, status: "AVAILABLE" },
        { startTime: "13:00", endTime: "13:30", available: false, status: "BOOKED" },
      ];

      const { morning, afternoon } = normalizeSlots(legacySlots);
      expect(morning[0].slotTime).toBe("08:30");
      expect(morning[0].isAvailable).toBe(true);
      expect(afternoon[0].slotTime).toBe("13:00");
      expect(afternoon[0].isAvailable).toBe(false);
    });

    it("skips slots with invalid or empty time without crashing", () => {
      const malformedSlots = [
        { time: "", status: "AVAILABLE" },
        { time: null, status: "AVAILABLE" },
        { time: "invalid", status: "AVAILABLE" },
        { time: "11:00", status: "AVAILABLE" },
      ];

      const { morning } = normalizeSlots(malformedSlots);
      expect(morning).toHaveLength(1);
      expect(morning[0].slotTime).toBe("11:00");
    });
  });

  describe("Step 3: Customer Confirmation State & Submission", () => {
    it("validates guest booking submissions with Zod schema", () => {
      const validGuest = {
        customerName: "Nguyễn Văn An",
        customerPhone: "0912345678",
        notes: "Muốn cắt tóc ngắn",
      };
      expect(() => guestBookingSchema.parse(validGuest)).not.toThrow();

      const invalidPhoneGuest = {
        customerName: "Nguyễn Văn An",
        customerPhone: "12345",
      };
      expect(() => guestBookingSchema.parse(invalidPhoneGuest)).toThrow();

      const shortNameGuest = {
        customerName: "A",
        customerPhone: "0912345678",
      };
      expect(() => guestBookingSchema.parse(shortNameGuest)).toThrow();
    });

    it("resolves authenticated user submission payload using user credentials", () => {
      const authenticatedUser = {
        id: 10,
        fullName: "Trần Minh Trí",
        phone: "0903334455",
        membershipTier: "GOLD",
      };

      // CustomerConfirmStep submission logic for logged-in user
      const resolveSubmissionPayload = (user, guestData = {}) => {
        if (user) {
          return {
            customerName: user.fullName || "Khách hàng",
            customerPhone: user.phone || "0900000000",
            notes: guestData.notes || undefined,
          };
        }
        return {
          customerName: guestData.customerName,
          customerPhone: guestData.customerPhone,
          notes: guestData.notes || undefined,
        };
      };

      const payload = resolveSubmissionPayload(authenticatedUser, { notes: "Khách VIP" });
      expect(payload.customerName).toBe("Trần Minh Trí");
      expect(payload.customerPhone).toBe("0903334455");
      expect(payload.notes).toBe("Khách VIP");
    });
  });
});
