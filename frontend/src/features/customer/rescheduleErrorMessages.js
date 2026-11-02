/**
 * Maps backend error codes to user-friendly Vietnamese messages for the Reschedule dialog.
 */
export function getRescheduleErrorMessage(error) {
  if (!error) {
    return "Không thể dời lịch hẹn. Vui lòng thử lại.";
  }

  const code = error?.response?.data?.code ?? error?.code;
  const status = error?.response?.status ?? error?.status;

  if (status === 429 || code === 2013 || code === "TOO_MANY_REQUESTS") {
    return "Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau 10 phút.";
  }

  switch (code) {
    case 2014:
    case "RESCHEDULE_WINDOW_EXPIRED":
      return "Chỉ có thể dời lịch trực tuyến trước giờ hẹn ít nhất 2 tiếng. Vui lòng liên hệ hotline chi nhánh để được hỗ trợ.";

    case 2015:
    case "BOOKING_ALREADY_RESCHEDULED":
      return "Lịch hẹn này đã được dời lịch 1 lần trước đó. Mỗi lịch hẹn chỉ được dời tối đa 1 lần.";

    case 2016:
    case "BOOKING_NOT_CONFIRMED":
    case 2008:
    case "INVALID_BOOKING_STATUS":
      return "Chỉ có thể dời lịch hẹn ở trạng thái đã xác nhận.";

    case 2007:
    case "SLOT_NOT_AVAILABLE":
    case 2001:
    case "SLOT_ALREADY_LOCKED":
      return "Khung giờ đã chọn không còn khả dụng hoặc vừa có khách khác giữ chỗ. Vui lòng chọn khung giờ khác.";

    case 2017:
    case "STYLIST_OFF_SHIFT":
      return "Kỹ thuật viên không có ca làm việc trong khung giờ này. Vui lòng chọn Stylist khác hoặc để hệ thống tự động phân bổ.";

    case 2005:
    case "BOOKING_NOT_FOUND":
      return "Không tìm thấy thông tin lịch hẹn hoặc thông tin xác thực không chính xác.";

    case 1003:
    case "FORBIDDEN":
      return "Bạn không có quyền dời lịch hẹn này.";

    default:
      return (
        error?.response?.data?.message ||
        error?.message ||
        "Không thể dời lịch hẹn. Vui lòng kiểm tra lại hoặc liên hệ hotline chi nhánh."
      );
  }
}
