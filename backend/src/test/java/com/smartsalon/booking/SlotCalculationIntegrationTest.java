package com.smartsalon.booking;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.booking.service.RedisLockService;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.config.TestAuthConfig;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import com.smartsalon.booking.dto.CreateBookingRequest;
import com.smartsalon.booking.service.BookingService;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.shift.entity.ShiftTemplateEntity;
import com.smartsalon.shift.entity.StaffAttendanceEntity;
import com.smartsalon.shift.entity.StaffAttendanceStatus;
import com.smartsalon.shift.entity.StaffScheduleEntity;
import com.smartsalon.shift.entity.StaffScheduleStatus;
import com.smartsalon.shift.repository.ShiftTemplateRepository;
import com.smartsalon.shift.repository.StaffAttendanceRepository;
import com.smartsalon.shift.repository.StaffScheduleRepository;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
class SlotCalculationIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RedisLockService redisLockService;

    @Autowired
    private ShiftTemplateRepository shiftTemplateRepository;

    @Autowired
    private StaffScheduleRepository staffScheduleRepository;

    @Autowired
    private StaffAttendanceRepository staffAttendanceRepository;

    @Autowired
    private BookingService bookingService;

    private MockMvc mockMvc;
    private BranchEntity testBranch;
    private ServiceEntity testService120m;
    private UserEntity testStylist;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        testBranch = branchRepository.findAllByIsDeletedFalseAndIsActiveTrue().stream()
                .findFirst()
                .orElseGet(() -> branchRepository.save(BranchEntity.builder()
                        .name("SmartSalon Test Branch")
                        .address("123 Test Street")
                        .phone("0901234567")
                        .isActive(true)
                        .build()));

        testService120m = serviceRepository.findAllByIsDeletedFalseAndIsActiveTrue().stream()
                .filter(s -> s.getDurationMinutes() >= 60)
                .findFirst()
                .orElseGet(() -> serviceRepository.save(ServiceEntity.builder()
                        .name("Combo Uốn Nhuộm Phục Hồi VIP")
                        .category("Uốn Nhuộm")
                        .basePrice(new BigDecimal("1000000.00"))
                        .durationMinutes(120)
                        .isActive(true)
                        .build()));

        testStylist = userRepository.findActiveStylistsByBranchId(testBranch.getId()).stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Test stylist not found"));
    }

    @Test
    @DisplayName("Khách hàng xem danh sách Stylist công khai không cần đăng nhập")
    void shouldReturnActiveStylistsPublicly() throws Exception {
        mockMvc.perform(get("/api/v1/stylists")
                        .param("branchId", testBranch.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result").isArray())
                .andExpect(jsonPath("$.result[0].fullName", notNullValue()));

        // Also verify /api/v1/bookings/stylists alias
        mockMvc.perform(get("/api/v1/bookings/stylists")
                        .param("branchId", testBranch.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result").isArray());
    }

    @Test
    @DisplayName("Tính toán khung giờ trống với Stylist cụ thể: kiểm tra bước nhảy 30p và cọc 20%")
    void shouldCalculateAvailableSlotsForSpecificStylist() throws Exception {
        LocalDate targetDate = LocalDate.now().plusDays(2);

        mockMvc.perform(get("/api/v1/bookings/available-slots")
                        .param("branchId", testBranch.getId().toString())
                        .param("date", targetDate.toString())
                        .param("serviceIds", testService120m.getId().toString())
                        .param("stylistId", testStylist.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.branchId").value(testBranch.getId()))
                .andExpect(jsonPath("$.result.totalDurationMinutes").value(testService120m.getDurationMinutes()))
                .andExpect(jsonPath("$.result.totalPrice").value(testService120m.getBasePrice().doubleValue()))
                .andExpect(jsonPath("$.result.depositAmount").value(testService120m.getBasePrice().multiply(new BigDecimal("0.20")).doubleValue()))
                .andExpect(jsonPath("$.result.slots").isArray())
                .andExpect(jsonPath("$.result.slots[0].time").value("08:30"))
                .andExpect(jsonPath("$.result.slots[0].status").value("AVAILABLE"));
    }

    @Test
    @DisplayName("Khung giờ bị trùng với Lịch hẹn DB đã xác nhận phải đổi trạng thái sang BOOKED")
    void shouldMarkOverlappingSlotsAsBooked() throws Exception {
        LocalDate targetDate = LocalDate.now().plusDays(3);
        LocalDateTime bookingStart = LocalDateTime.of(targetDate, LocalTime.of(10, 0));
        LocalDateTime bookingEnd = bookingStart.plusMinutes(90); // 10:00 to 11:30

        UserEntity customer = userRepository.findByUsernameAndIsDeletedFalse("admin")
                .orElseThrow();

        BookingEntity booked = bookingRepository.save(BookingEntity.builder()
                .branch(testBranch)
                .customer(customer)
                .staff(testStylist)
                .bookingCode("BK-OVERLAP-TEST")
                .bookingTime(bookingStart)
                .endTime(bookingEnd)
                .totalDurationMinutes(90)
                .totalPrice(new BigDecimal("500000.00"))
                .status(BookingStatus.CONFIRMED)
                .depositAmount(new BigDecimal("100000.00"))
                .depositStatus(DepositStatus.PAID)
                .customerName("Khách Hàng Đã Đặt")
                .customerPhone("0987654321")
                .build());

        try {
            // Query for a 60-minute service
            mockMvc.perform(get("/api/v1/bookings/available-slots")
                            .param("branchId", testBranch.getId().toString())
                            .param("date", targetDate.toString())
                            .param("serviceIds", testService120m.getId().toString())
                            .param("stylistId", testStylist.getId().toString())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    // Slot 09:30 (with 120m ends at 11:30) overlaps with [10:00, 11:30) -> BOOKED
                    .andExpect(jsonPath("$.result.slots[?(@.time == '09:30')].status").value("BOOKED"))
                    // Slot 10:00 overlaps with [10:00, 11:30) -> BOOKED
                    .andExpect(jsonPath("$.result.slots[?(@.time == '10:00')].status").value("BOOKED"))
                    // Slot 12:00 starts after bookingEnd -> AVAILABLE
                    .andExpect(jsonPath("$.result.slots[?(@.time == '12:00')].status").value("AVAILABLE"));
        } finally {
            bookingRepository.delete(booked);
        }
    }

    @Test
    @DisplayName("Khung giờ đang có Redis hold 5 phút phải hiển thị trạng thái LOCKED")
    void shouldMarkSlotsAsLockedWhenRedisHoldExists() throws Exception {
        LocalDate targetDate = LocalDate.now().plusDays(4);
        LocalDateTime holdStart = LocalDateTime.of(targetDate, LocalTime.of(14, 0));
        LocalDateTime holdEnd = LocalDateTime.of(targetDate, LocalTime.of(15, 0));

        redisLockService.tryLockSlots(testStylist.getId(), holdStart, holdEnd, "BK-HOLD-TEST");

        try {
            mockMvc.perform(get("/api/v1/bookings/available-slots")
                            .param("branchId", testBranch.getId().toString())
                            .param("date", targetDate.toString())
                            .param("serviceIds", testService120m.getId().toString())
                            .param("stylistId", testStylist.getId().toString())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    // Slot 14:00 has Redis lock -> LOCKED
                    .andExpect(jsonPath("$.result.slots[?(@.time == '14:00')].status").value("LOCKED"));
        } finally {
            redisLockService.unlockSlots(testStylist.getId(), holdStart, holdEnd);
        }
    }

    @Test
    @DisplayName("Tính khung giờ ở chế độ Bất kỳ Stylist nào (stylistId=null) trả về số thợ còn trống")
    void shouldCalculateAvailableSlotsForAnyStylist() throws Exception {
        LocalDate targetDate = LocalDate.now().plusDays(5);

        mockMvc.perform(get("/api/v1/bookings/available-slots")
                        .param("branchId", testBranch.getId().toString())
                        .param("date", targetDate.toString())
                        .param("serviceIds", testService120m.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.stylistId").doesNotExist())
                .andExpect(jsonPath("$.result.stylistName").value("Bất kỳ Stylist nào còn trống"))
                .andExpect(jsonPath("$.result.slots[0].availableStylistCount", greaterThanOrEqualTo(1)));
    }

    @Test
    @DisplayName("Ca Sáng 08:30-15:00 (+60p OT): Dịch vụ 90p lúc 14:00 (kết thúc 15:30 <= 16:00) khả dụng, dịch vụ 150p lúc 14:00 (kết thúc 16:30 > 16:00) bị chặn")
    void shouldEnforceOvertimeWindowForMorningShift() throws Exception {
        LocalDate targetDate = LocalDate.now().plusDays(10);

        ShiftTemplateEntity morningShift = shiftTemplateRepository.findByBranchIdAndCodeAndIsDeletedFalse(testBranch.getId(), "MORNING")
                .orElseGet(() -> shiftTemplateRepository.save(ShiftTemplateEntity.builder()
                        .branch(testBranch)
                        .code("MORNING")
                        .name("Ca Sáng")
                        .startTime(LocalTime.of(8, 30))
                        .endTime(LocalTime.of(15, 0))
                        .maxOvertimeMinutes(60)
                        .isActive(true)
                        .build()));

        StaffScheduleEntity schedule = staffScheduleRepository.findByUserIdAndScheduleDateAndIsDeletedFalse(testStylist.getId(), targetDate)
                .orElseGet(() -> StaffScheduleEntity.builder()
                        .branch(testBranch)
                        .user(testStylist)
                        .scheduleDate(targetDate)
                        .build());
        schedule.setStatus(StaffScheduleStatus.WORKING);
        schedule.setShiftTemplate(morningShift);
        staffScheduleRepository.save(schedule);

        ServiceEntity service90m = serviceRepository.save(ServiceEntity.builder()
                .name("Uốn Lạnh Phục Hồi 90m")
                .category("Uốn")
                .basePrice(new BigDecimal("400000.00"))
                .durationMinutes(90)
                .isActive(true)
                .build());

        ServiceEntity service150m = serviceRepository.save(ServiceEntity.builder()
                .name("Tẩy Nhuộm Toàn Phần 150m")
                .category("Nhuộm")
                .basePrice(new BigDecimal("800000.00"))
                .durationMinutes(150)
                .isActive(true)
                .build());

        try {
            // 90m service at 14:00 ends at 15:30 <= 16:00 -> AVAILABLE
            mockMvc.perform(get("/api/v1/bookings/available-slots")
                            .param("branchId", testBranch.getId().toString())
                            .param("date", targetDate.toString())
                            .param("serviceIds", service90m.getId().toString())
                            .param("stylistId", testStylist.getId().toString())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.result.slots[?(@.time == '14:00')].status").value("AVAILABLE"))
                    // Slot at 15:00 is >= shift.endTime -> BOOKED/unavailable
                    .andExpect(jsonPath("$.result.slots[?(@.time == '15:00')].status").value("BOOKED"));

            // 150m service at 14:00 ends at 16:30 > 16:00 -> BOOKED
            mockMvc.perform(get("/api/v1/bookings/available-slots")
                            .param("branchId", testBranch.getId().toString())
                            .param("date", targetDate.toString())
                            .param("serviceIds", service150m.getId().toString())
                            .param("stylistId", testStylist.getId().toString())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.result.slots[?(@.time == '14:00')].status").value("BOOKED"));
        } finally {
            serviceRepository.delete(service90m);
            serviceRepository.delete(service150m);
        }
    }

    @Test
    @DisplayName("Stylist xếp lịch Nghỉ (OFF) trên ngày đặt thì tất cả các slot đều BOOKED/không khả dụng")
    void shouldBlockStylistScheduledOff() throws Exception {
        LocalDate targetDate = LocalDate.now().plusDays(11);

        StaffScheduleEntity schedule = staffScheduleRepository.findByUserIdAndScheduleDateAndIsDeletedFalse(testStylist.getId(), targetDate)
                .orElseGet(() -> StaffScheduleEntity.builder()
                        .branch(testBranch)
                        .user(testStylist)
                        .scheduleDate(targetDate)
                        .build());
        schedule.setStatus(StaffScheduleStatus.OFF);
        schedule.setShiftTemplate(null);
        staffScheduleRepository.save(schedule);

        mockMvc.perform(get("/api/v1/bookings/available-slots")
                        .param("branchId", testBranch.getId().toString())
                        .param("date", targetDate.toString())
                        .param("serviceIds", testService120m.getId().toString())
                        .param("stylistId", testStylist.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.slots[*].status", everyItem(is("BOOKED"))))
                .andExpect(jsonPath("$.result.slots[*].availableStylistCount", everyItem(is(0))));
    }

    @Test
    @DisplayName("Đặt lịch tự động phân bổ (Least-Workload) loại trừ thợ lịch OFF")
    void shouldExcludeOffStylistsFromLeastWorkloadAssignment() throws Exception {
        LocalDate targetDate = LocalDate.now().plusDays(12);

        // Mark testStylist as OFF
        StaffScheduleEntity schedule = staffScheduleRepository.findByUserIdAndScheduleDateAndIsDeletedFalse(testStylist.getId(), targetDate)
                .orElseGet(() -> StaffScheduleEntity.builder()
                        .branch(testBranch)
                        .user(testStylist)
                        .scheduleDate(targetDate)
                        .build());
        schedule.setStatus(StaffScheduleStatus.OFF);
        schedule.setShiftTemplate(null);
        staffScheduleRepository.save(schedule);

        // Direct booking attempt with testStylist should throw SLOT_NOT_AVAILABLE
        CreateBookingRequest directOffRequest = new CreateBookingRequest(
                testBranch.getId(),
                testStylist.getId(),
                List.of(testService120m.getId()),
                LocalDateTime.of(targetDate, LocalTime.of(10, 0)),
                "Khách Test OFF",
                "0988776655",
                "Ghi chu"
        );

        assertThatThrownBy(() -> bookingService.holdSlotAndCreate(directOffRequest))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.SLOT_NOT_AVAILABLE));
    }

    @Test
    @DisplayName("API danh sách Stylist trả về thông tin ca trực (shiftCode, shiftName, isWorking) theo ngày")
    void shouldReturnStylistShiftBadgeInfo() throws Exception {
        LocalDate targetDate = LocalDate.now().plusDays(13);

        ShiftTemplateEntity morningShift = shiftTemplateRepository.findByBranchIdAndCodeAndIsDeletedFalse(testBranch.getId(), "MORNING")
                .orElseThrow();

        StaffScheduleEntity schedule = staffScheduleRepository.findByUserIdAndScheduleDateAndIsDeletedFalse(testStylist.getId(), targetDate)
                .orElseGet(() -> StaffScheduleEntity.builder()
                        .branch(testBranch)
                        .user(testStylist)
                        .scheduleDate(targetDate)
                        .build());
        schedule.setStatus(StaffScheduleStatus.WORKING);
        schedule.setShiftTemplate(morningShift);
        staffScheduleRepository.save(schedule);

        mockMvc.perform(get("/api/v1/bookings/stylists")
                        .param("branchId", testBranch.getId().toString())
                        .param("date", targetDate.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result[?(@.id == " + testStylist.getId() + ")].shiftCode").value("MORNING"))
                .andExpect(jsonPath("$.result[?(@.id == " + testStylist.getId() + ")].shiftName").value(morningShift.getName()))
                .andExpect(jsonPath("$.result[?(@.id == " + testStylist.getId() + ")].isWorking").value(true));
    }

    @Test
    @DisplayName("Ngày tương lai xa chưa công bố lịch làm việc: fallback về giờ mở cửa chi nhánh (08:30-20:30)")
    void shouldFallbackToOperatingHoursForFarFutureDate() throws Exception {
        LocalDate farFutureDate = LocalDate.now().plusYears(1);

        mockMvc.perform(get("/api/v1/bookings/available-slots")
                        .param("branchId", testBranch.getId().toString())
                        .param("date", farFutureDate.toString())
                        .param("serviceIds", testService120m.getId().toString())
                        .param("stylistId", testStylist.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.slots[?(@.time == '08:30')].status").value("AVAILABLE"))
                .andExpect(jsonPath("$.result.slots[?(@.time == '18:30')].status").value("AVAILABLE"));
    }

    @Test
    @DisplayName("Stylist hôm nay bị đánh dấu ABSENT (vắng mặt) thì tất cả slot bị chặn")
    void shouldBlockSlotWhenStylistIsAbsentToday() throws Exception {
        LocalDate today = LocalDate.now();

        StaffAttendanceEntity attendance = staffAttendanceRepository.findByUserIdAndAttendanceDateAndIsDeletedFalse(testStylist.getId(), today)
                .orElseGet(() -> StaffAttendanceEntity.builder()
                        .branch(testBranch)
                        .user(testStylist)
                        .attendanceDate(today)
                        .build());
        StaffAttendanceStatus prevStatus = attendance.getStatus();
        attendance.setStatus(StaffAttendanceStatus.ABSENT);
        staffAttendanceRepository.save(attendance);

        try {
            mockMvc.perform(get("/api/v1/bookings/available-slots")
                            .param("branchId", testBranch.getId().toString())
                            .param("date", today.toString())
                            .param("serviceIds", testService120m.getId().toString())
                            .param("stylistId", testStylist.getId().toString())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.result.slots[*].status", everyItem(not("AVAILABLE"))));
        } finally {
            attendance.setStatus(prevStatus != null ? prevStatus : StaffAttendanceStatus.PRESENT);
            staffAttendanceRepository.save(attendance);
        }
    }
}
