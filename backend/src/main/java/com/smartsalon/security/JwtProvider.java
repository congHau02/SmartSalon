// ./backend/src/main/java/com/smartsalon/security/JwtProvider.java
package com.smartsalon.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;

@Component
public class JwtProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.access-expiration-ms}")
    private long accessExpirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    public String generateAccessToken(String username, List<String> roles) {
        return generateAccessToken(null, username, roles, null);
    }

    public String generateAccessToken(Long userId, String username, List<String> roles, Long branchId) {
        Date now = new Date();
        var builder = Jwts.builder()
                .subject(username)
                .claim("roles", roles)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + accessExpirationMs))
                .signWith(getSigningKey());

        if (userId != null) {
            builder.claim("userId", userId);
        }
        if (branchId != null) {
            builder.claim("branchId", branchId);
        }

        return builder.compact();
    }

    public long getAccessExpirationMs() {
        return accessExpirationMs;
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}