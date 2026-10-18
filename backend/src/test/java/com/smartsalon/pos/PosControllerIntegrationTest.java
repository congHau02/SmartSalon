package com.smartsalon.pos;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingServiceItemEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceDefaultStepEntity;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.config.TestAuthConfig;
import com.smartsalon.inventory.entity.ProductEntity;
import com.smartsalon.inventory.repository.ProductRepository;
import com.smartsalon.pos.dto.ProductItemRequest;
import com.smartsalon.pos.dto.WalkInOrderRequest;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.pos.entity.OrderStatus;
import com.smartsalon.pos.repository.OrderRepository;
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
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.mock.web.MockMultipartFile;
import com.smartsalon.catalog.entity.ServiceBomEntity;
import com.smartsalon.catalog.repository.ServiceBomRepository;
import com.smartsalon.pos.dto.*;
import com.smartsalon.pos.entity.OrderStepAssignmentEntity;
import com.smartsalon.pos.entity.StepAssignmentStatus;
import com.smartsalon.pos.entity.TechnicalLogEntity;
import com.smartsalon.pos.repository.OrderStepAssignmentRepository;
import com.smartsalon.pos.repository.TechnicalLogRepository;
import com.smartsalon.inventory.entity.BranchInventoryEntity;
import com.smartsalon.inventory.entity.InventoryTransactionEntity;
import com.smartsalon.inventory.entity.InventoryTransactionType;
import com.smartsalon.inventory.repository.BranchInventoryRepository;
import com.smartsalon.inventory.repository.InventoryTransactionRepository;
import com.smartsalon.payment.entity.PaymentTransactionEntity;
import com.smartsalon.payment.repository.PaymentTransactionRepository;
import com.smartsalon.pos.entity.CommissionLedgerEntity;
import com.smartsalon.pos.repository.CommissionLedgerRepository;

