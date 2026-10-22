import { describe, it, expect, vi } from "vitest";
import {
  createSingleFlightRefresher,
  isAuthEndpoint,
  refreshAccessToken,
} from "../api/axiosClient";

describe("Auth Single-Flight Refresh and Endpoint Matcher", () => {
  describe("isAuthEndpoint", () => {


    it("identifies login, refresh, and register endpoints accurately", () => {
      expect(isAuthEndpoint("/api/v1/auth/login")).toBe(true);
      expect(isAuthEndpoint("/api/v1/auth/refresh")).toBe(true);
      expect(isAuthEndpoint("/api/v1/auth/register")).toBe(true);
      expect(isAuthEndpoint("http://localhost:8080/api/v1/auth/login?redirect=/pos")).toBe(true);
      expect(isAuthEndpoint("/auth/refresh/")).toBe(true);
    });

    it("does not classify non-auth business endpoints as auth endpoints", () => {
      expect(isAuthEndpoint("/api/v1/pos/orders")).toBe(false);
      expect(isAuthEndpoint("/api/v1/appointments/123")).toBe(false);
      expect(isAuthEndpoint("/api/v1/auth/me")).toBe(false);
      expect(isAuthEndpoint("")).toBe(false);
      expect(isAuthEndpoint(null)).toBe(false);
    });
  });

  describe("Single-Flight Concurrency (Redis Token Collision Protection)", () => {
    it("shares a single refresh promise across concurrent 401 callers", async () => {
      let callCount = 0;
      const mockNetworkRefresh = vi.fn(async () => {
        callCount++;
        await new Promise((r) => setTimeout(r, 20));
        return "new-access-token-xyz";
      });

      const { refreshAccessToken } = createSingleFlightRefresher(mockNetworkRefresh);

      // Trigger 4 concurrent refresh requests
      const results = await Promise.all([
        refreshAccessToken(),
        refreshAccessToken(),
        refreshAccessToken(),
        refreshAccessToken(),
      ]);

      // Exactly 1 network refresh executed
      expect(mockNetworkRefresh).toHaveBeenCalledTimes(1);
      expect(callCount).toBe(1);

      // All 4 received the same refreshed token
      results.forEach((token) => {
        expect(token).toBe("new-access-token-xyz");
      });
    });

    it("rejects all queued waiters when the single-flight refresh fails", async () => {
      const mockFailingRefresh = vi.fn(async () => {
        await new Promise((r) => setTimeout(r, 10));
        throw new Error("Invalid refresh token");
      });

      const { refreshAccessToken } = createSingleFlightRefresher(mockFailingRefresh);

      const promises = [refreshAccessToken(), refreshAccessToken(), refreshAccessToken()];

      await expect(Promise.all(promises)).rejects.toThrow("Invalid refresh token");
      expect(mockFailingRefresh).toHaveBeenCalledTimes(1);
    });
  });
});
