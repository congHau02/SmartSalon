package com.smartsalon.booking;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingServiceItemEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.booking.service.BookingReminderScheduler;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.config.TestAuthConfig;
import com.smartsalon.notification.RecordingNotificationSender;
import com.smartsalon.notification.dto.NotificationMessage;
import com.smartsalon.realtime.dto.RealtimeEventDto;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SpringBootTest
@Import(TestAuthConfig.class)
class BookingReminderSchedulerIntegrationTest {

    @Autowired
    private BookingReminderScheduler scheduler;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private RecordingNotificationSender recordingSender;

    @MockitoBean
    private SimpMessagingTemplate messagingTemplate;

    private final List<Long> createdBookingIds = new ArrayList<>();

    private BranchEntity branch;
    private ServiceEntity service;
    private UserEntity stylist;
    private UserEntity customerWithEmail;
    private UserEntity customerWithoutEmail;

    @BeforeEach
    void setUp() {
        recordingSender.clear();
        reset(messagingTemplate);
        createdBookingIds.clear();

        branch = branchRepository.findAllByIsDeletedFalseAndIsActiveTrue().stream()
                .findFirst()
                .orElseGet(() -> branchRepository.save(BranchEntity.builder()
                        .name("SmartSalon Flagship - Quận 1")
                        .address("123 Nguyễn Huệ, Quận 1, TP. HCM")
                        .phone("0901234567")
                        .isActive(true)
                        .build()));

        service = serviceRepository.findAllByIsDeletedFalseAndIsActiveTrue().stream()
                .findFirst()
                .orElseGet(() -> serviceRepository.save(ServiceEntity.builder()
                        .name("Cắt Tóc VIP")
                        .category("Hair")
                        .basePrice(new BigDecimal("200000.00"))
                        .durationMinutes(45)
                        .isActive(true)
                        .build()));

        stylist = userRepository.findActiveStylistsByBranchId(branch.getId()).stream()
                .findFirst()
                .orElseGet(() -> userRepository.save(UserEntity.builder()
                        .username("stylist.remind.test")
                        .passwordHash("hashed")
                        .fullName("Nguyễn Minh Stylist")
                        .phone("0912999888")
                        .branch(branch)
                        .isActive(true)
                        .build()));

        customerWithEmail = userRepository.findByPhoneAndIsDeletedFalse("0988001122")
                .orElseGet(() -> userRepository.save(UserEntity.builder()
                        .username("cust.with.mail." + UUID.randomUUID().toString().substring(0, 6))
                        .passwordHash("hashed")
                        .fullName("Khách Có Email")
                        .phone("0988001122")
                        .email("customer.remind@smartsalon.vn")
                        .branch(branch)
                        .isActive(true)
                        .build()));
        customerWithEmail.setEmail("customer.remind@smartsalon.vn");
        customerWithEmail = userRepository.save(customerWithEmail);

        customerWithoutEmail = userRepository.findByPhoneAndIsDeletedFalse("0988003344")
                .orElseGet(() -> userRepository.save(UserEntity.builder()
                        .username("cust.no.mail." + UUID.randomUUID().toString().substring(0, 6))
                        .passwordHash("hashed")
                        .fullName("Khách Không Email")
                        .phone("0988003344")
                        .email(null)
                        .branch(branch)
                        .isActive(true)
                        .build()));
        customerWithoutEmail.setEmail(null);
        customerWithoutEmail = userRepository.save(customerWithoutEmail);
    }

    @AfterEach
    void tearDown() {
        if (!createdBookingIds.isEmpty()) {
            bookingRepository.deleteAllById(createdBookingIds);
            createdBookingIds.clear();
        }
    }

    private void waitForMessages(int expectedCount) throws InterruptedException {
        long deadline = System.currentTimeMillis() + 3000;
        while (System.currentTimeMillis() < deadline && recordingSender.getSentMessages().size() < expectedCount) {
            Thread.sleep(50);
        }
    }

