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
public class BookingExpirationScheduler {

    private final BookingRepository bookingRepository;
    private final RedisLockService redisLockService;
    private final com.smartsalon.realtime.service.RealtimeNotificationService realtimeNotificationService;

    public BookingExpirationScheduler(BookingRepository bookingRepository, RedisLockService redisLockService) {
        this(bookingRepository, redisLockService, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public BookingExpirationScheduler(
            BookingRepository bookingRepository,
            RedisLockService redisLockService,
            com.smartsalon.realtime.service.RealtimeNotificationService realtimeNotificationService
    ) {
        this.bookingRepository = bookingRepository;
        this.redisLockService = redisLockService;
        this.realtimeNotificationService = realtimeNotificationService;
    }

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
            BookingStatus oldStatus = booking.getStatus();
            booking.expireHold();
            bookingRepository.save(booking);

            if (booking.getStaff() != null) {
                redisLockService.unlockSlots(
                        booking.getStaff().getId(),
                        booking.getBookingTime(),
                        booking.getEndTime()
                );
            }
            if (realtimeNotificationService != null) {
                realtimeNotificationService.notifyBookingStatusChanged(booking, oldStatus, BookingStatus.EXPIRED);
            }
            log.info("Expired booking hold: code={}, stylistId={}, time={}",
                    booking.getBookingCode(),
                    booking.getStaff() != null ? booking.getStaff().getId() : null,
                    booking.getBookingTime());
        }
    }
}
