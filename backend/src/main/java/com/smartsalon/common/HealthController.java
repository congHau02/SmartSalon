package com.smartsalon.common;

import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/public")
public class HealthController {

    private final DataSource dataSource;
    private final RedisConnectionFactory redisConnectionFactory;

    public HealthController(DataSource dataSource, RedisConnectionFactory redisConnectionFactory) {
        this.dataSource = dataSource;
        this.redisConnectionFactory = redisConnectionFactory;
    }

    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> getHealth() {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("status", "UP");
        details.put("service", "smart-salon-backend");
        details.put("virtualThreads", Boolean.TRUE.toString());

        // Database status check
        try (Connection conn = dataSource.getConnection()) {
            boolean valid = conn.isValid(2);
            details.put("database", valid ? "UP" : "DEGRADED");
        } catch (Exception e) {
            details.put("database", "DOWN: " + e.getMessage());
        }

        // Redis status check
        try {
            if (redisConnectionFactory != null) {
                try (RedisConnection connection = redisConnectionFactory.getConnection()) {
                    String ping = connection.ping();
                    details.put("redis", "PONG".equalsIgnoreCase(ping) ? "UP" : "DEGRADED");
                }
            } else {
                details.put("redis", "DISABLED");
            }
        } catch (Exception e) {
            details.put("redis", "DOWN: " + e.getMessage());
        }

        return ApiResponse.success("SmartSalon System Operational", details);
    }
}
