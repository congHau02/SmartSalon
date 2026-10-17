package com.smartsalon.payment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsalon.booking.BookingMapper;
import com.smartsalon.booking.dto.BookingResponse;
import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.booking.service.RedisLockService;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.payment.dto.PayOSWebhookPayload;
import com.smartsalon.payment.dto.PaymentQrInfo;
import com.smartsalon.payment.entity.PaymentTransactionEntity;
import com.smartsalon.payment.repository.PaymentTransactionRepository;
import com.smartsalon.payment.service.impl.PayOSServiceImpl;
import com.smartsalon.user.entity.UserEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PayOSServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private RedisLockService redisLockService;

    private final BookingMapper bookingMapper = new BookingMapper();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private PayOSServiceImpl payOSService;

    private BranchEntity branch;
    private UserEntity stylist;
    private BookingEntity pendingBooking;

    @BeforeEach
    void setUp() {
        payOSService = new PayOSServiceImpl(
                bookingRepository,
                paymentTransactionRepository,
                redisLockService,
                bookingMapper
        );

        ReflectionTestUtils.setField(payOSService, "checksumKey", "test-checksum-key-12345");
        ReflectionTestUtils.setField(payOSService, "bankId", "MB");
        ReflectionTestUtils.setField(payOSService, "accountNo", "0988888888");
        ReflectionTestUtils.setField(payOSService, "accountName", "SMART SALON VIETNAM");

        branch = BranchEntity.builder()
                .name("Chi nhánh Quận 1")
                .build();
        branch.setId(1L);

        stylist = UserEntity.builder()
                .fullName("Stylist Tran Van B")
                .build();
        stylist.setId(10L);

        pendingBooking = BookingEntity.builder()
                .bookingCode("BK-20261017-TEST")
                .branch(branch)
                .staff(stylist)
                .customerName("Nguyen Van A")
                .customerPhone("0901234567")
                .bookingTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0))
                .endTime(LocalDateTime.now().plusDays(1).withHour(11).withMinute(0))
                .totalDurationMinutes(60)
                .totalPrice(new BigDecimal("500000"))
                .depositAmount(new BigDecimal("100000"))
                .depositStatus(DepositStatus.UNPAID)
                .status(BookingStatus.PENDING_PAYMENT)
                .slotLockExpiresAt(LocalDateTime.now().plusMinutes(5))
                .items(new ArrayList<>())
                .build();
        pendingBooking.setId(100L);
    }

    @Test
    @DisplayName("generateDepositPaymentInfo: Thành công tạo link VietQR với thông tin cọc chính xác")
    void generateDepositPaymentInfo_Success() {
        when(bookingRepository.findByBookingCodeAndIsDeletedFalse("BK-20261017-TEST"))
                .thenReturn(Optional.of(pendingBooking));
        when(paymentTransactionRepository.findFirstByBookingIdAndStatus(100L, "PENDING"))
                .thenReturn(Optional.empty());

        PaymentQrInfo info = payOSService.generateDepositPaymentInfo("BK-20261017-TEST");

        assertThat(info).isNotNull();
        assertThat(info.bookingCode()).isEqualTo("BK-20261017-TEST");
        assertThat(info.amount()).isEqualByComparingTo(new BigDecimal("100000"));
        assertThat(info.bankId()).isEqualTo("MB");
        assertThat(info.accountNo()).isEqualTo("0988888888");
        assertThat(info.accountName()).isEqualTo("SMART SALON VIETNAM");
        assertThat(info.qrCodeUrl()).contains("https://img.vietqr.io/image/MB-0988888888-compact2.png");
        assertThat(info.qrCodeUrl()).contains("amount=100000");
        assertThat(info.qrCodeUrl()).contains("addInfo=BK-20261017-TEST");

        verify(paymentTransactionRepository, times(1)).save(any(PaymentTransactionEntity.class));
    }

    @Test
    @DisplayName("generateDepositPaymentInfo: Lịch hẹn hết hạn giữ chỗ ném AppException BOOKING_EXPIRED")
    void generateDepositPaymentInfo_Expired() {
        pendingBooking.setSlotLockExpiresAt(LocalDateTime.now().minusMinutes(1));

        when(bookingRepository.findByBookingCodeAndIsDeletedFalse("BK-20261017-TEST"))
                .thenReturn(Optional.of(pendingBooking));

        assertThatThrownBy(() -> payOSService.generateDepositPaymentInfo("BK-20261017-TEST"))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BOOKING_EXPIRED);

        verify(redisLockService, times(1)).unlockSlots(eq(10L), any(), any());
        assertThat(pendingBooking.getStatus()).isEqualTo(BookingStatus.EXPIRED);
    }

    @Test
    @DisplayName("verifyWebhookSignature: Xác thực chữ ký HMAC-SHA256 đúng chuẩn data a-z")
    void verifyWebhookSignature_Correct() {
        PayOSWebhookPayload.PayOSWebhookData data = new PayOSWebhookPayload.PayOSWebhookData(
                123456L,
                100000L,
                "BK-20261017-TEST",
                "0988888888",
                "REF98765",
                "2026-10-17 10:00:00",
                "VND",
                "pl_123",
                "00",
                "Success"
        );

        String sortedDataString = payOSService.buildDataSortedString(data);
        String validSignature = PayOSServiceImpl.hmacSha256(sortedDataString, "test-checksum-key-12345");

        PayOSWebhookPayload payload = new PayOSWebhookPayload("00", "Success", data, validSignature);

        boolean isValid = payOSService.verifyWebhookSignature(payload, "test-checksum-key-12345");
        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("processPayOSWebhook: Xử lý webhook thành công, chuyển CONFIRMED, giải phóng Redis lock")
    void processPayOSWebhook_Success() {
        PayOSWebhookPayload.PayOSWebhookData data = new PayOSWebhookPayload.PayOSWebhookData(
                123456L,
                100000L,
                "BK-20261017-TEST",
                "0988888888",
                "REF98765",
                "2026-10-17 10:00:00",
                "VND",
                "pl_123",
                "00",
                "Success"
        );
        String sortedDataString = payOSService.buildDataSortedString(data);
        String signature = PayOSServiceImpl.hmacSha256(sortedDataString, "test-checksum-key-12345");
        PayOSWebhookPayload payload = new PayOSWebhookPayload("00", "Success", data, signature);

        when(bookingRepository.findByBookingCodeAndIsDeletedFalse("BK-20261017-TEST"))
                .thenReturn(Optional.of(pendingBooking));
        when(bookingRepository.save(any(BookingEntity.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        BookingResponse response = payOSService.processPayOSWebhook(payload);

        assertThat(response).isNotNull();
        assertThat(response.status()).isEqualTo(BookingStatus.CONFIRMED);
        assertThat(response.depositStatus()).isEqualTo(DepositStatus.PAID);
        assertThat(response.slotLockExpiresAt()).isNull();

        verify(redisLockService, times(1)).unlockSlots(eq(10L), any(), any());
        verify(paymentTransactionRepository, times(1)).save(any(PaymentTransactionEntity.class));
    }

    @Test
    @DisplayName("processPayOSWebhook: Chữ ký không hợp lệ ném AppException INVALID_PAYMENT_SIGNATURE")
    void processPayOSWebhook_InvalidSignature() {
        PayOSWebhookPayload.PayOSWebhookData data = new PayOSWebhookPayload.PayOSWebhookData(
                123456L,
                100000L,
                "BK-20261017-TEST",
                "0988888888",
                "REF98765",
                "2026-10-17 10:00:00",
                "VND",
                "pl_123",
                "00",
                "Success"
        );
        PayOSWebhookPayload payload = new PayOSWebhookPayload("00", "Success", data, "invalid-signature");

        assertThatThrownBy(() -> payOSService.processPayOSWebhook(payload))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PAYMENT_SIGNATURE);

        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("processPayOSWebhook: Idempotent khi lịch hẹn đã ở trạng thái CONFIRMED")
    void processPayOSWebhook_Idempotent() {
        pendingBooking.setStatus(BookingStatus.CONFIRMED);
        pendingBooking.setDepositStatus(DepositStatus.PAID);

        PayOSWebhookPayload.PayOSWebhookData data = new PayOSWebhookPayload.PayOSWebhookData(
                123456L,
                100000L,
                "BK-20261017-TEST",
                "0988888888",
                "REF98765",
                "2026-10-17 10:00:00",
                "VND",
                "pl_123",
                "00",
                "Success"
        );
        String sortedDataString = payOSService.buildDataSortedString(data);
        String signature = PayOSServiceImpl.hmacSha256(sortedDataString, "test-checksum-key-12345");
        PayOSWebhookPayload payload = new PayOSWebhookPayload("00", "Success", data, signature);

        when(bookingRepository.findByBookingCodeAndIsDeletedFalse("BK-20261017-TEST"))
                .thenReturn(Optional.of(pendingBooking));

        BookingResponse response = payOSService.processPayOSWebhook(payload);

        assertThat(response.status()).isEqualTo(BookingStatus.CONFIRMED);
        verify(bookingRepository, never()).save(any());
        verify(redisLockService, never()).unlockSlots(any(), any(), any());
    }

    @Test
    @DisplayName("simulatePaymentSuccess: Mô phỏng sandbox một chạm chuyển CONFIRMED và lưu audit log")
    void simulatePaymentSuccess_Success() {
        when(bookingRepository.findByBookingCodeAndIsDeletedFalse("BK-20261017-TEST"))
                .thenReturn(Optional.of(pendingBooking));
        when(bookingRepository.save(any(BookingEntity.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        BookingResponse response = payOSService.simulatePaymentSuccess("BK-20261017-TEST");

        assertThat(response).isNotNull();
        assertThat(response.status()).isEqualTo(BookingStatus.CONFIRMED);
        assertThat(response.depositStatus()).isEqualTo(DepositStatus.PAID);
        assertThat(response.slotLockExpiresAt()).isNull();

        verify(redisLockService, times(1)).unlockSlots(eq(10L), any(), any());
        verify(paymentTransactionRepository, times(1)).save(argThat(tx ->
                "SUCCESS".equals(tx.getStatus()) && "PAYOS_SIMULATED".equals(tx.getPaymentMethod())
        ));
    }
}
