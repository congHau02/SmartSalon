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
        };
    }

    @Bean
    @Primary
    public com.smartsalon.booking.service.RedisLockService testRedisLockService() {
        return new com.smartsalon.booking.service.RedisLockService() {
            private final Map<String, String> locks = new ConcurrentHashMap<>();

            @Override
            public boolean tryLockSlots(Long stylistId, java.time.LocalDateTime startTime, java.time.LocalDateTime endTime, String lockOwner) {
                java.util.List<String> keys = com.smartsalon.booking.service.impl.RedisLockServiceImpl.generateBucketKeys(stylistId, startTime, endTime);
                synchronized (locks) {
                    for (String k : keys) {
                        if (locks.containsKey(k)) return false;
                    }
                    for (String k : keys) {
                        locks.put(k, lockOwner != null ? lockOwner : "LOCKED");
                    }
                    return true;
                }
            }

            @Override
            public boolean isAnySlotLocked(Long stylistId, java.time.LocalDateTime startTime, java.time.LocalDateTime endTime) {
                java.util.List<String> keys = com.smartsalon.booking.service.impl.RedisLockServiceImpl.generateBucketKeys(stylistId, startTime, endTime);
                for (String k : keys) {
                    if (locks.containsKey(k)) return true;
                }
                return false;
            }

            @Override
            public java.util.Set<String> getLockedKeys(java.util.Collection<String> keys) {
                if (keys == null || keys.isEmpty()) return java.util.Collections.emptySet();
                return keys.stream().filter(locks::containsKey).collect(java.util.stream.Collectors.toSet());
            }

            @Override
            public void unlockSlots(Long stylistId, java.time.LocalDateTime startTime, java.time.LocalDateTime endTime) {
                java.util.List<String> keys = com.smartsalon.booking.service.impl.RedisLockServiceImpl.generateBucketKeys(stylistId, startTime, endTime);
                keys.forEach(locks::remove);
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
                com.smartsalon.user.entity.RoleEntity stylistRole = roleRepository.save(com.smartsalon.user.entity.RoleEntity.builder().name("STYLIST").description("Stylist").build());
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

                userRepository.save(
                        com.smartsalon.user.entity.UserEntity.builder()
                                .username("stylist.minh")
                                .passwordHash(passwordEncoder.encode("Admin@123"))
                                .fullName("Trần Minh Tuấn (Master Stylist)")
                                .phone("0911000001")
                                .email("minh.tuan@smartsalon.vn")
                                .branch(branch)
                                .isActive(true)
                                .roles(java.util.Set.of(stylistRole))
                                .build()
                );
            }
        };
    }
}
