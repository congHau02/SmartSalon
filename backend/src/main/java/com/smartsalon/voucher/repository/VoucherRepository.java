package com.smartsalon.voucher.repository;

import com.smartsalon.voucher.entity.VoucherEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<VoucherEntity, Long> {

    Optional<VoucherEntity> findByCodeIgnoreCaseAndIsDeletedFalse(String code);

    boolean existsByCodeIgnoreCaseAndIsDeletedFalse(String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM VoucherEntity v WHERE v.id = :id AND v.isDeleted = false")
    Optional<VoucherEntity> findByIdForUpdate(@Param("id") Long id);

    List<VoucherEntity> findByIsDeletedFalseOrderByCreatedAtDesc();

    @Query("SELECT DISTINCT v FROM VoucherEntity v LEFT JOIN v.branches b WHERE v.isDeleted = false AND (b.id = :branchId OR SIZE(v.branches) = 0) ORDER BY v.createdAt DESC")
    List<VoucherEntity> findValidForBranch(@Param("branchId") Long branchId);
}
