package com.smartsalon.auth.service;

import com.smartsalon.auth.dto.LoginRequest;
import com.smartsalon.auth.dto.RefreshTokenRequest;
import com.smartsalon.auth.dto.RegisterRequest;
import com.smartsalon.auth.dto.TokenResponse;
import com.smartsalon.auth.dto.UserDto;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.security.JwtProvider;
import com.smartsalon.user.entity.RoleEntity;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.RoleRepository;
import com.smartsalon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final RefreshTokenStore refreshTokenStore;

    @Value("${app.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest request) {
        String identifier = request.getIdentifier().trim();
        UserEntity user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        if (!user.isActive()) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        return generateTokenResponse(user);
    }

    @Transactional
    public TokenResponse register(RegisterRequest request) {
        String username = request.getUsername().trim();
        String phone = request.getPhone().trim();
        String email = request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim() : null;

        if (userRepository.existsByUsername(username) || userRepository.existsByPhone(phone)) {
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }
        if (email != null && userRepository.existsByEmail(email)) {
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }

        RoleEntity customerRole = roleRepository.findByName("CUSTOMER")
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        BranchEntity branch = null;
        if (request.getBranchId() != null) {
            branch = branchRepository.findByIdAndIsDeletedFalse(request.getBranchId())
                    .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));
        }

        UserEntity user = UserEntity.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .phone(phone)
                .email(email)
                .branch(branch)
                .isActive(true)
                .roles(Set.of(customerRole))
                .build();

        user = userRepository.save(user);
        return generateTokenResponse(user);
    }

    @Transactional
    public TokenResponse refreshToken(RefreshTokenRequest request) {
        String rawToken = request.getRefreshToken();
        if (rawToken == null || !rawToken.contains(".")) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        String[] parts = rawToken.split("\\.", 2);
        Long userId;
        try {
            userId = Long.parseLong(parts[0]);
        } catch (NumberFormatException e) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        String tokenRandom = parts[1];
        if (!refreshTokenStore.validate(userId, tokenRandom)) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        // Token Rotation: revoke old token immediately
        refreshTokenStore.revoke(userId, tokenRandom);

        UserEntity user = userRepository.findById(userId)
                .filter(u -> u.isActive() && !u.isDeleted())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return generateTokenResponse(user);
    }

    public void logout(String refreshToken) {
        if (refreshToken != null && refreshToken.contains(".")) {
            try {
                String[] parts = refreshToken.split("\\.", 2);
                Long userId = Long.parseLong(parts[0]);
                refreshTokenStore.revoke(userId, parts[1]);
            } catch (Exception e) {
                log.warn("Error parsing refresh token on logout: {}", e.getMessage());
            }
        }
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String username) {
        UserEntity user = userRepository.findByUsernameAndIsDeletedFalse(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return mapToUserDto(user);
    }

    private TokenResponse generateTokenResponse(UserEntity user) {
        List<String> roles = user.getRoles().stream()
                .map(RoleEntity::getName)
                .toList();

        Long branchId = user.getBranch() != null ? user.getBranch().getId() : null;
        String accessToken = jwtProvider.generateAccessToken(user.getId(), user.getUsername(), roles, branchId);

        String tokenRandom = UUID.randomUUID().toString().replace("-", "");
        String refreshToken = user.getId() + "." + tokenRandom;

        refreshTokenStore.store(user.getId(), tokenRandom, refreshExpirationMs);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProvider.getAccessExpirationMs() / 1000)
                .user(mapToUserDto(user))
                .build();
    }

    public UserDto mapToUserDto(UserEntity user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .branchId(user.getBranch() != null ? user.getBranch().getId() : null)
                .branchName(user.getBranch() != null ? user.getBranch().getName() : null)
                .roles(user.getRoles().stream().map(RoleEntity::getName).toList())
                .build();
    }
}
