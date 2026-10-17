package com.smartsalon.payment;

import com.smartsalon.booking.dto.BookingResponse;
import com.smartsalon.common.ApiResponse;
import com.smartsalon.payment.dto.PayOSWebhookPayload;
import com.smartsalon.payment.dto.PaymentQrInfo;
import com.smartsalon.payment.service.PayOSService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/webhooks/payos")
@RequiredArgsConstructor
@Tag(name = "PayOS Payment & Webhook", description = "Xử lý thanh toán cọc PayOS, VietQR và Webhook tự động")
public class PayOSWebhookController {

    private final PayOSService payOSService;

    @PostMapping
    @Operation(summary = "Nhận webhook thông báo thanh toán từ PayOS")
    public ResponseEntity<ApiResponse<BookingResponse>> handleWebhook(@RequestBody PayOSWebhookPayload payload) {
        log.info("Received PayOS webhook callback: {}", payload);
        BookingResponse response = payOSService.processPayOSWebhook(payload);
        return ResponseEntity.ok(ApiResponse.success("Xử lý webhook thanh toán thành công", response));
    }

    @PostMapping("/simulate/{bookingCode}")
    @Operation(summary = "Mô phỏng thanh toán cọc thành công trong môi trường Sandbox (One-click Testing)")
    public ResponseEntity<ApiResponse<BookingResponse>> simulatePayment(@PathVariable String bookingCode) {
        log.info("Simulating payment success for booking code: {}", bookingCode);
        BookingResponse response = payOSService.simulatePaymentSuccess(bookingCode);
        return ResponseEntity.ok(ApiResponse.success("Mô phỏng thanh toán cọc thành công", response));
    }

    @GetMapping("/payment-info/{bookingCode}")
    @Operation(summary = "Lấy thông tin VietQR và link thanh toán cọc cho lịch hẹn")
    public ResponseEntity<ApiResponse<PaymentQrInfo>> getPaymentInfo(@PathVariable String bookingCode) {
        PaymentQrInfo info = payOSService.generateDepositPaymentInfo(bookingCode);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin thanh toán thành công", info));
    }
}
