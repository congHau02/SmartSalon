package com.smartsalon.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
public class RedisRefreshTokenStore implements RefreshTokenStore {

    private final StringRedisTemplate redisTemplate;

    private static final String KEY_PREFIX = "rt:";

    @Override
    public void store(Long userId, String token, long expirationMs) {
        String key = buildKey(userId, token);
        redisTemplate.opsForValue().set(key, "ACTIVE", Duration.ofMillis(expirationMs));
    }

    @Override
    public boolean validate(Long userId, String token) {
        String key = buildKey(userId, token);
        Boolean hasKey = redisTemplate.hasKey(key);
        return Boolean.TRUE.equals(hasKey);
    }

    @Override
    public void revoke(Long userId, String token) {
        String key = buildKey(userId, token);
        redisTemplate.delete(key);
    }

    private String buildKey(Long userId, String token) {
        return KEY_PREFIX + userId + ":" + token;
    }
}
