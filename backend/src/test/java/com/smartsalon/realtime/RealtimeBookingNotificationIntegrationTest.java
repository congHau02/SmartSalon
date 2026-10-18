package com.smartsalon.realtime;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsalon.booking.dto.CreateBookingRequest;
import com.smartsalon.booking.dto.UpdateBookingStatusRequest;
import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.booking.service.BookingService;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.config.TestAuthConfig;
import com.smartsalon.payment.dto.PayOSWebhookPayload;
import com.smartsalon.payment.repository.PaymentTransactionRepository;
import com.smartsalon.realtime.dto.RealtimeEventDto;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
class RealtimeBookingNotificationIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingService bookingService;

    @MockitoBean
    private SimpMessagingTemplate messagingTemplate;

    private MockMvc mockMvc;
    private BranchEntity branch;
    private ServiceEntity service;
    private UserEntity stylist;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        branch = branchRepository.findAll().stream()
                .filter(b -> !b.isDeleted() && b.isActive())
                .findFirst()
                .orElseGet(() -> {
                    BranchEntity b = BranchEntity.builder()
                            .name("Chi nhánh Test")
                            .address("123 Test")
                            .phone("0900000000")
                            .isActive(true)
                            .build();
                    return branchRepository.save(b);
                });

        stylist = userRepository.findAll().stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> "STYLIST".equals(r.getName())))
                .findFirst()
                .orElseThrow();

        service = serviceRepository.findAll().stream()
                .filter(s -> !s.isDeleted() && s.isActive())
                .findFirst()
                .orElseGet(() -> {
                    ServiceEntity s = ServiceEntity.builder()
                            .name("Dịch vụ Realtime Test")
                            .basePrice(new BigDecimal("200000"))
                            .durationMinutes(30)
                            .isActive(true)
                            .build();
                    return serviceRepository.save(s);
                });
    }

    @Test
    @DisplayName("Creating booking broadcasts BOOKING_CREATED payload to /topic/branch/{branchId}/bookings")
    void createBooking_shouldBroadcastBookingCreatedEvent() throws Exception {
        LocalDateTime bookingTime = LocalDate.now().plusDays(2).atTime(LocalTime.of(10, 0));
        CreateBookingRequest request = new CreateBookingRequest(
                branch.getId(),
                stylist.getId(),
                List.of(service.getId()),
                bookingTime,
                "Khách Test Realtime",
                "0911223344",
                "Ghi chú test"
        );

        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.bookingCode").isNotEmpty());

        ArgumentCaptor<RealtimeEventDto> captor = ArgumentCaptor.forClass(RealtimeEventDto.class);
        verify(messagingTemplate, atLeastOnce()).convertAndSend(
                eq("/topic/branch/" + branch.getId() + "/bookings"),
                captor.capture()
        );

        RealtimeEventDto event = captor.getValue();
        assertThat(event.getEventType()).isEqualTo("BOOKING_CREATED");
        assertThat(event.getBranchId()).isEqualTo(branch.getId());
        assertThat(event.getData()).containsEntry("customerName", "Khách Test Realtime");
        assertThat(event.getData()).containsEntry("customerPhone", "0911223344");
    }

    @Test
    @DisplayName("Sandbox deposit simulation broadcasts BOOKING_CONFIRMED to branch topic")
    void simulateDeposit_shouldBroadcastBookingConfirmedEvent() throws Exception {
        LocalDateTime bookingTime = LocalDate.now().plusDays(3).atTime(LocalTime.of(14, 0));
        CreateBookingRequest createReq = new CreateBookingRequest(
                branch.getId(),
                stylist.getId(),
                List.of(service.getId()),
                bookingTime,
                "Khách Hàng Sim",
                "0988776655",
                null
        );

        var created = bookingService.holdSlotAndCreate(createReq);
        String bookingCode = created.bookingCode();

        mockMvc.perform(post("/api/v1/webhooks/payos/simulate/" + bookingCode))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("CONFIRMED"));

        ArgumentCaptor<RealtimeEventDto> captor = ArgumentCaptor.forClass(RealtimeEventDto.class);
        verify(messagingTemplate, atLeastOnce()).convertAndSend(
                eq("/topic/branch/" + branch.getId() + "/bookings"),
                captor.capture()
        );

        List<RealtimeEventDto> events = captor.getAllValues();
        RealtimeEventDto confirmedEvent = events.stream()
                .filter(e -> "BOOKING_CONFIRMED".equals(e.getEventType()))
                .findFirst()
                .orElse(null);

        assertThat(confirmedEvent).isNotNull();
        assertThat(confirmedEvent.getCode()).isEqualTo(bookingCode);
        assertThat(confirmedEvent.getBranchId()).isEqualTo(branch.getId());
    }

    @Test
    @DisplayName("PayOS Webhook confirming deposit broadcasts BOOKING_CONFIRMED to branch topic")
    void payosWebhook_shouldBroadcastBookingConfirmedEvent() throws Exception {
        LocalDateTime bookingTime = LocalDate.now().plusDays(4).atTime(LocalTime.of(11, 0));
        CreateBookingRequest createReq = new CreateBookingRequest(
                branch.getId(),
                stylist.getId(),
                List.of(service.getId()),
                bookingTime,
                "Khách Hàng Webhook",
                "0933445566",
                null
        );

        var created = bookingService.holdSlotAndCreate(createReq);
        String bookingCode = created.bookingCode();
        long orderCode = System.currentTimeMillis() % 1000000L;

        PayOSWebhookPayload payload = new PayOSWebhookPayload(
                "00",
                "Success",
                new PayOSWebhookPayload.PayOSWebhookData(
                        orderCode,
                        40000L,
                        bookingCode,
                        "0988888888",
                        "REF-" + orderCode,
                        "2026-10-18 11:00:00",
                        "VND",
                        "link-123",
                        "00",
                        "Thành công"
                ),
                "mock_signature"
        );

        mockMvc.perform(post("/api/v1/webhooks/payos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("CONFIRMED"));

        ArgumentCaptor<RealtimeEventDto> captor = ArgumentCaptor.forClass(RealtimeEventDto.class);
        verify(messagingTemplate, atLeastOnce()).convertAndSend(
                eq("/topic/branch/" + branch.getId() + "/bookings"),
                captor.capture()
        );

        List<RealtimeEventDto> events = captor.getAllValues();
        RealtimeEventDto confirmedEvent = events.stream()
                .filter(e -> "BOOKING_CONFIRMED".equals(e.getEventType()))
                .findFirst()
                .orElse(null);

        assertThat(confirmedEvent).isNotNull();
        assertThat(confirmedEvent.getCode()).isEqualTo(bookingCode);
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    @DisplayName("Updating booking status broadcasts BOOKING_STATUS_CHANGED to branch topic")
    void updateBookingStatus_shouldBroadcastStatusChangedEvent() throws Exception {
        LocalDateTime bookingTime = LocalDate.now().plusDays(5).atTime(LocalTime.of(15, 0));
        CreateBookingRequest createReq = new CreateBookingRequest(
                branch.getId(),
                stylist.getId(),
                List.of(service.getId()),
                bookingTime,
                "Khách Hàng Update Status",
                "0955667788",
                null
        );

        var created = bookingService.holdSlotAndCreate(createReq);

        UpdateBookingStatusRequest updateReq = new UpdateBookingStatusRequest(
                BookingStatus.CANCELLED,
                "Khách bận việc đột xuất"
        );

        mockMvc.perform(patch("/api/v1/bookings/" + created.id() + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("CANCELLED"));

        ArgumentCaptor<RealtimeEventDto> captor = ArgumentCaptor.forClass(RealtimeEventDto.class);
        verify(messagingTemplate, atLeastOnce()).convertAndSend(
                eq("/topic/branch/" + branch.getId() + "/bookings"),
                captor.capture()
        );

        List<RealtimeEventDto> events = captor.getAllValues();
        RealtimeEventDto statusEvent = events.stream()
                .filter(e -> "BOOKING_STATUS_CHANGED".equals(e.getEventType()))
                .findFirst()
                .orElse(null);

        assertThat(statusEvent).isNotNull();
        assertThat(statusEvent.getData()).containsEntry("newStatus", "CANCELLED");
    }
}
