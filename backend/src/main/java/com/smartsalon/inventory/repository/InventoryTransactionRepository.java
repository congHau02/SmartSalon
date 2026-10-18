package com.smartsalon.inventory.repository;

import com.smartsalon.inventory.entity.InventoryTransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransactionEntity, Long> {

    List<InventoryTransactionEntity> findAllByBranchIdOrderByCreatedAtDesc(Long branchId);

    List<InventoryTransactionEntity> findAllByBranchIdAndProductIdOrderByCreatedAtDesc(Long branchId, Long productId);

    List<InventoryTransactionEntity> findAllByReferenceOrderId(Long referenceOrderId);

    List<InventoryTransactionEntity> findAllByReferenceOrderIdIn(List<Long> referenceOrderIds);

    @Query("SELECT it FROM InventoryTransactionEntity it WHERE it.branch.id = :branchId AND it.createdAt >= :startDate AND it.createdAt < :endDate ORDER BY it.createdAt DESC")
    List<InventoryTransactionEntity> findByBranchIdAndDateRange(
            @Param("branchId") Long branchId,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate);

    @Query("SELECT it FROM InventoryTransactionEntity it WHERE it.createdAt >= :startDate AND it.createdAt < :endDate ORDER BY it.createdAt DESC")
    List<InventoryTransactionEntity> findByDateRange(
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate);
}

