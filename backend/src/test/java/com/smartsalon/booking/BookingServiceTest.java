package com.smartsalon.booking;

import com.smartsalon.booking.dto.BookingResponse;
import com.smartsalon.booking.dto.CreateBookingRequest;
import com.smartsalon.booking.dto.UpdateBookingStatusRequest;
import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.booking.service.RedisLockService;
import com.smartsalon.booking.service.impl.BookingServiceImpl;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.user.entity.RoleEntity;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.RoleRepository;
import com.smartsalon.user.repository.UserRepository;
import com.smartsalon.payment.entity.PaymentTransactionEntity;
import com.smartsalon.payment.repository.PaymentTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private BranchRepository branchRepository;

    @Mock
    private ServiceRepository serviceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RedisLockService redisLockService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Spy
    private BookingMapper bookingMapper = new BookingMapper();

    @InjectMocks
    private BookingServiceImpl bookingService;

    private BranchEntity branch;
    private ServiceEntity service60m;
    private UserEntity stylist;
    private RoleEntity stylistRole;
    private RoleEntity customerRole;

    @BeforeEach
    void setUp() {
        branch = BranchEntity.builder()
                .name("SmartSalon Quận 1")
                .address("123 Nguyễn Huệ")
                .isActive(true)
                .build();
        branch.setId(1L);

        service60m = ServiceEntity.builder()
                .name("Cắt Tóc VIP & Gội Massage")
                .category("Hair")
                .basePrice(new BigDecimal("200000.00"))
                .durationMinutes(60)
                .isActive(true)
                .build();
        service60m.setId(10L);

        stylistRole = RoleEntity.builder().name("STYLIST").build();
        customerRole = RoleEntity.builder().name("CUSTOMER").build();

        stylist = UserEntity.builder()
                .username("minh.stylist")
                .fullName("Nguyễn Văn Minh")
                .phone("0900000001")
                .branch(branch)
                .isActive(true)
                .roles(new HashSet<>(Set.of(stylistRole)))
                .build();
        stylist.setId(20L);
    }

    @Test
    @DisplayName("Giữ chỗ thành công với Stylist chỉ định: Khóa Redis 5 phút, cọc 20%, trạng thái PENDING_PAYMENT")
    void holdSlotAndCreate_explicitStylist_success() {
        LocalDateTime bookingTime = LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(9, 0));
        CreateBookingRequest request = new CreateBookingRequest(
                1L, 20L, List.of(10L), bookingTime,
                "Nguyễn Khách Hàng", "0988776655", "Yêu cầu kỹ"
        );

        when(branchRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(branch));
        when(serviceRepository.findAllById(List.of(10L))).thenReturn(List.of(service60m));
        when(bookingRepository.findByBookingCodeAndIsDeletedFalse(anyString())).thenReturn(Optional.empty());
        when(userRepository.findById(20L)).thenReturn(Optional.of(stylist));
        when(bookingRepository.findOverlappingBookingsForStylist(eq(20L), any(), any(), any())).thenReturn(List.of());
        when(redisLockService.tryLockSlots(eq(20L), any(), any(), anyString())).thenReturn(true);
        when(userRepository.findByPhoneAndIsDeletedFalse("0988776655")).thenReturn(Optional.empty());
        when(userRepository.existsByUsername("0988776655")).thenReturn(false);
        when(roleRepository.findByName("CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_pwd");

        UserEntity createdGuest = UserEntity.builder()
                .username("0988776655")
                .fullName("Nguyễn Khách Hàng")
                .phone("0988776655")
                .build();
        createdGuest.setId(100L);
        when(userRepository.save(any(UserEntity.class))).thenReturn(createdGuest);

        when(bookingRepository.save(any(BookingEntity.class))).thenAnswer(invocation -> {
            BookingEntity b = invocation.getArgument(0);
            b.setId(500L);
            return b;
        });

        BookingResponse response = bookingService.holdSlotAndCreate(request);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(500L);
        assertThat(response.bookingCode()).startsWith("BK-");
        assertThat(response.branchId()).isEqualTo(1L);
        assertThat(response.stylistId()).isEqualTo(20L);
        assertThat(response.totalDurationMinutes()).isEqualTo(60);
        assertThat(response.totalPrice()).isEqualByComparingTo("200000.00");
        assertThat(response.depositAmount()).isEqualByComparingTo("40000.00"); // 20% of 200,000
        assertThat(response.status()).isEqualTo(BookingStatus.PENDING_PAYMENT);
        assertThat(response.depositStatus()).isEqualTo(DepositStatus.UNPAID);
        assertThat(response.slotLockExpiresAt()).isAfter(LocalDateTime.now());
        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).serviceName()).isEqualTo("Cắt Tóc VIP & Gội Massage");

        verify(redisLockService, times(1)).tryLockSlots(eq(20L), eq(bookingTime), eq(bookingTime.plusMinutes(60)), anyString());
        verify(paymentTransactionRepository, times(1)).save(any(PaymentTransactionEntity.class));
    }

    @Test
    @DisplayName("Ném ngoại lệ SLOT_ALREADY_LOCKED khi khung giờ đang có người giữ chỗ trên Redis")
    void holdSlotAndCreate_slotLockedInRedis_throwsException() {
        LocalDateTime bookingTime = LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(10, 0));
        CreateBookingRequest request = new CreateBookingRequest(
                1L, 20L, List.of(10L), bookingTime,
                "Khách Hai", "0911223344", null
        );

        when(branchRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(branch));
        when(serviceRepository.findAllById(List.of(10L))).thenReturn(List.of(service60m));
        when(bookingRepository.findByBookingCodeAndIsDeletedFalse(anyString())).thenReturn(Optional.empty());
        when(userRepository.findById(20L)).thenReturn(Optional.of(stylist));
        when(bookingRepository.findOverlappingBookingsForStylist(eq(20L), any(), any(), any())).thenReturn(List.of());
        when(redisLockService.tryLockSlots(eq(20L), any(), any(), anyString())).thenReturn(false);

        assertThatThrownBy(() -> bookingService.holdSlotAndCreate(request))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.SLOT_ALREADY_LOCKED);
    }

    @Test
    @DisplayName("Ném ngoại lệ SLOT_NOT_AVAILABLE khi khung giờ trùng lịch hẹn đã xác nhận trong DB")
    void holdSlotAndCreate_slotOverlapsInDb_throwsException() {
        LocalDateTime bookingTime = LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(10, 0));
        CreateBookingRequest request = new CreateBookingRequest(
                1L, 20L, List.of(10L), bookingTime,
                "Khách Ba", "0911223355", null
        );

        when(branchRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(branch));
        when(serviceRepository.findAllById(List.of(10L))).thenReturn(List.of(service60m));
        when(bookingRepository.findByBookingCodeAndIsDeletedFalse(anyString())).thenReturn(Optional.empty());
        when(userRepository.findById(20L)).thenReturn(Optional.of(stylist));

        BookingEntity existingOverlap = BookingEntity.builder()
                .status(BookingStatus.CONFIRMED)
                .bookingTime(bookingTime)
                .endTime(bookingTime.plusMinutes(60))
                .build();
        when(bookingRepository.findOverlappingBookingsForStylist(eq(20L), any(), any(), any()))
                .thenReturn(List.of(existingOverlap));

        assertThatThrownBy(() -> bookingService.holdSlotAndCreate(request))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.SLOT_NOT_AVAILABLE);

        verify(redisLockService, never()).tryLockSlots(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Bất kỳ Stylist nào (stylistId=null): Tự động phân bổ Stylist có ít tải nhất trong ngày")
    void holdSlotAndCreate_anyStylist_selectsLeastWorkloadStylist() {
        LocalDateTime bookingTime = LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(14, 0));
        CreateBookingRequest request = new CreateBookingRequest(
                1L, null, List.of(10L), bookingTime,
                "Khách Tự Động", "0933445566", null
        );

        UserEntity stylistB = UserEntity.builder()
                .username("lan.stylist")
                .fullName("Trần Thị Lan")
                .phone("0900000002")
                .branch(branch)
                .isActive(true)
                .roles(new HashSet<>(Set.of(stylistRole)))
                .build();
        stylistB.setId(21L);

        when(branchRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(branch));
        when(serviceRepository.findAllById(List.of(10L))).thenReturn(List.of(service60m));
        when(bookingRepository.findByBookingCodeAndIsDeletedFalse(anyString())).thenReturn(Optional.empty());
        when(userRepository.findActiveStylistsByBranchId(1L)).thenReturn(List.of(stylist, stylistB));

        // Both stylists free of overlap and not locked
        when(bookingRepository.findOverlappingBookingsForStylist(eq(20L), any(), any(), any())).thenReturn(List.of());
        when(bookingRepository.findOverlappingBookingsForStylist(eq(21L), any(), any(), any())).thenReturn(List.of());
        when(redisLockService.isAnySlotLocked(eq(20L), any(), any())).thenReturn(false);
        when(redisLockService.isAnySlotLocked(eq(21L), any(), any())).thenReturn(false);

        // Stylist 20L already has 120 minutes booked, Stylist 21L has 0 minutes booked
        BookingEntity existingBookingStylistA = BookingEntity.builder()
                .staff(stylist)
                .totalDurationMinutes(120)
                .build();
        when(bookingRepository.findActiveBookingsByBranchAndDay(eq(1L), any(), any(), any()))
                .thenReturn(List.of(existingBookingStylistA));

        // Redis lock succeeds on Stylist 21L (least loaded)
        when(redisLockService.tryLockSlots(eq(21L), any(), any(), anyString())).thenReturn(true);

        UserEntity existingCustomer = UserEntity.builder()
                .username("0933445566")
                .fullName("Khách Tự Động")
                .phone("0933445566")
                .build();
        existingCustomer.setId(99L);
        when(userRepository.findByPhoneAndIsDeletedFalse("0933445566")).thenReturn(Optional.of(existingCustomer));

        when(bookingRepository.save(any(BookingEntity.class))).thenAnswer(invocation -> {
            BookingEntity b = invocation.getArgument(0);
            b.setId(600L);
            return b;
        });

        BookingResponse response = bookingService.holdSlotAndCreate(request);

        assertThat(response).isNotNull();
        assertThat(response.stylistId()).isEqualTo(21L); // Assigned to stylist B!
        verify(redisLockService, times(1)).tryLockSlots(eq(21L), any(), any(), anyString());
        verify(redisLockService, never()).tryLockSlots(eq(20L), any(), any(), anyString());
    }

    @Test
    @DisplayName("Hủy lịch giữ chỗ (CANCELLED) phải mở khóa Redis ngay lập tức")
    void updateBookingStatus_cancelled_unlocksRedisSlots() {
        LocalDateTime bookingTime = LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(11, 0));
        BookingEntity booking = BookingEntity.builder()
                .branch(branch)
                .staff(stylist)
                .bookingTime(bookingTime)
                .endTime(bookingTime.plusMinutes(60))
                .status(BookingStatus.PENDING_PAYMENT)
                .build();
        booking.setId(700L);

        when(bookingRepository.findById(700L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(BookingEntity.class))).thenReturn(booking);

        UpdateBookingStatusRequest req = new UpdateBookingStatusRequest(BookingStatus.CANCELLED, "Khách bận");
        BookingResponse res = bookingService.updateBookingStatus(700L, req);

        assertThat(res.status()).isEqualTo(BookingStatus.CANCELLED);
        verify(redisLockService, times(1)).unlockSlots(eq(20L), eq(bookingTime), eq(bookingTime.plusMinutes(60)));
    }

    @Test
    @DisplayName("Chuyển trạng thái sang CONFIRMED từ PENDING_PAYMENT phải mở khóa Redis và đặt cọc PAID")
    void updateBookingStatus_pendingToConfirmed_unlocksRedisAndSetsDepositPaid() {
        LocalDateTime bookingTime = LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(14, 0));
        BookingEntity booking = BookingEntity.builder()
                .branch(branch)
                .staff(stylist)
                .bookingTime(bookingTime)
                .endTime(bookingTime.plusMinutes(60))
                .status(BookingStatus.PENDING_PAYMENT)
                .depositStatus(DepositStatus.UNPAID)
                .slotLockExpiresAt(LocalDateTime.now().plusMinutes(5))
                .build();
        booking.setId(750L);

        when(bookingRepository.findById(750L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(BookingEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateBookingStatusRequest req = new UpdateBookingStatusRequest(BookingStatus.CONFIRMED, "Admin xác nhận cọc tiền mặt");
        BookingResponse res = bookingService.updateBookingStatus(750L, req);

        assertThat(res.status()).isEqualTo(BookingStatus.CONFIRMED);
        assertThat(res.depositStatus()).isEqualTo(DepositStatus.PAID);
        assertThat(res.slotLockExpiresAt()).isNull();
        verify(redisLockService, times(1)).unlockSlots(eq(20L), eq(bookingTime), eq(bookingTime.plusMinutes(60)));
    }

    @Test
    @DisplayName("Ném ngoại lệ SLOT_NOT_AVAILABLE khi thời gian hẹn ở quá khứ")
    void holdSlotAndCreate_pastBookingTime_throwsException() {
        LocalDateTime pastBookingTime = LocalDateTime.now().minusHours(2);
        CreateBookingRequest request = new CreateBookingRequest(
                1L, 20L, List.of(10L), pastBookingTime,
                "Khách Quá Khứ", "0911223399", null
        );

        when(branchRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(branch));
        when(serviceRepository.findAllById(List.of(10L))).thenReturn(List.of(service60m));

        assertThatThrownBy(() -> bookingService.holdSlotAndCreate(request))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.SLOT_NOT_AVAILABLE);
    }

    @Test
    @DisplayName("Ném ngoại lệ VALIDATION_ERROR khi chuyển trạng thái lịch hẹn không hợp lệ (CANCELLED -> CONFIRMED)")
    void updateBookingStatus_invalidTransition_throwsException() {
        BookingEntity booking = BookingEntity.builder()
                .branch(branch)
                .staff(stylist)
                .status(BookingStatus.CANCELLED)
                .build();
        booking.setId(800L);

        when(bookingRepository.findById(800L)).thenReturn(Optional.of(booking));

        UpdateBookingStatusRequest req = new UpdateBookingStatusRequest(BookingStatus.CONFIRMED, null);
        assertThatThrownBy(() -> bookingService.updateBookingStatus(800L, req))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.VALIDATION_ERROR);
    }
}
