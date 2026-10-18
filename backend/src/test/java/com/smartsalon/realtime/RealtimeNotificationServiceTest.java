package com.smartsalon.realtime;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.realtime.dto.RealtimeEventDto;
import com.smartsalon.realtime.service.RealtimeNotificationService;
import com.smartsalon.realtime.service.impl.RealtimeNotificationServiceImpl;
import com.smartsalon.user.entity.UserEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class RealtimeNotificationServiceTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private RealtimeNotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new RealtimeNotificationServiceImpl(messagingTemplate);
    }

    @Test
    @DisplayName("sendBookingEvent publishes payload to /topic/branch/{branchId}/bookings")
    void sendBookingEvent_shouldPublishToCorrectTopic() {
        RealtimeEventDto event = RealtimeEventDto.builder()
                .eventType("BOOKING_CREATED")
                .branchId(1L)
                .referenceId(100L)
                .code("BK-20261018-TEST")
                .title("Lịch hẹn mới")
                .message("Khách hàng Nguyễn Văn A vừa đặt lịch")
                .timestamp(LocalDateTime.now())
                .build();

        notificationService.sendBookingEvent(1L, event);

        verify(messagingTemplate).convertAndSend(eq("/topic/branch/1/bookings"), eq(event));
    }

    @Test
    @DisplayName("sendDispatchEvent publishes payload to /topic/branch/{branchId}/dispatch")
    void sendDispatchEvent_shouldPublishToCorrectTopic() {
        RealtimeEventDto event = RealtimeEventDto.builder()
                .eventType("ORDER_CHECKED_IN")
                .branchId(2L)
                .referenceId(200L)
                .code("ORD-20261018-001")
                .title("Check-in đơn hàng")
                .message("Khách đã check-in")
                .timestamp(LocalDateTime.now())
                .build();

        notificationService.sendDispatchEvent(2L, event);

        verify(messagingTemplate).convertAndSend(eq("/topic/branch/2/dispatch"), eq(event));
    }

    @Test
    @DisplayName("notifyBookingCreated builds structured DTO and broadcasts to branch topic")
    void notifyBookingCreated_shouldBroadcastStructuredDto() {
        BranchEntity branch = BranchEntity.builder().name("Chi nhánh Quận 1").build();
        branch.setId(5L);
        UserEntity stylist = UserEntity.builder().fullName("Trần Thợ Cắt").build();
        stylist.setId(12L);
        LocalDateTime bookingTime = LocalDateTime.of(2026, 10, 18, 14, 30);

        BookingEntity booking = BookingEntity.builder()
                .branch(branch)
                .bookingCode("BK-20261018-9999")
                .customerName("Lê Khách Hàng")
                .customerPhone("0912345678")
                .bookingTime(bookingTime)
                .totalPrice(new BigDecimal("350000"))
                .depositAmount(new BigDecimal("70000"))
                .depositStatus(DepositStatus.UNPAID)
                .status(BookingStatus.PENDING_PAYMENT)
                .staff(stylist)
                .build();
        booking.setId(999L);

        notificationService.notifyBookingCreated(booking);

        ArgumentCaptor<RealtimeEventDto> captor = ArgumentCaptor.forClass(RealtimeEventDto.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/branch/5/bookings"), captor.capture());

        RealtimeEventDto sent = captor.getValue();
        assertThat(sent.getEventType()).isEqualTo("BOOKING_CREATED");
        assertThat(sent.getBranchId()).isEqualTo(5L);
        assertThat(sent.getReferenceId()).isEqualTo(999L);
        assertThat(sent.getCode()).isEqualTo("BK-20261018-9999");
        assertThat(sent.getTitle()).contains("Lịch hẹn mới");
        assertThat(sent.getMessage()).contains("Lê Khách Hàng");
        assertThat(sent.getData()).containsEntry("customerName", "Lê Khách Hàng");
        assertThat(sent.getData()).containsEntry("customerPhone", "0912345678");
        assertThat(sent.getData()).containsEntry("stylistName", "Trần Thợ Cắt");
        assertThat(sent.getData()).containsEntry("depositAmount", new BigDecimal("70000"));
    }

    @Test
    @DisplayName("notifyBookingConfirmed broadcasts BOOKING_CONFIRMED event to branch topic")
    void notifyBookingConfirmed_shouldBroadcastConfirmedEvent() {
        BranchEntity branch = BranchEntity.builder().name("Chi nhánh Cầu Giấy").build();
        branch.setId(3L);
        BookingEntity booking = BookingEntity.builder()
                .branch(branch)
                .bookingCode("BK-20261018-8888")
                .customerName("Phạm Văn B")
                .customerPhone("0987654321")
                .depositAmount(new BigDecimal("100000"))
                .depositStatus(DepositStatus.PAID)
                .status(BookingStatus.CONFIRMED)
                .build();
        booking.setId(888L);

        notificationService.notifyBookingConfirmed(booking);

        ArgumentCaptor<RealtimeEventDto> captor = ArgumentCaptor.forClass(RealtimeEventDto.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/branch/3/bookings"), captor.capture());

        RealtimeEventDto sent = captor.getValue();
        assertThat(sent.getEventType()).isEqualTo("BOOKING_CONFIRMED");
        assertThat(sent.getBranchId()).isEqualTo(3L);
        assertThat(sent.getReferenceId()).isEqualTo(888L);
        assertThat(sent.getCode()).isEqualTo("BK-20261018-8888");
        assertThat(sent.getTitle()).contains("Xác nhận cọc");
    }

    @Test
    @DisplayName("notifyBookingStatusChanged broadcasts BOOKING_STATUS_CHANGED event")
    void notifyBookingStatusChanged_shouldBroadcastStatusChangeEvent() {
        BranchEntity branch = BranchEntity.builder().name("Chi nhánh 1").build();
        branch.setId(1L);
        BookingEntity booking = BookingEntity.builder()
                .branch(branch)
                .bookingCode("BK-20261018-7777")
                .customerName("Hoàng C")
                .customerPhone("0900000000")
                .status(BookingStatus.CHECKED_IN)
                .build();
        booking.setId(777L);

        notificationService.notifyBookingStatusChanged(booking, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN);

        ArgumentCaptor<RealtimeEventDto> captor = ArgumentCaptor.forClass(RealtimeEventDto.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/branch/1/bookings"), captor.capture());

        RealtimeEventDto sent = captor.getValue();
        assertThat(sent.getEventType()).isEqualTo("BOOKING_STATUS_CHANGED");
        assertThat(sent.getData()).containsEntry("oldStatus", "CONFIRMED");
        assertThat(sent.getData()).containsEntry("newStatus", "CHECKED_IN");
    }
}
