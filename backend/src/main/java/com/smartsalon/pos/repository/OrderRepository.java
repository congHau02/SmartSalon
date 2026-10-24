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

    @Query("SELECT o FROM OrderEntity o WHERE o.branch.id = :branchId AND o.status = :status AND o.createdAt >= :startDate AND o.createdAt < :endDate AND o.isDeleted = false ORDER BY o.createdAt DESC")
    List<OrderEntity> findByBranchAndStatusAndDateRange(
            @Param("branchId") Long branchId,
            @Param("status") OrderStatus status,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate);

    @Query("SELECT o FROM OrderEntity o WHERE o.status = :status AND o.createdAt >= :startDate AND o.createdAt < :endDate AND o.isDeleted = false ORDER BY o.createdAt DESC")
    List<OrderEntity> findByStatusAndDateRange(
            @Param("status") OrderStatus status,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate);

    @Query("SELECT o FROM OrderEntity o WHERE o.branch.id = :branchId AND o.status IN (:statuses) AND o.isDeleted = false ORDER BY o.createdAt DESC")
    List<OrderEntity> findByBranchIdAndStatusIn(
            @Param("branchId") Long branchId,
            @Param("statuses") List<OrderStatus> statuses);

    @Query("SELECT COUNT(DISTINCT o.id) FROM OrderEntity o " +
           "LEFT JOIN o.booking b " +
           "LEFT JOIN o.items i " +
           "LEFT JOIN i.stepAssignments s " +
           "WHERE o.customer.id = :customerId " +
           "AND o.status = com.smartsalon.pos.entity.OrderStatus.PAID " +
           "AND o.isDeleted = false " +
           "AND o.createdAt < :endInstant " +
           "AND (b.staff.id = :staffId OR (s.staff.id = :staffId AND s.status = com.smartsalon.pos.entity.StepAssignmentStatus.COMPLETED))")
    long countPaidOrdersByCustomerAndStaff(
            @Param("customerId") Long customerId,
            @Param("staffId") Long staffId,
            @Param("endInstant") Instant endInstant);

    @Query("SELECT COUNT(o) FROM OrderEntity o WHERE o.customer.id = :customerId AND o.status = com.smartsalon.pos.entity.OrderStatus.PAID AND o.isDeleted = false")
    long countCompletedVisitsByCustomerId(@Param("customerId") Long customerId);

    @Query("SELECT COALESCE(SUM(o.subtotal - o.discountAmount), 0.00) FROM OrderEntity o " +
           "WHERE o.customer.id = :customerId AND o.status = com.smartsalon.pos.entity.OrderStatus.PAID AND o.isDeleted = false")
    java.math.BigDecimal sumTotalSpentByCustomerId(@Param("customerId") Long customerId);

    @Query("SELECT o FROM OrderEntity o WHERE (o.customer.id = :customerId OR (o.customer IS NULL AND o.customerPhone = :phone)) AND o.status = :status AND o.isDeleted = false ORDER BY o.createdAt DESC")
    List<OrderEntity> findCustomerOrdersByStatus(
            @Param("customerId") Long customerId,
            @Param("phone") String phone,
            @Param("status") OrderStatus status);
}
