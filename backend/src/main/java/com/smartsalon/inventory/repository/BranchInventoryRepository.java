package com.smartsalon.inventory.repository;

import com.smartsalon.inventory.entity.BranchInventoryEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BranchInventoryRepository extends JpaRepository<BranchInventoryEntity, Long> {

    Optional<BranchInventoryEntity> findByBranchIdAndProductId(Long branchId, Long productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT bi FROM BranchInventoryEntity bi WHERE bi.branch.id = :branchId AND bi.product.id = :productId")
    Optional<BranchInventoryEntity> findByBranchIdAndProductIdForUpdate(@Param("branchId") Long branchId, @Param("productId") Long productId);

    List<BranchInventoryEntity> findAllByBranchId(Long branchId);

    @Query("SELECT bi FROM BranchInventoryEntity bi WHERE bi.branch.id = :branchId AND bi.stockUnits <= bi.minStockAlertUnits")
    List<BranchInventoryEntity> findLowStockByBranchId(@Param("branchId") Long branchId);
}
