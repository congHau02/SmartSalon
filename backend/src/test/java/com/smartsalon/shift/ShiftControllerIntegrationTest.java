package com.smartsalon.shift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.config.TestAuthConfig;
import com.smartsalon.security.JwtProvider;
import com.smartsalon.shift.dto.CopyWeekRosterRequest;
import com.smartsalon.shift.dto.ShiftTemplateRequest;
import com.smartsalon.shift.dto.UpdateRosterCellRequest;
import com.smartsalon.shift.dto.UpdateRosterRequest;
import com.smartsalon.shift.entity.ShiftTemplateEntity;
import com.smartsalon.shift.repository.ShiftTemplateRepository;
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
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
class ShiftControllerIntegrationTest {

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
    private ShiftTemplateRepository shiftTemplateRepository;

    @Autowired
    private StaffScheduleRepository staffScheduleRepository;

    @Autowired
    private BookingRepository bookingRepository;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private BranchEntity branch1;
    private BranchEntity branch2;
    private UserEntity managerBranch1;
    private UserEntity managerBranch2;
    private UserEntity stylistMinh;
    private UserEntity customer;
    private ShiftTemplateEntity morningTmpl;
    private ShiftTemplateEntity fullDayTmpl;

    private String tokenAdmin;
    private String tokenManagerBranch1;
    private String tokenManagerBranch2;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        branch1 = branchRepository.findAll().stream().findFirst().orElseGet(() ->
                branchRepository.save(BranchEntity.builder()
                        .name("SmartSalon Flagship - Quận 1")
                        .address("123 Nguyễn Huệ, Q1")
                        .phone("0901000001")
                        .isActive(true)
                        .build())
        );

        branch2 = branchRepository.findAll().stream().filter(b -> !b.getId().equals(branch1.getId())).findFirst().orElseGet(() ->
                branchRepository.save(BranchEntity.builder()
                        .name("SmartSalon Luxury - Quận 3")
                        .address("456 Lê Văn Sỹ, Q3")
                        .phone("0901000002")
                        .isActive(true)
                        .build())
        );

        RoleEntity roleManager = roleRepository.findByName("MANAGER")
                .orElseGet(() -> roleRepository.save(RoleEntity.builder().name("MANAGER").build()));
        RoleEntity roleStylist = roleRepository.findByName("STYLIST")
                .orElseGet(() -> roleRepository.save(RoleEntity.builder().name("STYLIST").build()));
        RoleEntity roleCustomer = roleRepository.findByName("CUSTOMER")
                .orElseGet(() -> roleRepository.save(RoleEntity.builder().name("CUSTOMER").build()));

