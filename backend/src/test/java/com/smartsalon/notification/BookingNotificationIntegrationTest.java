package com.smartsalon.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsalon.booking.dto.CreateBookingRequest;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.config.TestAuthConfig;
import com.smartsalon.notification.dto.NotificationMessage;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
class BookingNotificationIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private RecordingNotificationSender recordingSender;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private MockMvc mockMvc;

    private BranchEntity branch;
    private ServiceEntity service;
    private ServiceEntity service2;
    private UserEntity stylist;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        recordingSender.clear();

        branch = branchRepository.findAllByIsDeletedFalseAndIsActiveTrue().stream()
                .findFirst()
                .orElseGet(() -> branchRepository.save(BranchEntity.builder()
                        .name("SmartSalon Flagship - Quận 1")
                        .address("123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh")
                        .phone("0901234567")
                        .isActive(true)
                        .build()));

        List<ServiceEntity> activeServices = serviceRepository.findAllByIsDeletedFalseAndIsActiveTrue();
        service = activeServices.size() > 0 ? activeServices.get(0) : serviceRepository.save(ServiceEntity.builder()
                .name("Combo Cắt Gội Massage")
                .category("Hair")
                .basePrice(new BigDecimal("250000.00"))
                .durationMinutes(60)
                .isActive(true)
                .build());

        service2 = activeServices.size() > 1 ? activeServices.get(1) : serviceRepository.save(ServiceEntity.builder()
                .name("Uốn Tóc Hàn Quốc Cao Cấp")
                .category("Hair")
                .basePrice(new BigDecimal("450000.00"))
                .durationMinutes(90)
                .isActive(true)
                .build());

        stylist = userRepository.findActiveStylistsByBranchId(branch.getId()).stream()
                .findFirst()
                .orElseGet(() -> userRepository.save(UserEntity.builder()
                        .username("stylist.notify.test")
                        .passwordHash("hashed")
                        .fullName("Trần Văn Stylist")
                        .phone("0909090909")
                        .branch(branch)
                        .isActive(true)
                        .build()));
    }

    private void waitForMessages(int expectedCount) throws InterruptedException {
        long deadline = System.currentTimeMillis() + 3000;
        while (System.currentTimeMillis() < deadline && recordingSender.getSentMessages().size() < expectedCount) {
            Thread.sleep(50);
        }
    }

    @Test
    @DisplayName("Email is sent on PayOS webhook confirmation with Vietnamese HTML details and multiple items")
    void shouldSendConfirmationEmailOnPayOSWebhookConfirmation() throws Exception {
        LocalDateTime bookingTime = LocalDateTime.now().plusDays(25).withHour(14).withMinute(0).withSecond(0).withNano(0);
        CreateBookingRequest req = new CreateBookingRequest(
                branch.getId(),
                stylist.getId(),
                List.of(service.getId(), service2.getId()),
                bookingTime,
                "Nguyễn Khách Webhook",
                "0933112233",
                "guest.webhook@smartsalon.vn",
                "Ghi chú đặt hẹn"
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.result.status").value("PENDING_PAYMENT"))
                .andReturn();

        String bookingCode = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("result").get("bookingCode").asText();

        // Initial PENDING_PAYMENT booking does not trigger confirmation email
        assertThat(recordingSender.getSentMessages()).isEmpty();

        // Simulate PayOS webhook confirmation
        mockMvc.perform(post("/api/v1/webhooks/payos/simulate/" + bookingCode))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.status").value("CONFIRMED"));

        waitForMessages(1);

        List<NotificationMessage> sent = recordingSender.getSentMessages();
        assertThat(sent).hasSize(1);

        NotificationMessage message = sent.get(0);
        assertThat(message.recipient()).isEqualTo("guest.webhook@smartsalon.vn");
        assertThat(message.subject()).contains("[SmartSalon] Xác nhận đặt lịch hẹn").contains(bookingCode);
        assertThat(message.htmlContent())
                .contains(bookingCode)
                .contains("Nguyễn Khách Webhook")
                .contains(branch.getName())
                .contains(service.getName())
                .contains(service2.getName())
                .contains("ĐÃ THANH TOÁN")
                .contains("/customer/booking?code=" + bookingCode);
    }

    @Test
    @DisplayName("Email is sent immediately on credit-covered confirmation")
    void shouldSendConfirmationEmailOnCreditCoveredBooking() throws Exception {
        // Create customer with high credit balance
        UserEntity customer = userRepository.save(UserEntity.builder()
                .username("cust.credit.notify")
                .passwordHash("hashed")
                .fullName("Lê Khách Tín Dụng")
                .phone("0944556699")
                .email("cust.credit@smartsalon.vn")
                .creditBalance(new BigDecimal("500000.00"))
                .branch(branch)
                .isActive(true)
                .build());

        LocalDateTime bookingTime = LocalDateTime.now().plusDays(24).withHour(14).withMinute(0).withSecond(0).withNano(0);
        CreateBookingRequest req = new CreateBookingRequest(
                branch.getId(),
                stylist.getId(),
                List.of(service.getId()),
                bookingTime,
                customer.getFullName(),
                customer.getPhone(),
                "fallback@notused.vn",
                "Trừ cọc bảo lưu"
        );

        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.result.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.result.depositStatus").value("PAID"));

        waitForMessages(1);

        List<NotificationMessage> sent = recordingSender.getSentMessages();
        assertThat(sent).hasSize(1);
        // Recipient resolution: registered user email takes precedence
        assertThat(sent.get(0).recipient()).isEqualTo("cust.credit@smartsalon.vn");
        assertThat(sent.get(0).htmlContent()).contains("Lê Khách Tín Dụng").contains("ĐÃ THANH TOÁN");
    }

    @Test
    @DisplayName("Recipient resolution order: registered user email -> booking.customer_email -> skip")
    void shouldFollowRecipientResolutionOrder() throws Exception {
        recordingSender.clear();
        LocalDateTime baseTime = LocalDateTime.now().plusDays(26);

        // Case A: Registered user email takes precedence over booking.customer_email
        UserEntity registeredUser = userRepository.save(UserEntity.builder()
                .username("cust.order.user")
                .passwordHash("hashed")
                .fullName("Phạm User Registered")
                .phone("0977889901")
                .email("primary.user@smartsalon.vn")
                .creditBalance(new BigDecimal("200000.00"))
                .branch(branch)
                .isActive(true)
                .build());

        CreateBookingRequest reqA = new CreateBookingRequest(
                branch.getId(),
                stylist.getId(),
                List.of(service.getId()),
                baseTime.withHour(9).withMinute(0).withSecond(0).withNano(0),
                registeredUser.getFullName(),
                registeredUser.getPhone(),
                "secondary.guest@smartsalon.vn",
                "Order test A"
        );

        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqA)))
                .andExpect(status().isCreated());

        waitForMessages(1);
        assertThat(recordingSender.getSentMessages()).hasSize(1);
        assertThat(recordingSender.getSentMessages().get(0).recipient()).isEqualTo("primary.user@smartsalon.vn");
        recordingSender.clear();

        // Case B: Guest booking with customer_email specified
        CreateBookingRequest reqB = new CreateBookingRequest(
                branch.getId(),
                stylist.getId(),
                List.of(service.getId()),
                baseTime.withHour(11).withMinute(0).withSecond(0).withNano(0),
                "Khách Vãng Lai B",
                "0977889902",
                "guest.specified@smartsalon.vn",
                "Order test B"
        );

        MvcResult resB = mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqB)))
                .andExpect(status().isCreated())
                .andReturn();
        String codeB = objectMapper.readTree(resB.getResponse().getContentAsString()).get("result").get("bookingCode").asText();

        mockMvc.perform(post("/api/v1/webhooks/payos/simulate/" + codeB)).andExpect(status().isOk());
        waitForMessages(1);
        assertThat(recordingSender.getSentMessages()).hasSize(1);
        assertThat(recordingSender.getSentMessages().get(0).recipient()).isEqualTo("guest.specified@smartsalon.vn");
        recordingSender.clear();

        // Case C: Guest booking with no email -> skip email delivery
        CreateBookingRequest reqC = new CreateBookingRequest(
                branch.getId(),
                stylist.getId(),
                List.of(service.getId()),
                baseTime.withHour(13).withMinute(0).withSecond(0).withNano(0),
                "Khách Phone Only C",
                "0977889903",
                null,
                "Order test C"
        );

        MvcResult resC = mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqC)))
                .andExpect(status().isCreated())
                .andReturn();
        String codeC = objectMapper.readTree(resC.getResponse().getContentAsString()).get("result").get("bookingCode").asText();

        mockMvc.perform(post("/api/v1/webhooks/payos/simulate/" + codeC)).andExpect(status().isOk());
        Thread.sleep(200);
        assertThat(recordingSender.getSentMessages()).isEmpty();
    }

    @Test
    @DisplayName("Throwing NotificationSender does not fail booking creation or confirmation")
    void shouldNotFailBookingWhenNotificationSenderThrows() throws Exception {
        recordingSender.setThrowException(true);

        UserEntity customer = userRepository.save(UserEntity.builder()
                .username("cust.error.test")
                .passwordHash("hashed")
                .fullName("Khách Thất Bại Mail")
                .phone("0966554433")
                .email("fail.smtp@smartsalon.vn")
                .creditBalance(new BigDecimal("500000.00"))
                .branch(branch)
                .isActive(true)
                .build());

        LocalDateTime bookingTime = LocalDateTime.now().plusDays(27).withHour(15).withMinute(0).withSecond(0).withNano(0);
        CreateBookingRequest req = new CreateBookingRequest(
                branch.getId(),
                stylist.getId(),
                List.of(service.getId()),
                bookingTime,
                customer.getFullName(),
                customer.getPhone(),
                "fail.smtp@smartsalon.vn",
                "SMTP throwing test"
        );

        // Booking creation with credit cover must succeed even though NotificationSender throws
        MvcResult result = mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.result.status").value("CONFIRMED"))
                .andReturn();

        String code = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("result").get("bookingCode").asText();

        // Verify booking in database is successfully saved and CONFIRMED
        var saved = bookingRepository.findByBookingCodeAndIsDeletedFalse(code);
        assertThat(saved).isPresent();
        assertThat(saved.get().getStatus()).isEqualTo(BookingStatus.CONFIRMED);

        Thread.sleep(300);
        recordingSender.clear();
    }
}
