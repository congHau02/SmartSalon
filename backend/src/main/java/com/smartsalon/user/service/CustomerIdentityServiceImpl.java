package com.smartsalon.user.service;

import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.user.entity.RoleEntity;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.RoleRepository;
import com.smartsalon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerIdentityServiceImpl implements CustomerIdentityService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UserEntity resolveForBooking(String phone, String customerName, BranchEntity branch) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            UserEntity authUser = userRepository.findByUsernameAndIsDeletedFalse(auth.getName()).orElse(null);
            if (authUser != null && authUser.getRoles().stream().anyMatch(r -> "CUSTOMER".equals(r.getName()))) {
                return authUser;
            }
        }

        String cleanPhone = phone != null ? phone.trim() : "";
        String cleanName = (customerName != null && !customerName.isBlank()) ? customerName.trim() : ("Khách hàng " + cleanPhone);
        return resolveOrCreateCustomerByPhone(cleanPhone, cleanName, branch, false);
    }

    @Override
    @Transactional
    public ResolvedWalkInCustomer resolveForWalkIn(boolean quickGuest, String customerPhone, String customerName, BranchEntity branch) {
        if (quickGuest) {
            UserEntity guest = resolveWalkInGuest();
            String resolvedName = (customerName != null && !customerName.isBlank()) ? customerName : "Khách lẻ nhanh";
            String resolvedPhone = (customerPhone != null && !customerPhone.isBlank()) ? customerPhone : WALKIN_PHONE;
            return new ResolvedWalkInCustomer(guest, resolvedName, resolvedPhone);
        }

        if (customerPhone != null && !customerPhone.isBlank()) {
            String cleanPhone = customerPhone.trim();
            String fallbackName = (customerName != null && !customerName.isBlank()) ? customerName.trim() : "Khách hàng " + cleanPhone;
            UserEntity user = resolveOrCreateCustomerByPhone(cleanPhone, fallbackName, branch, true);
            String resolvedName = (customerName != null && !customerName.isBlank()) ? customerName : user.getFullName();
            return new ResolvedWalkInCustomer(user, resolvedName, customerPhone);
        }

        UserEntity guest = resolveWalkInGuest();
        String resolvedName = (customerName != null && !customerName.isBlank()) ? customerName : "Khách lẻ vãng lai";
        return new ResolvedWalkInCustomer(guest, resolvedName, WALKIN_PHONE);
    }

    @Override
    @Transactional
    public UserEntity resolveWalkInGuest() {
        return userRepository.findByUsernameAndIsDeletedFalse(WALKIN_USERNAME)
                .orElseGet(this::createWalkInGuestUser);
    }

    private UserEntity resolveOrCreateCustomerByPhone(String cleanPhone, String cleanName, BranchEntity branch, boolean forceGuestPrefix) {
        Optional<UserEntity> existing = userRepository.findByPhoneAndIsDeletedFalse(cleanPhone);
        if (existing.isPresent()) {
            return existing.get();
        }

        String username = (forceGuestPrefix || userRepository.existsByUsername(cleanPhone))
                ? "guest_" + cleanPhone
                : cleanPhone;

        RoleEntity customerRole = roleRepository.findByName("CUSTOMER")
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        UserEntity newGuest = UserEntity.builder()
                .branch(branch)
                .username(username)
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .fullName(cleanName)
                .phone(cleanPhone)
                .isActive(true)
                .roles(Set.of(customerRole))
                .build();

        return userRepository.save(newGuest);
    }

    private UserEntity createWalkInGuestUser() {
        RoleEntity customerRole = roleRepository.findByName("CUSTOMER")
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        UserEntity user = UserEntity.builder()
                .username(WALKIN_USERNAME)
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .fullName("Khách vãng lai (Walk-in)")
                .phone(WALKIN_PHONE)
                .email("walkin@smartsalon.vn")
                .isActive(true)
                .roles(Set.of(customerRole))
                .build();

        return userRepository.save(user);
    }
}
