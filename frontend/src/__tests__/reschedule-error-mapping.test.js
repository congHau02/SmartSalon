import { describe, it, expect } from "vitest";
import { getRescheduleErrorMessage } from "../features/customer/rescheduleErrorMessages";

describe("Reschedule Error Code Mapping", () => {
  it("should map too late error (2014 / RESCHEDULE_WINDOW_EXPIRED)", () => {
    const errByCode = { response: { data: { code: 2014 } } };
    expect(getRescheduleErrorMessage(errByCode)).toContain("ít nhất 2 tiếng");

    const errByName = { code: "RESCHEDULE_WINDOW_EXPIRED" };
    expect(getRescheduleErrorMessage(errByName)).toContain("ít nhất 2 tiếng");
  });

  it("should map already rescheduled error (2015 / BOOKING_ALREADY_RESCHEDULED)", () => {
    const errByCode = { response: { data: { code: 2015 } } };
    expect(getRescheduleErrorMessage(errByCode)).toContain("tối đa 1 lần");

    const errByName = { code: "BOOKING_ALREADY_RESCHEDULED" };
    expect(getRescheduleErrorMessage(errByName)).toContain("tối đa 1 lần");
  });

  it("should map not confirmed error (2016 / 2008 / BOOKING_NOT_CONFIRMED)", () => {
    const err2016 = { response: { data: { code: 2016 } } };
    expect(getRescheduleErrorMessage(err2016)).toContain("trạng thái đã xác nhận");

    const err2008 = { response: { data: { code: 2008 } } };
    expect(getRescheduleErrorMessage(err2008)).toContain("trạng thái đã xác nhận");
  });

  it("should map slot taken error (2007 / 2001 / SLOT_NOT_AVAILABLE / SLOT_ALREADY_LOCKED)", () => {
    const err2007 = { response: { data: { code: 2007 } } };
    expect(getRescheduleErrorMessage(err2007)).toContain("không còn khả dụng");

    const err2001 = { code: 2001 };
    expect(getRescheduleErrorMessage(err2001)).toContain("không còn khả dụng");
  });

  it("should map stylist off-shift error (2017 / STYLIST_OFF_SHIFT)", () => {
    const errByCode = { response: { data: { code: 2017 } } };
    expect(getRescheduleErrorMessage(errByCode)).toContain("không có ca làm việc");

    const errByName = { code: "STYLIST_OFF_SHIFT" };
    expect(getRescheduleErrorMessage(errByName)).toContain("không có ca làm việc");
  });

  it("should map 429 rate limit error", () => {
    const err429 = { response: { status: 429 } };
    expect(getRescheduleErrorMessage(err429)).toContain("quá nhiều lần");

    const errCode2013 = { response: { data: { code: 2013 } } };
    expect(getRescheduleErrorMessage(errCode2013)).toContain("quá nhiều lần");
  });

  it("should return fallback message for unmapped errors", () => {
    const emptyErr = {};
    expect(getRescheduleErrorMessage(emptyErr)).toContain("Không thể dời lịch hẹn");

    const nullErr = null;
    expect(getRescheduleErrorMessage(nullErr)).toContain("Không thể dời lịch hẹn");
  });
});
