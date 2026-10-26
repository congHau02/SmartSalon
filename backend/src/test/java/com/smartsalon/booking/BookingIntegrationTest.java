package com.smartsalon.booking;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsalon.booking.dto.CreateBookingRequest;
import com.smartsalon.booking.dto.UpdateBookingStatusRequest;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.booking.service.RedisLockService;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.config.TestAuthConfig;
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
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
class BookingIntegrationTest {

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
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private RedisLockService redisLockService;

    private MockMvc mockMvc;
    private BranchEntity testBranch;
    private ServiceEntity testService;
    private UserEntity testStylist;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        testBranch = branchRepository.findAllByIsDeletedFalseAndIsActiveTrue().stream()
                .findFirst()
                .orElseGet(() -> branchRepository.save(BranchEntity.builder()
                        .name("SmartSalon Test Branch")
                        .address("123 Test Street")
                        .phone("0901234567")
                        .isActive(true)
                        .build()));

        testService = serviceRepository.findAllByIsDeletedFalseAndIsActiveTrue().stream()
                .findFirst()
                .orElseGet(() -> serviceRepository.save(ServiceEntity.builder()
                        .name("Combo Cắt Gội Massage")
                        .category("Hair")
                        .basePrice(new BigDecimal("250000.00"))
                        .durationMinutes(60)
                        .isActive(true)
                        .build()));

        testStylist = userRepository.findActiveStylistsByBranchId(testBranch.getId()).stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Test stylist not found"));
    }

    @Test
    @DisplayName("Khách hàng vãng lai tạo lịch hẹn giữ chỗ 5 phút thành công (POST /api/v1/bookings)")
    void createBooking_guestCustomer_success() throws Exception {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        LocalDateTime bookingTime = LocalDateTime.of(tomorrow, LocalTime.of(15, 0));

        CreateBookingRequest request = new CreateBookingRequest(
                testBranch.getId(),
                testStylist.getId(),
                List.of(testService.getId()),
                bookingTime,
                "Khách Hàng Vãng Lai",
                "0977889900",
                "Ghi chú đặt lịch"
        );

        MvcResult result = mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.bookingCode", startsWith("BK-")))
                .andExpect(jsonPath("$.result.branchId").value(testBranch.getId()))
                .andExpect(jsonPath("$.result.stylistId").value(testStylist.getId()))
                .andExpect(jsonPath("$.result.customerName").value("Khách Hàng Vãng Lai"))
                .andExpect(jsonPath("$.result.customerPhone").value("0977889900"))
                .andExpect(jsonPath("$.result.status").value("PENDING_PAYMENT"))
                .andExpect(jsonPath("$.result.depositStatus").value("UNPAID"))
                .andExpect(jsonPath("$.result.depositAmount", notNullValue()))
                .andExpect(jsonPath("$.result.slotLockExpiresAt", notNullValue()))
                .andExpect(jsonPath("$.result.items", hasSize(1)))
                .andReturn();

        String responseJson = result.getResponse().getContentAsString();
        String bookingCode = objectMapper.readTree(responseJson).path("result").path("bookingCode").asText();
        Long bookingId = objectMapper.readTree(responseJson).path("result").path("id").asLong();

        // Verify lookup by code
        mockMvc.perform(get("/api/v1/bookings/code/" + bookingCode)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.bookingCode").value(bookingCode));

        // Verify lookup by phone
        mockMvc.perform(get("/api/v1/bookings/lookup")
                        .param("phone", "0977889900")
                        .param("bookingCode", bookingCode)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.result[0].bookingCode").value(bookingCode));

        // Clean up
        paymentTransactionRepository.findByBookingIdOrderByCreatedAtDesc(bookingId)
                .forEach(paymentTransactionRepository::delete);
        bookingRepository.deleteById(bookingId);
    }

    @Test
    @DisplayName("Quản lý danh sách lịch hẹn và cập nhật trạng thái yêu cầu phân quyền")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void adminEndpoints_withRoleAdmin_success() throws Exception {
        mockMvc.perform(get("/api/v1/bookings")
                        .param("branchId", testBranch.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result").isArray());
    }

    @Test
    @DisplayName("Truy cập quản lý lịch hẹn không có Token phải trả về 401/403")
    void adminEndpoints_unauthorized_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }
}
