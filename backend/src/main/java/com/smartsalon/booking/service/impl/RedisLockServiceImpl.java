package com.smartsalon.booking.service.impl;

import com.smartsalon.booking.service.RedisLockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisLockServiceImpl implements RedisLockService {

    private final StringRedisTemplate redisTemplate;
    public static final Duration LOCK_TTL = Duration.ofSeconds(300);

    @Override
    public boolean tryLockSlots(Long stylistId, LocalDateTime startTime, LocalDateTime endTime, String lockOwner) {
        if (stylistId == null || startTime == null || endTime == null || !startTime.isBefore(endTime)) {
            return false;
        }

        List<String> keys = generateBucketKeys(stylistId, startTime, endTime);
        if (keys.isEmpty()) {
            return false;
        }

        Map<String, String> keyValues = new LinkedHashMap<>();
        for (String key : keys) {
            keyValues.put(key, lockOwner != null ? lockOwner : "LOCKED");
        }

        try {
            Boolean success = redisTemplate.opsForValue().multiSetIfAbsent(keyValues);
            if (Boolean.TRUE.equals(success)) {
                for (String key : keys) {
                    redisTemplate.expire(key, LOCK_TTL);
                }
                log.info("Locked {} slot bucket(s) for stylist {} with owner {}", keys.size(), stylistId, lockOwner);
                return true;
            } else {
                log.debug("Failed to lock slots for stylist {}: collision detected on buckets", stylistId);
                return false;
            }
        } catch (Exception e) {
            log.error("Redis error while attempting multi-bucket slot lock for stylist {}: {}", stylistId, e.getMessage());
            return false;
        }
    }

    @Override
    public boolean isAnySlotLocked(Long stylistId, LocalDateTime startTime, LocalDateTime endTime) {
        if (stylistId == null || startTime == null || endTime == null || !startTime.isBefore(endTime)) {
            return false;
        }
        List<String> keys = generateBucketKeys(stylistId, startTime, endTime);
        if (keys.isEmpty()) {
            return false;
        }

        try {
            List<String> values = redisTemplate.opsForValue().multiGet(keys);
            if (values != null) {
                for (String val : values) {
                    if (val != null) {
                        return true;
                    }
                }
            }
            return false;
        } catch (Exception e) {
            log.error("Redis error checking slot lock status for stylist {}: {}", stylistId, e.getMessage());
            return false;
        }
    }

    @Override
    public Set<String> getLockedKeys(Collection<String> keys) {
        if (keys == null || keys.isEmpty()) {
            return Collections.emptySet();
        }
        List<String> keyList = new ArrayList<>(keys);
        Set<String> locked = new HashSet<>();
        try {
            List<String> values = redisTemplate.opsForValue().multiGet(keyList);
            if (values != null) {
                for (int i = 0; i < Math.min(keyList.size(), values.size()); i++) {
                    if (values.get(i) != null) {
                        locked.add(keyList.get(i));
                    }
                }
            }
        } catch (Exception e) {
            log.error("Redis error querying batch locked keys: {}", e.getMessage());
        }
        return locked;
    }

    @Override
    public void unlockSlots(Long stylistId, LocalDateTime startTime, LocalDateTime endTime) {
        if (stylistId == null || startTime == null || endTime == null) {
            return;
        }
        List<String> keys = generateBucketKeys(stylistId, startTime, endTime);
        if (!keys.isEmpty()) {
            try {
                redisTemplate.delete(keys);
                log.info("Released {} slot bucket lock(s) for stylist {}", keys.size(), stylistId);
            } catch (Exception e) {
                log.error("Redis error releasing slot locks for stylist {}: {}", stylistId, e.getMessage());
            }
        }
    }

    @Override
    public List<String> getLockedSlots(Long stylistId, LocalDateTime startTime, LocalDateTime endTime) {
        List<String> locked = new ArrayList<>();
        if (stylistId == null || startTime == null || endTime == null) {
            return locked;
        }
        List<String> keys = generateBucketKeys(stylistId, startTime, endTime);
        try {
            List<String> values = redisTemplate.opsForValue().multiGet(keys);
            if (values != null) {
                for (int i = 0; i < keys.size(); i++) {
                    if (values.get(i) != null) {
                        locked.add(keys.get(i));
                    }
                }
            }
        } catch (Exception e) {
            log.error("Redis error querying locked slots: {}", e.getMessage());
        }
        return locked;
    }

    public static List<String> generateBucketKeys(Long stylistId, LocalDateTime startTime, LocalDateTime endTime) {
        List<String> keys = new ArrayList<>();
        LocalDateTime current = startTime;
        while (current.isBefore(endTime)) {
            String key = String.format("lock:slot:%d:%s:%02d:%02d",
                    stylistId,
                    current.toLocalDate(),
                    current.getHour(),
                    current.getMinute());
            keys.add(key);
            current = current.plusMinutes(30);
        }
        return keys;
    }
}
