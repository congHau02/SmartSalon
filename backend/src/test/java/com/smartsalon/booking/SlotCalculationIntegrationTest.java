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
}
