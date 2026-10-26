package com.smartsalon.analytics;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsalon.analytics.dto.UpdateBaseSalaryRequest;
import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.config.TestAuthConfig;
import com.smartsalon.pos.entity.*;
import com.smartsalon.pos.repository.CommissionLedgerRepository;
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
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
@Transactional
class StaffPayrollIntegrationTest {

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
    private CommissionLedgerRepository commissionLedgerRepository;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private MockMvc mockMvc;
    private BranchEntity branch;
    private UserEntity stylistMinh;
    private UserEntity stylistLan;
    private UserEntity stylistHung;
    private UserEntity staffLe;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        seedStaffPayrollData();
    }

    private void seedStaffPayrollData() {
        branch = branchRepository.findAll().stream().findFirst().orElseGet(() ->
                branchRepository.save(BranchEntity.builder()
                        .name("SmartSalon Flagship - Quận 1")
                        .address("123 Nguyễn Huệ, Q1")
                        .phone("0901234567")
                        .isActive(true)
                        .build())
        );

        RoleEntity stylistRole = roleRepository.findByName("STYLIST").orElseGet(() ->
                roleRepository.save(RoleEntity.builder().name("STYLIST").description("Thợ tạo kiểu").build())
        );
        RoleEntity staffRole = roleRepository.findByName("STAFF").orElseGet(() ->
                roleRepository.save(RoleEntity.builder().name("STAFF").description("Kỹ thuật viên").build())
        );
        RoleEntity customerRole = roleRepository.findByName("CUSTOMER").orElseGet(() ->
                roleRepository.save(RoleEntity.builder().name("CUSTOMER").description("Khách hàng").build())
        );

        stylistMinh = getOrCreateUser("stylist.minh", "Trần Minh Tuấn", "0911000001", "12000000.00", stylistRole);
        stylistLan = getOrCreateUser("stylist.lan", "Lê Ngọc Lan", "0911000002", "10000000.00", stylistRole);
        stylistHung = getOrCreateUser("stylist.hung", "Hoàng Phi Hùng", "0911000003", "9000000.00", stylistRole);
        staffLe = getOrCreateUser("staff.le", "Lê Văn Tiến", "0911000004", "8000000.00", staffRole);

        UserEntity custHa = getOrCreateUser("cust.ha", "Nguyễn Thu Hà", "0988111222", "0.00", customerRole);
        UserEntity custTri = getOrCreateUser("cust.tri", "Vũ Minh Trí", "0988222333", "0.00", customerRole);
        UserEntity custNgoc = getOrCreateUser("cust.ngoc", "Hoàng Bảo Ngọc", "0988333444", "0.00", customerRole);
        UserEntity custWalkin = getOrCreateUser("walkin.guest", "Khách vãng lai (Walk-in)", "0000000000", "0.00", customerRole);

        ServiceEntity service = serviceRepository.findAll().stream().findFirst().orElseGet(() ->
                serviceRepository.save(ServiceEntity.builder()
                        .name("Nhuộm tóc thời trang")
                        .category("COLOR")
                        .basePrice(new BigDecimal("850000.00"))
                        .commissionPoolRate(new BigDecimal("20.00"))
                        .durationMinutes(120)
                        .isActive(true)
                        .build())
        );

        // Bookings
        LocalDateTime b1Time = LocalDateTime.of(2026, 10, 15, 9, 30);
        LocalDateTime b2Time = LocalDateTime.of(2026, 10, 16, 14, 0);
        LocalDateTime b3Time = LocalDateTime.of(2026, 10, 17, 10, 0);
        LocalDateTime b4Time = LocalDateTime.of(2026, 10, 17, 15, 0);
        LocalDateTime b5Time = LocalDateTime.of(2026, 10, 18, 9, 30);
        LocalDateTime b6Time = LocalDateTime.of(2026, 10, 18, 14, 0);

        BookingEntity bk1 = createBooking("BK-20261015-0001", custHa, stylistMinh, b1Time, true);
        BookingEntity bk2 = createBooking("BK-20261016-0002", custTri, stylistLan, b2Time, false);
        BookingEntity bk3 = createBooking("BK-20261017-0003", custHa, stylistMinh, b3Time, true);
        BookingEntity bk4 = createBooking("BK-20261017-0004", custNgoc, stylistHung, b4Time, false);
        BookingEntity bk5 = createBooking("BK-20261018-0005", custTri, stylistLan, b5Time, true);
        BookingEntity bk6 = createBooking("BK-20261018-0006", custHa, stylistMinh, b6Time, true);

        // Orders
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        Instant t1 = b1Time.plusHours(2).atZone(zone).toInstant();
        Instant t2 = b2Time.plusHours(1).atZone(zone).toInstant();
        Instant t3 = b3Time.plusHours(1).atZone(zone).toInstant();
        Instant t4 = b4Time.plusHours(1).atZone(zone).toInstant();
        Instant t5 = b5Time.plusHours(2).atZone(zone).toInstant();
        Instant t6 = LocalDateTime.of(2026, 10, 18, 16, 0).atZone(zone).toInstant();

        // Order 1 (Hà with Minh): 298.5k commission (ledgers for staff)
        OrderEntity o1 = createOrder("ORD-20261015-001", bk1, custHa, t1, new BigDecimal("2100000.00"), service);
        createStepAssignment(o1, "Pha & Vào thuốc nhuộm", stylistMinh, new BigDecimal("110500.00"), t1);
        createStepAssignment(o1, "Gội xả & Sấy tạo kiểu", stylistMinh, new BigDecimal("34000.00"), t1);
        createStepAssignment(o1, "Chuẩn bị & Xả tóc", staffLe, new BigDecimal("25500.00"), t1);

        // Order 2 (Trí with Lan)
        OrderEntity o2 = createOrder("ORD-20261016-002", bk2, custTri, t2, new BigDecimal("250000.00"), service);
        createStepAssignment(o2, "Khai huyệt & Gội dưỡng sinh", stylistLan, new BigDecimal("35000.00"), t2);
        createStepAssignment(o2, "Sấy khô & Xịt dưỡng", stylistLan, new BigDecimal("15000.00"), t2);

        // Order 3 (Hà with Minh)
        OrderEntity o3 = createOrder("ORD-20261017-003", bk3, custHa, t3, new BigDecimal("650000.00"), service);
        createStepAssignment(o3, "Đưa dưỡng chất & Hấp nhiệt", stylistMinh, new BigDecimal("78000.00"), t3);
        createStepAssignment(o3, "Xả nguội & Sấy tạo kiểu", stylistMinh, new BigDecimal("26000.00"), t3);
        createStepAssignment(o3, "Gội sạch sâu", staffLe, new BigDecimal("26000.00"), t3);

        // Order 4 (Ngọc with Hùng)
        OrderEntity o4 = createOrder("ORD-20261017-004", bk4, custNgoc, t4, new BigDecimal("180000.00"), service);
        createStepAssignment(o4, "Tư vấn & Cắt tóc định hình", stylistHung, new BigDecimal("28800.00"), t4);
        createStepAssignment(o4, "Sấy vuốt sáp tạo kiểu", stylistHung, new BigDecimal("7200.00"), t4);

        // Order 5 (Trí with Lan)
        OrderEntity o5 = createOrder("ORD-20261018-005", bk5, custTri, t5, new BigDecimal("1950000.00"), service);
        createStepAssignment(o5, "Pha & Vào thuốc nhuộm", stylistLan, new BigDecimal("110500.00"), t5);
        createStepAssignment(o5, "Gội xả & Sấy tạo kiểu", stylistLan, new BigDecimal("34000.00"), t5);
        createStepAssignment(o5, "Chuẩn bị & Xả tóc", staffLe, new BigDecimal("25500.00"), t5);

        // Order 6 (Walk-in with Minh)
        OrderEntity o6 = createOrder("ORD-20261018-006", null, custWalkin, t6, new BigDecimal("250000.00"), service);
        createStepAssignment(o6, "Khai huyệt & Gội dưỡng sinh", stylistMinh, new BigDecimal("35000.00"), t6);
        createStepAssignment(o6, "Sấy khô & Xịt dưỡng", stylistMinh, new BigDecimal("15000.00"), t6);
    }

    private UserEntity getOrCreateUser(String username, String fullName, String phone, String baseSalary, RoleEntity role) {
        UserEntity user = userRepository.findByUsernameAndIsDeletedFalse(username).orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username(username)
                        .fullName(fullName)
                        .phone(phone)
                        .email(username + "@smartsalon.vn")
                        .passwordHash("hashed")
                        .branch(branch)
                        .baseSalary(new BigDecimal(baseSalary))
                        .isActive(true)
                        .roles(Set.of(role))
                        .build())
        );
        user.setBaseSalary(new BigDecimal(baseSalary));
        user.setBranch(branch);
        return userRepository.save(user);
    }

    private BookingEntity createBooking(String code, UserEntity customer, UserEntity staff, LocalDateTime time, boolean isRequested) {
        return bookingRepository.findByBookingCodeAndIsDeletedFalse(code).orElseGet(() ->
                bookingRepository.save(BookingEntity.builder()
                        .bookingCode(code)
                        .branch(branch)
                        .customer(customer)
                        .staff(staff)
                        .bookingTime(time)
                        .endTime(time.plusMinutes(90))
                        .status(BookingStatus.COMPLETED)
                        .depositStatus(DepositStatus.PAID)
                        .isStylistRequested(isRequested)
                        .customerName(customer.getFullName())
                        .customerPhone(customer.getPhone())
                        .totalPrice(new BigDecimal("850000.00"))
                        .depositAmount(new BigDecimal("170000.00"))
                        .build())
        );
    }

    private OrderEntity createOrder(String code, BookingEntity booking, UserEntity customer, Instant time, BigDecimal total, ServiceEntity service) {
        return orderRepository.findByOrderCodeAndIsDeletedFalse(code).orElseGet(() -> {
            OrderEntity order = OrderEntity.builder()
                    .orderCode(code)
                    .branch(branch)
                    .booking(booking)
                    .customer(customer)
                    .customerName(customer.getFullName())
                    .customerPhone(customer.getPhone())
                    .status(OrderStatus.PAID)
                    .subtotal(total)
                    .discountAmount(BigDecimal.ZERO)
                    .depositDeducted(BigDecimal.ZERO)
                    .finalAmount(total)
                    .paymentMethod("VIETQR")
                    .items(new ArrayList<>())
                    .build();
            order.setCreatedAt(time);

            OrderItemEntity item = OrderItemEntity.builder()
                    .order(order)
                    .service(service)
                    .itemType(OrderItemType.SERVICE)
                    .quantity(1)
                    .unitPrice(total)
                    .totalPrice(total)
                    .stepAssignments(new ArrayList<>())
                    .build();
            order.addItem(item);

            OrderEntity saved = orderRepository.save(order);
            entityManager.createNativeQuery("UPDATE orders SET created_at = :cat WHERE id = :id")
                    .setParameter("cat", time)
                    .setParameter("id", saved.getId())
                    .executeUpdate();
            return saved;
        });
    }

    private void createStepAssignment(OrderEntity order, String stepName, UserEntity staff, BigDecimal commission, Instant time) {
        OrderItemEntity item = order.getItems().get(0);
        OrderStepAssignmentEntity step = OrderStepAssignmentEntity.builder()
                .orderItem(item)
                .stepName(stepName)
                .staff(staff)
                .commissionAmount(commission)
                .commissionRate(new BigDecimal("20.00"))
                .status(StepAssignmentStatus.COMPLETED)
                .build();
        step.setCreatedAt(time);
        item.getStepAssignments().add(step);

        CommissionLedgerEntity ledger = commissionLedgerRepository.save(CommissionLedgerEntity.builder()
                .order(order)
                .staff(staff)
                .stepAssignment(step)
                .amount(commission)
                .status("EARNED")
                .calculationNotes(stepName + " hoa hồng")
                .build());

        entityManager.createNativeQuery("UPDATE commission_ledgers SET created_at = :cat WHERE id = :id")
                .setParameter("cat", time)
                .setParameter("id", ledger.getId())
                .executeUpdate();
    }

    @Test
    @DisplayName("GET /api/v1/analytics/staff-payroll - Successfully aggregate staff payroll, Requested Stylist Rate and Re-booking Rate")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void shouldReturnStaffPayrollReport() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/staff-payroll")
                        .param("branchId", branch.getId().toString())
                        .param("startDate", "2026-10-15")
                        .param("endDate", "2026-10-18")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.branchId").value(branch.getId().intValue()))
                .andExpect(jsonPath("$.result.totalStaffCount", greaterThanOrEqualTo(4)))
                .andExpect(jsonPath("$.result.totalBaseSalary", greaterThan(0.0)))
                .andExpect(jsonPath("$.result.totalCommission", notNullValue()))
                .andExpect(jsonPath("$.result.totalPayrollPayout", greaterThan(0.0)))
                .andExpect(jsonPath("$.result.staffMembers", hasSize(greaterThanOrEqualTo(4))))
                // Stylist Minh assertions: 3 bookings, 3 requested = 100%, 1 identified customer (custHa) with 2 orders = 100% rebooking
                .andExpect(jsonPath("$.result.staffMembers[?(@.username == 'stylist.minh')].baseSalary").value(hasItem(12000000.0)))
                .andExpect(jsonPath("$.result.staffMembers[?(@.username == 'stylist.minh')].completedBookingCount").value(hasItem(3)))
                .andExpect(jsonPath("$.result.staffMembers[?(@.username == 'stylist.minh')].requestedBookingCount").value(hasItem(3)))
                .andExpect(jsonPath("$.result.staffMembers[?(@.username == 'stylist.minh')].requestedStylistRate").value(hasItem(100.0)))
                .andExpect(jsonPath("$.result.staffMembers[?(@.username == 'stylist.minh')].totalIdentifiedCustomers").value(hasItem(1)))
                .andExpect(jsonPath("$.result.staffMembers[?(@.username == 'stylist.minh')].repeatCustomerCount").value(hasItem(1)))
                .andExpect(jsonPath("$.result.staffMembers[?(@.username == 'stylist.minh')].rebookingRate").value(hasItem(100.0)))
                .andExpect(jsonPath("$.result.staffMembers[?(@.username == 'stylist.minh')].totalCommission").value(hasItem(298500.0)))
                .andExpect(jsonPath("$.result.staffMembers[?(@.username == 'stylist.minh')].commissionLedgers", hasSize(greaterThanOrEqualTo(1))))
                // Stylist Lan assertions: 2 bookings, 1 requested = 50%, 1 identified customer (custTri) with 2 orders = 100% rebooking
                .andExpect(jsonPath("$.result.staffMembers[?(@.username == 'stylist.lan')].baseSalary").value(hasItem(10000000.0)))
                .andExpect(jsonPath("$.result.staffMembers[?(@.username == 'stylist.lan')].completedBookingCount").value(hasItem(2)))
                .andExpect(jsonPath("$.result.staffMembers[?(@.username == 'stylist.lan')].requestedBookingCount").value(hasItem(1)))
                .andExpect(jsonPath("$.result.staffMembers[?(@.username == 'stylist.lan')].requestedStylistRate").value(hasItem(50.0)))
                .andExpect(jsonPath("$.result.staffMembers[?(@.username == 'stylist.lan')].rebookingRate").value(hasItem(100.0)))
                // Stylist Hung assertions: 1 booking, 0 requested = 0%, 1 identified customer (custNgoc) with 1 order = 0% rebooking
                .andExpect(jsonPath("$.result.staffMembers[?(@.username == 'stylist.hung')].baseSalary").value(hasItem(9000000.0)))
                .andExpect(jsonPath("$.result.staffMembers[?(@.username == 'stylist.hung')].completedBookingCount").value(hasItem(1)))
                .andExpect(jsonPath("$.result.staffMembers[?(@.username == 'stylist.hung')].requestedBookingCount").value(hasItem(0)))
                .andExpect(jsonPath("$.result.staffMembers[?(@.username == 'stylist.hung')].requestedStylistRate").value(hasItem(0.0)))
                .andExpect(jsonPath("$.result.staffMembers[?(@.username == 'stylist.hung')].rebookingRate").value(hasItem(0.0)));
    }

    @Test
    @DisplayName("PATCH /api/v1/analytics/staff/{id}/base-salary - Update base salary and verify reflection in P&L Tier 2")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void shouldUpdateBaseSalaryAndReflectInPnl() throws Exception {
        UserEntity minh = userRepository.findByUsernameAndIsDeletedFalse("stylist.minh").orElseThrow();
        BigDecimal newSalary = new BigDecimal("15000000.00");
        UpdateBaseSalaryRequest req = UpdateBaseSalaryRequest.builder().baseSalary(newSalary).build();

        // 1. Update base salary
        mockMvc.perform(patch("/api/v1/analytics/staff/" + minh.getId() + "/base-salary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.staffId").value(minh.getId().intValue()))
                .andExpect(jsonPath("$.result.baseSalary").value(15000000.0));

        // 2. Verify in Staff Payroll report
        mockMvc.perform(get("/api/v1/analytics/staff-payroll")
                        .param("branchId", branch.getId().toString())
                        .param("startDate", "2026-10-15")
                        .param("endDate", "2026-10-18")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.staffMembers[?(@.username == 'stylist.minh')].baseSalary").value(hasItem(15000000.0)));

        // 3. Verify immediate reflection in Realized P&L Tier 2 post-payroll net profit
        // Total base salary across all 4 branch staff: 15M (Minh) + 10M (Lan) + 9M (Hung) + 8M (Le) = 42M
        // Pro-rated for 4 days (15th to 18th): 42M * 4 / 30 = 5,600,000 VND
        mockMvc.perform(get("/api/v1/analytics/pnl")
                        .param("branchId", branch.getId().toString())
                        .param("startDate", "2026-10-15")
                        .param("endDate", "2026-10-18")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.fixedBaseSalaryCost", equalTo(5600000.0)));
    }

    @Test
    @DisplayName("Staff Payroll endpoints - Deny access for CUSTOMER role")
    @WithMockUser(username = "customer", roles = {"CUSTOMER"})
    void shouldDenyAccessForCustomer() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/staff-payroll")
                        .param("branchId", branch.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());

        UpdateBaseSalaryRequest req = UpdateBaseSalaryRequest.builder().baseSalary(new BigDecimal("10000000.00")).build();
        mockMvc.perform(patch("/api/v1/analytics/staff/2/base-salary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/analytics/my-payroll - Return privacy-scoped personal payroll statement for STYLIST")
    @WithMockUser(username = "stylist.minh", roles = {"STYLIST"})
    void shouldReturnPersonalPayrollStatementForStylist() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/my-payroll")
                        .param("startDate", "2026-10-15")
                        .param("endDate", "2026-10-18")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.username").value("stylist.minh"))
                .andExpect(jsonPath("$.result.fullName").value(stylistMinh.getFullName()))
                .andExpect(jsonPath("$.result.baseSalary").value(12000000.0))
                .andExpect(jsonPath("$.result.totalCommission").value(298500.0))
                .andExpect(jsonPath("$.result.totalPayout").value(12298500.0))
                .andExpect(jsonPath("$.result.completedOrderCount").value(3))
                .andExpect(jsonPath("$.result.completedBookingCount").value(3))
                .andExpect(jsonPath("$.result.requestedBookingCount").value(3))
                .andExpect(jsonPath("$.result.requestedStylistRate").value(100.0))
                .andExpect(jsonPath("$.result.totalIdentifiedCustomers").value(1))
                .andExpect(jsonPath("$.result.repeatCustomerCount").value(1))
                .andExpect(jsonPath("$.result.rebookingRate").value(100.0))
                .andExpect(jsonPath("$.result.commissionLedgers", hasSize(6)))
                .andExpect(jsonPath("$.result.commissionLedgers[0].orderCode", notNullValue()))
                .andExpect(jsonPath("$.result.commissionLedgers[0].stepName", notNullValue()))
                .andExpect(jsonPath("$.result.commissionLedgers[0].amount", greaterThan(0.0)));
    }

    @Test
    @DisplayName("GET /api/v1/analytics/my-payroll - Return personal payroll statement for STAFF")
    @WithMockUser(username = "staff.le", roles = {"STAFF"})
    void shouldReturnPersonalPayrollStatementForStaff() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/my-payroll")
                        .param("startDate", "2026-10-15")
                        .param("endDate", "2026-10-18")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.username").value("staff.le"))
                .andExpect(jsonPath("$.result.fullName").value(staffLe.getFullName()))
                .andExpect(jsonPath("$.result.baseSalary").value(8000000.0))
                .andExpect(jsonPath("$.result.completedStepCount").value(3))
                .andExpect(jsonPath("$.result.totalCommission").value(77000.0))
                .andExpect(jsonPath("$.result.totalPayout").value(8077000.0))
                .andExpect(jsonPath("$.result.commissionLedgers", hasSize(3)));
    }

    @Test
    @DisplayName("GET /api/v1/analytics/my-payroll - Defaults to current month when dates are omitted")
    @WithMockUser(username = "stylist.minh", roles = {"STYLIST"})
    void shouldDefaultToCurrentMonthWhenDatesOmitted() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/my-payroll")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.username").value("stylist.minh"))
                .andExpect(jsonPath("$.result.startDate").isNotEmpty())
                .andExpect(jsonPath("$.result.endDate").isNotEmpty());
    }

    @Test
    @DisplayName("Branch-wide payroll & P&L endpoints - Strict 403 Forbidden enforcement for STYLIST and STAFF")
    @WithMockUser(username = "stylist.minh", roles = {"STYLIST"})
    void shouldEnforceForbiddenOnBranchWidePayrollForStylist() throws Exception {
        // STYLIST cannot access branch-wide payroll
        mockMvc.perform(get("/api/v1/analytics/staff-payroll")
                        .param("branchId", branch.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());

        // STYLIST cannot access P&L
        mockMvc.perform(get("/api/v1/analytics/pnl")
                        .param("branchId", branch.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());

        // STYLIST cannot modify base salary
        UpdateBaseSalaryRequest req = UpdateBaseSalaryRequest.builder().baseSalary(new BigDecimal("20000000.00")).build();
        mockMvc.perform(patch("/api/v1/analytics/staff/" + stylistMinh.getId() + "/base-salary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Branch-wide payroll & P&L endpoints - Strict 403 Forbidden enforcement for STAFF")
    @WithMockUser(username = "staff.le", roles = {"STAFF"})
    void shouldEnforceForbiddenOnBranchWidePayrollForStaff() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/staff-payroll")
                        .param("branchId", branch.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/analytics/pnl")
                        .param("branchId", branch.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());

        UpdateBaseSalaryRequest req = UpdateBaseSalaryRequest.builder().baseSalary(new BigDecimal("15000000.00")).build();
        mockMvc.perform(patch("/api/v1/analytics/staff/" + staffLe.getId() + "/base-salary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/analytics/my-payroll - Deny access for CUSTOMER role")
    @WithMockUser(username = "cust.ha", roles = {"CUSTOMER"})
    void shouldDenyMyPayrollForCustomer() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/my-payroll")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }
}
