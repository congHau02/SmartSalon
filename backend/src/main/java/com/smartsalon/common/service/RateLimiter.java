package com.smartsalon.common.service;

import java.time.Duration;

public interface RateLimiter {
    /**
     * Checks if the given key is allowed under the limit within the time window,
     * and increments the counter.
     *
     * @param key unique rate limit key (e.g., endpoint + IP + identifier)
     * @param limit maximum allowed requests within the window
     * @param window duration of the fixed window
     * @return true if request is allowed, false if rejected (exceeded limit)
     */
    boolean tryAcquire(String key, long limit, Duration window);
}
