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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import com.smartsalon.pos.dto.*;
import com.smartsalon.pos.entity.OrderStepAssignmentEntity;
import com.smartsalon.pos.entity.StepAssignmentStatus;
import com.smartsalon.pos.repository.OrderStepAssignmentRepository;

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
}
