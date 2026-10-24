package com.smartsalon.customer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsalon.auth.dto.RegisterRequest;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceDefaultStepEntity;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.config.TestAuthConfig;
import com.smartsalon.inventory.entity.BranchInventoryEntity;
import com.smartsalon.inventory.entity.ProductEntity;
import com.smartsalon.inventory.repository.BranchInventoryRepository;
import com.smartsalon.inventory.repository.ProductRepository;
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

    private final ObjectMapper objectMapper = new ObjectMapper();

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
        // Ensure custHa has SILVER tier and 2.6M spend for test idempotency
        custHa.setTotalSpent(new BigDecimal("2600000.00"));
        custHa.setMembershipTier(MembershipTier.SILVER);
        userRepository.save(custHa);
    }

    @Test
    @DisplayName("Flow 1: Provisional Customer in-place registration claim preserves historical spend and tier")
    @WithMockUser(username = "staff.le", roles = {"STAFF"})
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
    @WithMockUser(username = "staff.le", roles = {"STAFF"})
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
}
