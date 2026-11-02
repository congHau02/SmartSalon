import { describe, it, expect } from "vitest";
import { getLookupErrorMessage } from "../features/booking/components/BookingLookupModal";

describe("Phase 11 - Ticket 02: Rate Limit Error Mapping in Booking Lookup", () => {
  it("maps HTTP 429 status to Vietnamese rate limit message", () => {
    const errorWithStatus = { status: 429 };
    expect(getLookupErrorMessage(errorWithStatus)).toBe(
      "Bạn đã thực hiện quá nhiều yêu cầu tra cứu. Vui lòng thử lại sau 10 phút."
    );
  });

  it("maps response status 429 to Vietnamese rate limit message", () => {
    const errorWithResponse = { response: { status: 429 } };
    expect(getLookupErrorMessage(errorWithResponse)).toBe(
      "Bạn đã thực hiện quá nhiều yêu cầu tra cứu. Vui lòng thử lại sau 10 phút."
    );
  });

  it("maps TOO_MANY_REQUESTS error code (2013 or string) to Vietnamese rate limit message", () => {
    expect(getLookupErrorMessage({ code: 2013 })).toBe(
      "Bạn đã thực hiện quá nhiều yêu cầu tra cứu. Vui lòng thử lại sau 10 phút."
    );
    expect(getLookupErrorMessage({ code: "TOO_MANY_REQUESTS" })).toBe(
      "Bạn đã thực hiện quá nhiều yêu cầu tra cứu. Vui lòng thử lại sau 10 phút."
    );
  });

  it("maps generic errors to fallback message", () => {
    expect(getLookupErrorMessage(new Error("Network failed"))).toBe(
      "Không tìm thấy lịch hẹn phù hợp hoặc hệ thống đang bận."
    );
    expect(getLookupErrorMessage({ status: 500 })).toBe(
      "Không tìm thấy lịch hẹn phù hợp hoặc hệ thống đang bận."
    );
    expect(getLookupErrorMessage(null)).toBe(
      "Không tìm thấy lịch hẹn phù hợp hoặc hệ thống đang bận."
    );
  });
});
