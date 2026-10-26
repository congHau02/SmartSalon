package com.smartsalon.booking;

import com.smartsalon.booking.service.impl.RedisLockServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedisLockServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private RedisLockServiceImpl redisLockService;

    private final Long stylistId = 2L;
    private final LocalDate date = LocalDate.of(2026, 10, 20);
    private final LocalDateTime startTime = LocalDateTime.of(date, LocalTime.of(9, 0));
    private final LocalDateTime endTime = LocalDateTime.of(date, LocalTime.of(10, 30)); // 90 mins = 3 buckets (09:00, 09:30, 10:00)

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    @DisplayName("generateBucketKeys should create 3 discrete 30-min keys for 90-min duration")
    void shouldGenerateCorrectBucketKeys() {
        List<String> keys = RedisLockServiceImpl.generateBucketKeys(stylistId, startTime, endTime);

        assertThat(keys).hasSize(3);
        assertThat(keys).containsExactly(
                "lock:slot:2:2026-10-20:09:00",
                "lock:slot:2:2026-10-20:09:30",
                "lock:slot:2:2026-10-20:10:00"
        );
    }

    @Test
    @DisplayName("tryLockSlots should atomically acquire all buckets and set 300s TTL when keys are free")
    void shouldLockSlotsSuccessfully() {
        when(valueOperations.multiSetIfAbsent(anyMap())).thenReturn(Boolean.TRUE);

        boolean locked = redisLockService.tryLockSlots(stylistId, startTime, endTime, "BK-TEST-001");

        assertThat(locked).isTrue();
        verify(valueOperations).multiSetIfAbsent(anyMap());
        verify(redisTemplate, times(3)).expire(anyString(), eq(Duration.ofSeconds(300)));
    }

    @Test
    @DisplayName("tryLockSlots should return false when any bucket collides")
    void shouldFailWhenAnyBucketCollides() {
        when(valueOperations.multiSetIfAbsent(anyMap())).thenReturn(Boolean.FALSE);

        boolean locked = redisLockService.tryLockSlots(stylistId, startTime, endTime, "BK-TEST-002");

        assertThat(locked).isFalse();
        verify(valueOperations).multiSetIfAbsent(anyMap());
        verify(redisTemplate, never()).expire(anyString(), any(Duration.class));
    }

    @Test
    @DisplayName("isAnySlotLocked should return true if any bucket value is non-null")
    void shouldDetectActiveLocks() {
        when(valueOperations.multiGet(anyCollection())).thenReturn(java.util.Arrays.asList("BK-OTHER", null, null));

        boolean anyLocked = redisLockService.isAnySlotLocked(stylistId, startTime, endTime);

        assertThat(anyLocked).isTrue();
    }

    @Test
    @DisplayName("isAnySlotLocked should return false if all bucket values are null")
    void shouldReturnFalseWhenNoLocksExist() {
        when(valueOperations.multiGet(anyCollection())).thenReturn(java.util.Arrays.asList(null, null, null));

        boolean anyLocked = redisLockService.isAnySlotLocked(stylistId, startTime, endTime);

        assertThat(anyLocked).isFalse();
    }

    @Test
    @DisplayName("getLockedKeys should return set of keys where values are non-null in Redis")
    void shouldReturnLockedKeysBatch() {
        List<String> keys = List.of("key1", "key2", "key3");
        when(valueOperations.multiGet(keys)).thenReturn(java.util.Arrays.asList("LOCKED", null, "BK-001"));

        java.util.Set<String> locked = redisLockService.getLockedKeys(keys);

        assertThat(locked).containsExactlyInAnyOrder("key1", "key3");
    }

    @Test
    @DisplayName("unlockSlots should delete all bucket keys")
    void shouldDeleteAllBucketKeys() {
        redisLockService.unlockSlots(stylistId, startTime, endTime);

        verify(redisTemplate).delete(argThat((List<String> keys) -> keys.size() == 3));
    }
}
