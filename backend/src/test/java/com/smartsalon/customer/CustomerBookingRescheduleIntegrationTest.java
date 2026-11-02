package com.smartsalon.customer;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import com.smartsalon.customer.dto.CustomerRescheduleRequest;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.notification.RecordingNotificationSender;
import com.smartsalon.shift.entity.StaffScheduleEntity;
import com.smartsalon.shift.entity.StaffScheduleStatus;
import com.smartsalon.shift.repository.StaffScheduleRepository;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
class CustomerBookingRescheduleIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.smartsalon.user.repository.RoleRepository roleRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private StaffScheduleRepository staffScheduleRepository;

    @Autowired
    private RedisLockService redisLockService;

    @Autowired
    private RecordingNotificationSender recordingSender;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private MockMvc mockMvc;
    private BranchEntity branch;
    private ServiceEntity service;
    private UserEntity custHa;
    private UserEntity custTri;
    private UserEntity stylistMinh;
    private UserEntity stylistLan;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        recordingSender.clear();

        branch = branchRepository.findAllByIsDeletedFalseAndIsActiveTrue().stream()
                .findFirst()
                .orElseGet(() -> branchRepository.save(BranchEntity.builder()
                        .name("SmartSalon Flagship - Quận 1")
                        .address("123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh")
                        .phone("0901234567")
                        .isActive(true)
                        .build()));

        var customerRole = roleRepository.findByName("CUSTOMER").orElseGet(() ->
                roleRepository.save(com.smartsalon.user.entity.RoleEntity.builder().name("CUSTOMER").description("Customer").build()));
        var stylistRole = roleRepository.findByName("STYLIST").orElseGet(() ->
                roleRepository.save(com.smartsalon.user.entity.RoleEntity.builder().name("STYLIST").description("Stylist").build()));

        List<ServiceEntity> activeServices = serviceRepository.findAllByIsDeletedFalseAndIsActiveTrue();
        service = activeServices.size() > 0 ? activeServices.get(0) : serviceRepository.save(ServiceEntity.builder()
                .name("Combo Cắt Gội Massage")
                .category("Hair")
                .basePrice(new BigDecimal("250000.00"))
                .durationMinutes(60)
                .isActive(true)
                .build());

        custHa = userRepository.findByUsernameAndIsDeletedFalse("cust.ha").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("cust.ha")
                        .passwordHash("hashed")
                        .fullName("Nguyễn Thu Hà")
                        .phone("0988111222")
                        .email("ha.nguyen@smartsalon.vn")
                        .branch(branch)
                        .isActive(true)
                        .roles(java.util.Set.of(customerRole))
                        .build()));

        custTri = userRepository.findByUsernameAndIsDeletedFalse("cust.tri").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("cust.tri")
                        .passwordHash("hashed")
                        .fullName("Trịnh Xuân Tri")
                        .phone("0902223344")
                        .email("tri.trinh@smartsalon.vn")
                        .branch(branch)
                        .isActive(true)
                        .roles(java.util.Set.of(customerRole))
                        .build()));

        stylistMinh = userRepository.findByUsernameAndIsDeletedFalse("stylist.minh").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("stylist.minh")
                        .passwordHash("hashed")
                        .fullName("Trần Minh Tuấn")
                        .phone("0911000001")
                        .email("minh.tuan@smartsalon.vn")
                        .branch(branch)
                        .isActive(true)
                        .roles(java.util.Set.of(stylistRole))
                        .build()));

        stylistLan = userRepository.findByUsernameAndIsDeletedFalse("stylist.lan").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("stylist.lan")
                        .passwordHash("hashed")
                        .fullName("Lê Thị Lan")
                        .phone("0911000002")
                        .email("lan.le@smartsalon.vn")
                        .branch(branch)
                        .isActive(true)
                        .roles(java.util.Set.of(stylistRole))
                        .build()));
    }

    private BookingEntity createConfirmedBooking(UserEntity customer, UserEntity stylist, LocalDateTime bookingTime, int rescheduleCount) {
        String code = "BK-TEST-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        int duration = 60;
        LocalDateTime endTime = bookingTime.plusMinutes(duration);
        BigDecimal totalPrice = new BigDecimal("250000.00");
        BigDecimal deposit = new BigDecimal("50000.00");

        BookingEntity booking = BookingEntity.builder()
                .branch(branch)
                .customer(customer)
                .staff(stylist)
                .bookingCode(code)
                .bookingTime(bookingTime)
                .endTime(endTime)
                .totalDurationMinutes(duration)
                .totalPrice(totalPrice)
                .depositAmount(deposit)
                .depositStatus(DepositStatus.PAID)
                .status(BookingStatus.CONFIRMED)
                .isStylistRequested(true)
                .customerName(customer.getFullName())
                .customerPhone(customer.getPhone())
                .customerEmail(customer.getEmail())
                .rescheduleCount(rescheduleCount)
                .build();

        booking.addItem(BookingServiceItemEntity.builder()
                .service(service)
                .price(totalPrice)
                .durationMinutes(duration)
                .build());

        return bookingRepository.save(booking);
    }

    private void awaitEmails(int expectedCount) throws InterruptedException {
        long deadline = System.currentTimeMillis() + 3000;
        while (System.currentTimeMillis() < deadline && recordingSender.getSentMessages().size() < expectedCount) {
            Thread.sleep(50);
        }
    }

    @Test
    @DisplayName("Happy path: deposit unchanged, old keys freed, new keys held, email recorded, broadcast sent")
    void happyPath_shouldRescheduleSuccessfully() throws Exception {
        LocalDate date = LocalDate.now().plusDays(25);
        LocalDateTime originalStart = LocalDateTime.of(date, LocalTime.of(10, 0));
        LocalDateTime originalEnd = originalStart.plusMinutes(60);

        BookingEntity booking = createConfirmedBooking(custHa, stylistMinh, originalStart, 0);

        // Pre-lock old keys in Redis to simulate holding previous slot
        redisLockService.tryLockSlots(stylistMinh.getId(), originalStart, originalEnd, booking.getBookingCode());
        assertThat(redisLockService.isAnySlotLocked(stylistMinh.getId(), originalStart, originalEnd)).isTrue();

        LocalDateTime newTime = LocalDateTime.of(date.plusDays(1), LocalTime.of(14, 0));
        LocalDateTime newEndTime = newTime.plusMinutes(60);

        CustomerRescheduleRequest request = new CustomerRescheduleRequest(newTime, stylistLan.getId());

        mockMvc.perform(post("/api/v1/customer/me/bookings/{bookingId}/reschedule", booking.getId())
                        .with(user("cust.ha").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.bookingCode").value(booking.getBookingCode()))
                .andExpect(jsonPath("$.result.stylistId").value(stylistLan.getId()))
                .andExpect(jsonPath("$.result.rescheduleCount").value(1))
                .andExpect(jsonPath("$.result.depositAmount").value(50000.00))
                .andExpect(jsonPath("$.result.depositStatus").value("PAID"));

        // Verify DB entity
        BookingEntity updated = bookingRepository.findById(booking.getId()).orElseThrow();
        assertThat(updated.getBookingTime()).isEqualTo(newTime);
        assertThat(updated.getEndTime()).isEqualTo(newEndTime);
        assertThat(updated.getStaff().getId()).isEqualTo(stylistLan.getId());
        assertThat(updated.getRescheduleCount()).isEqualTo(1);
        assertThat(updated.getReminderSentAt()).isNull();
        assertThat(updated.getDepositAmount()).isEqualByComparingTo("50000.00");

        // Verify old slot keys freed and new keys held
        assertThat(redisLockService.isAnySlotLocked(stylistMinh.getId(), originalStart, originalEnd)).isFalse();
        assertThat(redisLockService.isAnySlotLocked(stylistLan.getId(), newTime, newEndTime)).isTrue();

        // Await async email dispatch
        awaitEmails(1);

        // Verify reschedule confirmation email recorded
        assertThat(recordingSender.getSentMessages()).anySatisfy(msg -> {
            assertThat(msg.recipient()).isEqualTo(custHa.getEmail());
            assertThat(msg.subject()).contains("Dời lịch");
            assertThat(msg.htmlContent()).contains(booking.getBookingCode());
        });
    }

    @Test
    @DisplayName("Less than 2h before original booking time should fail with RESCHEDULE_WINDOW_EXPIRED")
    void lessThanTwoHours_shouldFail() throws Exception {
        LocalDateTime start = LocalDateTime.now().plusMinutes(90); // 1h30m ahead (< 2h)
        BookingEntity booking = createConfirmedBooking(custHa, stylistMinh, start, 0);

        LocalDateTime newTime = LocalDateTime.now().plusDays(26).withHour(10).withMinute(0);
        CustomerRescheduleRequest request = new CustomerRescheduleRequest(newTime, null);

        mockMvc.perform(post("/api/v1/customer/me/bookings/{bookingId}/reschedule", booking.getId())
                        .with(user("cust.ha").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ErrorCode.RESCHEDULE_WINDOW_EXPIRED.getCode()));
    }

    @Test
    @DisplayName("Second reschedule should fail with BOOKING_ALREADY_RESCHEDULED")
    void secondReschedule_shouldFail() throws Exception {
        LocalDateTime start = LocalDateTime.now().plusDays(27).withHour(10).withMinute(0);
        BookingEntity booking = createConfirmedBooking(custHa, stylistMinh, start, 1); // count = 1

        LocalDateTime newTime = LocalDateTime.now().plusDays(28).withHour(10).withMinute(0);
        CustomerRescheduleRequest request = new CustomerRescheduleRequest(newTime, null);

        mockMvc.perform(post("/api/v1/customer/me/bookings/{bookingId}/reschedule", booking.getId())
                        .with(user("cust.ha").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ErrorCode.BOOKING_ALREADY_RESCHEDULED.getCode()));
    }

    @Test
    @DisplayName("Non-CONFIRMED booking should fail with BOOKING_NOT_CONFIRMED")
    void nonConfirmedBooking_shouldFail() throws Exception {
        LocalDateTime start = LocalDateTime.now().plusDays(29).withHour(10).withMinute(0);
        BookingEntity booking = createConfirmedBooking(custHa, stylistMinh, start, 0);
        booking.setStatus(BookingStatus.PENDING_PAYMENT);
        bookingRepository.save(booking);

        LocalDateTime newTime = LocalDateTime.now().plusDays(30).withHour(10).withMinute(0);
        CustomerRescheduleRequest request = new CustomerRescheduleRequest(newTime, null);

        mockMvc.perform(post("/api/v1/customer/me/bookings/{bookingId}/reschedule", booking.getId())
                        .with(user("cust.ha").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ErrorCode.BOOKING_NOT_CONFIRMED.getCode()));
    }

    @Test
    @DisplayName("Slot taken: original booking and old locks remain untouched")
    void slotTaken_shouldPreserveOriginalBookingAndLocks() throws Exception {
        LocalDate date = LocalDate.now().plusDays(31);
        LocalDateTime originalStart = LocalDateTime.of(date, LocalTime.of(10, 0));
        LocalDateTime originalEnd = originalStart.plusMinutes(60);

        BookingEntity booking = createConfirmedBooking(custHa, stylistMinh, originalStart, 0);

        // Pre-lock old slot
        redisLockService.tryLockSlots(stylistMinh.getId(), originalStart, originalEnd, booking.getBookingCode());

        // Target new slot is already taken by another lock
        LocalDateTime newTime = LocalDateTime.of(date.plusDays(1), LocalTime.of(15, 0));
        LocalDateTime newEndTime = newTime.plusMinutes(60);
        redisLockService.tryLockSlots(stylistLan.getId(), newTime, newEndTime, "BK-OTHER-CLIENT");

        CustomerRescheduleRequest request = new CustomerRescheduleRequest(newTime, stylistLan.getId());

        mockMvc.perform(post("/api/v1/customer/me/bookings/{bookingId}/reschedule", booking.getId())
                        .with(user("cust.ha").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(ErrorCode.SLOT_NOT_AVAILABLE.getCode()));

        // Verify original booking is completely untouched
        BookingEntity untouched = bookingRepository.findById(booking.getId()).orElseThrow();
        assertThat(untouched.getBookingTime()).isEqualTo(originalStart);
        assertThat(untouched.getEndTime()).isEqualTo(originalEnd);
        assertThat(untouched.getStaff().getId()).isEqualTo(stylistMinh.getId());
        assertThat(untouched.getRescheduleCount()).isEqualTo(0);

        // Old lock must remain intact
        assertThat(redisLockService.isAnySlotLocked(stylistMinh.getId(), originalStart, originalEnd)).isTrue();
    }

    @Test
    @DisplayName("Off-shift stylist should fail with STYLIST_OFF_SHIFT")
    void offShiftStylist_shouldFail() throws Exception {
        LocalDate date = LocalDate.now().plusDays(33);
        LocalDateTime originalStart = LocalDateTime.of(date, LocalTime.of(10, 0));
        BookingEntity booking = createConfirmedBooking(custHa, stylistMinh, originalStart, 0);

        // Set stylistLan off for that target date
        LocalDate targetDate = date.plusDays(1);
        StaffScheduleEntity offSchedule = staffScheduleRepository.findByBranchIdAndScheduleDateAndIsDeletedFalse(branch.getId(), targetDate)
                .stream()
                .filter(s -> s.getUser() != null && s.getUser().getId().equals(stylistLan.getId()))
                .findFirst()
                .orElseGet(() -> StaffScheduleEntity.builder()
                        .branch(branch)
                        .user(stylistLan)
                        .scheduleDate(targetDate)
                        .build());
        offSchedule.setStatus(StaffScheduleStatus.OFF);
        offSchedule.setShiftTemplate(null);
        staffScheduleRepository.save(offSchedule);

        LocalDateTime newTime = LocalDateTime.of(targetDate, LocalTime.of(14, 0));
        CustomerRescheduleRequest request = new CustomerRescheduleRequest(newTime, stylistLan.getId());

        mockMvc.perform(post("/api/v1/customer/me/bookings/{bookingId}/reschedule", booking.getId())
                        .with(user("cust.ha").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ErrorCode.STYLIST_OFF_SHIFT.getCode()));
    }

    @Test
    @DisplayName("Another customer's booking should return 403 Forbidden")
    void anotherCustomerBooking_shouldReturnForbidden() throws Exception {
        LocalDateTime start = LocalDateTime.now().plusDays(35).withHour(10).withMinute(0);
        BookingEntity booking = createConfirmedBooking(custHa, stylistMinh, start, 0);

        LocalDateTime newTime = LocalDateTime.now().plusDays(36).withHour(10).withMinute(0);
        CustomerRescheduleRequest request = new CustomerRescheduleRequest(newTime, null);

        // Access with cust.tri instead of booking owner cust.ha
        mockMvc.perform(post("/api/v1/customer/me/bookings/{bookingId}/reschedule", booking.getId())
                        .with(user("cust.tri").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(ErrorCode.FORBIDDEN.getCode()));
    }
}
