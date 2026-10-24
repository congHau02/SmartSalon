package com.smartsalon.user.repository;

import com.smartsalon.user.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByIdAndIsDeletedFalse(Long id);

    Optional<UserEntity> findByUsernameAndIsDeletedFalse(String username);

    Optional<UserEntity> findByPhoneAndIsDeletedFalse(String phone);

    @Query("SELECT u FROM UserEntity u WHERE (u.username = :identifier OR u.phone = :identifier) AND u.isDeleted = false")
    Optional<UserEntity> findByIdentifier(@Param("identifier") String identifier);

    boolean existsByUsername(String username);

    boolean existsByUsernameAndIdNot(String username, Long id);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    @Query("SELECT DISTINCT u FROM UserEntity u JOIN u.roles r WHERE u.branch.id = :branchId AND r.name = 'STYLIST' AND u.isActive = true AND u.isDeleted = false")
    List<UserEntity> findActiveStylistsByBranchId(@Param("branchId") Long branchId);

    @Query("SELECT DISTINCT u FROM UserEntity u JOIN u.roles r WHERE u.branch.id = :branchId AND r.name != 'CUSTOMER' AND u.isActive = true AND u.isDeleted = false")
    List<UserEntity> findActiveStaffByBranchId(@Param("branchId") Long branchId);

    @Query("SELECT DISTINCT u FROM UserEntity u JOIN u.roles r WHERE r.name = 'STYLIST' AND u.isActive = true AND u.isDeleted = false")
    List<UserEntity> findAllActiveStylists();

    @Query("SELECT DISTINCT u FROM UserEntity u JOIN u.roles r WHERE r.name != 'CUSTOMER' AND u.isActive = true AND u.isDeleted = false")
    List<UserEntity> findAllActiveStaff();
}
