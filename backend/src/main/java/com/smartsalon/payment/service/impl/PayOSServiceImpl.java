package com.smartsalon.payment.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsalon.booking.BookingMapper;
import com.smartsalon.booking.dto.BookingResponse;
import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.booking.service.RedisLockService;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.payment.dto.PayOSWebhookPayload;
import com.smartsalon.payment.dto.PaymentQrInfo;
import com.smartsalon.payment.entity.PaymentTransactionEntity;
import com.smartsalon.payment.repository.PaymentTransactionRepository;
import com.smartsalon.payment.service.PayOSService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class PayOSServiceImpl implements PayOSService {

    private static final Pattern BOOKING_CODE_PATTERN = Pattern.compile("BK-\\d{8}-[A-Za-z0-9]{4}");

    private final BookingRepository bookingRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final RedisLockService redisLockService;
    private final BookingMapper bookingMapper;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;
    private final com.smartsalon.realtime.service.RealtimeNotificationService realtimeNotificationService;

    @Value("${app.payos.client-id:}")
    private String clientId;

    @Value("${app.payos.api-key:}")
    private String apiKey;

    @Value("${app.payos.checksum-key:}")
    private String checksumKey;

    @Value("${app.payos.bank-id:MB}")
    private String bankId;

    @Value("${app.payos.account-no:0988888888}")
    private String accountNo;

    @Value("${app.payos.account-name:SMART SALON VIETNAM}")
    private String accountName;

    @Value("${app.payos.return-url:http://localhost:5173/customer/booking?step=4}")
    private String returnUrl;

    @Value("${app.payos.cancel-url:http://localhost:5173/customer/booking?step=4}")
    private String cancelUrl;

    @Value("${app.payos.simulation-enabled:true}")
    private boolean simulationEnabled;

    public PayOSServiceImpl(
            BookingRepository bookingRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            RedisLockService redisLockService,
            BookingMapper bookingMapper
    ) {
        this(bookingRepository, paymentTransactionRepository, redisLockService, bookingMapper, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public PayOSServiceImpl(
            BookingRepository bookingRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            RedisLockService redisLockService,
            BookingMapper bookingMapper,
            com.smartsalon.realtime.service.RealtimeNotificationService realtimeNotificationService
    ) {
        this.bookingRepository = bookingRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.redisLockService = redisLockService;
        this.bookingMapper = bookingMapper;
        this.realtimeNotificationService = realtimeNotificationService;
        this.objectMapper = new ObjectMapper().findAndRegisterModules();
        this.restClient = RestClient.builder()
                .baseUrl("https://api-merchant.payos.vn")
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PaymentQrInfo generateDepositPaymentInfo(String bookingCode) {
        BookingEntity booking = bookingRepository.findByBookingCodeAndIsDeletedFalse(bookingCode)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        if (booking.getStatus() == BookingStatus.EXPIRED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
        }

        if (booking.getStatus() == BookingStatus.PENDING_PAYMENT
                && booking.getSlotLockExpiresAt() != null
                && booking.getSlotLockExpiresAt().isBefore(LocalDateTime.now())) {
            booking.setStatus(BookingStatus.EXPIRED);
            bookingRepository.save(booking);
            if (booking.getStaff() != null) {
                redisLockService.unlockSlots(booking.getStaff().getId(), booking.getBookingTime(), booking.getEndTime());
            }
            throw new AppException(ErrorCode.BOOKING_EXPIRED);
        }

        BigDecimal depositAmount = booking.getDepositAmount();
        String description = booking.getBookingCode();
        String encodedAccountName = URLEncoder.encode(accountName, StandardCharsets.UTF_8);
        String vietQrUrl = String.format(
                "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%d&addInfo=%s&accountName=%s",
                bankId,
                accountNo,
                depositAmount.longValue(),
                description,
                encodedAccountName
        );

        String paymentUrl = vietQrUrl;
        String qrCodeUrl = vietQrUrl;
        long orderCode = Math.abs(booking.getBookingCode().hashCode()) + (System.currentTimeMillis() % 1000000L);

        // Attempt PayOS payment link creation if live credentials configured
        if (StringUtils.hasText(clientId) && StringUtils.hasText(apiKey) && StringUtils.hasText(checksumKey)) {
            try {
                Map<String, Object> reqData = new HashMap<>();
                reqData.put("orderCode", orderCode);
                reqData.put("amount", depositAmount.longValue());
                reqData.put("description", description);
                reqData.put("cancelUrl", cancelUrl);
                reqData.put("returnUrl", returnUrl);

                String signData = String.format(
                        "amount=%d&cancelUrl=%s&description=%s&orderCode=%d&returnUrl=%s",
                        depositAmount.longValue(), cancelUrl, description, orderCode, returnUrl
                );
                String signature = hmacSha256(signData, checksumKey);
                reqData.put("signature", signature);

                @SuppressWarnings("unchecked")
                Map<String, Object> response = restClient.post()
                        .uri("/v2/payment-requests")
                        .header("x-client-id", clientId)
                        .header("x-api-key", apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(reqData)
                        .retrieve()
                        .body(Map.class);

                if (response != null && "00".equals(response.get("code"))) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> data = (Map<String, Object>) response.get("data");
                    if (data != null) {
                        if (data.get("checkoutUrl") != null) {
                            paymentUrl = (String) data.get("checkoutUrl");
                        }
                        if (data.get("qrCode") != null) {
                            qrCodeUrl = (String) data.get("qrCode");
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("PayOS payment link creation request failed ({}), falling back to VietQR standard QR: {}",
                        ex.getClass().getSimpleName(), ex.getMessage());
            }
        }

        // Ensure PENDING transaction exists with orderCode matching transactionCode
        PaymentTransactionEntity tx = paymentTransactionRepository.findFirstByBookingIdAndStatus(booking.getId(), PaymentTransactionEntity.STATUS_PENDING)
                .orElseGet(() -> PaymentTransactionEntity.builder()
                        .booking(booking)
                        .orderId(null)
                        .amount(depositAmount)
                        .status(PaymentTransactionEntity.STATUS_PENDING)
                        .build());
        tx.setPaymentMethod(PaymentTransactionEntity.METHOD_PAYOS_VIETQR);
        tx.setTransactionCode("TX-" + orderCode);
        paymentTransactionRepository.save(tx);

        return new PaymentQrInfo(
                booking.getBookingCode(),
                depositAmount,
                bankId,
                accountNo,
                accountName,
                qrCodeUrl,
                paymentUrl,
                description,
                booking.getSlotLockExpiresAt()
        );
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingResponse processPayOSWebhook(PayOSWebhookPayload payload) {
        if (payload == null || payload.data() == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        // 1. Verify PayOS transaction success code "00"
        if (payload.code() != null && !"00".equals(payload.code())) {
            log.warn("PayOS webhook reported non-success code: {}. Payload: {}", payload.code(), payload);
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        // 2. Verify signature if checksumKey is configured, or check simulation allowance
        if (StringUtils.hasText(checksumKey)) {
            boolean valid = verifyWebhookSignature(payload, checksumKey);
            if (!valid) {
                log.error("PayOS webhook signature verification failed for payload: {}", payload);
                throw new AppException(ErrorCode.INVALID_PAYMENT_SIGNATURE);
            }
        } else if (!simulationEnabled) {
            log.error("PayOS checksum-key not configured in non-simulation environment");
            throw new AppException(ErrorCode.INVALID_PAYMENT_SIGNATURE);
        } else {
            log.warn("PayOS checksum-key not configured. Webhook signature verification bypassed for local/dev.");
        }

        String bookingCode = extractBookingCode(payload.data().description());
        BookingEntity booking = null;

        if (bookingCode != null) {
            booking = bookingRepository.findByBookingCodeAndIsDeletedFalse(bookingCode).orElse(null);
        }

        if (booking == null && payload.data().orderCode() != null) {
            Optional<PaymentTransactionEntity> matchedTx = paymentTransactionRepository.findByTransactionCode("TX-" + payload.data().orderCode());
            if (matchedTx.isPresent()) {
                booking = matchedTx.get().getBooking();
            }
        }

        if (booking == null) {
            log.error("PayOS webhook cannot match booking for payload description: {}", payload.data().description());
            throw new AppException(ErrorCode.BOOKING_NOT_FOUND);
        }

        // Idempotency: if already confirmed, return current state
        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            log.info("Booking {} already CONFIRMED. Skipping duplicate PayOS webhook execution.", booking.getBookingCode());
            return bookingMapper.toResponse(booking);
        }

        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
        }

        // 3. Verify payment amount covers required deposit
        if (payload.data().amount() != null
                && BigDecimal.valueOf(payload.data().amount()).compareTo(booking.getDepositAmount()) < 0) {
            log.error("PayOS webhook payment amount {} is less than required deposit {}",
                    payload.data().amount(), booking.getDepositAmount());
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        // Transition booking to CONFIRMED and release Redis slot lock
        final BookingEntity confirmedBooking = confirmBookingAndReleaseLock(booking);

        // Record or update transaction audit log
        PaymentTransactionEntity transaction = paymentTransactionRepository
                .findFirstByBookingIdAndStatus(confirmedBooking.getId(), PaymentTransactionEntity.STATUS_PENDING)
                .orElseGet(() -> PaymentTransactionEntity.builder()
                        .booking(confirmedBooking)
                        .orderId(null)
                        .paymentMethod(PaymentTransactionEntity.METHOD_PAYOS_VIETQR)
                        .amount(confirmedBooking.getDepositAmount())
                        .build());

        transaction.setStatus(PaymentTransactionEntity.STATUS_SUCCESS);
        if (payload.data().reference() != null) {
            transaction.setTransactionCode("PAYOS-" + payload.data().reference());
        } else if (transaction.getTransactionCode() == null) {
            transaction.setTransactionCode("TX-" + confirmedBooking.getBookingCode() + "-" + System.currentTimeMillis());
        }

        try {
            transaction.setPayloadWebhook(objectMapper.writeValueAsString(payload));
        } catch (Exception ex) {
            log.warn("Failed to serialize webhook payload: {}", ex.getMessage());
            transaction.setPayloadWebhook("{}");
        }
        paymentTransactionRepository.save(transaction);

        log.info("Booking {} successfully CONFIRMED via PayOS webhook. Deposit: {}", confirmedBooking.getBookingCode(), confirmedBooking.getDepositAmount());
        if (realtimeNotificationService != null) {
            realtimeNotificationService.notifyBookingConfirmed(confirmedBooking);
        }
        return bookingMapper.toResponse(confirmedBooking);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingResponse simulatePaymentSuccess(String bookingCode) {
        BookingEntity booking = bookingRepository.findByBookingCodeAndIsDeletedFalse(bookingCode)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            log.info("Booking {} already CONFIRMED. Skipping duplicate simulation.", bookingCode);
            return bookingMapper.toResponse(booking);
        }

        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
        }

        if (booking.getSlotLockExpiresAt() != null && booking.getSlotLockExpiresAt().isBefore(LocalDateTime.now())) {
            booking.setStatus(BookingStatus.EXPIRED);
            bookingRepository.save(booking);
            if (booking.getStaff() != null) {
                redisLockService.unlockSlots(booking.getStaff().getId(), booking.getBookingTime(), booking.getEndTime());
            }
            throw new AppException(ErrorCode.BOOKING_EXPIRED);
        }

        final BookingEntity confirmedBooking = confirmBookingAndReleaseLock(booking);

        PaymentTransactionEntity transaction = paymentTransactionRepository
                .findFirstByBookingIdAndStatus(confirmedBooking.getId(), PaymentTransactionEntity.STATUS_PENDING)
                .orElseGet(() -> PaymentTransactionEntity.builder()
                        .booking(confirmedBooking)
                        .amount(confirmedBooking.getDepositAmount())
                        .build());

        transaction.setPaymentMethod(PaymentTransactionEntity.METHOD_PAYOS_SIMULATED);
        transaction.setStatus(PaymentTransactionEntity.STATUS_SUCCESS);
        transaction.setTransactionCode("SIM-" + confirmedBooking.getBookingCode() + "-" + System.currentTimeMillis());
        transaction.setPayloadWebhook("{\"simulated\":true,\"bookingCode\":\"" + bookingCode + "\",\"timestamp\":\"" + LocalDateTime.now() + "\"}");
        paymentTransactionRepository.save(transaction);

        log.info("Booking {} successfully CONFIRMED via Sandbox one-click simulation.", bookingCode);
        if (realtimeNotificationService != null) {
            realtimeNotificationService.notifyBookingConfirmed(confirmedBooking);
        }
        return bookingMapper.toResponse(confirmedBooking);
    }

    private BookingEntity confirmBookingAndReleaseLock(BookingEntity booking) {
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setDepositStatus(DepositStatus.PAID);
        booking.setSlotLockExpiresAt(null);
        BookingEntity confirmed = bookingRepository.save(booking);

        if (confirmed.getStaff() != null) {
            redisLockService.unlockSlots(confirmed.getStaff().getId(), confirmed.getBookingTime(), confirmed.getEndTime());
        }
        return confirmed;
    }

    public boolean verifyWebhookSignature(PayOSWebhookPayload payload, String key) {
        if (payload == null || payload.data() == null || payload.signature() == null) {
            return false;
        }
        String dataSorted = buildDataSortedString(payload.data());
        String expectedSignature = hmacSha256(dataSorted, key);
        return expectedSignature.equalsIgnoreCase(payload.signature());
    }

    public String buildDataSortedString(PayOSWebhookPayload.PayOSWebhookData data) {
        Map<String, Object> map = new TreeMap<>();
        if (data.amount() != null) map.put("amount", data.amount());
        if (data.description() != null) map.put("description", data.description());
        if (data.orderCode() != null) map.put("orderCode", data.orderCode());
        if (data.reference() != null) map.put("reference", data.reference());
        if (data.transactionDateTime() != null) map.put("transactionDateTime", data.transactionDateTime());
        if (data.currency() != null) map.put("currency", data.currency());
        if (data.paymentLinkId() != null) map.put("paymentLinkId", data.paymentLinkId());
        if (data.code() != null) map.put("code", data.code());
        if (data.desc() != null) map.put("desc", data.desc());
        if (data.accountNumber() != null) map.put("accountNumber", data.accountNumber());

        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (entry.getValue() != null && !entry.getValue().toString().isEmpty()) {
                if (!sb.isEmpty()) {
                    sb.append("&");
                }
                sb.append(entry.getKey()).append("=").append(entry.getValue());
            }
        }
        return sb.toString();
    }

    public static String hmacSha256(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(2 * rawHmac.length);
            for (byte b : rawHmac) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to compute HMAC-SHA256", e);
        }
    }

    private String extractBookingCode(String description) {
        if (!StringUtils.hasText(description)) {
            return null;
        }
        Matcher matcher = BOOKING_CODE_PATTERN.matcher(description);
        if (matcher.find()) {
            return matcher.group();
        }
        return description.trim();
    }
}
