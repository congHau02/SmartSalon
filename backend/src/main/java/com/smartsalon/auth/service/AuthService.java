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
import com.smartsalon.pos.repository.OrderRepository;
import com.smartsalon.security.JwtProvider;
import com.smartsalon.user.entity.MembershipTier;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BranchRepository branchRepository;
    private final OrderRepository orderRepository;
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

        Optional<UserEntity> existingByPhone = userRepository.findByPhoneAndIsDeletedFalse(phone);

        if (existingByPhone.isPresent()) {
            UserEntity provisionalUser = existingByPhone.get();
            if (!provisionalUser.isProvisional()) {
                throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
            }

            // Upgrading provisional customer account in-place
            if (userRepository.existsByUsernameAndIdNot(username, provisionalUser.getId())) {
                throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
            }
            if (email != null && userRepository.existsByEmailAndIdNot(email, provisionalUser.getId())) {
                throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
            }

            BranchEntity branch = provisionalUser.getBranch();
            if (request.getBranchId() != null) {
                branch = branchRepository.findByIdAndIsDeletedFalse(request.getBranchId())
                        .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));
            }

            provisionalUser.setUsername(username);
            provisionalUser.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            provisionalUser.setFullName(request.getFullName().trim());
            provisionalUser.setEmail(email);
            provisionalUser.setBranch(branch);
            provisionalUser.setProvisional(false);
            provisionalUser.setActive(true);

            // Recompute spend and tier from historical paid orders
            BigDecimal totalSpent = orderRepository.sumTotalSpentByCustomerId(provisionalUser.getId());
            if (totalSpent != null && totalSpent.compareTo(BigDecimal.ZERO) > 0) {
                provisionalUser.setTotalSpent(totalSpent);
                provisionalUser.setMembershipTier(MembershipTier.fromTotalSpent(totalSpent));
            }

            UserEntity savedUser = userRepository.save(provisionalUser);
            return generateTokenResponse(savedUser);
        }

        // Standard new customer registration
        if (userRepository.existsByUsername(username)) {
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
                .isProvisional(false)
                .totalSpent(BigDecimal.ZERO)
                .membershipTier(MembershipTier.STANDARD)
                .creditBalance(BigDecimal.ZERO)
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
        MembershipTier tier = user.getMembershipTier() != null ? user.getMembershipTier() : MembershipTier.STANDARD;
        BigDecimal totalSpent = user.getTotalSpent() != null ? user.getTotalSpent() : BigDecimal.ZERO;
        BigDecimal creditBalance = user.getCreditBalance() != null ? user.getCreditBalance() : BigDecimal.ZERO;

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
                .membershipTier(tier.name())
                .discountPercent(tier.getDiscountPercent())
                .totalSpent(totalSpent)
                .nextTier(tier.getNextTier() != null ? tier.getNextTier().name() : null)
                .amountToNextTier(tier.getAmountToNextTier(totalSpent))
                .creditBalance(creditBalance)
                .isProvisional(user.isProvisional())
                .build();
    }
}
