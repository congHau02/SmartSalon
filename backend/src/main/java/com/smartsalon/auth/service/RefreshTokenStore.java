package com.smartsalon.auth.service;

public interface RefreshTokenStore {
    void store(Long userId, String token, long expirationMs);
    boolean validate(Long userId, String token);
    void revoke(Long userId, String token);
}
