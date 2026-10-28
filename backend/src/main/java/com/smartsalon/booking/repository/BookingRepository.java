package com.smartsalon.booking.repository;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<BookingEntity, Long> {

    Optional<BookingEntity> findByBookingCodeAndIsDeletedFalse(String bookingCode);

    Optional<BookingEntity> findByCustomerPhoneAndBookingCodeAndIsDeletedFalse(String customerPhone, String bookingCode);

    List<BookingEntity> findByCustomerPhoneAndIsDeletedFalseOrderByBookingTimeDesc(String customerPhone);

    List<BookingEntity> findByCustomerIdAndIsDeletedFalseOrderByBookingTimeDesc(Long customerId);

    @Query("SELECT COUNT(b) FROM BookingEntity b WHERE b.customer.id = :customerId AND b.isDeleted = false " +
           "AND b.status IN ('PENDING_PAYMENT', 'CONFIRMED') AND b.bookingTime > :now")
    long countUpcomingBookingsForCustomer(@Param("customerId") Long customerId, @Param("now") LocalDateTime now);

    @Query("SELECT b FROM BookingEntity b WHERE b.staff.id = :staffId AND b.isDeleted = false " +
           "AND b.bookingTime < :windowEnd AND b.endTime > :windowStart " +
           "AND (b.status IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS') " +
           "     OR (b.status = 'PENDING_PAYMENT' AND b.slotLockExpiresAt > :now))")
    List<BookingEntity> findOverlappingBookingsForStylist(
            @Param("staffId") Long staffId,
            @Param("windowStart") LocalDateTime windowStart,
            @Param("windowEnd") LocalDateTime windowEnd,
            @Param("now") LocalDateTime now);

    @Query("SELECT b FROM BookingEntity b WHERE b.staff.id = :staffId AND b.isDeleted = false " +
           "AND b.bookingTime >= :startOfDay AND b.bookingTime < :endOfDay " +
           "AND (b.status IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS') " +
           "     OR (b.status = 'PENDING_PAYMENT' AND (b.slotLockExpiresAt IS NULL OR b.slotLockExpiresAt > :now))) " +
           "ORDER BY b.bookingTime ASC")
    List<BookingEntity> findActiveBookingsByStylistAndDay(
            @Param("staffId") Long staffId,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay,
            @Param("now") LocalDateTime now);

    @Query("SELECT b FROM BookingEntity b WHERE b.branch.id = :branchId AND b.isDeleted = false " +
           "AND b.bookingTime >= :dayStart AND b.bookingTime < :dayEnd " +
           "AND (b.status IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS') " +
           "     OR (b.status = 'PENDING_PAYMENT' AND b.slotLockExpiresAt > :now))")
    List<BookingEntity> findActiveBookingsByBranchAndDay(
            @Param("branchId") Long branchId,
            @Param("dayStart") LocalDateTime dayStart,
            @Param("dayEnd") LocalDateTime dayEnd,
            @Param("now") LocalDateTime now);

    @Query("SELECT b FROM BookingEntity b WHERE b.status = 'PENDING_PAYMENT' AND b.slotLockExpiresAt <= :now AND b.isDeleted = false")
    List<BookingEntity> findExpiredHoldBookings(@Param("now") LocalDateTime now);

    @Query("SELECT b FROM BookingEntity b WHERE b.isDeleted = false " +
           "AND (:branchId IS NULL OR b.branch.id = :branchId) " +
           "AND (:status IS NULL OR b.status = :status) " +
           "AND (:startDate IS NULL OR b.bookingTime >= :startDate) " +
           "AND (:endDate IS NULL OR b.bookingTime < :endDate) " +
           "AND (:search IS NULL OR LOWER(b.customerName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR b.customerPhone LIKE CONCAT('%', :search, '%') " +
           "     OR LOWER(b.bookingCode) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY b.bookingTime DESC")
    List<BookingEntity> searchBookings(
            @Param("branchId") Long branchId,
            @Param("status") BookingStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("search") String search);

    @Query("SELECT b FROM BookingEntity b WHERE b.branch.id = :branchId AND b.isDeleted = false " +
           "AND b.bookingTime >= :dayStart AND b.bookingTime < :dayEnd ORDER BY b.bookingTime ASC")
    List<BookingEntity> findBookingsByBranchAndDay(
            @Param("branchId") Long branchId,
            @Param("dayStart") LocalDateTime dayStart,
            @Param("dayEnd") LocalDateTime dayEnd);

    @Query("SELECT b FROM BookingEntity b WHERE b.isDeleted = false " +
           "AND (:branchId IS NULL OR b.branch.id = :branchId) " +
           "AND b.status = 'COMPLETED' " +
           "AND b.bookingTime >= :startDate AND b.bookingTime < :endDate ORDER BY b.bookingTime DESC")
    List<BookingEntity> findCompletedBookingsByDateRange(
            @Param("branchId") Long branchId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
}
