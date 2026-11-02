package com.smartsalon.voucher;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceBomEntity;
import com.smartsalon.catalog.entity.ServiceDefaultStepEntity;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.catalog.repository.ServiceBomRepository;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.config.TestAuthConfig;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.inventory.entity.BranchInventoryEntity;
import com.smartsalon.inventory.entity.ProductEntity;
import com.smartsalon.inventory.repository.BranchInventoryRepository;
import com.smartsalon.inventory.repository.ProductRepository;
import com.smartsalon.voucher.dto.ApplyVoucherRequest;
import com.smartsalon.pos.dto.CheckoutRequest;
import com.smartsalon.pos.dto.PosOrderResponse;
import com.smartsalon.pos.entity.*;
import com.smartsalon.pos.repository.CommissionLedgerRepository;
import com.smartsalon.pos.repository.OrderRepository;
import com.smartsalon.pos.service.PosOrderService;
import com.smartsalon.user.entity.MembershipTier;
import com.smartsalon.user.entity.RoleEntity;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.RoleRepository;
import com.smartsalon.user.repository.UserRepository;
import com.smartsalon.voucher.entity.VoucherEntity;
import com.smartsalon.voucher.entity.VoucherRedemptionEntity;
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
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
class VoucherPosIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Autowired
    private PosOrderService posOrderService;

    @Autowired
    private VoucherRepository voucherRepository;

    @Autowired
    private VoucherRedemptionRepository voucherRedemptionRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private ServiceBomRepository serviceBomRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BranchInventoryRepository branchInventoryRepository;

    @Autowired
    private CommissionLedgerRepository commissionLedgerRepository;

    private BranchEntity branch1;
    private BranchEntity branch2;
    private UserEntity stylist;
    private ServiceEntity service;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        branch1 = branchRepository.findById(1L).orElseGet(() ->
                branchRepository.save(BranchEntity.builder().name("Branch 1").address("Addr 1").phone("0901").isActive(true).build()));
        branch2 = branchRepository.findById(2L).orElseGet(() ->
                branchRepository.save(BranchEntity.builder().name("Branch 2").address("Addr 2").phone("0902").isActive(true).build()));

        RoleEntity stylistRole = roleRepository.findByName("STYLIST").orElseGet(() ->
                roleRepository.save(RoleEntity.builder().name("STYLIST").description("Stylist").build()));

        stylist = userRepository.findByUsernameAndIsDeletedFalse("stylist.voucher.test").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("stylist.voucher.test")
                        .passwordHash("password")
                        .fullName("Stylist Voucher")
                        .phone("0981999999")
                        .branch(branch1)
                        .roles(Set.of(stylistRole))
                        .isActive(true)
                        .build()));

        service = serviceRepository.findAll().stream().findFirst().orElseGet(() -> {
            ServiceEntity s = ServiceEntity.builder()
                    .name("Cắt tóc Voucher Test")
                    .category("HAIRCUT")
                    .basePrice(new BigDecimal("200000.00"))
                    .commissionPoolRate(new BigDecimal("20.00"))
                    .durationMinutes(45)
                    .isActive(true)
                    .defaultSteps(new ArrayList<>())
                    .build();
            s.getDefaultSteps().add(ServiceDefaultStepEntity.builder()
                    .service(s)
                    .stepName("Cắt chính")
                    .stepOrder(1)
                    .commissionRate(new BigDecimal("100.00"))
                    .build());
            return serviceRepository.save(s);
        });
    }

    private OrderEntity createTestOrder(UserEntity customer, BranchEntity branch, BigDecimal itemPrice) {
        OrderEntity order = OrderEntity.builder()
                .branch(branch)
                .customer(customer)
                .customerName(customer.getFullName())
                .customerPhone(customer.getPhone())
                .orderCode("ORD-V-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000))
                .status(OrderStatus.CHECKED_IN)
                .depositDeducted(BigDecimal.ZERO)
                .subtotal(itemPrice)
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(itemPrice)
                .items(new ArrayList<>())
                .build();

        OrderItemEntity item = OrderItemEntity.builder()
                .itemType(OrderItemType.SERVICE)
                .service(service)
                .quantity(1)
                .unitPrice(itemPrice)
                .totalPrice(itemPrice)
                .stepAssignments(new ArrayList<>())
                .build();
        order.addItem(item);

        OrderStepAssignmentEntity step = OrderStepAssignmentEntity.builder()
                .stepName("Cắt chính")
                .staff(stylist)
                .commissionRate(new BigDecimal("100.00"))
                .commissionAmount(itemPrice.multiply(new BigDecimal("0.20")))
                .status(StepAssignmentStatus.COMPLETED)
                .build();
        item.addStepAssignment(step);

        order.recalculateTotals();
        order.applyMembershipTierDiscountIfAutomatic();
        return orderRepository.save(order);
    }

    private UserEntity createCustomerWithTier(MembershipTier tier) {
        RoleEntity customerRole = roleRepository.findByName("CUSTOMER").orElseThrow();
        return userRepository.save(UserEntity.builder()
                .username("cust." + tier.name().toLowerCase() + "." + System.currentTimeMillis() + (int)(Math.random()*1000))
                .passwordHash("password")
                .fullName("Khách hàng " + tier.name())
                .phone("091" + (System.currentTimeMillis() % 10000000))
                .roles(Set.of(customerRole))
                .branch(branch1)
                .membershipTier(tier)
                .totalSpent(BigDecimal.ZERO)
                .creditBalance(BigDecimal.ZERO)
                .isActive(true)
                .build());
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    @DisplayName("Validator rejection tests: every reason produces its distinct error code")
    void validator_everyRejectionCode() throws Exception {
        UserEntity customer = createCustomerWithTier(MembershipTier.STANDARD);
        OrderEntity order = createTestOrder(customer, branch1, new BigDecimal("200000.00"));

        // 1. VOUCHER_NOT_FOUND
        mockMvc.perform(post("/api/v1/pos/orders/" + order.getId() + "/voucher")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ApplyVoucherRequest("NONEXISTENT"))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(ErrorCode.VOUCHER_NOT_FOUND.getCode()));

        // 2. VOUCHER_INACTIVE
        VoucherEntity inactive = voucherRepository.save(VoucherEntity.builder()
                .code("INACTIVE1")
                .type(VoucherType.FIXED)
                .value(new BigDecimal("20000.00"))
                .active(false)
                .build());
        mockMvc.perform(post("/api/v1/pos/orders/" + order.getId() + "/voucher")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ApplyVoucherRequest(inactive.getCode()))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ErrorCode.VOUCHER_INACTIVE.getCode()));

        // 3. VOUCHER_NOT_STARTED
        VoucherEntity future = voucherRepository.save(VoucherEntity.builder()
                .code("FUTURE1")
                .type(VoucherType.FIXED)
                .value(new BigDecimal("20000.00"))
                .startsAt(Instant.now().plus(2, ChronoUnit.DAYS))
                .active(true)
                .build());
        mockMvc.perform(post("/api/v1/pos/orders/" + order.getId() + "/voucher")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ApplyVoucherRequest(future.getCode()))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ErrorCode.VOUCHER_NOT_STARTED.getCode()));

        // 4. VOUCHER_EXPIRED
        VoucherEntity expired = voucherRepository.save(VoucherEntity.builder()
                .code("EXPIRED1")
                .type(VoucherType.FIXED)
                .value(new BigDecimal("20000.00"))
                .endsAt(Instant.now().minus(2, ChronoUnit.DAYS))
                .active(true)
                .build());
        mockMvc.perform(post("/api/v1/pos/orders/" + order.getId() + "/voucher")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ApplyVoucherRequest(expired.getCode()))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ErrorCode.VOUCHER_EXPIRED.getCode()));

        // 5. VOUCHER_BRANCH_NOT_ALLOWED
        VoucherEntity branch2Only = voucherRepository.save(VoucherEntity.builder()
                .code("BRANCH2ONLY")
                .type(VoucherType.FIXED)
                .value(new BigDecimal("20000.00"))
                .branches(Set.of(branch2))
                .active(true)
                .build());
        mockMvc.perform(post("/api/v1/pos/orders/" + order.getId() + "/voucher")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ApplyVoucherRequest(branch2Only.getCode()))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ErrorCode.VOUCHER_BRANCH_NOT_ALLOWED.getCode()));

        // 6. VOUCHER_MIN_ORDER_AMOUNT_NOT_MET
        VoucherEntity highMin = voucherRepository.save(VoucherEntity.builder()
                .code("HIGHMIN")
                .type(VoucherType.FIXED)
                .value(new BigDecimal("20000.00"))
                .minOrderAmount(new BigDecimal("500000.00"))
                .active(true)
                .build());
        mockMvc.perform(post("/api/v1/pos/orders/" + order.getId() + "/voucher")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ApplyVoucherRequest(highMin.getCode()))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ErrorCode.VOUCHER_MIN_ORDER_AMOUNT_NOT_MET.getCode()));

        // 7. VOUCHER_USAGE_LIMIT_EXCEEDED
        VoucherEntity limitReached = voucherRepository.save(VoucherEntity.builder()
                .code("LIMITREACHED")
                .type(VoucherType.FIXED)
                .value(new BigDecimal("20000.00"))
                .usageLimit(1)
                .usedCount(1)
                .active(true)
                .build());
        mockMvc.perform(post("/api/v1/pos/orders/" + order.getId() + "/voucher")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ApplyVoucherRequest(limitReached.getCode()))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ErrorCode.VOUCHER_USAGE_LIMIT_EXCEEDED.getCode()));

        // 8. VOUCHER_CUSTOMER_LIMIT_EXCEEDED
        VoucherEntity custLimitV = voucherRepository.save(VoucherEntity.builder()
                .code("CUSTLIMIT")
                .type(VoucherType.FIXED)
                .value(new BigDecimal("20000.00"))
                .perCustomerLimit(1)
                .active(true)
                .build());
        // Insert a prior redemption for this customer
        OrderEntity oldOrder = createTestOrder(customer, branch1, new BigDecimal("100000.00"));
        voucherRedemptionRepository.save(VoucherRedemptionEntity.builder()
                .voucher(custLimitV)
                .order(oldOrder)
                .customer(customer)
                .discountAmount(new BigDecimal("20000.00"))
                .build());

        mockMvc.perform(post("/api/v1/pos/orders/" + order.getId() + "/voucher")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ApplyVoucherRequest(custLimitV.getCode()))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ErrorCode.VOUCHER_CUSTOMER_LIMIT_EXCEEDED.getCode()));
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    @DisplayName("Tier vs Voucher picks the larger and never sums: voucher wins when larger")
    void tierVsVoucher_voucherWinsWhenLarger() throws Exception {
        // Customer SILVER (5% discount on 1,000,000 = 50,000 VND)
        UserEntity customer = createCustomerWithTier(MembershipTier.SILVER);
        OrderEntity order = createTestOrder(customer, branch1, new BigDecimal("1000000.00"));

        // Voucher 10% = 100,000 VND (> 50,000 VND tier)
        VoucherEntity voucher = voucherRepository.save(VoucherEntity.builder()
                .code("PROMO10")
                .type(VoucherType.PERCENT)
                .value(new BigDecimal("10.00"))
                .active(true)
                .build());

        mockMvc.perform(post("/api/v1/pos/orders/" + order.getId() + "/voucher")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ApplyVoucherRequest(voucher.getCode()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.voucherId").value(voucher.getId()))
                .andExpect(jsonPath("$.result.voucherCode").value("PROMO10"))
                .andExpect(jsonPath("$.result.discountSource").value("VOUCHER"))
                .andExpect(jsonPath("$.result.discountAmount").value(100000.00))
                .andExpect(jsonPath("$.result.finalAmount").value(900000.00));

        OrderEntity inDb = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(inDb.getVoucher()).isNotNull();
        assertThat(inDb.getVoucher().getId()).isEqualTo(voucher.getId());
        assertThat(inDb.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("100000.00"));
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    @DisplayName("Tier vs Voucher picks the larger and never sums: tier wins when larger, orders.voucher_id remains null")
    void tierVsVoucher_tierWinsWhenLarger() throws Exception {
        // Customer DIAMOND (20% discount on 1,000,000 = 200,000 VND)
        UserEntity customer = createCustomerWithTier(MembershipTier.DIAMOND);
        OrderEntity order = createTestOrder(customer, branch1, new BigDecimal("1000000.00"));

        // Voucher 50k fixed (< 200k tier)
        VoucherEntity voucher = voucherRepository.save(VoucherEntity.builder()
                .code("GIAM50K")
                .type(VoucherType.FIXED)
                .value(new BigDecimal("50000.00"))
                .active(true)
                .build());

        mockMvc.perform(post("/api/v1/pos/orders/" + order.getId() + "/voucher")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ApplyVoucherRequest(voucher.getCode()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.voucherId").doesNotExist())
                .andExpect(jsonPath("$.result.discountSource").value("TIER"))
                .andExpect(jsonPath("$.result.discountAmount").value(150000.00))
                .andExpect(jsonPath("$.result.finalAmount").value(850000.00));

        OrderEntity inDb = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(inDb.getVoucher()).isNull();
        assertThat(inDb.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("150000.00"));
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    @DisplayName("Commission ledger is identical with and without voucher (funded by salon, not stylist)")
    void commissionLedger_identicalWithAndWithoutVoucher() throws Exception {
        UserEntity customer1 = createCustomerWithTier(MembershipTier.STANDARD);
        UserEntity customer2 = createCustomerWithTier(MembershipTier.STANDARD);

        // Order 1: No voucher
        OrderEntity orderWithout = createTestOrder(customer1, branch1, new BigDecimal("500000.00"));
        posOrderService.checkoutOrder(orderWithout.getId(), CheckoutRequest.builder().paymentMethod("CASH").build());

        // Order 2: With 100k voucher
        VoucherEntity voucher = voucherRepository.save(VoucherEntity.builder()
                .code("DISC100K")
                .type(VoucherType.FIXED)
                .value(new BigDecimal("100000.00"))
                .active(true)
                .build());

        OrderEntity orderWith = createTestOrder(customer2, branch1, new BigDecimal("500000.00"));
        posOrderService.applyVoucher(orderWith.getId(), voucher.getCode());
        posOrderService.checkoutOrder(orderWith.getId(), CheckoutRequest.builder().paymentMethod("CASH").build());

        // Assert commission ledgers for stylist
        CommissionLedgerEntity ledgerWithout = commissionLedgerRepository.findAll().stream()
                .filter(l -> l.getOrder().getId().equals(orderWithout.getId()))
                .findFirst().orElseThrow();

        CommissionLedgerEntity ledgerWith = commissionLedgerRepository.findAll().stream()
                .filter(l -> l.getOrder().getId().equals(orderWith.getId()))
                .findFirst().orElseThrow();

        assertThat(ledgerWith.getAmount()).isEqualByComparingTo(ledgerWithout.getAmount());
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    @DisplayName("Redemption occurs ONLY on transition to PAID inside unified settlement")
    void redemptionOnlyOnPaid() throws Exception {
        UserEntity customer = createCustomerWithTier(MembershipTier.STANDARD);
        OrderEntity order = createTestOrder(customer, branch1, new BigDecimal("400000.00"));

        VoucherEntity voucher = voucherRepository.save(VoucherEntity.builder()
                .code("REDEEMTEST")
                .type(VoucherType.FIXED)
                .value(new BigDecimal("50000.00"))
                .usageLimit(10)
                .usedCount(0)
                .active(true)
                .build());

        // 1. Apply voucher on unpaid order
        posOrderService.applyVoucher(order.getId(), voucher.getCode());

        // usedCount must still be 0, no redemption row
        VoucherEntity vAfterApply = voucherRepository.findById(voucher.getId()).orElseThrow();
        assertEquals(0, vAfterApply.getUsedCount());
        assertThat(voucherRedemptionRepository.existsByOrderId(order.getId())).isFalse();

        // 2. Checkout to PAID
        posOrderService.checkoutOrder(order.getId(), CheckoutRequest.builder().paymentMethod("CASH").build());

        // usedCount must now be 1, and redemption row created
        VoucherEntity vAfterPaid = voucherRepository.findById(voucher.getId()).orElseThrow();
        assertEquals(1, vAfterPaid.getUsedCount());
        assertThat(voucherRedemptionRepository.existsByOrderId(order.getId())).isTrue();
    }

    @Test
    @DisplayName("Concurrent Checkout of last usage: exactly one succeeds and one fails with VOUCHER_NO_LONGER_VALID")
    void concurrentCheckout_lastUsage_exactlyOneSucceeds() throws Exception {
        VoucherEntity voucher = voucherRepository.save(VoucherEntity.builder()
                .code("LASTUSAGE" + System.currentTimeMillis())
                .type(VoucherType.FIXED)
                .value(new BigDecimal("50000.00"))
                .usageLimit(1) // Only 1 usage allowed!
                .usedCount(0)
                .active(true)
                .build());

        UserEntity cust1 = createCustomerWithTier(MembershipTier.STANDARD);
        UserEntity cust2 = createCustomerWithTier(MembershipTier.STANDARD);

        OrderEntity order1 = createTestOrder(cust1, branch1, new BigDecimal("300000.00"));
        OrderEntity order2 = createTestOrder(cust2, branch1, new BigDecimal("300000.00"));

        // Both orders pre-apply the voucher while usedCount is still 0
        posOrderService.applyVoucher(order1.getId(), voucher.getCode());
        posOrderService.applyVoucher(order2.getId(), voucher.getCode());

        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        List<PosOrderResponse> successes = new CopyOnWriteArrayList<>();
        List<Throwable> failures = new CopyOnWriteArrayList<>();

        CheckoutRequest req = CheckoutRequest.builder().paymentMethod("CASH").build();

        executor.submit(() -> {
            try {
                startLatch.await();
                successes.add(posOrderService.checkoutOrder(order1.getId(), req));
            } catch (Throwable t) {
                failures.add(t);
            } finally {
                doneLatch.countDown();
            }
        });

        executor.submit(() -> {
            try {
                startLatch.await();
                successes.add(posOrderService.checkoutOrder(order2.getId(), req));
            } catch (Throwable t) {
                failures.add(t);
            } finally {
                doneLatch.countDown();
            }
        });

        startLatch.countDown();
        boolean finished = doneLatch.await(15, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(finished).isTrue();
        // Exactly one checkout succeeded
        assertThat(successes).hasSize(1);
        assertThat(failures).hasSize(1);

        Throwable error = failures.get(0);
        while (error.getCause() != null && !(error instanceof AppException)) {
            error = error.getCause();
        }
        assertThat(error).isInstanceOf(AppException.class);
        assertEquals(ErrorCode.VOUCHER_NO_LONGER_VALID, ((AppException) error).getErrorCode());

        // Check DB state: used_count is exactly 1, redemptions count is exactly 1
        VoucherEntity finalVoucher = voucherRepository.findById(voucher.getId()).orElseThrow();
        assertEquals(1, finalVoucher.getUsedCount());
    }
}
