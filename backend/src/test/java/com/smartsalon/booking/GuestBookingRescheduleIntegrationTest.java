package com.smartsalon.booking;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsalon.booking.dto.GuestRescheduleRequest;
import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingServiceItemEntity;
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
import com.smartsalon.user.repository.RoleRepository;
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
import java.util.UUID;

import org.springframework.transaction.annotation.Transactional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
class GuestBookingRescheduleIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RedisLockService redisLockService;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private MockMvc mockMvc;
    private BranchEntity branch;
    private ServiceEntity service;
    private UserEntity stylistMinh;
    private UserEntity stylistLan;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        branch = branchRepository.findAllByIsDeletedFalseAndIsActiveTrue().stream()
                .findFirst()
                .orElseGet(() -> branchRepository.save(BranchEntity.builder()
                        .name("SmartSalon Flagship - Quận 1")
                        .address("123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh")
                        .phone("0901234567")
                        .isActive(true)
                        .build()));

        var stylistRole = roleRepository.findByName("STYLIST").orElseGet(() ->
                roleRepository.save(com.smartsalon.user.entity.RoleEntity.builder().name("STYLIST").description("Stylist").build()));

        List<ServiceEntity> activeServices = serviceRepository.findAllByIsDeletedFalseAndIsActiveTrue();
        service = !activeServices.isEmpty() ? activeServices.get(0) : serviceRepository.save(ServiceEntity.builder()
                .name("Combo Cắt Gội Massage")
                .category("Hair")
                .basePrice(new BigDecimal("250000.00"))
                .durationMinutes(60)
                .isActive(true)
                .build());

        stylistMinh = userRepository.findByUsernameAndIsDeletedFalse("stylist.guest.minh").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("stylist.guest.minh")
                        .passwordHash("hashed")
                        .fullName("Trần Minh Tuấn")
                        .phone("0911000011")
                        .email("minh.tuan.guest@smartsalon.vn")
                        .branch(branch)
                        .isActive(true)
                        .roles(java.util.Set.of(stylistRole))
                        .build()));

        stylistLan = userRepository.findByUsernameAndIsDeletedFalse("stylist.guest.lan").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("stylist.guest.lan")
                        .passwordHash("hashed")
                        .fullName("Lê Thị Lan")
                        .phone("0911000012")
                        .email("lan.le.guest@smartsalon.vn")
                        .branch(branch)
                        .isActive(true)
                        .roles(java.util.Set.of(stylistRole))
                        .build()));
    }

    private BookingEntity createGuestBooking(String phone, String name, UserEntity stylist, LocalDateTime bookingTime, int rescheduleCount, BookingStatus status) {
        String code = "BK-GUEST-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        int duration = 60;
        LocalDateTime endTime = bookingTime.plusMinutes(duration);
        BigDecimal totalPrice = new BigDecimal("250000.00");
        BigDecimal deposit = new BigDecimal("50000.00");

        var customerRole = roleRepository.findByName("CUSTOMER").orElseGet(() ->
                roleRepository.save(com.smartsalon.user.entity.RoleEntity.builder().name("CUSTOMER").description("Customer").build()));

        UserEntity guestUser = userRepository.findByPhoneAndIsDeletedFalse(phone).orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("provisional." + phone)
                        .passwordHash("hashed")
                        .fullName(name)
                        .phone(phone)
                        .email("guest." + phone + "@example.com")
                        .branch(branch)
                        .isActive(true)
                        .roles(java.util.Set.of(customerRole))
                        .build()));

        BookingEntity booking = BookingEntity.builder()
                .branch(branch)
                .customer(guestUser)
                .staff(stylist)
                .bookingCode(code)
                .bookingTime(bookingTime)
                .endTime(endTime)
                .totalDurationMinutes(duration)
                .totalPrice(totalPrice)
                .depositAmount(deposit)
                .depositStatus(DepositStatus.PAID)
                .status(status)
                .isStylistRequested(true)
                .customerName(name)
                .customerPhone(phone)
                .customerEmail("guest." + phone + "@example.com")
                .rescheduleCount(rescheduleCount)
                .build();

        booking.addItem(BookingServiceItemEntity.builder()
                .service(service)
                .price(totalPrice)
                .durationMinutes(duration)
                .build());

        return bookingRepository.save(booking);
    }

    @Test
    @DisplayName("Guest happy path: dời lịch thành công, bảo toàn tiền cọc, đổi slot lock Redis và tăng rescheduleCount")
    void guestHappyPath_shouldRescheduleSuccessfully() throws Exception {
        LocalDate date = LocalDate.now().plusDays(30);
        LocalDateTime originalStart = LocalDateTime.of(date, LocalTime.of(10, 0));
        LocalDateTime originalEnd = originalStart.plusMinutes(60);
        String guestPhone = "0944111222";

        BookingEntity booking = createGuestBooking(guestPhone, "Khách Vãng Lai A", stylistMinh, originalStart, 0, BookingStatus.CONFIRMED);

        // Pre-lock old slot
        redisLockService.tryLockSlots(stylistMinh.getId(), originalStart, originalEnd, booking.getBookingCode());
        assertThat(redisLockService.isAnySlotLocked(stylistMinh.getId(), originalStart, originalEnd)).isTrue();

        LocalDateTime newTime = LocalDateTime.of(date.plusDays(1), LocalTime.of(15, 0));
        LocalDateTime newEndTime = newTime.plusMinutes(60);

        GuestRescheduleRequest request = new GuestRescheduleRequest(guestPhone, booking.getBookingCode(), newTime, stylistLan.getId());

        mockMvc.perform(post("/api/v1/bookings/reschedule")
                        .with(req -> {
                            req.setRemoteAddr("192.168.1.10");
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.bookingCode", is(booking.getBookingCode())))
                .andExpect(jsonPath("$.result.stylistId", is(stylistLan.getId().intValue())))
                .andExpect(jsonPath("$.result.rescheduleCount", is(1)))
                .andExpect(jsonPath("$.result.depositAmount", is(50000.00)))
                .andExpect(jsonPath("$.result.depositStatus", is("PAID")));

        // Old slot unlocked, new slot locked
        assertThat(redisLockService.isAnySlotLocked(stylistMinh.getId(), originalStart, originalEnd)).isFalse();
        assertThat(redisLockService.isAnySlotLocked(stylistLan.getId(), newTime, newEndTime)).isTrue();
    }

    @Test
    @DisplayName("Sai số điện thoại hoặc sai mã booking -> trả về 404 BOOKING_NOT_FOUND đồng nhất, không rò rỉ thông tin")
    void wrongPhoneOrCode_shouldRejectWithNotFound() throws Exception {
        LocalDate date = LocalDate.now().plusDays(31);
        LocalDateTime originalStart = LocalDateTime.of(date, LocalTime.of(10, 0));
        String guestPhone = "0944222333";

        BookingEntity booking = createGuestBooking(guestPhone, "Khách Vãng Lai B", stylistMinh, originalStart, 0, BookingStatus.CONFIRMED);
        LocalDateTime newTime = LocalDateTime.of(date.plusDays(1), LocalTime.of(11, 0));

        // 1. Sai số điện thoại
        GuestRescheduleRequest wrongPhoneReq = new GuestRescheduleRequest("0999888777", booking.getBookingCode(), newTime, null);
        mockMvc.perform(post("/api/v1/bookings/reschedule")
                        .with(req -> {
                            req.setRemoteAddr("192.168.1.20");
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongPhoneReq)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code", is(2005)));

        // 2. Sai mã đặt hẹn
        GuestRescheduleRequest wrongCodeReq = new GuestRescheduleRequest(guestPhone, "BK-WRONG-CODE", newTime, null);
        mockMvc.perform(post("/api/v1/bookings/reschedule")
                        .with(req -> {
                            req.setRemoteAddr("192.168.1.21");
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongCodeReq)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code", is(2005)));
    }

    @Test
    @DisplayName("Rate limit: Quá 5 lần gửi yêu cầu dời lịch trong 10 phút từ cùng IP + Phone thì lần thứ 6 bị chặn với 429 TOO_MANY_REQUESTS")
    void rateLimit_allow5_reject6th() throws Exception {
        String testIp = "192.168.2.50";
        String testPhone = "0944333444";
        LocalDateTime newTime = LocalDateTime.of(LocalDate.now().plusDays(32), LocalTime.of(14, 0));
        GuestRescheduleRequest request = new GuestRescheduleRequest(testPhone, "BK-NONEXISTENT", newTime, null);

        // First 5 attempts (reach service and fail 404, but consume rate limit quota)
        for (int i = 1; i <= 5; i++) {
            mockMvc.perform(post("/api/v1/bookings/reschedule")
                            .with(req -> {
                                req.setRemoteAddr(testIp);
                                return req;
                            })
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound());
        }

        // 6th attempt must be rejected with 429 TOO_MANY_REQUESTS
        mockMvc.perform(post("/api/v1/bookings/reschedule")
                        .with(req -> {
                            req.setRemoteAddr(testIp);
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code", is(2013)))
                .andExpect(jsonPath("$.message", is("Quá nhiều yêu cầu, vui lòng thử lại sau.")));
    }

    @Test
    @DisplayName("Quy tắc Ticket-05: Dời lịch dưới 2 tiếng trước giờ hẹn ban đầu bị từ chối với 2014 RESCHEDULE_WINDOW_EXPIRED")
    void ticket05Rules_lessThan2Hours_shouldReject() throws Exception {
        // Booking starting in 30 minutes
        LocalDateTime originalStart = LocalDateTime.now().plusMinutes(30);
        String guestPhone = "0944555666";

        BookingEntity booking = createGuestBooking(guestPhone, "Khách C", stylistMinh, originalStart, 0, BookingStatus.CONFIRMED);
        LocalDateTime newTime = LocalDateTime.now().plusDays(2).with(LocalTime.of(14, 0));
        GuestRescheduleRequest request = new GuestRescheduleRequest(guestPhone, booking.getBookingCode(), newTime, null);

        mockMvc.perform(post("/api/v1/bookings/reschedule")
                        .with(req -> {
                            req.setRemoteAddr("192.168.3.10");
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is(2014)));
    }

    @Test
    @DisplayName("Quy tắc Ticket-05: Lịch hẹn đã dời lịch 1 lần trước đó (rescheduleCount=1) bị từ chối với 2015 BOOKING_ALREADY_RESCHEDULED")
    void ticket05Rules_alreadyRescheduled_shouldReject() throws Exception {
        LocalDate date = LocalDate.now().plusDays(33);
        LocalDateTime originalStart = LocalDateTime.of(date, LocalTime.of(10, 0));
        String guestPhone = "0944777888";

        BookingEntity booking = createGuestBooking(guestPhone, "Khách D", stylistMinh, originalStart, 1, BookingStatus.CONFIRMED);
        LocalDateTime newTime = LocalDateTime.of(date.plusDays(1), LocalTime.of(14, 0));
        GuestRescheduleRequest request = new GuestRescheduleRequest(guestPhone, booking.getBookingCode(), newTime, null);

        mockMvc.perform(post("/api/v1/bookings/reschedule")
                        .with(req -> {
                            req.setRemoteAddr("192.168.3.20");
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is(2015)));
    }
}
