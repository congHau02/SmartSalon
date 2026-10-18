package com.smartsalon.pos.repository;

import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.pos.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, Long> {

    Optional<OrderEntity> findByIdAndIsDeletedFalse(Long id);

    Optional<OrderEntity> findByOrderCodeAndIsDeletedFalse(String orderCode);

    Optional<OrderEntity> findByBookingIdAndIsDeletedFalse(Long bookingId);

    boolean existsByBookingIdAndStatusNotAndIsDeletedFalse(Long bookingId, OrderStatus status);

    @Query("SELECT o FROM OrderEntity o WHERE o.branch.id = :branchId AND o.createdAt >= :startDate AND o.createdAt < :endDate AND o.isDeleted = false ORDER BY o.createdAt DESC")
    List<OrderEntity> findByBranchAndDateRange(
            @Param("branchId") Long branchId,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate);

    @Query("SELECT o FROM OrderEntity o WHERE o.branch.id = :branchId AND o.status IN (:statuses) AND o.isDeleted = false ORDER BY o.createdAt DESC")
    List<OrderEntity> findByBranchIdAndStatusIn(
            @Param("branchId") Long branchId,
            @Param("statuses") List<OrderStatus> statuses);
}
