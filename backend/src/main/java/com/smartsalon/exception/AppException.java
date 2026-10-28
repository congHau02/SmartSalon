// ./backend/src/main/java/com/smartsalon/exception/AppException.java
package com.smartsalon.exception;

import lombok.Getter;

@Getter
public class AppException extends RuntimeException {
    private final ErrorCode errorCode;
    private final Object data;

    public AppException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.data = null;
    }

    public AppException(ErrorCode errorCode, String message) {
        super(message != null ? message : errorCode.getMessage());
        this.errorCode = errorCode;
        this.data = null;
    }

    public AppException(ErrorCode errorCode, String message, Object data) {
        super(message != null ? message : errorCode.getMessage());
        this.errorCode = errorCode;
        this.data = data;
    }
}
