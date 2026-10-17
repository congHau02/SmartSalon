package com.smartsalon.booking.service;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingExpirationScheduler {

    private final BookingRepository bookingRepository;
    private final RedisLockService redisLockService;

    @Scheduled(fixedDelay = 30000)
    @Transactional(rollbackFor = Exception.class)
    public void sweepExpiredHoldBookings() {
        LocalDateTime now = LocalDateTime.now();
        List<BookingEntity> expiredList = bookingRepository.findExpiredHoldBookings(now);
        if (expiredList.isEmpty()) {
            return;
        }

        log.info("Sweeping {} expired booking hold(s)...", expiredList.size());
        for (BookingEntity booking : expiredList) {
            booking.setStatus(BookingStatus.EXPIRED);
            bookingRepository.save(booking);

            if (booking.getStaff() != null) {
                redisLockService.unlockSlots(
                        booking.getStaff().getId(),
                        booking.getBookingTime(),
                        booking.getEndTime()
                );
            }
            log.info("Expired booking hold: code={}, stylistId={}, time={}",
                    booking.getBookingCode(),
                    booking.getStaff() != null ? booking.getStaff().getId() : null,
                    booking.getBookingTime());
        }
    }
}
