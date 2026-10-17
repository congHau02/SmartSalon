package com.smartsalon.booking.repository;

import com.smartsalon.booking.entity.BookingServiceItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingServiceItemRepository extends JpaRepository<BookingServiceItemEntity, Long> {
    List<BookingServiceItemEntity> findByBookingIdAndIsDeletedFalse(Long bookingId);
}
