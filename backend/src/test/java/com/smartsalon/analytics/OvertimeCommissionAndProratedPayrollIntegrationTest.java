package com.smartsalon.analytics;

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
import com.smartsalon.pos.dto.CheckoutRequest;
import com.smartsalon.pos.dto.PosOrderResponse;
import com.smartsalon.pos.entity.*;
import com.smartsalon.pos.repository.CommissionLedgerRepository;
import com.smartsalon.pos.repository.OrderRepository;
import com.smartsalon.pos.repository.OrderStepAssignmentRepository;
import com.smartsalon.shift.entity.*;
import com.smartsalon.shift.repository.ShiftTemplateRepository;
import com.smartsalon.shift.repository.StaffAttendanceRepository;
import com.smartsalon.shift.repository.StaffScheduleRepository;
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
import java.time.LocalTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
@Transactional
class OvertimeCommissionAndProratedPayrollIntegrationTest {

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
    private BookingRepository bookingRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderStepAssignmentRepository stepAssignmentRepository;

    @Autowired
    private CommissionLedgerRepository commissionLedgerRepository;

    @Autowired
    private ShiftTemplateRepository shiftTemplateRepository;

    @Autowired
    private StaffScheduleRepository staffScheduleRepository;

    @Autowired
    private StaffAttendanceRepository staffAttendanceRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private MockMvc mockMvc;

    private BranchEntity branch;
    private UserEntity stylist;
    private UserEntity customer;
    private ServiceEntity service;
    private ShiftTemplateEntity morningShift;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        branch = branchRepository.findAll().stream().findFirst().orElseGet(() ->
                branchRepository.save(BranchEntity.builder()
                        .name("SmartSalon Thảo Điền")
                        .address("45 Thảo Điền, Q2")
                        .phone("0908889999")
                        .isActive(true)
                        .build())
        );

        RoleEntity stylistRole = roleRepository.findByName("STYLIST").orElseGet(() ->
                roleRepository.save(RoleEntity.builder().name("STYLIST").description("Thợ chính").build())
        );
        RoleEntity customerRole = roleRepository.findByName("CUSTOMER").orElseGet(() ->
                roleRepository.save(RoleEntity.builder().name("CUSTOMER").description("Khách hàng").build())
        );

