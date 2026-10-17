package com.smartsalon.payment.service;

import com.smartsalon.booking.dto.BookingResponse;
import com.smartsalon.payment.dto.PayOSWebhookPayload;
import com.smartsalon.payment.dto.PaymentQrInfo;

public interface PayOSService {

    PaymentQrInfo generateDepositPaymentInfo(String bookingCode);

    BookingResponse processPayOSWebhook(PayOSWebhookPayload payload);

    BookingResponse simulatePaymentSuccess(String bookingCode);
}
