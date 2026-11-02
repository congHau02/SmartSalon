package com.smartsalon.common.service.impl;

import com.smartsalon.common.service.RateLimiter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
public class RedisRateLimiter implements RateLimiter {

    private final StringRedisTemplate redisTemplate;

    @Override
    public boolean tryAcquire(String key, long limit, Duration window) {
        if (key == null || limit <= 0 || window == null || window.isNegative() || window.isZero()) {
            return false;
        }

        try {
            // shortcut: fixed window allows a 2x burst at window edges, upgrade to sliding window/Bucket4j if abuse is observed
            Long currentCount = redisTemplate.opsForValue().increment(key);
            if (currentCount != null && currentCount == 1) {
                redisTemplate.expire(key, window);
            }
            return currentCount != null && currentCount <= limit;
        } catch (Exception e) {
            log.error("Redis rate limiter error for key {}: {}", key, e.getMessage());
            return true;
        }
    }
}
