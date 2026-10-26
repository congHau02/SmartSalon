package com.smartsalon.common;

import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/system")
public class SystemController {

    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : "anonymous";
        var authorities = auth != null ? auth.getAuthorities() : java.util.List.of();

        return ApiResponse.success("Authenticated User Profile", Map.of(
                "username", username,
                "authorities", authorities.stream().map(Object::toString).toList()
        ));
    }

    @GetMapping("/simulate-error")
    public ApiResponse<Void> simulateError(@RequestParam(defaultValue = "validation") String type) {
        if ("slot".equalsIgnoreCase(type)) {
            throw new AppException(ErrorCode.SLOT_ALREADY_LOCKED);
        }
        if ("stock".equalsIgnoreCase(type)) {
            throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
        }
        if ("uncaught".equalsIgnoreCase(type)) {
            throw new RuntimeException("Raw database connection failure: syntax error near SELECT * FROM orders");
        }
        throw new AppException(ErrorCode.VALIDATION_ERROR);
    }
}