    private BookingEntity createBooking(UserEntity cust, String customEmail, BookingStatus status,
                                       LocalDateTime time, LocalDateTime reminderSentAt) {
        BookingEntity booking = BookingEntity.builder()
                .branch(branch)
                .customer(cust)
                .staff(stylist)
                .bookingCode("BK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .bookingTime(time)
                .endTime(time.plusMinutes(45))
                .totalDurationMinutes(45)
                .totalPrice(new BigDecimal("200000.00"))
                .depositAmount(new BigDecimal("40000.00"))
                .depositStatus(status == BookingStatus.CONFIRMED ? DepositStatus.PAID : DepositStatus.UNPAID)
                .status(status)
                .customerName(cust.getFullName())
                .customerPhone(cust.getPhone())
                .customerEmail(customEmail)
                .reminderSentAt(reminderSentAt)
                .build();

        BookingServiceItemEntity item = BookingServiceItemEntity.builder()
                .service(service)
                .price(service.getBasePrice())
                .durationMinutes(service.getDurationMinutes())
                .build();
        booking.addItem(item);

        BookingEntity saved = bookingRepository.save(booking);
        createdBookingIds.add(saved.getId());
        return saved;
    }

    @Test
    @DisplayName("Inside window with customer email: sends 1 reminder email + 1 branch STOMP broadcast, stamps reminderSentAt, no duplicates on rerun")
    void shouldProcessReminderForInsideWindowBookingWithEmail() throws Exception {
        LocalDateTime now = LocalDateTime.of(2026, 11, 2, 10, 0);
        LocalDateTime insideTime = now.plusHours(23).plusMinutes(30);

        BookingEntity booking = createBooking(customerWithEmail, null, BookingStatus.CONFIRMED, insideTime, null);

        // Run scheduler
        scheduler.sweepDueReminders(now);

        waitForMessages(1);

        // 1. Verify email sent
        List<NotificationMessage> sent = recordingSender.getSentMessages();
        assertThat(sent).hasSize(1);
        NotificationMessage email = sent.get(0);
        assertThat(email.recipient()).isEqualTo("customer.remind@smartsalon.vn");
        assertThat(email.subject()).contains("[SmartSalon] Nhắc lịch hẹn ngày mai").contains(booking.getBookingCode());
        assertThat(email.htmlContent())
                .contains(booking.getBookingCode())
                .contains("Nhắc Nhở Lịch Hẹn Ngày Mai")
                .contains(branch.getName());

        // 2. Verify STOMP broadcast to branch topic
        ArgumentCaptor<RealtimeEventDto> captor = ArgumentCaptor.forClass(RealtimeEventDto.class);
        verify(messagingTemplate, timeout(3000).times(1))
                .convertAndSend(eq("/topic/branch/" + branch.getId() + "/bookings"), captor.capture());

        RealtimeEventDto event = captor.getValue();
        assertThat(event.getEventType()).isEqualTo("BOOKING_REMINDER_DUE");
        assertThat(event.getCode()).isEqualTo(booking.getBookingCode());
        assertThat(event.getTitle()).contains("Khách sắp đến");

        // 3. Verify database flag updated
        BookingEntity updated = bookingRepository.findById(booking.getId()).orElseThrow();
        assertThat(updated.getReminderSentAt()).isEqualTo(now);

        // 4. Rerun scheduler: no duplicates sent
        scheduler.sweepDueReminders(now);
        Thread.sleep(200);
        assertThat(recordingSender.getSentMessages()).hasSize(1);
        verify(messagingTemplate, times(1)).convertAndSend(anyString(), any(RealtimeEventDto.class));
    }

    @Test
    @DisplayName("Inside window without customer email: skips email, sends 1 branch STOMP broadcast, stamps reminderSentAt")
    void shouldSendRealtimeNoticeOnlyWhenNoEmail() throws Exception {
        LocalDateTime now = LocalDateTime.of(2026, 11, 2, 10, 0);
        LocalDateTime insideTime = now.plusHours(23).plusMinutes(45);

        BookingEntity booking = createBooking(customerWithoutEmail, null, BookingStatus.CONFIRMED, insideTime, null);

        scheduler.sweepDueReminders(now);

        // Realtime broadcast must still arrive
        verify(messagingTemplate, timeout(3000).times(1))
                .convertAndSend(eq("/topic/branch/" + branch.getId() + "/bookings"), any(RealtimeEventDto.class));

        // Email must not be sent
        Thread.sleep(200);
        assertThat(recordingSender.getSentMessages()).isEmpty();

        // Database flag stamped
        BookingEntity updated = bookingRepository.findById(booking.getId()).orElseThrow();
        assertThat(updated.getReminderSentAt()).isEqualTo(now);
    }

    @Test
    @DisplayName("Ineligible bookings: outside window, cancelled, or already reminded are ignored")
    void shouldIgnoreIneligibleBookings() throws Exception {
        LocalDateTime now = LocalDateTime.of(2026, 11, 2, 10, 0);

        // Outside window: too soon (< 23h ahead, e.g. 2h ahead)
        createBooking(customerWithEmail, null, BookingStatus.CONFIRMED, now.plusHours(2), null);

        // Outside window: too far (> 24h ahead, e.g. 26h ahead)
        createBooking(customerWithEmail, null, BookingStatus.CONFIRMED, now.plusHours(26), null);

        // Inside window but CANCELLED
        createBooking(customerWithEmail, null, BookingStatus.CANCELLED, now.plusHours(23).plusMinutes(30), null);

        // Inside window but already reminded
        createBooking(customerWithEmail, null, BookingStatus.CONFIRMED, now.plusHours(23).plusMinutes(30), now.minusHours(1));

        scheduler.sweepDueReminders(now);

        Thread.sleep(300);
        assertThat(recordingSender.getSentMessages()).isEmpty();
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(RealtimeEventDto.class));
    }
}
