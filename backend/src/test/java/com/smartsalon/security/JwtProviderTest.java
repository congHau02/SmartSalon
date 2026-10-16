package com.smartsalon.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JwtProviderTest {

    private JwtProvider jwtProvider;

    @BeforeEach
    void setUp() {
        jwtProvider = new JwtProvider();
        ReflectionTestUtils.setField(jwtProvider, "jwtSecret", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
        ReflectionTestUtils.setField(jwtProvider, "accessExpirationMs", 3600000L);
    }

    @Test
    @DisplayName("Should generate valid JWT and parse claims correctly")
    void shouldGenerateAndParseToken() {
        String username = "stylist_linh";
        List<String> roles = List.of("STAFF", "STYLIST");

        String token = jwtProvider.generateAccessToken(username, roles);

        assertNotNull(token);
        assertFalse(token.isBlank());

        Claims claims = jwtProvider.parseClaims(token);
        assertEquals(username, claims.getSubject());

        @SuppressWarnings("unchecked")
        List<String> extractedRoles = claims.get("roles", List.class);
        assertNotNull(extractedRoles);
        assertEquals(2, extractedRoles.size());
        assertTrue(extractedRoles.contains("STAFF"));
        assertTrue(extractedRoles.contains("STYLIST"));
    }
}
