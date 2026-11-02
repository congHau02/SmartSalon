package com.smartsalon.common.service;

import com.smartsalon.common.service.impl.RedisRateLimiter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedisRateLimiterTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private RedisRateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        rateLimiter = new RedisRateLimiter(redisTemplate);
    }

    @Test
    @DisplayName("Lần gọi đầu tiên (count = 1) phải tăng đếm và thiết lập thời gian hết hạn (EXPIRE)")
    void tryAcquire_firstHit_incrementsAndSetsExpire() {
        String key = "rl:lookup:127.0.0.1:0987654321";
        Duration window = Duration.ofMinutes(10);
        when(valueOperations.increment(key)).thenReturn(1L);

        boolean allowed = rateLimiter.tryAcquire(key, 5, window);

        assertThat(allowed).isTrue();
        verify(valueOperations).increment(key);
        verify(redisTemplate).expire(eq(key), eq(window));
    }

    @Test
    @DisplayName("Các lần gọi tiếp theo trong ngưỡng (count <= limit) không gọi lại expire và trả về true")
    void tryAcquire_withinLimit_doesNotSetExpireAgain() {
        String key = "rl:lookup:127.0.0.1:0987654321";
        Duration window = Duration.ofMinutes(10);
        when(valueOperations.increment(key)).thenReturn(5L);

        boolean allowed = rateLimiter.tryAcquire(key, 5, window);

        assertThat(allowed).isTrue();
        verify(valueOperations).increment(key);
        verify(redisTemplate, never()).expire(eq(key), any(Duration.class));
    }

    @Test
    @DisplayName("Khi vượt quá giới hạn (count > limit) trả về false")
    void tryAcquire_exceedsLimit_returnsFalse() {
        String key = "rl:lookup:127.0.0.1:0987654321";
        Duration window = Duration.ofMinutes(10);
        when(valueOperations.increment(key)).thenReturn(6L);

        boolean allowed = rateLimiter.tryAcquire(key, 5, window);

        assertThat(allowed).isFalse();
        verify(valueOperations).increment(key);
        verify(redisTemplate, never()).expire(eq(key), any(Duration.class));
    }

    @Test
    @DisplayName("Xử lý an toàn khi tham số không hợp lệ (null key, limit <= 0, window null)")
    void tryAcquire_invalidParams_returnsFalse() {
        assertThat(rateLimiter.tryAcquire(null, 5, Duration.ofMinutes(10))).isFalse();
        assertThat(rateLimiter.tryAcquire("rl:test", 0, Duration.ofMinutes(10))).isFalse();
        assertThat(rateLimiter.tryAcquire("rl:test", 5, null)).isFalse();
        assertThat(rateLimiter.tryAcquire("rl:test", 5, Duration.ZERO)).isFalse();
    }

    @Test
    @DisplayName("Khi Redis gặp sự cố ngoại lệ, fail-open để không gián đoạn người dùng")
    void tryAcquire_onRedisException_failsOpen() {
        String key = "rl:lookup:127.0.0.1:0987654321";
        Duration window = Duration.ofMinutes(10);
        when(valueOperations.increment(key)).thenThrow(new RuntimeException("Redis connection timeout"));

        boolean allowed = rateLimiter.tryAcquire(key, 5, window);

        assertThat(allowed).isTrue();
    }
}
