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
    SLOT_ALREADY_LOCKED(2001, "Khung giờ này vừa có khách khác giữ chỗ", HttpStatus.CONFLICT),
    INSUFFICIENT_STOCK(3001, "Tồn kho vật tư (ml/gram) không đủ để xuất", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;
}