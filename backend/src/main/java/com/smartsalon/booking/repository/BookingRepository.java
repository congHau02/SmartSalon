package com.smartsalon.booking.repository;

import com.smartsalon.booking.entity.BookingEntity;
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

    List<BookingEntity> findByCustomerPhoneAndIsDeletedFalseOrderByBookingTimeDesc(String customerPhone);

    List<BookingEntity> findByCustomerIdAndIsDeletedFalseOrderByBookingTimeDesc(Long customerId);

    @Query("SELECT b FROM BookingEntity b WHERE b.staff.id = :staffId AND b.isDeleted = false " +
           "AND b.bookingTime < :windowEnd AND b.endTime > :windowStart " +
           "AND (b.status IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS') " +
           "     OR (b.status = 'PENDING_PAYMENT' AND b.slotLockExpiresAt > :now))")
    List<BookingEntity> findOverlappingBookingsForStylist(
            @Param("staffId") Long staffId,
            @Param("windowStart") LocalDateTime windowStart,
            @Param("windowEnd") LocalDateTime windowEnd,
            @Param("now") LocalDateTime now);

    @Query("SELECT b FROM BookingEntity b WHERE b.branch.id = :branchId AND b.isDeleted = false " +
           "AND b.bookingTime < :windowEnd AND b.endTime > :windowStart " +
           "AND (b.status IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS') " +
           "     OR (b.status = 'PENDING_PAYMENT' AND b.slotLockExpiresAt > :now))")
    List<BookingEntity> findOverlappingBookingsByBranch(
            @Param("branchId") Long branchId,
            @Param("windowStart") LocalDateTime windowStart,
            @Param("windowEnd") LocalDateTime windowEnd,
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
}
