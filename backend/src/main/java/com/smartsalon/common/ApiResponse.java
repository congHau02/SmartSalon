// ./backend/src/main/java/com/smartsalon/common/ApiResponse.java
package com.smartsalon.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        int code,
        String message,
        T result,
        Instant timestamp
) {
    public static <T> ApiResponse<T> success(T result) {
        return new ApiResponse<>(1000, "Success", result, Instant.now());
    }

    public static <T> ApiResponse<T> success(String message, T result) {
        return new ApiResponse<>(1000, message, result, Instant.now());
    }

    public static <T> ApiResponse<T> error(int code, String message) {
        return new ApiResponse<>(code, message, null, Instant.now());
    }
}