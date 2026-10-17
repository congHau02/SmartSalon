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
    INSUFFICIENT_STOCK(3001, "Tồn kho vật tư (ml/gram) không đủ để xuất", HttpStatus.BAD_REQUEST),
    PRODUCT_NOT_FOUND(3002, "Không tìm thấy sản phẩm hoặc vật tư yêu cầu", HttpStatus.NOT_FOUND);

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;
}