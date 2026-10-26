package com.smartsalon.user.service;

import com.smartsalon.auth.dto.UserDto;
import com.smartsalon.auth.service.AuthService;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.security.BranchScopeGuard;
import com.smartsalon.user.dto.UserCreateRequest;
import com.smartsalon.user.dto.UserUpdateRequest;
import com.smartsalon.user.entity.RoleEntity;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.RoleRepository;
import com.smartsalon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final BranchScopeGuard branchScopeGuard;

    @Transactional
    public UserDto createStaff(UserCreateRequest request) {
        boolean isAdmin = branchScopeGuard.isCurrentUserAdmin();
        if (!isAdmin) {
            // Non-admin (MANAGER) cannot assign ADMIN or MANAGER roles
            for (String roleName : request.getRoles()) {
                if ("ADMIN".equalsIgnoreCase(roleName) || "MANAGER".equalsIgnoreCase(roleName)) {
                    throw new AppException(ErrorCode.FORBIDDEN);
                }
            }
            // Non-admin (MANAGER) cannot assign staff to a different branch
            Long callerBranchId = branchScopeGuard.getCallerBranchId();
            if (request.getBranchId() == null || !request.getBranchId().equals(callerBranchId)) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        }

        String username = request.getUsername().trim();
        String phone = request.getPhone().trim();

        if (userRepository.existsByUsername(username) || userRepository.existsByPhone(phone)) {
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }
        if (request.getEmail() != null && !request.getEmail().isBlank() && userRepository.existsByEmail(request.getEmail().trim())) {
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }

        BranchEntity branch = null;
        if (request.getBranchId() != null) {
            branch = branchRepository.findByIdAndIsDeletedFalse(request.getBranchId())
                    .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));
        }

        Set<RoleEntity> roles = new HashSet<>();
        for (String roleName : request.getRoles()) {
            RoleEntity role = roleRepository.findByName(roleName.toUpperCase())
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
            roles.add(role);
        }

        UserEntity user = UserEntity.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .phone(phone)
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .branch(branch)
                .isActive(true)
                .roles(roles)
                .build();

        user = userRepository.save(user);
        return authService.mapToUserDto(user);
    }

    @Transactional
    public UserDto updateStaff(Long id, UserUpdateRequest request) {
        UserEntity user = userRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        boolean isAdmin = branchScopeGuard.isCurrentUserAdmin();
        if (!isAdmin) {
            Long callerBranchId = branchScopeGuard.getCallerBranchId();
            // Non-admin (MANAGER) can only update staff within their own branch
            if (user.getBranch() == null || !callerBranchId.equals(user.getBranch().getId())) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
            // Cannot modify an ADMIN account
            if (user.getRoles().stream().anyMatch(r -> "ADMIN".equalsIgnoreCase(r.getName()))) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
            // Cannot promote to ADMIN or MANAGER
            if (request.getRoles() != null && request.getRoles().stream()
                    .anyMatch(r -> "ADMIN".equalsIgnoreCase(r) || "MANAGER".equalsIgnoreCase(r))) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
            // Cannot reassign staff to a different branch
            if (request.getBranchId() != null && !request.getBranchId().equals(callerBranchId)) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        }

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            String cleanPhone = request.getPhone().trim();
            if (!cleanPhone.equals(user.getPhone()) && userRepository.existsByPhone(cleanPhone)) {
                throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
            }
            user.setPhone(cleanPhone);
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String cleanEmail = request.getEmail().trim();
            if (!cleanEmail.equals(user.getEmail()) && userRepository.existsByEmail(cleanEmail)) {
                throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
            }
            user.setEmail(cleanEmail);
        }
        if (request.getBranchId() != null) {
            BranchEntity newBranch = branchRepository.findByIdAndIsDeletedFalse(request.getBranchId())
                    .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));
            user.setBranch(newBranch);
        }
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            Set<RoleEntity> newRoles = new HashSet<>();
            for (String roleName : request.getRoles()) {
                RoleEntity role = roleRepository.findByName(roleName.toUpperCase())
                        .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
                newRoles.add(role);
            }
            user.setRoles(newRoles);
        }
        if (request.getIsActive() != null) {
            user.setActive(request.getIsActive());
        }

        user = userRepository.save(user);
        return authService.mapToUserDto(user);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getUsers(Long branchId) {
        Long effectiveBranchId = branchScopeGuard.getEffectiveBranchId(branchId);
        List<UserEntity> users;
        if (effectiveBranchId != null) {
            users = userRepository.findActiveStaffByBranchId(effectiveBranchId);
        } else {
            users = userRepository.findAllActiveStaff();
        }
        return users.stream().map(authService::mapToUserDto).toList();
    }
}
