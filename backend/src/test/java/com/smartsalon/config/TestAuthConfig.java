package com.smartsalon.config;

import com.smartsalon.auth.service.RefreshTokenStore;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@TestConfiguration
public class TestAuthConfig {

    @Bean
    @Primary
    public RefreshTokenStore testRefreshTokenStore() {
        return new RefreshTokenStore() {
            private final Map<String, String> tokens = new ConcurrentHashMap<>();

            @Override
            public void store(Long userId, String token, long expirationMs) {
                tokens.put(userId + ":" + token, "ACTIVE");
            }

            @Override
            public boolean validate(Long userId, String token) {
                return tokens.containsKey(userId + ":" + token);
            }

            @Override
            public void revoke(Long userId, String token) {
                tokens.remove(userId + ":" + token);
            }

            @Override
            public void revokeAll(Long userId) {
                tokens.keySet().removeIf(k -> k.startsWith(userId + ":"));
            }
        };
    }

    @Bean
    public org.springframework.boot.ApplicationRunner testDataInitializer(
            com.smartsalon.user.repository.UserRepository userRepository,
            com.smartsalon.user.repository.RoleRepository roleRepository,
            com.smartsalon.branch.repository.BranchRepository branchRepository,
            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        return args -> {
            if (roleRepository.count() == 0) {
                com.smartsalon.branch.entity.BranchEntity branch = branchRepository.save(
                        com.smartsalon.branch.entity.BranchEntity.builder()
                                .name("SmartSalon Flagship - Quận 1")
                                .address("123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh")
                                .phone("0901234567")
                                .isActive(true)
                                .build()
                );

                com.smartsalon.user.entity.RoleEntity adminRole = roleRepository.save(
                        com.smartsalon.user.entity.RoleEntity.builder().name("ADMIN").description("Super Admin").build()
                );
                roleRepository.save(com.smartsalon.user.entity.RoleEntity.builder().name("MANAGER").description("Manager").build());
                roleRepository.save(com.smartsalon.user.entity.RoleEntity.builder().name("STAFF").description("Staff").build());
                roleRepository.save(com.smartsalon.user.entity.RoleEntity.builder().name("STYLIST").description("Stylist").build());
                roleRepository.save(com.smartsalon.user.entity.RoleEntity.builder().name("CUSTOMER").description("Customer").build());

                userRepository.save(
                        com.smartsalon.user.entity.UserEntity.builder()
                                .username("admin")
                                .passwordHash(passwordEncoder.encode("Admin@123"))
                                .fullName("Hệ thống Quản trị viên")
                                .phone("0988888888")
                                .email("admin@smartsalon.vn")
                                .branch(branch)
                                .isActive(true)
                                .roles(java.util.Set.of(adminRole))
                                .build()
                );
            }
        };
    }
}
