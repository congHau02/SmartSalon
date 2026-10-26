package com.smartsalon.booking.service;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Set;

public interface RedisLockService {

    /**
     * Atomically lock all 30-minute buckets in [startTime, endTime) for a stylist with 300s TTL.
     * @return true if all buckets were locked successfully, false if any bucket was already locked.
     */
    boolean tryLockSlots(Long stylistId, LocalDateTime startTime, LocalDateTime endTime, String lockOwner);

    /**
     * Check if any 30-minute bucket in [startTime, endTime) is currently locked for a stylist.
     */
    boolean isAnySlotLocked(Long stylistId, LocalDateTime startTime, LocalDateTime endTime);

    /**
     * Given a collection of slot bucket keys, query Redis in a single batch (multiGet)
     * and return the set of keys that are currently locked (non-null in Redis).
     */
    Set<String> getLockedKeys(Collection<String> keys);

    /**
     * Release all 30-minute bucket locks in [startTime, endTime) for a stylist.
     */
    void unlockSlots(Long stylistId, LocalDateTime startTime, LocalDateTime endTime);
}
