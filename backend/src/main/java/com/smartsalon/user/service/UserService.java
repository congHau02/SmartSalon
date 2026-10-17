package com.smartsalon.user.service;

import com.smartsalon.auth.dto.UserDto;
import com.smartsalon.auth.service.AuthService;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.user.dto.UserCreateRequest;
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

    @Transactional
    public UserDto createStaff(UserCreateRequest request) {
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

    @Transactional(readOnly = true)
    public List<UserDto> getUsers(Long branchId) {
        List<UserEntity> users;
        if (branchId != null) {
            users = userRepository.findAll().stream()
                    .filter(u -> !u.isDeleted() && u.getBranch() != null && branchId.equals(u.getBranch().getId()))
                    .toList();
        } else {
            users = userRepository.findAll().stream()
                    .filter(u -> !u.isDeleted())
                    .toList();
        }
        return users.stream().map(authService::mapToUserDto).toList();
    }
}
