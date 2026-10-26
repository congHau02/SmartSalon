// ./backend/src/main/java/com/smartsalon/security/JwtAuthenticationFilter.java
package com.smartsalon.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                Claims claims = jwtProvider.parseClaims(token);
                String username = claims.getSubject();
                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    @SuppressWarnings("unchecked")
                    List<String> roles = claims.get("roles", List.class);

                    var authorities = (roles != null ? roles : java.util.Collections.<String>emptyList())
                            .stream()
                            .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                            .map(SimpleGrantedAuthority::new)
                            .toList();

                    var auth = new UsernamePasswordAuthenticationToken(username, null, authorities);
                    Long branchId = claims.get("branchId") instanceof Number n ? n.longValue() : null;
                    Long userId = claims.get("userId") instanceof Number n ? n.longValue() : null;
                    if (branchId != null || userId != null) {
                        Map<String, Object> details = new HashMap<>();
                        if (branchId != null) details.put("branchId", branchId);
                        if (userId != null) details.put("userId", userId);
                        auth.setDetails(details);
                    }
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception ignored) {
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}
