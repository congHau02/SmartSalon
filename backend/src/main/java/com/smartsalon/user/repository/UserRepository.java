package com.smartsalon.user.repository;

import com.smartsalon.user.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByUsernameAndIsDeletedFalse(String username);

    Optional<UserEntity> findByPhoneAndIsDeletedFalse(String phone);

    @Query("SELECT u FROM UserEntity u WHERE (u.username = :identifier OR u.phone = :identifier) AND u.isDeleted = false")
    Optional<UserEntity> findByIdentifier(@Param("identifier") String identifier);

    boolean existsByUsername(String username);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);
}
