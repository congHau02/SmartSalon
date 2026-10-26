package com.smartsalon.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;
import com.smartsalon.booking.repository.BookingRepository;
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
import com.smartsalon.payment.PayOSWebhookController;
import com.smartsalon.payment.service.PayOSService;
import com.smartsalon.pos.dto.WalkInOrderRequest;
import com.smartsalon.user.dto.UserCreateRequest;
import com.smartsalon.user.dto.UserUpdateRequest;
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
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
public class MultiBranchAndSecurityHardeningIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JwtProvider jwtProvider;

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
    private BookingRepository bookingRepository;

    @Autowired
    private StompAuthChannelInterceptor stompAuthChannelInterceptor;

    @Autowired
    private PayOSService payOSService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private BranchEntity branch1;
    private BranchEntity branch2;
    private RoleEntity roleAdmin;
    private RoleEntity roleManager;
    private RoleEntity roleStaff;
    private RoleEntity roleStylist;
    private RoleEntity roleCustomer;

    private UserEntity managerBranch1;
    private UserEntity managerBranch2;
    private UserEntity staffBranch1;
    private UserEntity customer;

    private String tokenManagerBranch1;
    private String tokenManagerBranch2;
    private String tokenAdmin;
    private String tokenStaffBranch1;
    private String tokenCustomer;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        branch1 = branchRepository.findAll().stream().findFirst().orElseGet(() ->
                branchRepository.save(BranchEntity.builder()
                        .name("SmartSalon Chi nhánh 1")
                        .address("123 Nguyễn Huệ, Q1")
                        .phone("0901000001")
                        .isActive(true)
                        .build())
        );

        branch2 = branchRepository.findAll().stream().filter(b -> !b.getId().equals(branch1.getId())).findFirst().orElseGet(() ->
                branchRepository.save(BranchEntity.builder()
                        .name("SmartSalon Chi nhánh 2")
                        .address("456 Lê Lợi, Q1")
                        .phone("0901000002")
                        .isActive(true)
                        .build())
        );

        roleAdmin = roleRepository.findByName("ADMIN").orElseGet(() -> roleRepository.save(RoleEntity.builder().name("ADMIN").build()));
        roleManager = roleRepository.findByName("MANAGER").orElseGet(() -> roleRepository.save(RoleEntity.builder().name("MANAGER").build()));
        roleStaff = roleRepository.findByName("STAFF").orElseGet(() -> roleRepository.save(RoleEntity.builder().name("STAFF").build()));
        roleStylist = roleRepository.findByName("STYLIST").orElseGet(() -> roleRepository.save(RoleEntity.builder().name("STYLIST").build()));
        roleCustomer = roleRepository.findByName("CUSTOMER").orElseGet(() -> roleRepository.save(RoleEntity.builder().name("CUSTOMER").build()));

        managerBranch1 = userRepository.findByUsernameAndIsDeletedFalse("mgr.b1").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("mgr.b1")
                        .fullName("Trần Quản Lý Một")
                        .phone("0981000001")
                        .passwordHash("hashed")
                        .branch(branch1)
                        .isActive(true)
                        .roles(new HashSet<>(Set.of(roleManager)))
                        .build())
        );

        managerBranch2 = userRepository.findByUsernameAndIsDeletedFalse("mgr.b2").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("mgr.b2")
                        .fullName("Lê Quản Lý Hai")
                        .phone("0981000002")
                        .passwordHash("hashed")
                        .branch(branch2)
                        .isActive(true)
                        .roles(new HashSet<>(Set.of(roleManager)))
                        .build())
        );

        staffBranch1 = userRepository.findByUsernameAndIsDeletedFalse("staff.b1").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("staff.b1")
                        .fullName("Phạm Nhân Viên Một")
                        .phone("0981000003")
                        .passwordHash("hashed")
                        .branch(branch1)
                        .isActive(true)
                        .roles(new HashSet<>(Set.of(roleStaff)))
                        .build())
        );

        customer = userRepository.findByPhoneAndIsDeletedFalse("0989998877").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("cust.vip")
                        .fullName("Nguyễn Khách VIP")
                        .phone("0989998877")
                        .passwordHash("hashed")
                        .branch(branch1)
                        .isActive(true)
                        .roles(new HashSet<>(Set.of(roleCustomer)))
                        .membershipTier(MembershipTier.SILVER)
                        .totalSpent(BigDecimal.valueOf(2500000))
                        .creditBalance(BigDecimal.valueOf(100000))
                        .build())
        );

        tokenManagerBranch1 = jwtProvider.generateAccessToken(managerBranch1.getId(), managerBranch1.getUsername(), List.of("MANAGER"), branch1.getId());
        tokenManagerBranch2 = jwtProvider.generateAccessToken(managerBranch2.getId(), managerBranch2.getUsername(), List.of("MANAGER"), branch2.getId());
        tokenAdmin = jwtProvider.generateAccessToken(999L, "admin", List.of("ADMIN"), null);
        tokenStaffBranch1 = jwtProvider.generateAccessToken(staffBranch1.getId(), staffBranch1.getUsername(), List.of("STAFF"), branch1.getId());
        tokenCustomer = jwtProvider.generateAccessToken(customer.getId(), customer.getUsername(), List.of("CUSTOMER"), branch1.getId());
    }

    @Test
    @DisplayName("Branch Scope Guard: Manager of Branch 1 cannot access Branch 2 inventory (403 Forbidden)")
    void manager_crossBranch_inventory_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/v1/branches/" + branch2.getId() + "/inventory")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenManagerBranch1)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(1003));

        // But Admin can access branch 2
        mockMvc.perform(get("/api/v1/branches/" + branch2.getId() + "/inventory")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Branch Scope Guard: Manager of Branch 1 cannot create walk-in order in Branch 2 (403 Forbidden)")
    void manager_crossBranch_posOrder_shouldReturn403() throws Exception {
        WalkInOrderRequest request = WalkInOrderRequest.builder()
                .branchId(branch2.getId())
                .customerName("Khách Thử Nghiệm")
                .customerPhone("0987111222")
                .isQuickGuest(false)
                .build();

        mockMvc.perform(post("/api/v1/pos/orders/walk-in")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenManagerBranch1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(1003));
    }

    @Test
    @DisplayName("Branch Scope Guard: Manager of Branch 1 cannot view Analytics P&L for Branch 2 (403 Forbidden)")
    void manager_crossBranch_analytics_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/pnl")
                        .param("branchId", branch2.getId().toString())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenManagerBranch1)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(1003));

        // Allowed for own branch
        mockMvc.perform(get("/api/v1/analytics/pnl")
                        .param("branchId", branch1.getId().toString())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenManagerBranch1)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Privilege Escalation Prevention: Manager cannot create account with ADMIN or MANAGER role")
    void manager_cannotAssignAdminOrManagerRoles() throws Exception {
        // Attempt to create ADMIN
        UserCreateRequest reqAdmin = UserCreateRequest.builder()
                .username("escalated.admin")
                .password("Password@123")
                .fullName("Escalated Admin")
                .phone("0981999111")
                .branchId(branch1.getId())
                .roles(List.of("ADMIN"))
                .build();

        mockMvc.perform(post("/api/v1/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenManagerBranch1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqAdmin)))
                .andExpect(status().isForbidden());

        // Attempt to create MANAGER
        UserCreateRequest reqManager = UserCreateRequest.builder()
                .username("escalated.mgr")
                .password("Password@123")
                .fullName("Escalated Manager")
                .phone("0981999222")
                .branchId(branch1.getId())
                .roles(List.of("MANAGER"))
                .build();

        mockMvc.perform(post("/api/v1/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenManagerBranch1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqManager)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Privilege Escalation Prevention: Manager cannot create staff in another branch")
    void manager_cannotCreateStaffInAnotherBranch() throws Exception {
        UserCreateRequest reqCross = UserCreateRequest.builder()
                .username("cross.branch.staff")
                .password("Password@123")
                .fullName("Cross Branch Staff")
                .phone("0981999333")
                .branchId(branch2.getId())
                .roles(List.of("STAFF"))
                .build();

        mockMvc.perform(post("/api/v1/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenManagerBranch1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqCross)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Staff Creation: Manager creating staff in own branch succeeds")
    void manager_canCreateStaffInOwnBranch() throws Exception {
        String uniquePhone = String.format("0981%06d", Math.abs((int) (System.nanoTime() % 1000000)));
        UserCreateRequest reqValid = UserCreateRequest.builder()
                .username("staff.valid." + System.currentTimeMillis())
                .password("Password@123")
                .fullName("Nhân Viên Hợp Lệ")
                .phone(uniquePhone)
                .branchId(branch1.getId())
                .roles(List.of("STAFF"))
                .build();

        mockMvc.perform(post("/api/v1/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenManagerBranch1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqValid)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.branchId").value(branch1.getId()));
    }

    @Test
    @DisplayName("Staff Listing: Queries only active staff excluding CUSTOMER / Provisional Customer")
    void staffListing_queriesOnlyStaff_excludesCustomers() throws Exception {
        mockMvc.perform(get("/api/v1/users")
                        .param("branchId", branch1.getId().toString())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenManagerBranch1)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result[*].roles[*]", not(hasItem("CUSTOMER"))));
    }

    @Test
    @DisplayName("Fallback Exception Handler: Returns safe UNCATEGORIZED_EXCEPTION message without leaking raw details")
    void globalExceptionHandler_returnsSafe500Message() throws Exception {
        mockMvc.perform(get("/api/v1/system/simulate-error")
                        .param("type", "uncaught")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value(9999))
                .andExpect(jsonPath("$.message").value("Lỗi hệ thống chưa xác định"))
                .andExpect(jsonPath("$.message", not(containsString("syntax error"))))
                .andExpect(jsonPath("$.message", not(containsString("SELECT * FROM orders"))));
    }

    @Test
    @DisplayName("Public Loyalty Preview: Unauthenticated call masks customer name and hides lifetime spend")
    void customerLoyaltyPreview_unauthenticated_masksPii() throws Exception {
        mockMvc.perform(get("/api/v1/customers/loyalty-preview")
                        .param("phone", customer.getPhone())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.membershipTier").value("SILVER"))
                .andExpect(jsonPath("$.result.discountPercent").value(5))
                .andExpect(jsonPath("$.result.fullName", containsString("*")))
                .andExpect(jsonPath("$.result.totalSpent").doesNotExist())
                .andExpect(jsonPath("$.result.creditBalance").doesNotExist());

        // But authenticated staff receives unmasked data
        mockMvc.perform(get("/api/v1/customers/loyalty-preview")
                        .param("phone", customer.getPhone())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenStaffBranch1)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.fullName").value(customer.getFullName()))
                .andExpect(jsonPath("$.result.totalSpent").value(2500000.00))
                .andExpect(jsonPath("$.result.creditBalance").value(100000.00));
    }

    @Test
    @DisplayName("Public Booking Lookup: Unauthenticated call without bookingCode is rejected with 400")
    void bookingLookup_unauthenticated_withoutCode_isRejected() throws Exception {
        mockMvc.perform(get("/api/v1/bookings/lookup")
                        .param("phone", "0989998877")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(1001));

        // But authenticated staff can lookup by phone alone
        mockMvc.perform(get("/api/v1/bookings/lookup")
                        .param("phone", "0989998877")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenStaffBranch1)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    @DisplayName("PayOS Simulation: Rejected with 403 Forbidden when disabled in code")
    void payosSimulation_whenDisabled_returns403() {
        PayOSWebhookController controller = new PayOSWebhookController(payOSService);
        ReflectionTestUtils.setField(controller, "simulationEnabled", false);

        assertThatThrownBy(() -> controller.simulatePayment("BK-TEST-1234"))
                .isInstanceOf(com.smartsalon.exception.AppException.class)
                .hasMessageContaining(com.smartsalon.exception.ErrorCode.FORBIDDEN.getMessage());
    }

    @Test
    @DisplayName("STOMP WebSocket: Interceptor rejects unauthenticated and cross-branch subscriptions")
    void stompWebSocket_interceptor_validatesBranchAccess() {
        // 1. Unauthenticated subscription to /topic/branch/1/bookings -> throws MessageDeliveryException
        StompHeaderAccessor unauthAccessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        unauthAccessor.setDestination("/topic/branch/1/bookings");
        org.springframework.messaging.Message<?> unauthMessage = MessageBuilder.createMessage(new byte[0], unauthAccessor.getMessageHeaders());

        assertThatThrownBy(() -> stompAuthChannelInterceptor.preSend(unauthMessage, null))
                .isInstanceOf(MessageDeliveryException.class)
                .hasMessageContaining("requires authentication");

        // 2. Manager of Branch 1 attempting to subscribe to Branch 2 -> throws MessageDeliveryException (Forbidden)
        StompHeaderAccessor crossAccessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        crossAccessor.setDestination("/topic/branch/" + branch2.getId() + "/bookings");
        crossAccessor.addNativeHeader("Authorization", "Bearer " + tokenManagerBranch1);
        org.springframework.messaging.Message<?> crossMessage = MessageBuilder.createMessage(new byte[0], crossAccessor.getMessageHeaders());

        assertThatThrownBy(() -> stompAuthChannelInterceptor.preSend(crossMessage, null))
                .isInstanceOf(MessageDeliveryException.class)
                .hasMessageContaining("Cross-branch WebSocket subscription");

        // 3. Manager of Branch 1 subscribing to Branch 1 -> succeeds
        StompHeaderAccessor validAccessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        validAccessor.setDestination("/topic/branch/" + branch1.getId() + "/bookings");
        validAccessor.addNativeHeader("Authorization", "Bearer " + tokenManagerBranch1);
        org.springframework.messaging.Message<?> validMessage = MessageBuilder.createMessage(new byte[0], validAccessor.getMessageHeaders());

        org.springframework.messaging.Message<?> result = stompAuthChannelInterceptor.preSend(validMessage, null);
        assertThat(result).isNotNull();

        // 4. Admin subscribing to Branch 2 -> succeeds
        StompHeaderAccessor adminAccessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        adminAccessor.setDestination("/topic/branch/" + branch2.getId() + "/bookings");
        adminAccessor.addNativeHeader("Authorization", "Bearer " + tokenAdmin);
        org.springframework.messaging.Message<?> adminMessage = MessageBuilder.createMessage(new byte[0], adminAccessor.getMessageHeaders());

        org.springframework.messaging.Message<?> adminResult = stompAuthChannelInterceptor.preSend(adminMessage, null);
        assertThat(adminResult).isNotNull();
    }
}
