package com.smartsalon.analytics;

import com.smartsalon.booking.dto.AvailableSlotsResponse;
import com.smartsalon.booking.dto.StylistDto;
import com.smartsalon.booking.service.SlotCalculationService;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.config.TestAuthConfig;
import com.smartsalon.pos.entity.*;
import com.smartsalon.pos.repository.CommissionLedgerRepository;
import com.smartsalon.pos.repository.OrderRepository;
import com.smartsalon.pos.repository.OrderStepAssignmentRepository;
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
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
@Transactional
class SettledAtPnlAndBatchOptimizationIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CommissionLedgerRepository commissionLedgerRepository;

    @Autowired
    private OrderStepAssignmentRepository stepAssignmentRepository;

    @Autowired
    private SlotCalculationService slotCalculationService;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    private MockMvc mockMvc;
    private BranchEntity branch;
    private UserEntity stylist;
    private UserEntity customer;
    private ServiceEntity service;

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        branch = branchRepository.findAll().stream().findFirst().orElseGet(() ->
                branchRepository.save(BranchEntity.builder()
                        .name("SmartSalon Landmark - Bình Thạnh")
                        .address("720A Điện Biên Phủ, Bình Thạnh")
                        .phone("0908889999")
                        .isActive(true)
                        .build())
        );

        RoleEntity stylistRole = roleRepository.findByName("STYLIST").orElseGet(() ->
                roleRepository.save(RoleEntity.builder().name("STYLIST").description("Stylist").build())
        );

        stylist = userRepository.findByUsernameAndIsDeletedFalse("stylist.thao").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("stylist.thao")
                        .passwordHash("hashed")
                        .fullName("Nguyễn Phương Thảo")
                        .phone("0903334444")
                        .branch(branch)
                        .baseSalary(new BigDecimal("9000000.00"))
                        .isActive(true)
                        .roles(Set.of(stylistRole))
                        .build())
        );

        RoleEntity customerRole = roleRepository.findByName("CUSTOMER").orElseGet(() ->
                roleRepository.save(RoleEntity.builder().name("CUSTOMER").description("Khách hàng").build())
        );

        customer = userRepository.findByUsernameAndIsDeletedFalse("cust.test").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("cust.test")
                        .passwordHash("hashed")
                        .fullName("Khách Hàng Carry Over")
                        .phone("0912345678")
                        .branch(branch)
                        .isActive(true)
                        .roles(Set.of(customerRole))
                        .build())
        );

        service = serviceRepository.findAll().stream().findFirst().orElseGet(() ->
                serviceRepository.save(ServiceEntity.builder()
                        .name("Cắt Tóc Thiết Kế & Gội Thư Giãn")
                        .category("CUT")
                        .basePrice(new BigDecimal("300000.00"))
                        .durationMinutes(45)
                        .isActive(true)
                        .build())
        );
    }

    @Test
    @DisplayName("Ticket 03: Carry-over order settled today is included in today's P&L and Stylist Daily Worklog, but excluded from creation day")
    @WithMockUser(username = "admin", roles = {"ADMIN", "MANAGER"})
    void shouldIncludeCarryOverOrderInSettlementDayPnlAndWorklog() throws Exception {
        LocalDate createdDate = LocalDate.of(2026, 11, 10);
        LocalDate settledDate = LocalDate.of(2026, 11, 11);

        Instant createdInstant = createdDate.atTime(18, 0).atZone(DEFAULT_ZONE).toInstant();
        Instant settledInstant = settledDate.atTime(10, 30).atZone(DEFAULT_ZONE).toInstant();

        OrderEntity carryOverOrder = OrderEntity.builder()
                .orderCode("ORD-CARRY-OVER-1111")
                .branch(branch)
                .customer(customer)
                .status(OrderStatus.PAID)
                .customerName("Khách Hàng Carry Over")
                .customerPhone("0912345678")
                .paymentMethod("CASH")
                .settledBy(stylist)
                .settledAt(settledInstant)
                .subtotal(new BigDecimal("500000.00"))
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(new BigDecimal("500000.00"))
                .notes("Đơn lưu qua ngày chốt ca")
                .build();

        OrderItemEntity item = OrderItemEntity.builder()
                .service(service)
                .itemType(OrderItemType.SERVICE)
                .unitPrice(new BigDecimal("500000.00"))
                .quantity(1)
                .totalPrice(new BigDecimal("500000.00"))
                .build();
        carryOverOrder.addItem(item);

        OrderStepAssignmentEntity step = OrderStepAssignmentEntity.builder()
                .orderItem(item)
                .staff(stylist)
                .stepName("Cắt tạo kiểu chính")
                .status(StepAssignmentStatus.COMPLETED)
                .commissionRate(new BigDecimal("10.00"))
                .commissionAmount(new BigDecimal("50000.00"))
                .build();
        item.addStepAssignment(step);

        OrderEntity savedOrder = orderRepository.save(carryOverOrder);
        entityManager.createQuery("UPDATE OrderEntity o SET o.createdAt = :created WHERE o.id = :id")
                .setParameter("created", createdInstant)
                .setParameter("id", savedOrder.getId())
                .executeUpdate();
        entityManager.flush();
        entityManager.clear();

        // Record commission ledger stamped at settlement time
        CommissionLedgerEntity ledger = CommissionLedgerEntity.builder()
                .order(savedOrder)
                .staff(stylist)
                .stepAssignment(step)
                .amount(new BigDecimal("50000.00"))
                .status("CONFIRMED")
                .createdAt(settledInstant)
                .build();
        commissionLedgerRepository.save(ledger);

        // 1. Verify P&L report for creation day (2026-11-10): carry-over order MUST NOT be present
        mockMvc.perform(get("/api/v1/analytics/pnl")
                        .param("branchId", branch.getId().toString())
                        .param("startDate", createdDate.toString())
                        .param("endDate", createdDate.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.orders[?(@.orderCode == 'ORD-CARRY-OVER-1111')]").doesNotExist());

        // 2. Verify P&L report for settlement day (2026-11-11): carry-over order MUST be present
        mockMvc.perform(get("/api/v1/analytics/pnl")
                        .param("branchId", branch.getId().toString())
                        .param("startDate", settledDate.toString())
                        .param("endDate", settledDate.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.orders[?(@.orderCode == 'ORD-CARRY-OVER-1111')]").exists())
                .andExpect(jsonPath("$.result.orders[?(@.orderCode == 'ORD-CARRY-OVER-1111')].grossServiceRevenue").value(hasItem(500000.0)))
                .andExpect(jsonPath("$.result.orders[?(@.orderCode == 'ORD-CARRY-OVER-1111')].staffCommissions").value(hasItem(50000.0)))
                .andExpect(jsonPath("$.result.dailySeries[?(@.date == '" + settledDate + "')].totalNetRevenue").value(hasItem(500000.0)));

        // 3. Verify Stylist Daily Worklog for settlement day (2026-11-11): order appears with shift cash handover
        mockMvc.perform(get("/api/v1/pos/stylist/daily-worklog")
                        .param("branchId", branch.getId().toString())
                        .param("stylistId", stylist.getId().toString())
                        .param("date", settledDate.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.tickets[?(@.orderCode == 'ORD-CARRY-OVER-1111')]").exists())
                .andExpect(jsonPath("$.result.cashCollectedToHandover", greaterThanOrEqualTo(500000.0)))
                .andExpect(jsonPath("$.result.totalTicketCount", greaterThanOrEqualTo(1)));
    }

    @Test
    @DisplayName("Ticket 03: Tier-2 P&L base salary pro-rates accurately for 1-day (1/30) vs 30-day (100%) periods")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void shouldProRateTier2BaseSalaryForDifferentPeriods() throws Exception {
        List<UserEntity> activeStaff = userRepository.findActiveStaffByBranchId(branch.getId());
        BigDecimal totalMonthlyBaseSalary = activeStaff.stream()
                .map(u -> u.getBaseSalary() != null ? u.getBaseSalary() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 1-Day period: exactly 1/30th of monthly base salary rounded to whole VND
        BigDecimal expected1DaySalary = totalMonthlyBaseSalary
                .multiply(BigDecimal.valueOf(1))
                .divide(BigDecimal.valueOf(30), 0, RoundingMode.HALF_UP)
                .setScale(2, RoundingMode.HALF_UP);

        mockMvc.perform(get("/api/v1/analytics/pnl")
                        .param("branchId", branch.getId().toString())
                        .param("startDate", "2026-11-01")
                        .param("endDate", "2026-11-01")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.fixedBaseSalaryCost", equalTo(expected1DaySalary.doubleValue())));

        // 30-Day period: 100% (30/30) of monthly base salary
        BigDecimal expected30DaySalary = totalMonthlyBaseSalary
                .multiply(BigDecimal.valueOf(30))
                .divide(BigDecimal.valueOf(30), 0, RoundingMode.HALF_UP)
                .setScale(2, RoundingMode.HALF_UP);

        mockMvc.perform(get("/api/v1/analytics/pnl")
                        .param("branchId", branch.getId().toString())
                        .param("startDate", "2026-11-01")
                        .param("endDate", "2026-11-30")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.fixedBaseSalaryCost", equalTo(expected30DaySalary.doubleValue())));
    }

    @Test
    @DisplayName("Ticket 03: Batch slot calculation and stylist review aggregation execute correctly")
    void shouldExecuteBatchSlotCalculationAndReviewAggregation() {
        // 1. Stylist review aggregation batch query
        List<StylistDto> stylists = slotCalculationService.getActiveStylists(branch.getId());
        assertNotNull(stylists);
        assertFalse(stylists.isEmpty());
        for (StylistDto s : stylists) {
            assertNotNull(s.id());
            assertNotNull(s.averageRating());
            assertNotNull(s.reviewCount());
        }

        // 2. Available slots calculation with single branch booking query and Redis multiGet
        LocalDate targetDate = LocalDate.now().plusDays(7);
        AvailableSlotsResponse response = slotCalculationService.calculateAvailableSlots(
                branch.getId(), targetDate, List.of(service.getId()), stylist.getId());

        assertNotNull(response);
        assertNotNull(response.slots());
        assertFalse(response.slots().isEmpty());
    }
}
