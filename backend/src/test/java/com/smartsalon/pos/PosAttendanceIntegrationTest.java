package com.smartsalon.pos;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.config.TestAuthConfig;
import com.smartsalon.pos.dto.PosAttendanceActionRequest;
import com.smartsalon.shift.entity.ShiftTemplateEntity;
import com.smartsalon.shift.entity.StaffAttendanceEntity;
import com.smartsalon.shift.entity.StaffAttendanceStatus;
import com.smartsalon.shift.entity.StaffScheduleEntity;
import com.smartsalon.shift.entity.StaffScheduleStatus;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
@Transactional
class PosAttendanceIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ShiftTemplateRepository shiftTemplateRepository;

    @Autowired
    private StaffScheduleRepository staffScheduleRepository;

    @Autowired
    private StaffAttendanceRepository staffAttendanceRepository;

    private BranchEntity testBranch;
    private UserEntity testStylist;
    private ShiftTemplateEntity morningTemplate;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        testBranch = branchRepository.findAll().stream().findFirst().orElseGet(() ->
                branchRepository.save(BranchEntity.builder()
                        .name("SmartSalon Flagship - Quận 1")
                        .address("123 Nguyễn Huệ, Q1")
                        .phone("0901234567")
                        .isActive(true)
                        .build())
        );

        RoleEntity stylistRole = roleRepository.findByName("STYLIST").orElseGet(() ->
                roleRepository.save(RoleEntity.builder().name("STYLIST").description("Thợ tạo mẫu tóc").build())
        );

        RoleEntity managerRole = roleRepository.findByName("MANAGER").orElseGet(() ->
                roleRepository.save(RoleEntity.builder().name("MANAGER").description("Quản lý chi nhánh").build())
        );

        userRepository.findByUsernameAndIsDeletedFalse("branch.manager").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("branch.manager")
                        .passwordHash("hashed")
                        .fullName("Trần Quản Lý")
                        .phone("0900999888")
                        .email("manager@smartsalon.vn")
                        .branch(testBranch)
                        .isActive(true)
                        .roles(Set.of(managerRole))
                        .build())
        );

        testStylist = userRepository.findByPhoneAndIsDeletedFalse("0912340099").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("stylist.attendance.test")
                        .passwordHash("hashed")
                        .fullName("Trần Thợ Chính")
                        .phone("0912340099")
                        .email("stylist.attendance.test@smartsalon.vn")
                        .branch(testBranch)
                        .attendancePin("1234")
                        .isActive(true)
                        .roles(Set.of(stylistRole))
                        .build())
        );

        morningTemplate = shiftTemplateRepository.findByBranchIdAndCodeAndIsDeletedFalse(testBranch.getId(), "MORNING")
                .orElseGet(() -> shiftTemplateRepository.save(ShiftTemplateEntity.builder()
                        .branch(testBranch)
                        .code("MORNING")
                        .name("Ca Sáng")
                        .startTime(LocalTime.of(8, 30))
                        .endTime(LocalTime.of(15, 0))
                        .maxOvertimeMinutes(60)
                        .isActive(true)
                        .build()));
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    @DisplayName("GET /api/v1/pos/attendance/today trả về danh sách nhân sự kèm thông tin ca và trạng thái chấm công")
    void shouldGetTodayAttendance() throws Exception {
        LocalDate today = LocalDate.now();

        // Setup schedule and attendance
        StaffScheduleEntity schedule = staffScheduleRepository.findByUserIdAndScheduleDateAndIsDeletedFalse(testStylist.getId(), today)
                .orElseGet(() -> staffScheduleRepository.save(StaffScheduleEntity.builder()
                        .branch(testBranch)
                        .user(testStylist)
                        .shiftTemplate(morningTemplate)
                        .scheduleDate(today)
                        .status(StaffScheduleStatus.WORKING)
                        .build()));

        StaffAttendanceEntity attendance = staffAttendanceRepository.findByUserIdAndAttendanceDateAndIsDeletedFalse(testStylist.getId(), today)
                .orElseGet(() -> staffAttendanceRepository.save(StaffAttendanceEntity.builder()
                        .branch(testBranch)
                        .user(testStylist)
                        .schedule(schedule)
                        .attendanceDate(today)
                        .clockInAt(LocalDateTime.now())
                        .status(StaffAttendanceStatus.PRESENT)
                        .overtimeMinutes(0)
                        .build()));

        mockMvc.perform(get("/api/v1/pos/attendance/today")
                        .param("branchId", testBranch.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result", isA(Iterable.class)))
                .andExpect(jsonPath("$.result[?(@.userId == " + testStylist.getId() + ")].fullName", contains("Trần Thợ Chính")))
                .andExpect(jsonPath("$.result[?(@.userId == " + testStylist.getId() + ")].attendanceStatus", contains("PRESENT")));
    }

    @Test
    @WithMockUser(username = "stylist.attendance.test", roles = {"STYLIST"})
    @DisplayName("POST /api/v1/pos/attendance/action với sai mã PIN trả về 400 Bad Request INVALID_ATTENDANCE_PIN")
    void shouldRejectAttendanceActionWithInvalidPin() throws Exception {
        PosAttendanceActionRequest request = PosAttendanceActionRequest.builder()
                .branchId(testBranch.getId())
                .userId(testStylist.getId())
                .action("CLOCK_IN")
                .pin("9999") // Wrong PIN
                .build();

        mockMvc.perform(post("/api/v1/pos/attendance/action")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is(1010)))
                .andExpect(jsonPath("$.message", containsString("Mã PIN chấm công không chính xác")));
    }

    @Test
    @WithMockUser(username = "stylist.attendance.test", roles = {"STYLIST"})
    @DisplayName("POST /api/v1/pos/attendance/action với đúng PIN thực hiện CLOCK_IN -> TOGGLE_BREAK -> CLOCK_OUT")
    void shouldExecuteFullAttendanceLifecycleWithValidPin() throws Exception {
        LocalDate today = LocalDate.now();

        // Ensure schedule exists with endTime set to 1 hour ago to trigger overtime on CLOCK_OUT
        ShiftTemplateEntity pastShift = shiftTemplateRepository.save(ShiftTemplateEntity.builder()
                .branch(testBranch)
                .code("EARLY_SHIFT")
                .name("Ca Sớm")
                .startTime(LocalTime.now().minusHours(4))
                .endTime(LocalTime.now().minusMinutes(30))
                .maxOvertimeMinutes(60)
                .isActive(true)
                .build());

        staffScheduleRepository.save(StaffScheduleEntity.builder()
                .branch(testBranch)
                .user(testStylist)
                .shiftTemplate(pastShift)
                .scheduleDate(today)
                .status(StaffScheduleStatus.WORKING)
                .build());

        // 1. Clock-in
        PosAttendanceActionRequest clockInReq = PosAttendanceActionRequest.builder()
                .branchId(testBranch.getId())
                .userId(testStylist.getId())
                .action("CLOCK_IN")
                .pin("1234")
                .build();

        mockMvc.perform(post("/api/v1/pos/attendance/action")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clockInReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.attendanceStatus", is("PRESENT")))
                .andExpect(jsonPath("$.result.clockInAt", notNullValue()));

        // 2. Toggle break (PRESENT -> ON_BREAK)
        PosAttendanceActionRequest breakReq = PosAttendanceActionRequest.builder()
                .branchId(testBranch.getId())
                .userId(testStylist.getId())
                .action("TOGGLE_BREAK")
                .pin("1234")
                .build();

        mockMvc.perform(post("/api/v1/pos/attendance/action")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(breakReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.attendanceStatus", is("ON_BREAK")))
                .andExpect(jsonPath("$.result.breakStartAt", notNullValue()));

        // 3. Toggle break again (ON_BREAK -> PRESENT)
        mockMvc.perform(post("/api/v1/pos/attendance/action")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(breakReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.attendanceStatus", is("PRESENT")))
                .andExpect(jsonPath("$.result.breakEndAt", notNullValue()));

        // 4. Clock-out (computes overtimeMinutes because now > shift.endTime)
        PosAttendanceActionRequest clockOutReq = PosAttendanceActionRequest.builder()
                .branchId(testBranch.getId())
                .userId(testStylist.getId())
                .action("CLOCK_OUT")
                .pin("1234")
                .build();

        mockMvc.perform(post("/api/v1/pos/attendance/action")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clockOutReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.attendanceStatus", is("COMPLETED")))
                .andExpect(jsonPath("$.result.clockOutAt", notNullValue()))
                .andExpect(jsonPath("$.result.overtimeMinutes", greaterThanOrEqualTo(25)));
    }

    @Test
    @WithMockUser(username = "branch.manager", roles = {"MANAGER"})
    @DisplayName("Quản lý/Lễ tân có thể dùng overridePin = true mà không cần nhập PIN của nhân sự")
    void shouldAllowAdministrativeOverrideWithoutPin() throws Exception {
        PosAttendanceActionRequest request = PosAttendanceActionRequest.builder()
                .branchId(testBranch.getId())
                .userId(testStylist.getId())
                .action("MARK_ABSENT")
                .overridePin(true)
                .build();

        mockMvc.perform(post("/api/v1/pos/attendance/action")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.attendanceStatus", is("ABSENT")));
    }

    @Test
    @WithMockUser(username = "stylist.attendance.test", roles = {"STYLIST"})
    @DisplayName("Stylist không có quyền ghi đè PIN (overridePin = true trả về 403 Forbidden)")
    void shouldRejectOverrideFromNonPrivilegedUser() throws Exception {
        PosAttendanceActionRequest request = PosAttendanceActionRequest.builder()
                .branchId(testBranch.getId())
                .userId(testStylist.getId())
                .action("CLOCK_IN")
                .overridePin(true) // Stylist attempting administrative override
                .build();

        mockMvc.perform(post("/api/v1/pos/attendance/action")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "branch.manager", roles = {"MANAGER"})
    @DisplayName("Dispatch Board trả về StylistAvailabilityDto kèm trạng thái chấm công trực tiếp")
    void shouldIncludeAttendanceStatusOnDispatchBoard() throws Exception {
        LocalDate today = LocalDate.now();

        StaffAttendanceEntity attendance = staffAttendanceRepository.findByUserIdAndAttendanceDateAndIsDeletedFalse(testStylist.getId(), today)
                .orElseGet(() -> staffAttendanceRepository.save(StaffAttendanceEntity.builder()
                        .branch(testBranch)
                        .user(testStylist)
                        .attendanceDate(today)
                        .status(StaffAttendanceStatus.ON_BREAK)
                        .build()));
        attendance.setStatus(StaffAttendanceStatus.ON_BREAK);
        staffAttendanceRepository.save(attendance);

        mockMvc.perform(get("/api/v1/pos/dispatch-board")
                        .param("branchId", testBranch.getId().toString())
                        .param("date", today.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.stylists[?(@.stylistId == " + testStylist.getId() + ")].attendanceStatus", contains("ON_BREAK")));
    }

    @Test
    @WithMockUser(username = "stylist.attendance.test", roles = {"STYLIST"})
    @DisplayName("Stylist Daily Worklog trả về trạng thái chấm công và tóm tắt lịch trực 7 ngày")
    void shouldIncludeAttendanceAndWeeklyScheduleInWorklog() throws Exception {
        LocalDate today = LocalDate.now();

        mockMvc.perform(get("/api/v1/pos/stylist/daily-worklog")
                        .param("branchId", testBranch.getId().toString())
                        .param("stylistId", testStylist.getId().toString())
                        .param("date", today.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.weeklySchedule", hasSize(7)))
                .andExpect(jsonPath("$.result.weeklySchedule[0].dayOfWeek", notNullValue()));
    }
}
