package com.smartsalon.common;

import com.smartsalon.common.service.SystemHealthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class HealthController {

    private final SystemHealthService systemHealthService;

    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> getHealth() {
        Map<String, Object> details = systemHealthService.checkHealth();
        return ApiResponse.success("SmartSalon System Operational", details);
    }
}