        stylist = userRepository.findByUsernameAndIsDeletedFalse("stylist.ot.test").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("stylist.ot.test")
                        .fullName("Trần Thợ Chính OT")
                        .phone("0918887766")
                        .email("stylist.ot@smartsalon.vn")
                        .passwordHash("hashed_pwd")
                        .branch(branch)
                        .baseSalary(new BigDecimal("12000000.00"))
                        .roles(java.util.Collections.singleton(stylistRole))
                        .isActive(true)
                        .build())
        );

        customer = userRepository.findByUsernameAndIsDeletedFalse("cust.ot.test").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("cust.ot.test")
                        .fullName("Nguyễn Khách Test OT")
                        .phone("0987654321")
                        .email("cust.ot@gmail.com")
                        .passwordHash("hashed_pwd")
                        .branch(branch)
                        .roles(java.util.Collections.singleton(customerRole))
                        .isActive(true)
                        .build())
        );

        service = serviceRepository.save(ServiceEntity.builder()
                .name("Nhuộm tóc Balayage Cao Cấp")
                .category("COLOR")
                .basePrice(new BigDecimal("1000000.00"))
                .commissionPoolRate(new BigDecimal("20.00")) // Pool = 200,000 VND
                .durationMinutes(90)
                .isActive(true)
                .build());

        service.getDefaultSteps().add(ServiceDefaultStepEntity.builder()
                .service(service)
                .stepName("Pha & Vào thuốc nhuộm")
                .stepOrder(1)
                .commissionRate(new BigDecimal("30.00"))
                .build());
        service.getDefaultSteps().add(ServiceDefaultStepEntity.builder()
                .service(service)
                .stepName("Gội xả & Sấy tạo kiểu")
                .stepOrder(2)
                .commissionRate(new BigDecimal("70.00"))
                .build());
        service = serviceRepository.save(service);

        morningShift = shiftTemplateRepository.save(ShiftTemplateEntity.builder()
                .branch(branch)
                .code("SHIFT-MORNING-" + System.currentTimeMillis())
                .name("Ca Sáng 08:30-15:00")
                .startTime(LocalTime.of(8, 30))
                .endTime(LocalTime.of(15, 0))
                .maxOvertimeMinutes(60)
                .isActive(true)
                .build());
    }

    @Test
    @DisplayName("Phase 10 Ticket 04: Settling order past shift.endTime applies 1.2x Overtime Commission Multiplier & notes [OT 1.2x]")
    @WithMockUser(username = "admin", roles = {"ADMIN", "MANAGER"})
    void shouldApply1Point2OvertimeCommissionMultiplierWhenFinishingPastShiftEnd() throws Exception {
        LocalDate workDate = LocalDate.of(2026, 11, 20);

        // Stylist scheduled MORNING shift: 08:30-15:00
        staffScheduleRepository.save(StaffScheduleEntity.builder()
                .branch(branch)
                .user(stylist)
                .shiftTemplate(morningShift)
                .scheduleDate(workDate)
                .status(StaffScheduleStatus.WORKING)
                .build());

        // Booking scheduled from 14:00 to 15:30 (finishes at 15:30, which is past shift.endTime 15:00)
        LocalDateTime bookingStart = workDate.atTime(14, 0);
        LocalDateTime bookingEnd = workDate.atTime(15, 30);

        BookingEntity booking = bookingRepository.save(BookingEntity.builder()
                .branch(branch)
                .customer(customer)
                .staff(stylist)
                .bookingCode("BK-OT-" + System.currentTimeMillis())
                .bookingTime(bookingStart)
                .endTime(bookingEnd)
                .totalDurationMinutes(90)
                .totalPrice(new BigDecimal("1000000.00"))
                .depositAmount(new BigDecimal("100000.00"))
                .depositStatus(DepositStatus.PAID)
                .status(BookingStatus.CONFIRMED)
                .build());

        booking.addItem(BookingServiceItemEntity.builder()
                .booking(booking)
                .service(service)
                .price(new BigDecimal("1000000.00"))
                .build());
        booking = bookingRepository.save(booking);

        // Check-in booking into POS Order
        String checkInResult = mockMvc.perform(post("/api/v1/pos/bookings/" + booking.getId() + "/check-in"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long orderId = objectMapper.readTree(checkInResult).get("result").get("id").asLong();

        // Service Pool = 1,000,000 * 20% = 200,000 VND.
        // Default 2 steps: Step 1 (30% = 60,000 VND), Step 2 (70% = 140,000 VND).
        // With 1.2x Overtime multiplier:
        // Step 1: 60,000 * 1.2 = 72,000 VND
        // Step 2: 140,000 * 1.2 = 168,000 VND
        // Total Overtime Commission: 240,000 VND

        CheckoutRequest checkoutReq = CheckoutRequest.builder()
                .paymentMethod("CASH")
                .discountAmount(BigDecimal.ZERO)
                .notes("Thanh toán tiền mặt ca tăng ca")
                .build();

        mockMvc.perform(post("/api/v1/pos/orders/" + orderId + "/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.status", is("PAID")));

        List<CommissionLedgerEntity> ledgers = commissionLedgerRepository.findByOrderId(orderId);
        assertEquals(2, ledgers.size());

        for (CommissionLedgerEntity ledger : ledgers) {
            assertTrue(ledger.getCalculationNotes().contains("[OT 1.2x]"),
                    "Audit note must contain [OT 1.2x], got: " + ledger.getCalculationNotes());
        }

        BigDecimal totalCommission = ledgers.stream()
                .map(CommissionLedgerEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Standard 200,000 * 1.2 = 240,000
        assertEquals(0, new BigDecimal("240000.00").compareTo(totalCommission));

        // Verify Step Assignment entities also have multiplied commission amount
        List<OrderStepAssignmentEntity> stepAssignments = stepAssignmentRepository.findByOrderId(orderId);
        BigDecimal totalStepAmount = stepAssignments.stream()
                .map(OrderStepAssignmentEntity::getCommissionAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(0, new BigDecimal("240000.00").compareTo(totalStepAmount));
    }

    @Test
    @DisplayName("Phase 10 Ticket 04: Order performed on scheduled OFF cover day applies 1.2x Overtime Commission Multiplier")
    @WithMockUser(username = "admin", roles = {"ADMIN", "MANAGER"})
    void shouldApplyOvertimeCommissionMultiplierWhenWorkingOnScheduledOffDay() throws Exception {
        LocalDate workDate = LocalDate.of(2026, 11, 21);

        // Stylist scheduled OFF on this day
        staffScheduleRepository.save(StaffScheduleEntity.builder()
                .branch(branch)
                .user(stylist)
                .scheduleDate(workDate)
                .status(StaffScheduleStatus.OFF)
                .build());

        LocalDateTime bookingStart = workDate.atTime(10, 0);
        LocalDateTime bookingEnd = workDate.atTime(11, 30);

        BookingEntity booking = bookingRepository.save(BookingEntity.builder()
                .branch(branch)
                .customer(customer)
                .staff(stylist)
                .bookingCode("BK-OFF-" + System.currentTimeMillis())
                .bookingTime(bookingStart)
                .endTime(bookingEnd)
                .totalDurationMinutes(90)
                .totalPrice(new BigDecimal("1000000.00"))
                .depositAmount(BigDecimal.ZERO)
                .depositStatus(DepositStatus.UNPAID)
                .status(BookingStatus.CONFIRMED)
                .build());

        booking.addItem(BookingServiceItemEntity.builder()
                .booking(booking)
                .service(service)
                .price(new BigDecimal("1000000.00"))
                .build());
        bookingRepository.save(booking);

        String checkInResult = mockMvc.perform(post("/api/v1/pos/bookings/" + booking.getId() + "/check-in"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long orderId = objectMapper.readTree(checkInResult).get("result").get("id").asLong();

        CheckoutRequest checkoutReq = CheckoutRequest.builder()
                .paymentMethod("CASH")
                .discountAmount(BigDecimal.ZERO)
                .build();

        mockMvc.perform(post("/api/v1/pos/orders/" + orderId + "/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.status", is("PAID")));

        List<CommissionLedgerEntity> ledgers = commissionLedgerRepository.findByOrderId(orderId);
        assertEquals(2, ledgers.size());
        for (CommissionLedgerEntity ledger : ledgers) {
            assertTrue(ledger.getCalculationNotes().contains("[OT 1.2x]"));
        }
    }

    @Test
    @DisplayName("Phase 10 Ticket 04: GET /my-payroll & /staff-payroll compute shift-prorated base salary and overtime commission total")
    @WithMockUser(username = "stylist.ot.test", roles = {"STYLIST"})
    void shouldCalculateShiftProratedBaseSalaryAndOvertimeCommissionTotalInMyPayroll() throws Exception {
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(5);
        LocalDate endDate = today.plusDays(5);

        // Contract base salary = 12,000,000 VND
        // Scheduled working shifts = 2 shifts
        staffScheduleRepository.save(StaffScheduleEntity.builder()
                .branch(branch)
                .user(stylist)
                .shiftTemplate(morningShift)
                .scheduleDate(today.minusDays(2))
                .status(StaffScheduleStatus.WORKING)
                .build());

        staffScheduleRepository.save(StaffScheduleEntity.builder()
                .branch(branch)
                .user(stylist)
                .shiftTemplate(morningShift)
                .scheduleDate(today.minusDays(1))
                .status(StaffScheduleStatus.WORKING)
                .build());

        // today is scheduled OFF
        staffScheduleRepository.save(StaffScheduleEntity.builder()
                .branch(branch)
                .user(stylist)
                .scheduleDate(today)
                .status(StaffScheduleStatus.OFF)
                .build());

        // Completed shifts = 3 shifts (today-2, today-1, and today extra cover day)
        staffAttendanceRepository.save(StaffAttendanceEntity.builder()
                .branch(branch)
                .user(stylist)
                .attendanceDate(today.minusDays(2))
                .status(StaffAttendanceStatus.COMPLETED)
                .build());

        staffAttendanceRepository.save(StaffAttendanceEntity.builder()
                .branch(branch)
                .user(stylist)
                .attendanceDate(today.minusDays(1))
                .status(StaffAttendanceStatus.COMPLETED)
                .build());

        staffAttendanceRepository.save(StaffAttendanceEntity.builder()
                .branch(branch)
                .user(stylist)
                .attendanceDate(today)
                .status(StaffAttendanceStatus.COMPLETED)
                .build());

        // Create Order & Commission Ledgers today
        OrderEntity order = orderRepository.save(OrderEntity.builder()
                .branch(branch)
                .customer(customer)
                .orderCode("ORD-TODAY-" + System.currentTimeMillis())
                .status(OrderStatus.PAID)
                .subtotal(new BigDecimal("1000000.00"))
                .finalAmount(new BigDecimal("1000000.00"))
                .build());

        commissionLedgerRepository.save(CommissionLedgerEntity.builder()
                .staff(stylist)
                .order(order)
                .amount(new BigDecimal("240000.00"))
                .status("EARNED")
                .calculationNotes("Công đoạn Nhuộm [OT 1.2x]")
                .build());

        commissionLedgerRepository.save(CommissionLedgerEntity.builder()
                .staff(stylist)
                .order(order)
                .amount(new BigDecimal("100000.00"))
                .status("EARNED")
                .calculationNotes("Công đoạn Gội thường")
                .build());

        // Prorated base salary = 12,000,000 * 3 completed / 2 scheduled = 18,000,000 VND
        // Overtime commission total = 240,000 VND
        // Total commission = 340,000 VND
        // Total payout = 18,000,000 + 340,000 = 18,340,000 VND

        mockMvc.perform(get("/api/v1/analytics/my-payroll")
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.contractBaseSalary").value(12000000.00))
                .andExpect(jsonPath("$.result.baseSalary").value(18000000.00))
                .andExpect(jsonPath("$.result.scheduledShiftCount").value(2))
                .andExpect(jsonPath("$.result.completedShiftCount").value(3))
                .andExpect(jsonPath("$.result.extraShiftCount").value(1))
                .andExpect(jsonPath("$.result.overtimeCommissionTotal").value(240000.00))
                .andExpect(jsonPath("$.result.totalCommission").value(340000.00))
                .andExpect(jsonPath("$.result.totalPayout").value(18340000.00));
    }

    @Test
    @DisplayName("Phase 10 Ticket 04: GET /api/v1/analytics/pnl reflects Shift-Prorated Base Salary in totalBaseSalaries and trueNetProfit")
    @WithMockUser(username = "admin", roles = {"ADMIN", "MANAGER"})
    void shouldReflectShiftProratedBaseSalaryInTier2Pnl() throws Exception {
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(5);
        LocalDate endDate = today.plusDays(5);

        // 2 scheduled shifts for stylist
        staffScheduleRepository.save(StaffScheduleEntity.builder()
                .branch(branch)
                .user(stylist)
                .shiftTemplate(morningShift)
                .scheduleDate(today.minusDays(2))
                .status(StaffScheduleStatus.WORKING)
                .build());

        staffScheduleRepository.save(StaffScheduleEntity.builder()
                .branch(branch)
                .user(stylist)
                .shiftTemplate(morningShift)
                .scheduleDate(today.minusDays(1))
                .status(StaffScheduleStatus.WORKING)
                .build());

        // 1 completed shift (out of 2 scheduled) -> 50% prorated salary = 6,000,000 VND
        staffAttendanceRepository.save(StaffAttendanceEntity.builder()
                .branch(branch)
                .user(stylist)
                .attendanceDate(today.minusDays(2))
                .status(StaffAttendanceStatus.COMPLETED)
                .build());

        mockMvc.perform(get("/api/v1/analytics/pnl")
                        .param("branchId", branch.getId().toString())
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.totalBaseSalaries").value(6000000.00))
                .andExpect(jsonPath("$.result.fixedBaseSalaryCost").value(6000000.00))
                .andExpect(jsonPath("$.result.trueNetProfit").isNumber());
    }
}