@SpringBootTest
@Import(TestAuthConfig.class)
@Transactional
class PosControllerIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderStepAssignmentRepository stepAssignmentRepository;

    @Autowired
    private ServiceBomRepository serviceBomRepository;

    @Autowired
    private TechnicalLogRepository technicalLogRepository;

    @Autowired
    private CommissionLedgerRepository commissionLedgerRepository;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private BranchInventoryRepository branchInventoryRepository;

    @Autowired
    private InventoryTransactionRepository inventoryTransactionRepository;

    private BranchEntity branch;
    private UserEntity customer;
    private UserEntity stylist;
    private ServiceEntity service;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
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

        customer = userRepository.findByPhoneAndIsDeletedFalse("0988776655").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("test.customer")
                        .passwordHash("hashed")
                        .fullName("Nguyễn Thị Test")
                        .phone("0988776655")
                        .email("customer.test@smartsalon.vn")
                        .branch(branch)
                        .isActive(true)
                        .roles(Set.of(customerRole))
                        .build())
        );

        stylist = userRepository.findActiveStylistsByBranchId(branch.getId()).stream().findFirst().orElseGet(() ->
                userRepository.findAllActiveStylists().stream().findFirst().orElseThrow()
        );

        service = ServiceEntity.builder()
                .name("Cắt tóc tạo kiểu Test POS")
                .category("HAIR_CARE")
                .basePrice(new BigDecimal("250000.00"))
                .commissionPoolRate(new BigDecimal("20.00"))
                .durationMinutes(45)
                .isActive(true)
                .defaultSteps(new ArrayList<>())
                .build();
        service.getDefaultSteps().add(ServiceDefaultStepEntity.builder()
                .service(service)
                .stepName("Gội & Xả")
                .stepOrder(1)
                .commissionRate(new BigDecimal("30.00"))
                .build());
        service.getDefaultSteps().add(ServiceDefaultStepEntity.builder()
                .service(service)
                .stepName("Cắt & Sấy")
                .stepOrder(2)
                .commissionRate(new BigDecimal("70.00"))
                .build());
        service = serviceRepository.save(service);
    }

    @Test
    @DisplayName("Should check-in booking, carry over paid deposit, copy service items and generate default steps")
    @WithMockUser(username = "staff.le", roles = {"STAFF"})
    void shouldCheckInBookingAndCreateLinkedOrderWithDepositAndSteps() throws Exception {
        // 1. Create a CONFIRMED booking with PAID deposit
        BookingEntity booking = BookingEntity.builder()
                .branch(branch)
                .customer(customer)
                .staff(stylist)
                .bookingCode("BK-TEST-" + System.currentTimeMillis() % 10000)
                .bookingTime(LocalDateTime.now().plusHours(1))
                .endTime(LocalDateTime.now().plusHours(2))
                .totalDurationMinutes(60)
                .totalPrice(new BigDecimal("250000.00"))
                .depositAmount(new BigDecimal("50000.00"))
                .depositStatus(DepositStatus.PAID)
                .status(BookingStatus.CONFIRMED)
                .customerName(customer.getFullName())
                .customerPhone(customer.getPhone())
                .notes("Khách đặt online")
                .items(new ArrayList<>())
                .build();

        BookingServiceItemEntity item = BookingServiceItemEntity.builder()
                .booking(booking)
                .service(service)
                .price(new BigDecimal("250000.00"))
                .durationMinutes(45)
                .build();
        booking.addItem(item);
        booking = bookingRepository.save(booking);

        // 2. Call POS Check-in API
        mockMvc.perform(post("/api/v1/pos/bookings/" + booking.getId() + "/check-in")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.status", is("CHECKED_IN")))
                .andExpect(jsonPath("$.result.bookingId", is(booking.getId().intValue())))
                .andExpect(jsonPath("$.result.orderCode", startsWith("ORD-")))
                .andExpect(jsonPath("$.result.customerName", is(customer.getFullName())))
                .andExpect(jsonPath("$.result.customerPhone", is(customer.getPhone())))
                .andExpect(jsonPath("$.result.subtotal", is(250000.0)))
                .andExpect(jsonPath("$.result.depositDeducted", is(50000.0)))
                .andExpect(jsonPath("$.result.finalAmount", is(200000.0)))
                .andExpect(jsonPath("$.result.items", hasSize(1)))
                .andExpect(jsonPath("$.result.items[0].serviceName", is(service.getName())))
                .andExpect(jsonPath("$.result.items[0].steps", not(empty())));

        // 3. Verify booking status transitioned in DB
        BookingEntity updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        assertEquals(BookingStatus.CHECKED_IN, updatedBooking.getStatus());

        // 4. Verify duplicate check-in throws 409 Conflict
        mockMvc.perform(post("/api/v1/pos/bookings/" + booking.getId() + "/check-in")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Should create quick guest walk-in order using canonical walkin.guest")
    @WithMockUser(username = "staff.le", roles = {"STAFF"})
    void shouldCreateWalkInOrderWithQuickGuest() throws Exception {
        WalkInOrderRequest request = WalkInOrderRequest.builder()
                .branchId(branch.getId())
                .isQuickGuest(true)
                .serviceIds(List.of(service.getId()))
                .stylistId(stylist.getId())
                .notes("Khách lẻ cắt nhanh")
                .build();

        mockMvc.perform(post("/api/v1/pos/orders/walk-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.status", is("CHECKED_IN")))
                .andExpect(jsonPath("$.result.customerPhone", is("0000000000")))
                .andExpect(jsonPath("$.result.subtotal", is(service.getBasePrice().doubleValue())))
                .andExpect(jsonPath("$.result.finalAmount", is(service.getBasePrice().doubleValue())))
                .andExpect(jsonPath("$.result.items[0].serviceId", is(service.getId().intValue())));
    }

    @Test
    @DisplayName("Should create walk-in order with phone lookup, new customer creation, and retail product")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void shouldCreateWalkInOrderWithNewCustomerPhoneAndProduct() throws Exception {
        // Find or create retail product
        ProductEntity product = productRepository.findAllByIsDeletedFalse().stream().findFirst().orElseGet(() ->
                productRepository.save(ProductEntity.builder()
                        .name("Sáp vuốt tóc cao cấp")
                        .sku("WAX-TEST-" + System.currentTimeMillis())
                        .unit("Hộp")
                        .retailPrice(new BigDecimal("180000.00"))
                        .costPrice(new BigDecimal("90000.00"))
                        .isActive(true)
                        .build())
        );

        String uniquePhone = "0933" + (int)(Math.random() * 900000 + 100000);
        WalkInOrderRequest request = WalkInOrderRequest.builder()
                .branchId(branch.getId())
                .customerName("Võ Hoàng Yến")
                .customerPhone(uniquePhone)
                .isQuickGuest(false)
                .serviceIds(List.of(service.getId()))
                .productItems(List.of(ProductItemRequest.builder()
                        .productId(product.getId())
                        .quantity(2)
                        .build()))
                .stylistId(stylist.getId())
                .notes("Mua thêm sáp")
                .build();

        mockMvc.perform(post("/api/v1/pos/orders/walk-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.customerName", is("Võ Hoàng Yến")))
                .andExpect(jsonPath("$.result.customerPhone", is(uniquePhone)))
                .andExpect(jsonPath("$.result.items", hasSize(2)));

        // Verify customer user was created
        assertTrue(userRepository.findByPhoneAndIsDeletedFalse(uniquePhone).isPresent());
    }

    @Test
    @DisplayName("Should query dispatch board and return 4 Kanban columns & stylist availability")
    @WithMockUser(username = "staff.le", roles = {"STAFF"})
    void shouldGetDispatchBoardWithKanbanAndStylistAvailability() throws Exception {
        mockMvc.perform(get("/api/v1/pos/dispatch-board")
                        .param("branchId", branch.getId().toString())
                        .param("date", LocalDate.now().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.branchId", is(branch.getId().intValue())))
                .andExpect(jsonPath("$.result.upcomingBookings", notNullValue()))
                .andExpect(jsonPath("$.result.checkedInOrders", notNullValue()))
                .andExpect(jsonPath("$.result.inProgressOrders", notNullValue()))
                .andExpect(jsonPath("$.result.readyOrPaidOrders", notNullValue()))
                .andExpect(jsonPath("$.result.stylists", notNullValue()));
    }

    @Test
    @DisplayName("Should add service item to order, generate default steps, and recalculate totals")
    @WithMockUser(username = "staff.le", roles = {"STAFF"})
    void shouldAddServiceItemAndRecalculateTotals() throws Exception {
        // Create an initial walk-in order
        WalkInOrderRequest walkInReq = WalkInOrderRequest.builder()
                .branchId(branch.getId())
                .isQuickGuest(true)
                .serviceIds(List.of(service.getId()))
                .build();
        String walkInJson = mockMvc.perform(post("/api/v1/pos/orders/walk-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(walkInReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        PosOrderResponse createdOrder = objectMapper.readTree(walkInJson).get("result")
                .traverse(objectMapper).readValueAs(PosOrderResponse.class);

        // Create second service
        ServiceEntity extraService = serviceRepository.save(ServiceEntity.builder()
                .name("Uốn tóc Hàn Quốc")
                .category("HAIR_CARE")
                .basePrice(new BigDecimal("400000.00"))
                .commissionPoolRate(new BigDecimal("20.00"))
                .durationMinutes(60)
                .isActive(true)
                .defaultSteps(new ArrayList<>())
                .build());
        extraService.getDefaultSteps().add(ServiceDefaultStepEntity.builder()
                .service(extraService)
                .stepName("Vào trục uốn")
                .stepOrder(1)
                .commissionRate(new BigDecimal("100.00"))
                .build());
        extraService = serviceRepository.save(extraService);

        AddServiceItemRequest addReq = AddServiceItemRequest.builder()
                .serviceId(extraService.getId())
                .staffId(stylist.getId())
                .build();

        mockMvc.perform(post("/api/v1/pos/orders/" + createdOrder.getId() + "/items/service")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.items", hasSize(2)))
                .andExpect(jsonPath("$.result.subtotal", is(650000.0)))
                .andExpect(jsonPath("$.result.finalAmount", is(650000.0)))
                .andExpect(jsonPath("$.result.items[1].serviceName", is("Uốn tóc Hàn Quốc")))
                .andExpect(jsonPath("$.result.items[1].steps", hasSize(1)))
                .andExpect(jsonPath("$.result.items[1].steps[0].stepName", is("Vào trục uốn")))
                .andExpect(jsonPath("$.result.items[1].steps[0].commissionAmount", is(80000))); // 400k * 20% * 100% = 80k
    }

    @Test
    @DisplayName("Should add retail product item and update order notes and discount")
    @WithMockUser(username = "staff.le", roles = {"STAFF"})
    void shouldAddProductAndUpdateOrderDiscount() throws Exception {
        WalkInOrderRequest walkInReq = WalkInOrderRequest.builder()
                .branchId(branch.getId())
                .isQuickGuest(true)
                .serviceIds(List.of(service.getId()))
                .build();
        String walkInJson = mockMvc.perform(post("/api/v1/pos/orders/walk-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(walkInReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        PosOrderResponse createdOrder = objectMapper.readTree(walkInJson).get("result")
                .traverse(objectMapper).readValueAs(PosOrderResponse.class);

        ProductEntity prod = productRepository.save(ProductEntity.builder()
                .name("Tinh dầu dưỡng Moroccanoil")
                .sku("OIL-" + System.currentTimeMillis())
                .unit("Chai")
                .retailPrice(new BigDecimal("200000.00"))
                .costPrice(new BigDecimal("100000.00"))
                .isActive(true)
                .build());

        AddProductItemRequest prodReq = AddProductItemRequest.builder()
                .productId(prod.getId())
                .quantity(2)
                .build();

        mockMvc.perform(post("/api/v1/pos/orders/" + createdOrder.getId() + "/items/product")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(prodReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.items", hasSize(2)))
                .andExpect(jsonPath("$.result.subtotal", is(650000.0))) // 250k + 400k
                .andExpect(jsonPath("$.result.finalAmount", is(650000.0)));

        // Update discount and notes
        UpdateOrderRequest updateReq = UpdateOrderRequest.builder()
                .discountAmount(new BigDecimal("50000.00"))
                .notes("Khách quen VIP giảm 50k")
                .build();

        mockMvc.perform(patch("/api/v1/pos/orders/" + createdOrder.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.discountAmount", is(50000.0)))
                .andExpect(jsonPath("$.result.notes", is("Khách quen VIP giảm 50k")))
                .andExpect(jsonPath("$.result.finalAmount", is(600000.0))); // 650k - 50k
    }

    @Test
    @DisplayName("Should remove item from order and recalculate totals")
    @WithMockUser(username = "staff.le", roles = {"STAFF"})
    void shouldRemoveOrderItemAndRecalculateTotals() throws Exception {
        WalkInOrderRequest walkInReq = WalkInOrderRequest.builder()
                .branchId(branch.getId())
                .isQuickGuest(true)
                .serviceIds(List.of(service.getId()))
                .build();
        String walkInJson = mockMvc.perform(post("/api/v1/pos/orders/walk-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(walkInReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        PosOrderResponse createdOrder = objectMapper.readTree(walkInJson).get("result")
                .traverse(objectMapper).readValueAs(PosOrderResponse.class);

        Long itemId = createdOrder.getItems().get(0).getId();

        mockMvc.perform(delete("/api/v1/pos/orders/" + createdOrder.getId() + "/items/" + itemId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.items", empty()))
                .andExpect(jsonPath("$.result.subtotal", is(0)))
                .andExpect(jsonPath("$.result.finalAmount", is(0)));
    }

    @Test
    @DisplayName("Should update step assignment staff and commission weight with live two-tier preview")
    @WithMockUser(username = "staff.le", roles = {"STAFF"})
    void shouldUpdateStepAssignmentAndRecalculateCommissionPreview() throws Exception {
        WalkInOrderRequest walkInReq = WalkInOrderRequest.builder()
                .branchId(branch.getId())
                .isQuickGuest(true)
                .serviceIds(List.of(service.getId()))
                .build();
        String walkInJson = mockMvc.perform(post("/api/v1/pos/orders/walk-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(walkInReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        PosOrderResponse createdOrder = objectMapper.readTree(walkInJson).get("result")
                .traverse(objectMapper).readValueAs(PosOrderResponse.class);

        PosStepAssignmentResponse stepToUpdate = createdOrder.getItems().get(0).getSteps().get(0);

        // Update step rate to 50%
        // Service price = 250,000, Pool rate = 20% -> Pool = 50,000
        // Step rate = 50% -> commission preview = 50,000 * 0.50 = 25,000
        UpdateStepAssignmentRequest stepReq = UpdateStepAssignmentRequest.builder()
                .staffId(stylist.getId())
                .commissionRate(new BigDecimal("50.00"))
                .build();

        mockMvc.perform(patch("/api/v1/pos/orders/" + createdOrder.getId() + "/steps/" + stepToUpdate.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(stepReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.commissionRate", is(50.0)))
                .andExpect(jsonPath("$.result.commissionAmount", is(25000)));
    }

    @Test
    @DisplayName("Should advance step status to IN_PROGRESS and auto-advance Order and linked Booking")
    @WithMockUser(username = "staff.le", roles = {"STAFF"})
    void shouldAdvanceStepToInProgressAndAutoAdvanceParentOrderAndBooking() throws Exception {
        // 1. Create a CONFIRMED booking and check it in
        BookingEntity booking = BookingEntity.builder()
                .branch(branch)
                .customer(customer)
                .staff(stylist)
                .bookingCode("BK-STEP-" + System.currentTimeMillis() % 10000)
                .bookingTime(LocalDateTime.now().plusHours(1))
                .endTime(LocalDateTime.now().plusHours(2))
                .totalDurationMinutes(60)
                .totalPrice(new BigDecimal("250000.00"))
                .depositAmount(new BigDecimal("50000.00"))
                .depositStatus(DepositStatus.PAID)
                .status(BookingStatus.CONFIRMED)
                .customerName(customer.getFullName())
                .customerPhone(customer.getPhone())
                .items(new ArrayList<>())
                .build();
        BookingServiceItemEntity item = BookingServiceItemEntity.builder()
                .booking(booking)
                .service(service)
                .price(new BigDecimal("250000.00"))
                .durationMinutes(45)
                .build();
        booking.addItem(item);
        booking = bookingRepository.save(booking);

        String checkInJson = mockMvc.perform(post("/api/v1/pos/bookings/" + booking.getId() + "/check-in")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        PosOrderResponse checkedInOrder = objectMapper.readTree(checkInJson).get("result")
                .traverse(objectMapper).readValueAs(PosOrderResponse.class);

        assertEquals(OrderStatus.CHECKED_IN, checkedInOrder.getStatus());

        PosStepAssignmentResponse firstStep = checkedInOrder.getItems().get(0).getSteps().get(0);

        // 2. Advance first step to IN_PROGRESS
        UpdateStepStatusRequest statusReq = UpdateStepStatusRequest.builder()
                .status(StepAssignmentStatus.IN_PROGRESS)
                .build();

        mockMvc.perform(patch("/api/v1/pos/orders/" + checkedInOrder.getId() + "/steps/" + firstStep.getId() + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.status", is("IN_PROGRESS")))
                .andExpect(jsonPath("$.result.startedAt", notNullValue()));

        // 3. Verify parent Order and linked Booking automatically progressed to IN_PROGRESS
        OrderEntity updatedOrder = orderRepository.findById(checkedInOrder.getId()).orElseThrow();
        assertEquals(OrderStatus.IN_PROGRESS, updatedOrder.getStatus());

        BookingEntity updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        assertEquals(BookingStatus.IN_PROGRESS, updatedBooking.getStatus());
    }

    @Test
    @DisplayName("Should advance all steps to COMPLETED and auto-advance Order to READY_FOR_CHECKOUT")
    @WithMockUser(username = "staff.le", roles = {"STAFF"})
    void shouldAdvanceAllStepsToCompletedAndAdvanceOrderToReadyForCheckout() throws Exception {
        WalkInOrderRequest walkInReq = WalkInOrderRequest.builder()
                .branchId(branch.getId())
                .isQuickGuest(true)
                .serviceIds(List.of(service.getId()))
                .build();
        String walkInJson = mockMvc.perform(post("/api/v1/pos/orders/walk-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(walkInReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        PosOrderResponse createdOrder = objectMapper.readTree(walkInJson).get("result")
                .traverse(objectMapper).readValueAs(PosOrderResponse.class);

        List<PosStepAssignmentResponse> steps = createdOrder.getItems().get(0).getSteps();
        assertFalse(steps.isEmpty());

        for (PosStepAssignmentResponse s : steps) {
            UpdateStepStatusRequest statusReq = UpdateStepStatusRequest.builder()
                    .status(StepAssignmentStatus.COMPLETED)
                    .build();

            mockMvc.perform(patch("/api/v1/pos/orders/" + createdOrder.getId() + "/steps/" + s.getId() + "/status")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(statusReq)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.result.status", is("COMPLETED")))
                    .andExpect(jsonPath("$.result.completedAt", notNullValue()));
        }

        // Verify Order is now READY_FOR_CHECKOUT
        OrderEntity finalOrder = orderRepository.findById(createdOrder.getId()).orElseThrow();
        assertEquals(OrderStatus.READY_FOR_CHECKOUT, finalOrder.getStatus());
    }

    @Test
    @DisplayName("Ticket 04: Should synthesize baseline BOM from service BOMs when no actual_bom_json exists yet")
    @WithMockUser(username = "staff.le", roles = {"STAFF"})
    void shouldSynthesizeBaselineBomWhenNoActualBomJsonExists() throws Exception {
        // Setup chemical product and service BOM
        ProductEntity dyeProduct = productRepository.save(ProductEntity.builder()
                .name("Thuốc nhuộm tóc Loreal Test")
                .sku("DYE-TEST-" + System.currentTimeMillis())
                .unit("ml")
                .volumeOrWeightPerUnit(new BigDecimal("100.00"))
                .volumeUnit("ml")
                .retailPrice(new BigDecimal("150000.00"))
                .isActive(true)
                .build());

        serviceBomRepository.save(ServiceBomEntity.builder()
                .service(service)
                .product(dyeProduct)
                .standardAmount(new BigDecimal("60.00"))
                .unit("ml")
                .build());

        // Create a Walk-in order with this service
        WalkInOrderRequest walkInReq = WalkInOrderRequest.builder()
                .branchId(branch.getId())
                .isQuickGuest(true)
                .serviceIds(List.of(service.getId()))
                .build();
        String walkInJson = mockMvc.perform(post("/api/v1/pos/orders/walk-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(walkInReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        PosOrderResponse createdOrder = objectMapper.readTree(walkInJson).get("result")
                .traverse(objectMapper).readValueAs(PosOrderResponse.class);

        // Fetch Visual Log: should synthesize baseline BOM
        mockMvc.perform(get("/api/v1/pos/orders/" + createdOrder.getId() + "/visual-log"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.orderId", is(createdOrder.getId().intValue())))
                .andExpect(jsonPath("$.result.isSaved", is(false)))
                .andExpect(jsonPath("$.result.bomItems", hasSize(1)))
                .andExpect(jsonPath("$.result.bomItems[0].productId", is(dyeProduct.getId().intValue())))
                .andExpect(jsonPath("$.result.bomItems[0].productName", is("Thuốc nhuộm tóc Loreal Test")))
                .andExpect(jsonPath("$.result.bomItems[0].standardAmount", is(60.00)))
                .andExpect(jsonPath("$.result.bomItems[0].actualAmount", is(60.00)))
                .andExpect(jsonPath("$.result.bomItems[0].unit", is("ml")));
    }

    @Test
    @DisplayName("Ticket 04: Should save Visual Log with actual BOM overrides and reload persisted state")
    @WithMockUser(username = "staff.le", roles = {"STAFF"})
    void shouldSaveVisualLogWithActualBomOverridesAndPersist() throws Exception {
        ProductEntity dyeProduct = productRepository.save(ProductEntity.builder()
                .name("Thuốc nhuộm tóc Wella Test")
                .sku("DYE-WELLA-" + System.currentTimeMillis())
                .unit("ml")
                .volumeOrWeightPerUnit(new BigDecimal("100.00"))
                .volumeUnit("ml")
                .retailPrice(new BigDecimal("180000.00"))
                .isActive(true)
                .build());

        ProductEntity oxyProduct = productRepository.save(ProductEntity.builder()
                .name("Oxy trợ nhuộm 9% Test")
                .sku("OXY-9-" + System.currentTimeMillis())
                .unit("ml")
                .volumeOrWeightPerUnit(new BigDecimal("1000.00"))
                .volumeUnit("ml")
                .retailPrice(new BigDecimal("120000.00"))
                .isActive(true)
                .build());

        serviceBomRepository.save(ServiceBomEntity.builder()
                .service(service)
                .product(dyeProduct)
                .standardAmount(new BigDecimal("60.00"))
                .unit("ml")
                .build());

        WalkInOrderRequest walkInReq = WalkInOrderRequest.builder()
                .branchId(branch.getId())
                .isQuickGuest(true)
                .serviceIds(List.of(service.getId()))
                .build();
        String walkInJson = mockMvc.perform(post("/api/v1/pos/orders/walk-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(walkInReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        PosOrderResponse createdOrder = objectMapper.readTree(walkInJson).get("result")
                .traverse(objectMapper).readValueAs(PosOrderResponse.class);

        // Prepare SaveTechnicalLogRequest with actual BOM override (dye 85ml instead of 60ml, oxy 30ml added)
        SaveTechnicalLogRequest saveReq = SaveTechnicalLogRequest.builder()
                .staffId(stylist.getId())
                .formulaNotes("Tỉ lệ 1:1.5 Oxy 9% + Thuốc nhuộm Wella, ủ nhiệt 35p")
                .hairConditionNotes("Tóc sợi mảnh, chân tóc level 3, ngọn level 5")
                .beforeImageUrl("/uploads/visual-logs/before-test.jpg")
                .afterImageUrl("/uploads/visual-logs/after-test.jpg")
                .bomItems(List.of(
                        ActualBomItemDto.builder()
                                .productId(dyeProduct.getId())
                                .productName(dyeProduct.getName())
                                .standardAmount(new BigDecimal("60.00"))
                                .actualAmount(new BigDecimal("85.00"))
                                .unit("ml")
                                .build(),
                        ActualBomItemDto.builder()
                                .productId(oxyProduct.getId())
                                .productName(oxyProduct.getName())
                                .standardAmount(BigDecimal.ZERO)
                                .actualAmount(new BigDecimal("30.00"))
                                .unit("ml")
                                .build()
                ))
                .build();

        // Save Visual Log
        mockMvc.perform(put("/api/v1/pos/orders/" + createdOrder.getId() + "/visual-log")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.orderId", is(createdOrder.getId().intValue())))
                .andExpect(jsonPath("$.result.isSaved", is(true)))
                .andExpect(jsonPath("$.result.formulaNotes", containsString("Tỉ lệ 1:1.5")))
                .andExpect(jsonPath("$.result.bomItems", hasSize(2)))
                .andExpect(jsonPath("$.result.bomItems[0].actualAmount", is(85.00)))
                .andExpect(jsonPath("$.result.bomItems[1].actualAmount", is(30.00)));

        // Verify entity in DB
        TechnicalLogEntity savedLog = technicalLogRepository.findByOrderIdAndIsDeletedFalse(createdOrder.getId()).orElseThrow();
        assertEquals("Tỉ lệ 1:1.5 Oxy 9% + Thuốc nhuộm Wella, ủ nhiệt 35p", savedLog.getFormulaNotes());
        assertEquals("/uploads/visual-logs/before-test.jpg", savedLog.getBeforeImageUrl());
        assertNotNull(savedLog.getActualBomJson());
        assertTrue(savedLog.getActualBomJson().contains("85.00"));

        // Fetch Visual Log again -> verify persisted response
        mockMvc.perform(get("/api/v1/pos/orders/" + createdOrder.getId() + "/visual-log"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.isSaved", is(true)))
                .andExpect(jsonPath("$.result.bomItems", hasSize(2)))
                .andExpect(jsonPath("$.result.bomItems[0].actualAmount", is(85.00)));
    }

    @Test
    @DisplayName("Ticket 04: Should upload image via multipart in local fallback mode successfully")
    @WithMockUser(username = "staff.le", roles = {"STAFF"})
    void shouldUploadMediaInLocalFallbackModeSuccessfully() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-hair-before.jpg",
                "image/jpeg",
                "simulated-image-binary-data".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/pos/media/upload").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.url", notNullValue()))
                .andExpect(jsonPath("$.result.originalName", is("test-hair-before.jpg")))
                .andExpect(jsonPath("$.result.contentType", is("image/jpeg")));
    }

    @Test
    @DisplayName("Ticket 04: Should reject non-image file uploads with 400 Bad Request")
    @WithMockUser(username = "staff.le", roles = {"STAFF"})
    void shouldRejectNonImageFileUpload() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "malicious.exe",
                "application/octet-stream",
                "malicious-payload".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/pos/media/upload").file(file))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Ticket 05: Should checkout order with standard BOM deduction, step completion, commission ledger, and booking settlement")
    @WithMockUser(username = "staff.le", roles = {"STAFF"})
    void shouldCheckoutOrderWithStandardBomSuccessfully() throws Exception {
        // 1. Setup inventory chemical product & branch inventory
        ProductEntity chemicalProduct = productRepository.save(ProductEntity.builder()
                .name("Dung dịch uốn phục hồi Goldwell")
                .sku("CHEM-GOLD-" + System.currentTimeMillis())
                .unit("chai")
                .volumeOrWeightPerUnit(new BigDecimal("500.00"))
                .volumeUnit("ml")
                .minStockAlertUnits(2)
                .costPrice(new BigDecimal("200000.00"))
                .retailPrice(new BigDecimal("350000.00"))
                .isActive(true)
                .build());

        BranchInventoryEntity branchInventory = branchInventoryRepository.save(BranchInventoryEntity.builder()
                .branch(branch)
                .product(chemicalProduct)
                .stockUnits(5)
                .currentVolume(new BigDecimal("200.00"))
                .minStockAlertUnits(2)
                .build());

        // Attach standard BOM to service (50ml)
        serviceBomRepository.save(ServiceBomEntity.builder()
                .service(service)
                .product(chemicalProduct)
                .standardAmount(new BigDecimal("50.00"))
                .unit("ml")
                .build());

        // 2. Create a confirmed booking with deposit paid (50,000 VND)
        BookingEntity booking = bookingRepository.save(BookingEntity.builder()
                .branch(branch)
                .customer(customer)
                .staff(stylist)
                .bookingCode("BK-CK-" + System.currentTimeMillis())
                .bookingTime(LocalDateTime.now())
                .endTime(LocalDateTime.now().plusMinutes(45))
                .totalDurationMinutes(45)
                .totalPrice(new BigDecimal("250000.00"))
                .depositAmount(new BigDecimal("50000.00"))
                .depositStatus(DepositStatus.PAID)
                .status(BookingStatus.CONFIRMED)
                .build());

        booking.getItems().add(BookingServiceItemEntity.builder()
                .booking(booking)
                .service(service)
                .price(new BigDecimal("250000.00"))
                .build());
        booking = bookingRepository.save(booking);

        // Check-in booking into Order
        String checkInResult = mockMvc.perform(post("/api/v1/pos/bookings/" + booking.getId() + "/check-in"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        PosOrderResponse orderResp = objectMapper.readTree(checkInResult).get("result")
                .traverse(objectMapper).readValueAs(PosOrderResponse.class);

        assertEquals(0, new BigDecimal("50000.00").compareTo(orderResp.getDepositDeducted()));
        assertEquals(0, new BigDecimal("200000.00").compareTo(orderResp.getFinalAmount())); // 250k - 50k deposit

        // 3. Execute Checkout with CASH
        CheckoutRequest checkoutReq = CheckoutRequest.builder()
                .paymentMethod("CASH")
                .discountAmount(BigDecimal.ZERO)
                .notes("Thanh toán tiền mặt đủ")
                .build();

        mockMvc.perform(post("/api/v1/pos/orders/" + orderResp.getId() + "/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.status", is("PAID")))
                .andExpect(jsonPath("$.result.paymentMethod", is("CASH")))
                .andExpect(jsonPath("$.result.finalAmount", is(200000.00)));

        // 4. Verify chemical inventory deducted 50ml from Opened Volume (200 - 50 = 150ml)
        BranchInventoryEntity updatedInv = branchInventoryRepository.findByBranchIdAndProductId(branch.getId(), chemicalProduct.getId()).orElseThrow();
        assertEquals(5, updatedInv.getStockUnits());
        assertEquals(0, new BigDecimal("150.00").compareTo(updatedInv.getCurrentVolume()));

        // 5. Verify Step Assignments are marked COMPLETED
        List<OrderStepAssignmentEntity> steps = stepAssignmentRepository.findByOrderId(orderResp.getId());
        assertEquals(2, steps.size());
        for (OrderStepAssignmentEntity s : steps) {
            assertEquals(StepAssignmentStatus.COMPLETED, s.getStatus());
            assertNotNull(s.getStartedAt());
            assertNotNull(s.getCompletedAt());
            assertTrue(s.getCommissionAmount().compareTo(BigDecimal.ZERO) > 0);
        }

        // 6. Verify Commission Ledger rows generated
        List<CommissionLedgerEntity> ledgers = commissionLedgerRepository.findByOrderId(orderResp.getId());
        assertEquals(2, ledgers.size());
        // Service price = 250k, pool rate = 20% -> Pool = 50k
        // Step 1: 30% -> 15k
        // Step 2: 70% -> 35k
        BigDecimal totalCommission = ledgers.stream().map(CommissionLedgerEntity::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(0, new BigDecimal("50000").compareTo(totalCommission));
        for (CommissionLedgerEntity cl : ledgers) {
            assertEquals("EARNED", cl.getStatus());
            assertNotNull(cl.getCalculationNotes());
            assertTrue(cl.getCalculationNotes().contains("Pool 20.0%"));
        }

        // 7. Verify Payment Transaction created
        List<PaymentTransactionEntity> txs = paymentTransactionRepository.findByBookingIdOrderByCreatedAtDesc(booking.getId());
        assertFalse(txs.isEmpty());
        PaymentTransactionEntity checkoutTx = txs.stream()
                .filter(t -> "CASH".equals(t.getPaymentMethod()))
                .findFirst().orElseThrow();
        assertEquals(0, new BigDecimal("200000.00").compareTo(checkoutTx.getAmount()));
        assertEquals(PaymentTransactionEntity.STATUS_SUCCESS, checkoutTx.getStatus());

        // 8. Verify Order status is PAID and linked Booking is COMPLETED
        OrderEntity dbOrder = orderRepository.findById(orderResp.getId()).orElseThrow();
        assertEquals(OrderStatus.PAID, dbOrder.getStatus());
        assertEquals("CASH", dbOrder.getPaymentMethod());

        BookingEntity dbBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        assertEquals(BookingStatus.COMPLETED, dbBooking.getStatus());
    }

    @Test
    @DisplayName("Ticket 05: Should checkout order with Visual Log actual BOM override and retail product deduction")
    @WithMockUser(username = "staff.le", roles = {"STAFF"})
    void shouldCheckoutOrderWithVisualLogActualBomOverrideAndRetailProductSuccessfully() throws Exception {
        // Setup Chemical Product (100ml per unit, stockUnits = 2, currentVolume = 30ml)
        ProductEntity dyeProduct = productRepository.save(ProductEntity.builder()
                .name("Thuốc nhuộm Wella Koleston")
                .sku("DYE-WEL-" + System.currentTimeMillis())
                .unit("tuýp")
                .volumeOrWeightPerUnit(new BigDecimal("100.00"))
                .volumeUnit("ml")
                .minStockAlertUnits(1)
                .costPrice(new BigDecimal("80000.00"))
                .retailPrice(new BigDecimal("150000.00"))
                .isActive(true)
                .build());

        branchInventoryRepository.save(BranchInventoryEntity.builder()
                .branch(branch)
                .product(dyeProduct)
                .stockUnits(2)
                .currentVolume(new BigDecimal("30.00"))
                .minStockAlertUnits(1)
                .build());

        // Setup Retail Product (stockUnits = 10)
        ProductEntity retailWax = productRepository.save(ProductEntity.builder()
                .name("Sáp tạo phồng Reuzel Clay")
                .sku("WAX-REU-" + System.currentTimeMillis())
                .unit("hộp")
                .volumeOrWeightPerUnit(new BigDecimal("100.00"))
                .volumeUnit("g")
                .minStockAlertUnits(2)
                .costPrice(new BigDecimal("180000.00"))
                .retailPrice(new BigDecimal("320000.00"))
                .isActive(true)
                .build());

        branchInventoryRepository.save(BranchInventoryEntity.builder()
                .branch(branch)
                .product(retailWax)
                .stockUnits(10)
                .currentVolume(BigDecimal.ZERO)
                .minStockAlertUnits(2)
                .build());

        // Create Walk-in order with Service + Retail Wax (quantity = 2)
        WalkInOrderRequest walkInReq = WalkInOrderRequest.builder()
                .branchId(branch.getId())
                .customerName("Đặng Văn Lâm")
                .customerPhone("0944556677")
                .stylistId(stylist.getId())
                .serviceIds(List.of(service.getId()))
                .productItems(List.of(
                        ProductItemRequest.builder()
                                .productId(retailWax.getId())
                                .quantity(2)
                                .build()
                ))
                .build();

        String walkInRes = mockMvc.perform(post("/api/v1/pos/orders/walk-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(walkInReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        PosOrderResponse createdOrder = objectMapper.readTree(walkInRes).get("result")
                .traverse(objectMapper).readValueAs(PosOrderResponse.class);

        // Subtotal = 250k (service) + 640k (2 wax @ 320k) = 890,000 VND
        assertEquals(0, new BigDecimal("890000.00").compareTo(createdOrder.getSubtotal()));

        // Save Visual Log with overridden chemical volume = 85ml (deficit = 85 - 30 = 55ml, unseals 1 unit)
        SaveTechnicalLogRequest saveLogReq = SaveTechnicalLogRequest.builder()
                .formulaNotes("Công thức nhuộm tóc dày")
                .bomItems(List.of(
                        ActualBomItemDto.builder()
                                .productId(dyeProduct.getId())
                                .productName(dyeProduct.getName())
                                .standardAmount(new BigDecimal("60.00"))
                                .actualAmount(new BigDecimal("85.00"))
                                .unit("ml")
                                .build()
                ))
                .build();

        mockMvc.perform(put("/api/v1/pos/orders/" + createdOrder.getId() + "/visual-log")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saveLogReq)))
                .andExpect(status().isOk());

        // Checkout with CARD and 40,000 VND discount -> final = 850,000 VND
        CheckoutRequest checkoutReq = CheckoutRequest.builder()
                .paymentMethod("CARD")
                .discountAmount(new BigDecimal("40000.00"))
                .notes("Thanh toán thẻ quẹt POS")
                .build();

        mockMvc.perform(post("/api/v1/pos/orders/" + createdOrder.getId() + "/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.status", is("PAID")))
                .andExpect(jsonPath("$.result.paymentMethod", is("CARD")))
                .andExpect(jsonPath("$.result.discountAmount", is(40000.00)))
                .andExpect(jsonPath("$.result.finalAmount", is(850000.00)));

        // Verify chemical stock auto-unsealed 1 unit: stockUnits: 2 -> 1, volume: (30 + 100 - 85) = 45ml
        BranchInventoryEntity updatedDyeInv = branchInventoryRepository.findByBranchIdAndProductId(branch.getId(), dyeProduct.getId()).orElseThrow();
        assertEquals(1, updatedDyeInv.getStockUnits());
        assertEquals(0, new BigDecimal("45.00").compareTo(updatedDyeInv.getCurrentVolume()));

        // Verify retail product stock deducted 2 units: stockUnits: 10 -> 8
        BranchInventoryEntity updatedWaxInv = branchInventoryRepository.findByBranchIdAndProductId(branch.getId(), retailWax.getId()).orElseThrow();
        assertEquals(8, updatedWaxInv.getStockUnits());

        // Verify RETAIL_SALE transaction logged
        List<InventoryTransactionEntity> retailTxs = inventoryTransactionRepository.findAllByBranchIdAndProductIdOrderByCreatedAtDesc(branch.getId(), retailWax.getId());
        assertFalse(retailTxs.isEmpty());
        assertEquals(InventoryTransactionType.RETAIL_SALE, retailTxs.get(0).getTransactionType());
        assertEquals(-2, retailTxs.get(0).getQuantityUnits());

        // Verify Commission Ledger entries
        List<CommissionLedgerEntity> ledgers = commissionLedgerRepository.findByOrderId(createdOrder.getId());
        assertEquals(2, ledgers.size());
    }

    @Test
    @DisplayName("Ticket 05: Should reject checkout on already PAID order")
    @WithMockUser(username = "staff.le", roles = {"STAFF"})
    void shouldRejectCheckoutOnAlreadyPaidOrder() throws Exception {
        WalkInOrderRequest walkInReq = WalkInOrderRequest.builder()
                .branchId(branch.getId())
                .customerName("Lê Văn C")
                .customerPhone("0911223344")
                .serviceIds(List.of(service.getId()))
                .build();

        String walkInRes = mockMvc.perform(post("/api/v1/pos/orders/walk-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(walkInReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        PosOrderResponse createdOrder = objectMapper.readTree(walkInRes).get("result")
                .traverse(objectMapper).readValueAs(PosOrderResponse.class);

        CheckoutRequest checkoutReq = CheckoutRequest.builder()
                .paymentMethod("CASH")
                .build();

        // 1st checkout -> Success
        mockMvc.perform(post("/api/v1/pos/orders/" + createdOrder.getId() + "/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isOk());

        // 2nd checkout -> 400 Bad Request
        mockMvc.perform(post("/api/v1/pos/orders/" + createdOrder.getId() + "/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Ticket 05: Should get VietQR info for active order")
    @WithMockUser(username = "staff.le", roles = {"STAFF"})
    void shouldGetPosVietQrSuccessfully() throws Exception {
        WalkInOrderRequest walkInReq = WalkInOrderRequest.builder()
                .branchId(branch.getId())
                .customerName("Phan Hoàng")
                .customerPhone("0977665544")
                .serviceIds(List.of(service.getId()))
                .build();

        String walkInRes = mockMvc.perform(post("/api/v1/pos/orders/walk-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(walkInReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        PosOrderResponse createdOrder = objectMapper.readTree(walkInRes).get("result")
                .traverse(objectMapper).readValueAs(PosOrderResponse.class);

        mockMvc.perform(get("/api/v1/pos/orders/" + createdOrder.getId() + "/vietqr"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.orderId", is(createdOrder.getId().intValue())))
                .andExpect(jsonPath("$.result.orderCode", is(createdOrder.getOrderCode())))
                .andExpect(jsonPath("$.result.finalAmount", is(250000.00)))
                .andExpect(jsonPath("$.result.qrCodeUrl", containsString("vietqr.io")));
    }

    @Test
    @DisplayName("Ticket 05: Should get Commission Ledger summary for branch and date")
    @WithMockUser(username = "staff.le", roles = {"STAFF"})
    void shouldGetCommissionLedgerSummarySuccessfully() throws Exception {
        // Create walk-in order, assign steps, and checkout to earn commission
        WalkInOrderRequest walkInReq = WalkInOrderRequest.builder()
                .branchId(branch.getId())
                .customerName("Trương Mỹ")
                .customerPhone("0988112233")
                .stylistId(stylist.getId())
                .serviceIds(List.of(service.getId()))
                .build();

        String walkInRes = mockMvc.perform(post("/api/v1/pos/orders/walk-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(walkInReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        PosOrderResponse createdOrder = objectMapper.readTree(walkInRes).get("result")
                .traverse(objectMapper).readValueAs(PosOrderResponse.class);

        CheckoutRequest checkoutReq = CheckoutRequest.builder()
                .paymentMethod("VIETQR")
                .build();

        mockMvc.perform(post("/api/v1/pos/orders/" + createdOrder.getId() + "/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isOk());

        // Query Commission Ledger
        mockMvc.perform(get("/api/v1/pos/commission-ledger")
                        .param("branchId", branch.getId().toString())
                        .param("date", LocalDate.now().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.branchId", is(branch.getId().intValue())))
                .andExpect(jsonPath("$.result.totalCommissionAmount", notNullValue()))
                .andExpect(jsonPath("$.result.staffSummaries", not(empty())))
                .andExpect(jsonPath("$.result.entries", not(empty())))
                .andExpect(jsonPath("$.result.entries[0].status", is("EARNED")));
    }
}