        managerBranch1 = userRepository.findByUsernameAndIsDeletedFalse("mgr.b1").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("mgr.b1")
                        .fullName("Quản lý Chi nhánh 1")
                        .phone("0981999001")
                        .passwordHash("hashed")
                        .branch(branch1)
                        .isActive(true)
                        .roles(new HashSet<>(Set.of(roleManager)))
                        .build())
        );

        managerBranch2 = userRepository.findByUsernameAndIsDeletedFalse("mgr.b2").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("mgr.b2")
                        .fullName("Quản lý Chi nhánh 2")
                        .phone("0981999002")
                        .passwordHash("hashed")
                        .branch(branch2)
                        .isActive(true)
                        .roles(new HashSet<>(Set.of(roleManager)))
                        .build())
        );

        stylistMinh = userRepository.findByUsernameAndIsDeletedFalse("stylist.minh").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("stylist.minh")
                        .fullName("Trần Minh Tuấn (Master Stylist)")
                        .phone("0911000001")
                        .passwordHash("hashed")
                        .branch(branch1)
                        .isActive(true)
                        .roles(new HashSet<>(Set.of(roleStylist)))
                        .build())
        );

        customer = userRepository.findByUsernameAndIsDeletedFalse("cust.test").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("cust.test")
                        .fullName("Nguyễn Khách Test")
                        .phone("0988111222")
                        .passwordHash("hashed")
                        .branch(branch1)
                        .isActive(true)
                        .roles(new HashSet<>(Set.of(roleCustomer)))
                        .build())
        );

        // Ensure default shift templates for Branch 1
        morningTmpl = shiftTemplateRepository.findByBranchIdAndCodeAndIsDeletedFalse(branch1.getId(), "MORNING")
                .orElseGet(() -> shiftTemplateRepository.save(ShiftTemplateEntity.builder()
                        .branch(branch1)
                        .code("MORNING")
                        .name("Ca Sáng")
                        .startTime(LocalTime.of(8, 30))
                        .endTime(LocalTime.of(15, 0))
                        .maxOvertimeMinutes(60)
                        .isActive(true)
                        .build()));

        shiftTemplateRepository.findByBranchIdAndCodeAndIsDeletedFalse(branch1.getId(), "AFTERNOON")
                .orElseGet(() -> shiftTemplateRepository.save(ShiftTemplateEntity.builder()
                        .branch(branch1)
                        .code("AFTERNOON")
                        .name("Ca Chiều")
                        .startTime(LocalTime.of(14, 0))
                        .endTime(LocalTime.of(20, 30))
                        .maxOvertimeMinutes(0)
                        .isActive(true)
                        .build()));

        fullDayTmpl = shiftTemplateRepository.findByBranchIdAndCodeAndIsDeletedFalse(branch1.getId(), "FULL_DAY")
                .orElseGet(() -> shiftTemplateRepository.save(ShiftTemplateEntity.builder()
                        .branch(branch1)
                        .code("FULL_DAY")
                        .name("Ca Cả ngày")
                        .startTime(LocalTime.of(8, 30))
                        .endTime(LocalTime.of(20, 30))
                        .maxOvertimeMinutes(0)
                        .isActive(true)
                        .build()));

        // Also ensure Branch 2 templates
        shiftTemplateRepository.findByBranchIdAndCodeAndIsDeletedFalse(branch2.getId(), "FULL_DAY")
                .orElseGet(() -> shiftTemplateRepository.save(ShiftTemplateEntity.builder()
                        .branch(branch2)
                        .code("FULL_DAY")
                        .name("Ca Cả ngày")
                        .startTime(LocalTime.of(8, 30))
                        .endTime(LocalTime.of(20, 30))
                        .maxOvertimeMinutes(0)
                        .isActive(true)
                        .build()));

        tokenAdmin = jwtProvider.generateAccessToken(1L, "admin", List.of("ADMIN"), null);
        tokenManagerBranch1 = jwtProvider.generateAccessToken(managerBranch1.getId(), managerBranch1.getUsername(), List.of("MANAGER"), branch1.getId());
        tokenManagerBranch2 = jwtProvider.generateAccessToken(managerBranch2.getId(), managerBranch2.getUsername(), List.of("MANAGER"), branch2.getId());
    }

    @Test
    @DisplayName("GET /api/v1/shifts/templates: Admin gets branch templates, Manager isolated to own branch")
    void testGetShiftTemplates_andAccessControl() throws Exception {
        // Admin gets templates of Branch 1
        mockMvc.perform(get("/api/v1/shifts/templates?branchId=" + branch1.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result", hasSize(greaterThanOrEqualTo(3))))
                .andExpect(jsonPath("$.result[?(@.code == 'MORNING')].startTime").value("08:30:00"));

        // Manager of Branch 1 gets Branch 1 templates
        mockMvc.perform(get("/api/v1/shifts/templates?branchId=" + branch1.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenManagerBranch1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));

        // Manager of Branch 1 requests Branch 2 templates -> 403 Forbidden
        mockMvc.perform(get("/api/v1/shifts/templates?branchId=" + branch2.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenManagerBranch1))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST & PUT /api/v1/shifts/templates: Create and update shift template with validations")
    void testCreateAndUpdateShiftTemplate() throws Exception {
        ShiftTemplateRequest createReq = ShiftTemplateRequest.builder()
                .branchId(branch1.getId())
                .code("NIGHT_TEST")
                .name("Ca Tối Thử Nghiệm")
                .startTime(LocalTime.of(18, 0))
                .endTime(LocalTime.of(22, 0))
                .maxOvertimeMinutes(30)
                .isActive(true)
                .build();

        // Manager 1 creates template for Branch 1 -> 200 OK
        String response = mockMvc.perform(post("/api/v1/shifts/templates")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenManagerBranch1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.code").value("NIGHT_TEST"))
                .andExpect(jsonPath("$.result.maxOvertimeMinutes").value(30))
                .andReturn().getResponse().getContentAsString();

        Long createdId = objectMapper.readTree(response).path("result").path("id").asLong();

        // Manager 1 tries to create template for Branch 2 -> 403 Forbidden
        createReq.setBranchId(branch2.getId());
        createReq.setCode("NIGHT_TEST_B2");
        mockMvc.perform(post("/api/v1/shifts/templates")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenManagerBranch1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isForbidden());

        // Update template
        ShiftTemplateRequest updateReq = ShiftTemplateRequest.builder()
                .branchId(branch1.getId())
                .code("NIGHT_TEST")
                .name("Ca Tối Cập Nhật")
                .startTime(LocalTime.of(18, 30))
                .endTime(LocalTime.of(22, 30))
                .maxOvertimeMinutes(45)
                .isActive(true)
                .build();

        mockMvc.perform(put("/api/v1/shifts/templates/" + createdId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenManagerBranch1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.name").value("Ca Tối Cập Nhật"))
                .andExpect(jsonPath("$.result.startTime").value("18:30:00"))
                .andExpect(jsonPath("$.result.maxOvertimeMinutes").value(45));
    }

    @Test
    @DisplayName("GET /api/v1/shifts/roster: Retrieves 7-day weekly matrix with staff rows and schedule cells")
    void testGetWeeklyRoster() throws Exception {
        LocalDate monday = LocalDate.now().plusWeeks(1).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate sunday = monday.plusDays(6);

        mockMvc.perform(get("/api/v1/shifts/roster")
                        .param("branchId", branch1.getId().toString())
                        .param("startDate", monday.toString())
                        .param("endDate", sunday.toString())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenManagerBranch1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.branchId").value(branch1.getId()))
                .andExpect(jsonPath("$.result.staff", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.result.staff[0].schedules", hasSize(7)));
    }

    @Test
    @DisplayName("PUT /api/v1/shifts/roster: Booking Conflict Guard rejects OFF or narrower shift when active booking exists (HTTP 409 Conflict)")
    void testBookingConflictGuard_blocksConflictingShiftUpdate() throws Exception {
        LocalDate testDate = LocalDate.now().plusWeeks(2).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        // Create a confirmed booking for stylist.minh on testDate from 16:00 to 17:30
        BookingEntity conflictingBooking = bookingRepository.save(BookingEntity.builder()
                .branch(branch1)
                .customer(customer)
                .staff(stylistMinh)
                .bookingCode("BK-CONFLICT-TEST-" + System.currentTimeMillis())
                .bookingTime(testDate.atTime(16, 0))
                .endTime(testDate.atTime(17, 30))
                .totalDurationMinutes(90)
                .totalPrice(BigDecimal.valueOf(500000))
                .depositAmount(BigDecimal.valueOf(100000))
                .depositStatus(DepositStatus.PAID)
                .status(BookingStatus.CONFIRMED)
                .customerName("Khách Hàng Xung Đột")
                .customerPhone("0988777666")
                .notes("Lịch test conflict guard")
                .build());

        // 1. Attempt to set stylist.minh to MORNING shift (08:30–15:00, maxOT 60 -> 16:00, ends at 17:30 > 16:00) -> 409 Conflict
        UpdateRosterRequest reqMorning = UpdateRosterRequest.builder()
                .branchId(branch1.getId())
                .cells(List.of(
                        UpdateRosterCellRequest.builder()
                                .userId(stylistMinh.getId())
                                .scheduleDate(testDate)
                                .status("WORKING")
                                .shiftTemplateId(morningTmpl.getId())
                                .notes("Chuyển ca sáng")
                                .build()
                ))
                .build();

        mockMvc.perform(put("/api/v1/shifts/roster")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenManagerBranch1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqMorning)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(2011))
                .andExpect(jsonPath("$.message", containsString("xung đột")))
                .andExpect(jsonPath("$.result[0].bookingCode").value(conflictingBooking.getBookingCode()))
                .andExpect(jsonPath("$.result[0].customerName").value("Khách Hàng Xung Đột"));

        // 2. Attempt to set stylist.minh to OFF -> Must also be blocked with 409 Conflict
        UpdateRosterRequest reqOff = UpdateRosterRequest.builder()
                .branchId(branch1.getId())
                .cells(List.of(
                        UpdateRosterCellRequest.builder()
                                .userId(stylistMinh.getId())
                                .scheduleDate(testDate)
                                .status("OFF")
                                .shiftTemplateId(null)
                                .notes("Nghỉ đột xuất")
                                .build()
                ))
                .build();

        mockMvc.perform(put("/api/v1/shifts/roster")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenManagerBranch1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqOff)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(2011))
                .andExpect(jsonPath("$.result[0].bookingCode").value(conflictingBooking.getBookingCode()));

        // 3. Setting stylist.minh to FULL_DAY (08:30–20:30) which covers 16:00–17:30 -> Must succeed (200 OK)
        UpdateRosterRequest reqFullDay = UpdateRosterRequest.builder()
                .branchId(branch1.getId())
                .cells(List.of(
                        UpdateRosterCellRequest.builder()
                                .userId(stylistMinh.getId())
                                .scheduleDate(testDate)
                                .status("WORKING")
                                .shiftTemplateId(fullDayTmpl.getId())
                                .notes("Ca Cả ngày bao phủ trọn vẹn")
                                .build()
                ))
                .build();

        mockMvc.perform(put("/api/v1/shifts/roster")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenManagerBranch1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqFullDay)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result[0].status").value("WORKING"))
                .andExpect(jsonPath("$.result[0].shiftTemplateCode").value("FULL_DAY"));
    }

    @Test
    @DisplayName("POST /api/v1/shifts/roster/copy-week: Copies previous week roster to target week")
    void testCopyWeekRoster() throws Exception {
        LocalDate sourceMonday = LocalDate.now().plusWeeks(3).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate targetMonday = sourceMonday.plusWeeks(1);

        // Seed 1 schedule in source week
        mockMvc.perform(put("/api/v1/shifts/roster")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenManagerBranch1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateRosterRequest.builder()
                                .branchId(branch1.getId())
                                .cells(List.of(
                                        UpdateRosterCellRequest.builder()
                                                .userId(stylistMinh.getId())
                                                .scheduleDate(sourceMonday)
                                                .status("WORKING")
                                                .shiftTemplateId(fullDayTmpl.getId())
                                                .notes("Tuần nguồn")
                                                .build()
                                ))
                                .build())))
                .andExpect(status().isOk());

        // Copy week
        CopyWeekRosterRequest copyReq = CopyWeekRosterRequest.builder()
                .branchId(branch1.getId())
                .sourceStartDate(sourceMonday)
                .targetStartDate(targetMonday)
                .build();

        mockMvc.perform(post("/api/v1/shifts/roster/copy-week")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenManagerBranch1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(copyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result", greaterThanOrEqualTo(1)));

        // Manager of Branch 1 tries to copy week for Branch 2 -> 403 Forbidden
        copyReq.setBranchId(branch2.getId());
        mockMvc.perform(post("/api/v1/shifts/roster/copy-week")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenManagerBranch1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(copyReq)))
                .andExpect(status().isForbidden());
    }
}
