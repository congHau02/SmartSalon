package com.smartsalon.security;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final Pattern BRANCH_TOPIC_PATTERN = Pattern.compile("^/topic/branch/([0-9]+)/.*");

    private final JwtProvider jwtProvider;
    private final BranchScopeGuard branchScopeGuard;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            authenticateFromHeaders(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();
            if (destination != null) {
                Matcher matcher = BRANCH_TOPIC_PATTERN.matcher(destination);
                if (matcher.matches()) {
                    Long targetBranchId = Long.parseLong(matcher.group(1));
                    Authentication auth = authenticateFromHeaders(accessor);
                    if (auth == null || !auth.isAuthenticated()) {
                        throw new MessageDeliveryException("Unauthorized: WebSocket subscription to " + destination + " requires authentication");
                    }
                    if (!branchScopeGuard.isAdmin(auth)) {
                        Long callerBranchId = extractBranchId(auth);
                        if (callerBranchId == null || !callerBranchId.equals(targetBranchId)) {
                            throw new MessageDeliveryException("Forbidden: Cross-branch WebSocket subscription to " + destination + " is rejected");
                        }
                    }
                }
            }
        }
        return message;
    }

    private Authentication authenticateFromHeaders(StompHeaderAccessor accessor) {
        if (accessor.getUser() instanceof Authentication existingAuth && existingAuth.isAuthenticated()) {
            return existingAuth;
        }

        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null) {
            authHeader = accessor.getFirstNativeHeader("authorization");
        }
        if (authHeader == null) {
            authHeader = accessor.getFirstNativeHeader("token");
        }

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                Claims claims = jwtProvider.parseClaims(token);
                String username = claims.getSubject();
                if (username != null) {
                    @SuppressWarnings("unchecked")
                    List<String> roles = claims.get("roles", List.class);
                    Long branchId = claims.get("branchId") instanceof Number n ? n.longValue() : null;
                    Long userId = claims.get("userId") instanceof Number n ? n.longValue() : null;

                    var authorities = (roles != null ? roles : Collections.<String>emptyList())
                            .stream()
                            .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                            .map(SimpleGrantedAuthority::new)
                            .toList();

                    var auth = new UsernamePasswordAuthenticationToken(username, null, authorities);
                    Map<String, Object> details = new HashMap<>();
                    if (branchId != null) details.put("branchId", branchId);
                    if (userId != null) details.put("userId", userId);
                    auth.setDetails(details);

                    try {
                        accessor.setUser(auth);
                    } catch (Exception ignored) {
                        // Accessor may be immutable in wrapped message contexts
                    }
                    return auth;
                }
            } catch (Exception ex) {
                log.warn("Invalid JWT token in STOMP headers: {}", ex.getMessage());
            }
        }
        return accessor.getUser() instanceof Authentication a ? a : null;
    }

    private Long extractBranchId(Authentication auth) {
        if (auth != null && auth.getDetails() instanceof Map<?, ?> details) {
            Object branchObj = details.get("branchId");
            if (branchObj instanceof Number n) {
                return n.longValue();
            }
        }
        return null;
    }
}
