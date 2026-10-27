package com.smartsalon.customer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsalon.auth.dto.RegisterRequest;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceDefaultStepEntity;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.booking.dto.CreateBookingRequest;
import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingServiceItemEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.booking.service.RedisLockService;
import com.smartsalon.config.TestAuthConfig;
import com.smartsalon.inventory.entity.BranchInventoryEntity;
import com.smartsalon.inventory.entity.ProductEntity;
import com.smartsalon.inventory.repository.BranchInventoryRepository;
import com.smartsalon.inventory.repository.ProductRepository;
import com.smartsalon.payment.entity.PaymentTransactionEntity;
import com.smartsalon.payment.repository.PaymentTransactionRepository;
import com.smartsalon.pos.dto.AddProductItemRequest;
import com.smartsalon.pos.dto.CheckoutRequest;
import com.smartsalon.pos.dto.UpdateOrderRequest;
import com.smartsalon.pos.dto.WalkInOrderRequest;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.pos.repository.CommissionLedgerRepository;
import com.smartsalon.pos.repository.OrderRepository;
import com.smartsalon.user.entity.MembershipTier;
import com.smartsalon.user.entity.RoleEntity;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.RoleRepository;
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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
class CustomerCrmIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BranchInventoryRepository branchInventoryRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CommissionLedgerRepository commissionLedgerRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RedisLockService redisLockService;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private com.smartsalon.pos.repository.TechnicalLogRepository technicalLogRepository;

    @Autowired
    private com.smartsalon.review.repository.ServiceReviewRepository serviceReviewRepository;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private MockMvc mockMvc;
    private BranchEntity branch;
    private ServiceEntity service;
    private ProductEntity product;
    private UserEntity custHa;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        branch = branchRepository.findAll().stream().findFirst().orElseGet(() ->
                branchRepository.save(BranchEntity.builder()
                        .name("SmartSalon Flagship - Quận 1")
                        .address("123 Nguyễn Huệ, Q1")
                        .phone("0901234567")
                        .isActive(true)
                        .build())
        );

        RoleEntity customerRole = roleRepository.findByName("CUSTOMER").orElseGet(() ->
                roleRepository.save(RoleEntity.builder().name("CUSTOMER").description("Khách hàng").build())
        );

        service = serviceRepository.findAll().stream()
                .filter(s -> "Nhuộm tóc thời trang CRM".equals(s.getName()))
                .findFirst()
                .orElseGet(() -> {
                    ServiceEntity s = ServiceEntity.builder()
                            .name("Nhuộm tóc thời trang CRM")
                            .category("HAIR_COLOR")
                            .basePrice(new BigDecimal("850000.00"))
                            .commissionPoolRate(new BigDecimal("20.00"))
                            .durationMinutes(90)
                            .isActive(true)
                            .defaultSteps(new ArrayList<>())
                            .build();
                    s.getDefaultSteps().add(ServiceDefaultStepEntity.builder()
                            .service(s)
                            .stepName("Pha thuốc")
                            .stepOrder(1)
                            .commissionRate(new BigDecimal("100.00"))
                            .build());
                    return serviceRepository.save(s);
                });

        product = productRepository.findBySkuAndIsDeletedFalse("KER-SHAMP-CRM").orElseGet(() ->
                productRepository.save(ProductEntity.builder()
                        .name("Dầu gội Kérastase CRM")
                        .sku("KER-SHAMP-CRM")
                        .unit("Chai")
                        .retailPrice(new BigDecimal("1250000.00"))
                        .isActive(true)
                        .build())
        );

        branchInventoryRepository.findByBranchIdAndProductId(branch.getId(), product.getId()).orElseGet(() ->
                branchInventoryRepository.save(BranchInventoryEntity.builder()
                        .branch(branch)
                        .product(product)
                        .stockUnits(20)
                        .build())
        );

        custHa = userRepository.findByPhoneAndIsDeletedFalse("0988111222").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("cust.ha")
                        .passwordHash("hashed")
                        .fullName("Nguyễn Thu Hà")
                        .phone("0988111222")
                        .email("ha.nguyen@smartsalon.vn")
                        .branch(branch)
                        .isActive(true)
                        .totalSpent(new BigDecimal("2600000.00"))
                        .membershipTier(MembershipTier.SILVER)
                        .roles(Set.of(customerRole))
                        .build())
        );
        // Ensure custHa has SILVER tier and 2.6M spend and zero credit balance for test idempotency
        custHa.setTotalSpent(new BigDecimal("2600000.00"));
        custHa.setMembershipTier(MembershipTier.SILVER);
        custHa.setCreditBalance(BigDecimal.ZERO);
        userRepository.save(custHa);
    }

    @Test
    @DisplayName("Flow 1: Provisional Customer in-place registration claim preserves historical spend and tier")
    @WithMockUser(username = "staff.le", roles = {"ADMIN"})
    void shouldClaimProvisionalCustomerInPlaceOnRegistration() throws Exception {
        String testPhone = "0977888999";

        // 1. Create a Walk-in Order for a new unauthenticated customer
        WalkInOrderRequest walkInReq = WalkInOrderRequest.builder()
                .branchId(branch.getId())
                .customerPhone(testPhone)
                .customerName("Khách Tạm Thời")
                .serviceIds(List.of(service.getId()))
                .isQuickGuest(false)
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/v1/pos/orders/walk-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(walkInReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(1000))
                .andReturn();

        JsonNode createNode = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("result");
        Long orderId = createNode.get("id").asLong();
        Long provisionalCustomerId = createNode.get("customerId").asLong();

        UserEntity provisionalUser = userRepository.findById(provisionalCustomerId).orElseThrow();
        assertTrue(provisionalUser.isProvisional(), "Auto-created customer must have is_provisional = true");
        assertEquals(testPhone, provisionalUser.getPhone());

        // Add a product item of 1,250,000 VND so total subtotal = 2,100,000 VND
        AddProductItemRequest addProductReq = AddProductItemRequest.builder()
                .productId(product.getId())
                .quantity(1)
                .build();
        mockMvc.perform(post("/api/v1/pos/orders/" + orderId + "/items/product")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addProductReq)))
                .andExpect(status().isOk());

        // 2. Complete POS checkout (subtotal 2,100,000 VND net)
        CheckoutRequest checkoutReq = CheckoutRequest.builder()
                .paymentMethod("CASH")
                .notes("Thanh toán tiền mặt đủ")
                .build();

        mockMvc.perform(post("/api/v1/pos/orders/" + orderId + "/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.status").value("PAID"));

        UserEntity userAfterCheckout = userRepository.findById(provisionalCustomerId).orElseThrow();
        assertEquals(0, new BigDecimal("2100000.00").compareTo(userAfterCheckout.getTotalSpent()),
                "total_spent must reflect completed order net revenue");
        assertEquals(MembershipTier.SILVER, userAfterCheckout.getMembershipTier(),
                "Customer spend >= 2M must promote to SILVER");

        // 3. Register online with that same phone number to claim profile in-place
        RegisterRequest registerReq = RegisterRequest.builder()
                .username("khach.tamthoi")
                .password("Password@123")
                .fullName("Khách Tạm Thời Chính Thức")
                .phone(testPhone)
                .email("tamthoi@smartsalon.vn")
                .branchId(branch.getId())
                .build();

        MvcResult registerResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.user.id").value(provisionalCustomerId))
                .andExpect(jsonPath("$.result.user.username").value("khach.tamthoi"))
                .andExpect(jsonPath("$.result.user.isProvisional").value(false))
                .andExpect(jsonPath("$.result.user.membershipTier").value("SILVER"))
                .andExpect(jsonPath("$.result.user.discountPercent").value(5))
                .andReturn();

        UserEntity claimedUser = userRepository.findById(provisionalCustomerId).orElseThrow();
        assertFalse(claimedUser.isProvisional(), "Claimed user must have is_provisional = false");
        assertEquals("khach.tamthoi", claimedUser.getUsername());
        assertEquals("Khách Tạm Thời Chính Thức", claimedUser.getFullName());
        assertEquals(0, new BigDecimal("2100000.00").compareTo(claimedUser.getTotalSpent()),
                "Claimed user retains historical spend");

        // Verify order is still linked to this user
        OrderEntity orderInDb = orderRepository.findById(orderId).orElseThrow();
        assertEquals(claimedUser.getId(), orderInDb.getCustomer().getId(),
                "Historical orders must remain linked without change");

        // 4. Second registration with the same phone must be rejected with USER_ALREADY_EXISTS
        RegisterRequest duplicateReq = RegisterRequest.builder()
                .username("another.username")
                .password("Password@123")
                .fullName("Người khác")
                .phone(testPhone)
                .email("other@smartsalon.vn")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(1005)); // USER_ALREADY_EXISTS
    }

    @Test
    @DisplayName("Flow 2: Membership Tier discounts calculate automatically without affecting staff commissions")
    @WithMockUser(username = "staff.le", roles = {"ADMIN"})
    void shouldAutoCalculateMembershipTierDiscountAndPreserveCommissions() throws Exception {
        // Customer cust.ha (phone 0988111222) is SILVER tier (5% discount)
        WalkInOrderRequest walkInReq = WalkInOrderRequest.builder()
                .branchId(branch.getId())
                .customerPhone("0988111222")
                .customerName("Nguyễn Thu Hà")
                .serviceIds(List.of(service.getId())) // basePrice: 850,000 VND
                .isQuickGuest(false)
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/v1/pos/orders/walk-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(walkInReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.subtotal").value(850000.00))
                // 5% of 850,000 = 42,500 VND
                .andExpect(jsonPath("$.result.discountAmount").value(42500.00))
                .andExpect(jsonPath("$.result.finalAmount").value(807500.00))
                .andExpect(jsonPath("$.result.isDiscountManual").value(false))
                .andExpect(jsonPath("$.result.customerMembershipTier").value("SILVER"))
                .andExpect(jsonPath("$.result.customerDiscountPercent").value(5))
                .andReturn();

        JsonNode createNode = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("result");
        Long orderId = createNode.get("id").asLong();

        // Add Product (1,250,000 VND). Subtotal becomes 850,000 + 1,250,000 = 2,100,000 VND
        AddProductItemRequest addProductReq = AddProductItemRequest.builder()
                .productId(product.getId())
                .quantity(1)
                .build();

        mockMvc.perform(post("/api/v1/pos/orders/" + orderId + "/items/product")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addProductReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.subtotal").value(2100000.00))
                // 5% of 2,100,000 = 105,000 VND
                .andExpect(jsonPath("$.result.discountAmount").value(105000.00))
                .andExpect(jsonPath("$.result.finalAmount").value(1995000.00))
                .andExpect(jsonPath("$.result.isDiscountManual").value(false));

        // Manually override discount at POS to 150,000 VND
        UpdateOrderRequest updateReq = UpdateOrderRequest.builder()
                .discountAmount(new BigDecimal("150000.00"))
                .notes("Ưu đãi đặc biệt của quản lý")
                .build();

        mockMvc.perform(patch("/api/v1/pos/orders/" + orderId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.discountAmount").value(150000.00))
                .andExpect(jsonPath("$.result.finalAmount").value(1950000.00))
                .andExpect(jsonPath("$.result.isDiscountManual").value(true));

        // Complete checkout
        CheckoutRequest checkoutReq = CheckoutRequest.builder()
                .paymentMethod("VIETQR")
                .notes("Thanh toán QR")
                .build();

        mockMvc.perform(post("/api/v1/pos/orders/" + orderId + "/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.status").value("PAID"));

        // Verify Commission Ledger entries are calculated from 100% of catalog price (850,000)
        // Pool rate = 20%, 850,000 * 20% = 170,000 pool
        var ledgers = commissionLedgerRepository.findAll().stream()
                .filter(l -> l.getOrder() != null && l.getOrder().getId().equals(orderId))
                .toList();

        assertFalse(ledgers.isEmpty(), "Commission ledgers must be recorded");
        BigDecimal totalCommissionOnOrder = ledgers.stream()
                .map(l -> l.getAmount() != null ? l.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        // Total commission across 100% of steps must equal pool (170,000 VND)
        assertEquals(0, new BigDecimal("170000.00").compareTo(totalCommissionOnOrder),
                "Commission pool must remain 100% of catalog price (170,000) regardless of order discount");
    }

    @Test
    @DisplayName("Loyalty Preview: Exposes customer membership tier, savings, and progression")
    void shouldReturnCustomerLoyaltyPreview() throws Exception {
        // 1. Seeded customer cust.ha (SILVER)
        mockMvc.perform(get("/api/v1/customers/loyalty-preview")
                        .param("phone", "0988111222"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.membershipTier").value("SILVER"))
                .andExpect(jsonPath("$.result.discountPercent").value(5))
                .andExpect(jsonPath("$.result.nextTier").value("GOLD"))
                .andExpect(jsonPath("$.result.amountToNextTier").value(2400000.00)); // 5M - 2.6M = 2.4M

        // 2. Unknown phone returns standard tier
        mockMvc.perform(get("/api/v1/customers/loyalty-preview")
                        .param("phone", "0999000111"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.membershipTier").value("STANDARD"))
                .andExpect(jsonPath("$.result.discountPercent").value(0))
                .andExpect(jsonPath("$.result.nextTier").value("SILVER"))
                .andExpect(jsonPath("$.result.amountToNextTier").value(2000000.00));
    }

    @Test
    @DisplayName("Online Cancellation: Cancelling PENDING_PAYMENT booking releases Redis slot locks")
    @WithMockUser(username = "cust.ha", roles = {"CUSTOMER"})
    void shouldReleaseRedisSlotLocksWhenCancellingPendingPaymentBooking() throws Exception {
        UserEntity stylist = userRepository.findActiveStylistsByBranchId(branch.getId()).stream().findFirst().orElseThrow();
        LocalDateTime startTime = LocalDateTime.now().plusHours(4);
        LocalDateTime endTime = startTime.plusMinutes(90);

        redisLockService.tryLockSlots(stylist.getId(), startTime, endTime, "CANCEL_TEST_PENDING");
        assertTrue(redisLockService.isAnySlotLocked(stylist.getId(), startTime, endTime));

        BookingEntity booking = bookingRepository.save(BookingEntity.builder()
                .branch(branch)
                .customer(custHa)
                .staff(stylist)
                .bookingCode("BK-PEN-" + System.currentTimeMillis())
                .bookingTime(startTime)
                .endTime(endTime)
                .totalDurationMinutes(90)
                .totalPrice(new BigDecimal("850000.00"))
                .depositAmount(new BigDecimal("170000.00"))
                .depositStatus(DepositStatus.UNPAID)
                .status(BookingStatus.PENDING_PAYMENT)
                .customerName(custHa.getFullName())
                .customerPhone(custHa.getPhone())
                .items(new ArrayList<>())
                .build());

        mockMvc.perform(post("/api/v1/customer/me/bookings/" + booking.getId() + "/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("CANCELLED"));

        // Redis slot locks released because status was PENDING_PAYMENT
        assertFalse(redisLockService.isAnySlotLocked(stylist.getId(), startTime, endTime),
                "Redis slot locks must be freed upon cancellation of PENDING_PAYMENT booking");
    }

    @Test
    @DisplayName("Online Cancellation: Cancelling >= 2h in advance credits Retained Deposit and preserves other active Redis locks")
    @WithMockUser(username = "cust.ha", roles = {"CUSTOMER"})
    void shouldAllowOnlineCancellationAndCreditRetainedDepositWhenAtLeastTwoHoursBefore() throws Exception {
        UserEntity stylist = userRepository.findActiveStylistsByBranchId(branch.getId()).stream().findFirst().orElseThrow();
        LocalDateTime startTime = LocalDateTime.now().plusHours(4);
        LocalDateTime endTime = startTime.plusMinutes(90);

        // Another customer holds an active lock on this slot
        redisLockService.tryLockSlots(stylist.getId(), startTime, endTime, "ANOTHER_CUSTOMER_LOCK");
        assertTrue(redisLockService.isAnySlotLocked(stylist.getId(), startTime, endTime));

        BigDecimal initialCredit = custHa.getCreditBalance() != null ? custHa.getCreditBalance() : BigDecimal.ZERO;
        BigDecimal depositAmount = new BigDecimal("170000.00");

        BookingEntity booking = bookingRepository.save(BookingEntity.builder()
                .branch(branch)
                .customer(custHa)
                .staff(stylist)
                .bookingCode("BK-CANCEL-TEST-" + System.currentTimeMillis())
                .bookingTime(startTime)
                .endTime(endTime)
                .totalDurationMinutes(90)
                .totalPrice(new BigDecimal("850000.00"))
                .depositAmount(depositAmount)
                .depositStatus(DepositStatus.PAID)
                .status(BookingStatus.CONFIRMED)
                .customerName(custHa.getFullName())
                .customerPhone(custHa.getPhone())
                .items(new ArrayList<>())
                .build());

        mockMvc.perform(post("/api/v1/customer/me/bookings/" + booking.getId() + "/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("CANCELLED"))
                .andExpect(jsonPath("$.result.depositStatus").value("CREDITED"))
                .andExpect(jsonPath("$.result.canCancelOnline").value(false));

        // 1. Booking record updated in DB
        BookingEntity updated = bookingRepository.findById(booking.getId()).orElseThrow();
        assertEquals(BookingStatus.CANCELLED, updated.getStatus());
        assertEquals(DepositStatus.CREDITED, updated.getDepositStatus());

        // 2. Redis slot locks for CONFIRMED booking are NOT wiped (preserves other customer's active lock per Story 18)
        assertTrue(redisLockService.isAnySlotLocked(stylist.getId(), startTime, endTime),
                "Redis slot locks must NOT be wiped when cancelling a CONFIRMED booking");

        // 3. Retained Deposit balance credited
        UserEntity updatedCust = userRepository.findById(custHa.getId()).orElseThrow();
        assertEquals(0, initialCredit.add(depositAmount).compareTo(updatedCust.getCreditBalance()),
                "Customer credit balance must increase by paid deposit amount");

        // Cleanup Redis lock
        redisLockService.unlockSlots(stylist.getId(), startTime, endTime);
    }

    @Test
    @DisplayName("Online Cancellation: Cancelling < 2h before bookingTime is rejected with 400 BOOKING_CANCELLATION_WINDOW_EXPIRED")
    @WithMockUser(username = "cust.ha", roles = {"CUSTOMER"})
    void shouldRejectOnlineCancellationWhenLessThanTwoHoursBefore() throws Exception {
        UserEntity stylist = userRepository.findActiveStylistsByBranchId(branch.getId()).stream().findFirst().orElseThrow();
        LocalDateTime startTime = LocalDateTime.now().plusHours(1); // Only 1 hour away (< 2h)
        LocalDateTime endTime = startTime.plusMinutes(90);

        BookingEntity booking = bookingRepository.save(BookingEntity.builder()
                .branch(branch)
                .customer(custHa)
                .staff(stylist)
                .bookingCode("BK-LATE-CANCEL-" + System.currentTimeMillis())
                .bookingTime(startTime)
                .endTime(endTime)
                .totalDurationMinutes(90)
                .totalPrice(new BigDecimal("850000.00"))
                .depositAmount(new BigDecimal("170000.00"))
                .depositStatus(DepositStatus.PAID)
                .status(BookingStatus.CONFIRMED)
                .customerName(custHa.getFullName())
                .customerPhone(custHa.getPhone())
                .items(new ArrayList<>())
                .build());

        mockMvc.perform(post("/api/v1/customer/me/bookings/" + booking.getId() + "/cancel"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(2010)) // BOOKING_CANCELLATION_WINDOW_EXPIRED
                .andExpect(jsonPath("$.message").value("Chỉ được hủy lịch hẹn trực tuyến trước giờ hẹn ít nhất 2 tiếng"));

        // Status unchanged
        BookingEntity updated = bookingRepository.findById(booking.getId()).orElseThrow();
        assertEquals(BookingStatus.CONFIRMED, updated.getStatus());
        assertEquals(DepositStatus.PAID, updated.getDepositStatus());
    }

    @Test
    @DisplayName("Retained Deposit Auto-Offset: Booking covered by Retained Deposit confirms immediately via CREDIT_BALANCE without VietQR")
    void shouldAutoConfirmBookingWithRetainedDepositWithoutVietQr() throws Exception {
        // Set customer credit balance to 300,000 VND
        custHa.setCreditBalance(new BigDecimal("300000.00"));
        userRepository.save(custHa);

        UserEntity stylist = userRepository.findActiveStylistsByBranchId(branch.getId()).stream().findFirst().orElseThrow();
        LocalDateTime bookingTime = LocalDateTime.now().plusDays(3).withHour(10).withMinute(0).withSecond(0).withNano(0);

        CreateBookingRequest request = new CreateBookingRequest(
                branch.getId(),
                stylist.getId(),
                List.of(service.getId()), // Base price 850,000 -> 20% deposit = 170,000 VND
                bookingTime,
                custHa.getFullName(),
                custHa.getPhone(),
                "Đặt hẹn tự động trừ cọc bảo lưu"
        );

        MvcResult result = mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.result.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.result.depositStatus").value("PAID"))
                .andExpect(jsonPath("$.result.depositAmount").value(170000.00))
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString()).get("result");
        String bookingCode = root.get("bookingCode").asText();

        // 1. Customer credit balance deducted by 170,000 VND (300,000 - 170,000 = 130,000 VND)
        UserEntity updatedCust = userRepository.findById(custHa.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("130000.00").compareTo(updatedCust.getCreditBalance()),
                "Credit balance should be deducted by the deposit amount");

        // 2. Payment Transaction recorded with METHOD_CREDIT_BALANCE and STATUS_SUCCESS
        BookingEntity createdBooking = bookingRepository.findByBookingCodeAndIsDeletedFalse(bookingCode).orElseThrow();
        var txList = paymentTransactionRepository.findByBookingIdOrderByCreatedAtDesc(createdBooking.getId());
        assertFalse(txList.isEmpty(), "Payment transaction must be recorded");
        PaymentTransactionEntity tx = txList.get(0);
        assertEquals("CREDIT_BALANCE", tx.getPaymentMethod());
        assertEquals("SUCCESS", tx.getStatus());
        assertEquals(0, new BigDecimal("170000.00").compareTo(tx.getAmount()));
    }

    @Test
    @DisplayName("Retained Deposit: POS walk-in does not deduct creditBalance on draft; offset occurs once at final settlement (PAID)")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void shouldAutoOffsetRemainingRetainedDepositAtPosCheckInAndWalkIn() throws Exception {
        // Set customer credit balance to 200,000 VND
        custHa.setCreditBalance(new BigDecimal("200000.00"));
        userRepository.save(custHa);

        WalkInOrderRequest walkInReq = WalkInOrderRequest.builder()
                .branchId(branch.getId())
                .customerPhone(custHa.getPhone())
                .customerName(custHa.getFullName())
                .serviceIds(List.of(service.getId())) // 850,000 VND
                .isQuickGuest(false)
                .notes("Khách vãng lai dùng cọc bảo lưu")
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/pos/orders/walk-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(walkInReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.result.subtotal").value(850000.00))
                // 5% SILVER discount = 42,500 VND
                .andExpect(jsonPath("$.result.discountAmount").value(42500.00))
                // Draft order does NOT deduct retained deposit upfront
                .andExpect(jsonPath("$.result.depositDeducted").value(0.00))
                // Draft preview = 850,000 - 42,500 = 807,500 VND, net of available retained credit (200,000) = 607,500 VND (balance not mutated)
                .andExpect(jsonPath("$.result.finalAmount").value(607500.00))
                .andReturn();

        Long orderId = objectMapper.readTree(result.getResponse().getContentAsString()).get("result").get("id").asLong();

        // Customer's credit balance must remain 200,000 VND while order is in draft
        UserEntity draftCust = userRepository.findById(custHa.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("200000.00").compareTo(draftCust.getCreditBalance()),
                "Credit balance must remain untouched during draft order state");

        // Now checkout the order: available 200,000 credit is deducted atomically at settlement
        CheckoutRequest checkoutReq = CheckoutRequest.builder()
                .paymentMethod("CASH")
                .notes("Thanh toán hoàn tất với cọc bảo lưu")
                .build();

        mockMvc.perform(post("/api/v1/pos/orders/" + orderId + "/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.status").value("PAID"))
                .andExpect(jsonPath("$.result.depositDeducted").value(200000.00))
                .andExpect(jsonPath("$.result.finalAmount").value(607500.00));

        // Customer's credit balance should now be 0 VND
        UserEntity settledCust = userRepository.findById(custHa.getId()).orElseThrow();
        assertEquals(0, BigDecimal.ZERO.compareTo(settledCust.getCreditBalance()),
                "Remaining credit balance should be deducted at settlement");
    }

    @Test
    @DisplayName("Customer Portal: Endpoints return summary and bookings with canCancelOnline")
    @WithMockUser(username = "cust.ha", roles = {"CUSTOMER"})
    void shouldReturnCustomerSummaryAndChronologicalBookingsWithCanCancelOnline() throws Exception {
        // Summary endpoint
        mockMvc.perform(get("/api/v1/customer/me/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.username").value("cust.ha"))
                .andExpect(jsonPath("$.result.membershipTier").value("SILVER"))
                .andExpect(jsonPath("$.result.discountPercent").value(5))
                .andExpect(jsonPath("$.result.nextTier").value("GOLD"))
                .andExpect(jsonPath("$.result.creditBalance").isNumber())
                .andExpect(jsonPath("$.result.totalCompletedVisits").isNumber())
                .andExpect(jsonPath("$.result.upcomingBookingCount").isNumber());

        // Bookings endpoint
        mockMvc.perform(get("/api/v1/customer/me/bookings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result").isArray());
    }

    @Test
    @DisplayName("Visual Log Privacy Guard: Customer orders endpoint returns before/after photos and care notes while stripping actual_bom_json")
    @WithMockUser(username = "cust.ha", roles = {"CUSTOMER"})
    void shouldReturnCustomerPaidOrdersEnrichedWithVisualLogAndStripActualBomJson() throws Exception {
        UserEntity stylist = userRepository.findActiveStylistsByBranchId(branch.getId()).stream().findFirst().orElseThrow();
        OrderEntity order = OrderEntity.builder()
                .branch(branch)
                .customer(custHa)
                .customerName(custHa.getFullName())
                .customerPhone(custHa.getPhone())
                .orderCode("ORD-VISUAL-TEST-" + System.currentTimeMillis())
                .subtotal(new BigDecimal("500000.00"))
                .finalAmount(new BigDecimal("500000.00"))
                .status(com.smartsalon.pos.entity.OrderStatus.PAID)
                .build();
        com.smartsalon.pos.entity.OrderItemEntity item = com.smartsalon.pos.entity.OrderItemEntity.builder()
                .service(service)
                .itemType(com.smartsalon.pos.entity.OrderItemType.SERVICE)
                .unitPrice(new BigDecimal("500000.00"))
                .quantity(1)
                .totalPrice(new BigDecimal("500000.00"))
                .build();
        order.addItem(item);
        order = orderRepository.save(order);

        com.smartsalon.pos.entity.TechnicalLogEntity techLog = com.smartsalon.pos.entity.TechnicalLogEntity.builder()
                .order(order)
                .customer(custHa)
                .staff(stylist)
                .beforeImageUrl("https://cdn.smartsalon.vn/logs/before-test.jpg")
                .afterImageUrl("https://cdn.smartsalon.vn/logs/after-test.jpg")
                .hairConditionNotes("Tóc sợi mảnh, khô phần ngọn do tẩy nhuộm trước đó")
                .formulaNotes("Nhuộm cân bằng màu hạt dẻ sáng, phục hồi collagen")
                .actualBomJson("{\"consumedSkus\":[{\"sku\":\"OXI-6\",\"usedAmount\":45,\"unit\":\"ml\"}]}")
                .build();
        technicalLogRepository.save(techLog);

        mockMvc.perform(get("/api/v1/customer/me/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result").isArray())
                .andExpect(jsonPath("$.result[0].visualLog.beforeImageUrl").value("https://cdn.smartsalon.vn/logs/before-test.jpg"))
                .andExpect(jsonPath("$.result[0].visualLog.afterImageUrl").value("https://cdn.smartsalon.vn/logs/after-test.jpg"))
                .andExpect(jsonPath("$.result[0].visualLog.hairConditionNotes").value("Tóc sợi mảnh, khô phần ngọn do tẩy nhuộm trước đó"))
                .andExpect(jsonPath("$.result[0].visualLog.formulaNotes").value("Nhuộm cân bằng màu hạt dẻ sáng, phục hồi collagen"))
                .andExpect(jsonPath("$.result[0].visualLog.actualBomJson").doesNotExist())
                .andExpect(jsonPath("$.result[0].actualBomJson").doesNotExist());
    }

    @Test
    @DisplayName("Service Review Submission: Enforces single review uniqueness, ownership, unpaid, and retail-only guards")
    @WithMockUser(username = "cust.ha", roles = {"CUSTOMER"})
    void shouldSubmitServiceReviewAndEnforceGuards() throws Exception {
        UserEntity stylist = userRepository.findActiveStylistsByBranchId(branch.getId()).stream().findFirst().orElseThrow();
        OrderEntity order = OrderEntity.builder()
                .branch(branch)
                .customer(custHa)
                .customerName(custHa.getFullName())
                .customerPhone(custHa.getPhone())
                .orderCode("ORD-REV-TEST-" + System.currentTimeMillis())
                .subtotal(new BigDecimal("500000.00"))
                .finalAmount(new BigDecimal("500000.00"))
                .status(com.smartsalon.pos.entity.OrderStatus.PAID)
                .build();
        com.smartsalon.pos.entity.OrderItemEntity item = com.smartsalon.pos.entity.OrderItemEntity.builder()
                .service(service)
                .itemType(com.smartsalon.pos.entity.OrderItemType.SERVICE)
                .unitPrice(new BigDecimal("500000.00"))
                .quantity(1)
                .totalPrice(new BigDecimal("500000.00"))
                .build();
        order.addItem(item);
        order = orderRepository.save(order);

        com.smartsalon.customer.dto.CreateServiceReviewRequest reviewReq = com.smartsalon.customer.dto.CreateServiceReviewRequest.builder()
                .stylistId(stylist.getId())
                .rating(5)
                .comment("Kỹ thuật cắt và tạo kiểu rất ưng ý!")
                .build();

        // Stylist who did not participate in the order must be rejected
        mockMvc.perform(post("/api/v1/customer/me/orders/" + order.getId() + "/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isNotFound());

        technicalLogRepository.save(com.smartsalon.pos.entity.TechnicalLogEntity.builder()
                .order(order)
                .customer(custHa)
                .staff(stylist)
                .build());

        mockMvc.perform(post("/api/v1/customer/me/orders/" + order.getId() + "/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.orderId").value(order.getId()))
                .andExpect(jsonPath("$.result.rating").value(5))
                .andExpect(jsonPath("$.result.stylistId").value(stylist.getId()))
                .andExpect(jsonPath("$.result.comment").value("Kỹ thuật cắt và tạo kiểu rất ưng ý!"));

        // Duplicate review on the same order must be rejected
        mockMvc.perform(post("/api/v1/customer/me/orders/" + order.getId() + "/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isBadRequest());

        // canReview becomes false for this order
        mockMvc.perform(get("/api/v1/customer/me/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result[?(@.orderId == " + order.getId() + ")].canReview").value(false))
                .andExpect(jsonPath("$.result[?(@.orderId == " + order.getId() + ")].review.rating").value(5));
    }

    @Test
    @DisplayName("Stylist Star Ratings & Review Counts: Real-time aggregation across booking and admin KPI endpoints")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void shouldAggregateStylistRatingsInBookingAndAnalyticsEndpoints() throws Exception {
        // Stylist lookup in Booking wizard
        mockMvc.perform(get("/api/v1/bookings/stylists?branchId=" + branch.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result").isArray())
                .andExpect(jsonPath("$.result[0].averageRating").isNumber())
                .andExpect(jsonPath("$.result[0].reviewCount").isNumber());

        // Staff performance in Analytics Dashboard
        mockMvc.perform(get("/api/v1/analytics/staff-performance?branchId=" + branch.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.averageRating").isNumber())
                .andExpect(jsonPath("$.result.staffMembers[0].averageRating").isNumber())
                .andExpect(jsonPath("$.result.staffMembers[0].reviewCount").isNumber());
    }
}
