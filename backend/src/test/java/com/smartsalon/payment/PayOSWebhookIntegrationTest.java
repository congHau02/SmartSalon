package com.smartsalon.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsalon.booking.dto.CreateBookingRequest;
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
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
class PayOSWebhookIntegrationTest {

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

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private com.smartsalon.user.repository.RoleRepository roleRepository;

    private MockMvc mockMvc;
    private BranchEntity branch;
    private ServiceEntity service1;
    private UserEntity stylist;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        branch = branchRepository.findAllByIsDeletedFalseAndIsActiveTrue().stream()
                .findFirst()
                .orElseGet(() -> branchRepository.save(BranchEntity.builder()
                        .name("SmartSalon Test Branch")
                        .address("123 Test Street")
                        .phone("0901234567")
                        .isActive(true)
                        .build()));

        service1 = serviceRepository.findAllByIsDeletedFalseAndIsActiveTrue().stream()
                .findFirst()
                .orElseGet(() -> serviceRepository.save(ServiceEntity.builder()
                        .name("Combo Cắt Gội Massage")
                        .category("Hair")
                        .basePrice(new BigDecimal("250000.00"))
                        .durationMinutes(60)
                        .isActive(true)
                        .build()));

        stylist = userRepository.findActiveStylistsByBranchId(branch.getId()).stream()
                .findFirst()
                .orElseGet(() -> {
                    var stylistRole = roleRepository.findByName("STYLIST")
                            .orElseGet(() -> roleRepository.save(com.smartsalon.user.entity.RoleEntity.builder().name("STYLIST").build()));
                    return userRepository.save(UserEntity.builder()
                            .username("stylist_payos_" + System.currentTimeMillis())
                            .passwordHash("hash")
                            .fullName("Stylist Test PayOS")
                            .phone("0988998877")
                            .branch(branch)
                            .isActive(true)
                            .roles(java.util.Set.of(stylistRole))
                            .build());
                });
    }

    @Test
    @DisplayName("GET /api/v1/bookings/{code}/payment-info: Lấy thông tin thanh toán VietQR thành công")
    void getPaymentInfo_Success() throws Exception {
        LocalDate tomorrow = LocalDate.now().plusDays(2);
        CreateBookingRequest req = new CreateBookingRequest(
                branch.getId(),
                stylist.getId(),
                List.of(service1.getId()),
                tomorrow.atTime(14, 0),
                "Khách Thanh Toán Test",
                "0987654321",
                "Ghi chú thanh toán"
        );
        var booking = bookingService.holdSlotAndCreate(req);

        mockMvc.perform(get("/api/v1/bookings/" + booking.bookingCode() + "/payment-info"))
                .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.bookingCode").value(booking.bookingCode()))
                .andExpect(jsonPath("$.result.amount").isNumber())
                .andExpect(jsonPath("$.result.bankId").value("MB"))
                .andExpect(jsonPath("$.result.qrCodeUrl", containsString("vietqr.io")));
    }

    @Test
    @DisplayName("POST /api/v1/webhooks/payos/simulate/{code}: One-click sandbox simulation thành công chuyển CONFIRMED")
    void simulatePayment_Success() throws Exception {
        LocalDate tomorrow = LocalDate.now().plusDays(3);
        CreateBookingRequest req = new CreateBookingRequest(
                branch.getId(),
                stylist.getId(),
                List.of(service1.getId()),
                tomorrow.atTime(15, 0),
                "Khách Sandbox Test",
                "0911223344",
                "Sandbox Test"
        );
        var booking = bookingService.holdSlotAndCreate(req);

        mockMvc.perform(post("/api/v1/webhooks/payos/simulate/" + booking.bookingCode()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.bookingCode").value(booking.bookingCode()))
                .andExpect(jsonPath("$.result.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.result.depositStatus").value("PAID"))
                .andExpect(jsonPath("$.result.slotLockExpiresAt").doesNotExist());

        BookingEntity updated = bookingRepository.findByBookingCodeAndIsDeletedFalse(booking.bookingCode()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
        assertThat(updated.getDepositStatus()).isEqualTo(DepositStatus.PAID);
        assertThat(updated.getSlotLockExpiresAt()).isNull();

        var transactions = paymentTransactionRepository.findByBookingIdOrderByCreatedAtDesc(updated.getId());
        assertThat(transactions).isNotEmpty();
        assertThat(transactions.get(0).getStatus()).isEqualTo("SUCCESS");
        assertThat(transactions.get(0).getPaymentMethod()).isEqualTo("PAYOS_SIMULATED");
    }

    @Test
    @DisplayName("POST /api/v1/webhooks/payos: Nhận webhook từ PayOS chuyển CONFIRMED")
    void handleWebhook_Success() throws Exception {
        LocalDate tomorrow = LocalDate.now().plusDays(4);
        CreateBookingRequest req = new CreateBookingRequest(
                branch.getId(),
                stylist.getId(),
                List.of(service1.getId()),
                tomorrow.atTime(16, 0),
                "Khách Webhook Test",
                "0933445566",
                "Webhook Test"
        );
        var booking = bookingService.holdSlotAndCreate(req);

        PayOSWebhookPayload.PayOSWebhookData data = new PayOSWebhookPayload.PayOSWebhookData(
                123456L,
                booking.depositAmount().longValue(),
                booking.bookingCode(),
                "0988888888",
                "REF_INTEGRATION_TEST",
                "2026-10-17 12:00:00",
                "VND",
                "pl_integration_123",
                "00",
                "Success"
        );
        PayOSWebhookPayload payload = new PayOSWebhookPayload("00", "Success", data, "test-signature");

        mockMvc.perform(post("/api/v1/webhooks/payos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.bookingCode").value(booking.bookingCode()))
                .andExpect(jsonPath("$.result.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.result.depositStatus").value("PAID"));

        BookingEntity updated = bookingRepository.findByBookingCodeAndIsDeletedFalse(booking.bookingCode()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
        assertThat(updated.getDepositStatus()).isEqualTo(DepositStatus.PAID);
    }
}
