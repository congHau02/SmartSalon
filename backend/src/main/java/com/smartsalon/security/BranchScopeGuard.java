package com.smartsalon.security;

import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class BranchScopeGuard {

    private final UserRepository userRepository;
    private final BranchRepository branchRepository;

    public boolean isAdmin(Authentication auth) {
        if (auth == null) {
            return false;
        }
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> "ROLE_ADMIN".equals(a) || "ADMIN".equals(a));
    }

    public boolean isCurrentUserAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return isAdmin(auth);
    }

    public Authentication getAuthenticationOrThrow() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return auth;
    }

    public Long getCallerBranchId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        if (auth.getDetails() instanceof Map<?, ?> details) {
            Object branchObj = details.get("branchId");
            if (branchObj instanceof Number n) {
                return n.longValue();
            }
        }
        UserEntity user = userRepository.findByUsernameAndIsDeletedFalse(auth.getName())
                .orElse(null);
        if (user != null && user.getBranch() != null) {
            return user.getBranch().getId();
        }
        return branchRepository.findAll().stream().map(BranchEntity::getId).findFirst().orElse(null);
    }

    public void checkBranchAccess(Long targetBranchId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return;
        }
        if (isAdmin(auth)) {
            return;
        }
        Long callerBranchId = getCallerBranchId();
        if (callerBranchId == null || targetBranchId == null || !callerBranchId.equals(targetBranchId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    public Long getEffectiveBranchId(Long requestedBranchId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return requestedBranchId;
        }
        if (isAdmin(auth)) {
            return requestedBranchId;
        }
        Long callerBranchId = getCallerBranchId();
        if (callerBranchId == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        if (requestedBranchId != null && !callerBranchId.equals(requestedBranchId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        return callerBranchId;
    }

    public UserEntity getCurrentUser() {
        Authentication auth = getAuthenticationOrThrow();
        return userRepository.findByUsernameAndIsDeletedFalse(auth.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }
}
