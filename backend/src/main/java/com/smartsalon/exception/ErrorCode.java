// ./backend/src/main/java/com/smartsalon/exception/ErrorCode.java
package com.smartsalon.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi hệ thống chưa xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    VALIDATION_ERROR(1001, "Dữ liệu đầu vào không hợp lệ", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED(1002, "Chưa xác thực hoặc Token không hợp lệ", HttpStatus.UNAUTHORIZED),
    FORBIDDEN(1003, "Bạn không có quyền truy cập tài nguyên này", HttpStatus.FORBIDDEN),
    USER_NOT_FOUND(1004, "Không tìm thấy thông tin người dùng", HttpStatus.NOT_FOUND),
    USER_ALREADY_EXISTS(1005, "Tên đăng nhập, số điện thoại hoặc email đã được sử dụng", HttpStatus.CONFLICT),
    INVALID_CREDENTIALS(1006, "Tên đăng nhập hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED),
    REFRESH_TOKEN_EXPIRED(1007, "Phiên đăng nhập đã hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại", HttpStatus.UNAUTHORIZED),
    BRANCH_NOT_FOUND(1008, "Không tìm thấy chi nhánh yêu cầu", HttpStatus.NOT_FOUND),
    ROLE_NOT_FOUND(1009, "Không tìm thấy vai trò người dùng trong hệ thống", HttpStatus.NOT_FOUND),
    SLOT_ALREADY_LOCKED(2001, "Khung giờ này vừa có khách khác giữ chỗ", HttpStatus.CONFLICT),
    SERVICE_NOT_FOUND(2002, "Không tìm thấy dịch vụ yêu cầu", HttpStatus.NOT_FOUND),
    INVALID_COMMISSION_RATES(2003, "Tổng tỷ lệ hoa hồng các bước kỹ thuật không được vượt quá 100%", HttpStatus.BAD_REQUEST),
    STYLIST_NOT_FOUND(2004, "Không tìm thấy thông tin kỹ thuật viên yêu cầu", HttpStatus.NOT_FOUND),
    BOOKING_NOT_FOUND(2005, "Không tìm thấy lịch hẹn yêu cầu", HttpStatus.NOT_FOUND),
    BOOKING_EXPIRED(2006, "Thời gian giữ chỗ của lịch hẹn đã hết hạn", HttpStatus.BAD_REQUEST),
    SLOT_NOT_AVAILABLE(2007, "Khung giờ đã chọn không còn khả dụng", HttpStatus.CONFLICT),
    INVALID_BOOKING_STATUS(2008, "Trạng thái lịch hẹn không hợp lệ cho thao tác này", HttpStatus.BAD_REQUEST),
    INVALID_PAYMENT_SIGNATURE(2009, "Chữ ký xác thực thanh toán không hợp lệ", HttpStatus.BAD_REQUEST),
    BOOKING_CANCELLATION_WINDOW_EXPIRED(2010, "Chỉ được hủy lịch hẹn trực tuyến trước giờ hẹn ít nhất 2 tiếng", HttpStatus.BAD_REQUEST),
    SHIFT_BOOKING_CONFLICT(2011, "Ca làm việc xung đột với lịch hẹn đã xác nhận của kỹ thuật viên", HttpStatus.CONFLICT),
    SHIFT_TEMPLATE_NOT_FOUND(2012, "Không tìm thấy mẫu ca làm việc", HttpStatus.NOT_FOUND),
    INVALID_ATTENDANCE_PIN(1010, "Mã PIN chấm công không chính xác", HttpStatus.BAD_REQUEST),
    ATTENDANCE_ACTION_INVALID(1011, "Thao tác chấm công không hợp lệ", HttpStatus.BAD_REQUEST),
    INSUFFICIENT_STOCK(3001, "Tồn kho vật tư (ml/gram) không đủ để xuất", HttpStatus.BAD_REQUEST),
    PRODUCT_NOT_FOUND(3002, "Không tìm thấy sản phẩm hoặc vật tư yêu cầu", HttpStatus.NOT_FOUND),
    PRODUCT_ALREADY_EXISTS(3003, "Mã SKU sản phẩm đã tồn tại trong hệ thống", HttpStatus.CONFLICT),
    ORDER_NOT_FOUND(4001, "Không tìm thấy đơn hàng yêu cầu", HttpStatus.NOT_FOUND),
    ORDER_ALREADY_EXISTS_FOR_BOOKING(4002, "Lịch hẹn này đã được mở đơn hàng", HttpStatus.CONFLICT),
    INVALID_ORDER_STATUS(4003, "Trạng thái đơn hàng không hợp lệ cho thao tác này", HttpStatus.BAD_REQUEST),
    STEP_ASSIGNMENT_NOT_FOUND(4004, "Không tìm thấy bước kỹ thuật được phân công", HttpStatus.NOT_FOUND),
    ORDER_ITEM_NOT_FOUND(4005, "Không tìm thấy mục hàng trong đơn", HttpStatus.NOT_FOUND),
    INVALID_MEDIA_TYPE(4006, "Định dạng tệp không hợp lệ, chỉ chấp nhận ảnh JPEG, PNG, WEBP, GIF", HttpStatus.BAD_REQUEST),
    EMPTY_FILE(4007, "Tệp tải lên không được để trống", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;
}