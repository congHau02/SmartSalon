package com.smartsalon.booking;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.booking.service.BookingExpirationScheduler;
import com.smartsalon.booking.service.RedisLockService;
import com.smartsalon.user.entity.UserEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingExpirationSchedulerTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private RedisLockService redisLockService;

    @InjectMocks
    private BookingExpirationScheduler scheduler;

    @Test
    @DisplayName("Scheduler tự động quét và chuyển trạng thái EXPIRED, giải phóng Redis lock cho các đơn quá hạn 5 phút")
    void sweepExpiredHoldBookings_sweepsAndReleasesLocks() {
        LocalDateTime bookingStart = LocalDateTime.now().minusMinutes(10);
        LocalDateTime bookingEnd = bookingStart.plusMinutes(60);

        UserEntity stylist = UserEntity.builder().fullName("Nguyễn Minh").build();
        stylist.setId(42L);

        BookingEntity expiredBooking = BookingEntity.builder()
                .bookingCode("BK-EXPIRED-001")
                .staff(stylist)
                .bookingTime(bookingStart)
                .endTime(bookingEnd)
                .status(BookingStatus.PENDING_PAYMENT)
                .slotLockExpiresAt(LocalDateTime.now().minusMinutes(2))
                .build();

        when(bookingRepository.findExpiredHoldBookings(any())).thenReturn(List.of(expiredBooking));

        scheduler.sweepExpiredHoldBookings();

        assertThat(expiredBooking.getStatus()).isEqualTo(BookingStatus.EXPIRED);
        verify(bookingRepository, times(1)).save(expiredBooking);
        verify(redisLockService, times(1)).unlockSlots(eq(42L), eq(bookingStart), eq(bookingEnd));
    }

    @Test
    @DisplayName("Scheduler không thực hiện gì nếu không có đơn nào quá hạn")
    void sweepExpiredHoldBookings_noExpired_doesNothing() {
        when(bookingRepository.findExpiredHoldBookings(any())).thenReturn(List.of());

        scheduler.sweepExpiredHoldBookings();

        verify(bookingRepository, never()).save(any());
        verify(redisLockService, never()).unlockSlots(any(), any(), any());
    }
}
