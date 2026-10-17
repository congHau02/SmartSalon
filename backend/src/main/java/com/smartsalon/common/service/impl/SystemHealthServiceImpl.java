package com.smartsalon.common.service.impl;

import com.smartsalon.common.service.SystemHealthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemHealthServiceImpl implements SystemHealthService {

    private final DataSource dataSource;
    private final RedisConnectionFactory redisConnectionFactory;

    @Override
    public Map<String, Object> checkHealth() {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("status", "UP");
        details.put("service", "smart-salon-backend");
        details.put("virtualThreads", Boolean.TRUE.toString());

        // Database status check
        try (Connection conn = dataSource.getConnection()) {
            boolean valid = conn.isValid(2);
            details.put("database", valid ? "UP" : "DEGRADED");
        } catch (Exception e) {
            log.error("Database health check probe failed", e);
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
            log.error("Redis health check probe failed", e);
            details.put("redis", "DOWN: " + e.getMessage());
        }

        return details;
    }
}
