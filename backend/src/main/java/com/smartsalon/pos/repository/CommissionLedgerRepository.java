package com.smartsalon.pos.repository;

import com.smartsalon.pos.entity.CommissionLedgerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface CommissionLedgerRepository extends JpaRepository<CommissionLedgerEntity, Long> {

    List<CommissionLedgerEntity> findByOrderId(Long orderId);

    @Query("SELECT c FROM CommissionLedgerEntity c WHERE c.order.branch.id = :branchId AND c.createdAt >= :startDate AND c.createdAt < :endDate ORDER BY c.createdAt DESC")
    List<CommissionLedgerEntity> findByBranchAndDateRange(
            @Param("branchId") Long branchId,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate);
}
