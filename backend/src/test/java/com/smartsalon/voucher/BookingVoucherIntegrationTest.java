package com.smartsalon.voucher;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsalon.booking.dto.CreateBookingRequest;
import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceDefaultStepEntity;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.config.TestAuthConfig;
import com.smartsalon.pos.dto.CheckoutRequest;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.pos.entity.OrderStatus;
import com.smartsalon.pos.repository.OrderRepository;
import com.smartsalon.user.entity.RoleEntity;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.RoleRepository;
import com.smartsalon.user.repository.UserRepository;
import com.smartsalon.voucher.dto.ValidateVoucherRequest;
import com.smartsalon.voucher.entity.VoucherEntity;
import com.smartsalon.voucher.entity.VoucherType;
import com.smartsalon.voucher.repository.VoucherRedemptionRepository;
import com.smartsalon.voucher.repository.VoucherRepository;
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
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.springframework.transaction.annotation.Transactional;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
@Transactional
class BookingVoucherIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Autowired
    private VoucherRepository voucherRepository;

    @Autowired
    private VoucherRedemptionRepository voucherRedemptionRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    private BranchEntity branch1;
    private BranchEntity branch2;
    private ServiceEntity service;
    private UserEntity stylist;
    private UserEntity customer;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        voucherRedemptionRepository.deleteAll();

        branch1 = branchRepository.findById(1L).orElseGet(() ->
                branchRepository.save(BranchEntity.builder().name("Branch 1").address("Addr 1").phone("0901").isActive(true).build()));
        branch2 = branchRepository.findById(2L).orElseGet(() ->
                branchRepository.save(BranchEntity.builder().name("Branch 2").address("Addr 2").phone("0902").isActive(true).build()));

        RoleEntity stylistRole = roleRepository.findByName("STYLIST").orElseGet(() ->
                roleRepository.save(RoleEntity.builder().name("STYLIST").description("Stylist").build()));

        RoleEntity customerRole = roleRepository.findByName("CUSTOMER").orElseGet(() ->
                roleRepository.save(RoleEntity.builder().name("CUSTOMER").description("Customer").build()));

        stylist = userRepository.findByUsernameAndIsDeletedFalse("stylist.bv.test").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("stylist.bv.test")
                        .passwordHash("password")
                        .fullName("Stylist BV")
                        .phone("0981888888")
                        .branch(branch1)
                        .roles(Set.of(stylistRole))
                        .isActive(true)
                        .build()));

        customer = userRepository.findByPhoneAndIsDeletedFalse("0989990088").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("customer.bv.t08")
                        .passwordHash("password")
                        .fullName("Khách Test BV")
                        .phone("0989990088")
                        .email("customer.bv.t08@test.com")
                        .branch(branch1)
                        .roles(Set.of(customerRole))
                        .isActive(true)
                        .build()));

        service = serviceRepository.findAll().stream().findFirst().orElseGet(() -> {
            ServiceEntity s = ServiceEntity.builder()
                    .name("Dịch vụ BV Test")
                    .category("HAIRCUT")
                    .basePrice(new BigDecimal("200000.00"))
                    .commissionPoolRate(new BigDecimal("20.00"))
                    .durationMinutes(45)
                    .isActive(true)
                    .defaultSteps(new ArrayList<>())
                    .build();
            s.getDefaultSteps().add(ServiceDefaultStepEntity.builder()
                    .service(s)
                    .stepName("Bước 1")
                    .stepOrder(1)
                    .commissionRate(new BigDecimal("100.00"))
                    .build());
            return serviceRepository.save(s);
        });
    }

    private VoucherEntity createVoucher(String code, VoucherType type, BigDecimal value,
                                        BigDecimal minOrder, BigDecimal maxDiscount,
                                        Instant startsAt, Instant endsAt,
                                        Integer usageLimit, Integer perCustomerLimit,
                                        Set<BranchEntity> branches, boolean active) {
        VoucherEntity v = VoucherEntity.builder()
                .code(code.toUpperCase())
                .type(type)
                .value(value)
                .minOrderAmount(minOrder != null ? minOrder : BigDecimal.ZERO)
                .maxDiscount(maxDiscount)
                .startsAt(startsAt != null ? startsAt : Instant.now().minus(1, ChronoUnit.DAYS))
                .endsAt(endsAt != null ? endsAt : Instant.now().plus(7, ChronoUnit.DAYS))
                .usageLimit(usageLimit)
                .perCustomerLimit(perCustomerLimit != null ? perCustomerLimit : 1)
                .usedCount(0)
                .active(active)
                .branches(branches != null ? branches : Set.of())
                .build();
        return voucherRepository.save(v);
    }

    @Test
    @DisplayName("POST /api/v1/vouchers/validate returns discount preview when voucher is valid")
    void validateVoucher_success_returnsDiscountPreview() throws Exception {
        String code = "VALIDPREV" + System.currentTimeMillis();
        createVoucher(code, VoucherType.PERCENT, new BigDecimal("20"), new BigDecimal("100000"),
                new BigDecimal("50000"), null, null, 10, 1, Set.of(branch1), true);

        ValidateVoucherRequest request = new ValidateVoucherRequest(
                code,
                branch1.getId(),
                new BigDecimal("200000"),
                "0989990088"
        );

        mockMvc.perform(post("/api/v1/vouchers/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.code", is(code.toUpperCase())))
                .andExpect(jsonPath("$.result.discountAmount", is(40000.00)))
                .andExpect(jsonPath("$.result.valid", is(true)));
    }

    @Test
    @DisplayName("POST /api/v1/vouchers/validate returns validator error code when voucher is expired")
    void validateVoucher_expired_returnsValidatorErrorCode() throws Exception {
        String code = "EXPPREV" + System.currentTimeMillis();
        createVoucher(code, VoucherType.FIXED, new BigDecimal("30000"), BigDecimal.ZERO,
                null, Instant.now().minus(5, ChronoUnit.DAYS), Instant.now().minus(1, ChronoUnit.DAYS),
                10, 1, Set.of(), true);

        ValidateVoucherRequest request = new ValidateVoucherRequest(
                code,
                branch1.getId(),
                new BigDecimal("200000"),
                null
        );

        mockMvc.perform(post("/api/v1/vouchers/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is(5004)));
    }

    @Test
    @DisplayName("Booking create with valid voucher code stores it on booking, leaves deposit unchanged, consumes no usage")
    void createBooking_withValidVoucher_storesCodeAndDepositUnchanged() throws Exception {
        String code = "BOOKVOUCHER" + System.currentTimeMillis();
        VoucherEntity voucher = createVoucher(code, VoucherType.FIXED, new BigDecimal("50000"),
                BigDecimal.ZERO, null, null, null, 5, 1, Set.of(), true);

        LocalDateTime bookingTime = LocalDate.now().plusDays(2).atTime(10, 0);
        CreateBookingRequest request = new CreateBookingRequest(
                branch1.getId(),
                stylist.getId(),
                List.of(service.getId()),
                bookingTime,
                "Khách Voucher Test",
                "0912345678",
                "khach@test.com",
                "Đặt lịch có voucher",
                code
        );

        MvcResult result = mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.bookingCode").isNotEmpty())
                .andReturn();

        String responseJson = result.getResponse().getContentAsString();
        String bookingCode = objectMapper.readTree(responseJson).path("result").path("bookingCode").asText();

        BookingEntity booking = bookingRepository.findByBookingCodeAndIsDeletedFalse(bookingCode).orElseThrow();
        assertEquals(code.toUpperCase(), booking.getVoucherCode());

        // Deposit amount is 20% of service price (200,000 * 0.20 = 40,000) - untouched by voucher
        assertEquals(0, new BigDecimal("40000").compareTo(booking.getDepositAmount()));

        // Voucher usage must not be consumed at booking time
        VoucherEntity refreshed = voucherRepository.findById(voucher.getId()).orElseThrow();
        assertEquals(0, refreshed.getUsedCount());
        assertEquals(0, voucherRedemptionRepository.count());
    }

    @Test
    @DisplayName("Booking create with invalid voucher code is rejected with validator error code")
    void createBooking_withInvalidVoucher_isRejected() throws Exception {
        String code = "EXPINVALID" + System.currentTimeMillis();
        createVoucher(code, VoucherType.FIXED, new BigDecimal("50000"),
                BigDecimal.ZERO, null, Instant.now().minus(5, ChronoUnit.DAYS), Instant.now().minus(1, ChronoUnit.DAYS),
                5, 1, Set.of(), true);

        LocalDateTime bookingTime = LocalDate.now().plusDays(2).atTime(11, 0);
        CreateBookingRequest request = new CreateBookingRequest(
                branch1.getId(),
                stylist.getId(),
                List.of(service.getId()),
                bookingTime,
                "Khách Lỗi Voucher",
                "0912345679",
                "khach2@test.com",
                "Đặt lịch voucher hết hạn",
                code
        );

        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is(5004)));
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    @DisplayName("POS check-in pre-applies valid voucher code from booking, leaves redemption count 0 until PAID")
    void checkIn_preAppliesValidVoucher() throws Exception {
        String code = "CHECKINPRE" + System.currentTimeMillis();
        VoucherEntity voucher = createVoucher(code, VoucherType.FIXED, new BigDecimal("30000"),
                BigDecimal.ZERO, null, null, null, 10, 1, Set.of(), true);

        BookingEntity booking = BookingEntity.builder()
                .branch(branch1)
                .customer(customer)
                .bookingCode("BK-CK-" + System.currentTimeMillis())
                .customerName("Khách Check In")
                .customerPhone("0989990088")
                .bookingTime(LocalDateTime.now())
                .endTime(LocalDateTime.now().plusMinutes(45))
                .totalDurationMinutes(45)
                .totalPrice(new BigDecimal("200000"))
                .depositAmount(new BigDecimal("40000"))
                .depositStatus(com.smartsalon.booking.entity.DepositStatus.PAID)
                .status(BookingStatus.CONFIRMED)
                .voucherCode(code)
                .build();
        booking.addItem(com.smartsalon.booking.entity.BookingServiceItemEntity.builder()
                .booking(booking)
                .service(service)
                .price(new BigDecimal("200000"))
                .durationMinutes(45)
                .build());
        booking = bookingRepository.save(booking);

        MvcResult result = mockMvc.perform(post("/api/v1/pos/bookings/" + booking.getId() + "/check-in")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.voucherCode", is(code.toUpperCase())))
                .andExpect(jsonPath("$.result.discountAmount").value(30000))
                .andReturn();

        // No redemption row created yet (still CHECKED_IN, not PAID)
        assertEquals(0, voucherRedemptionRepository.count());
        VoucherEntity refreshedVoucher = voucherRepository.findById(voucher.getId()).orElseThrow();
        assertEquals(0, refreshedVoucher.getUsedCount());

        // Now checkout (transition to PAID)
        String resJson = result.getResponse().getContentAsString();
        Long orderId = objectMapper.readTree(resJson).path("result").path("id").asLong();

        CheckoutRequest checkoutRequest = new CheckoutRequest();
        checkoutRequest.setPaymentMethod("CASH");

        mockMvc.perform(post("/api/v1/pos/orders/" + orderId + "/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.status", is("PAID")));

        // Now redemption must exist and usedCount must be 1!
        assertEquals(1, voucherRedemptionRepository.count());
        refreshedVoucher = voucherRepository.findById(voucher.getId()).orElseThrow();
        assertEquals(1, refreshedVoucher.getUsedCount());
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    @DisplayName("POS check-in drops voucher that expired after booking and includes notice for cashier")
    void checkIn_dropsExpiredSinceBookingVoucher_cashierSeesNotice() throws Exception {
        String code = "EXPBEFORECK" + System.currentTimeMillis();
        // Voucher expired
        VoucherEntity voucher = createVoucher(code, VoucherType.FIXED, new BigDecimal("30000"),
                BigDecimal.ZERO, null, Instant.now().minus(5, ChronoUnit.DAYS), Instant.now().minus(1, ChronoUnit.DAYS),
                10, 1, Set.of(), true);

        BookingEntity booking = BookingEntity.builder()
                .branch(branch1)
                .customer(customer)
                .bookingCode("BK-EXP-" + System.currentTimeMillis())
                .customerName("Khách Hết Hạn")
                .customerPhone("0987654322")
                .bookingTime(LocalDateTime.now())
                .endTime(LocalDateTime.now().plusMinutes(45))
                .totalDurationMinutes(45)
                .totalPrice(new BigDecimal("200000"))
                .depositAmount(new BigDecimal("40000"))
                .depositStatus(com.smartsalon.booking.entity.DepositStatus.PAID)
                .status(BookingStatus.CONFIRMED)
                .voucherCode(code)
                .build();
        booking.addItem(com.smartsalon.booking.entity.BookingServiceItemEntity.builder()
                .booking(booking)
                .service(service)
                .price(new BigDecimal("200000"))
                .durationMinutes(45)
                .build());
        booking = bookingRepository.save(booking);

        mockMvc.perform(post("/api/v1/pos/bookings/" + booking.getId() + "/check-in")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.voucherCode").doesNotExist())
                .andExpect(jsonPath("$.result.voucherNotice", containsString("không còn khả dụng")));

        // Zero redemptions
        assertEquals(0, voucherRedemptionRepository.count());
    }
}
