package com.smartsalon.realtime.service.impl;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.realtime.dto.RealtimeEventDto;
import com.smartsalon.realtime.service.RealtimeNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class RealtimeNotificationServiceImpl implements RealtimeNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    @Override
    public void sendBookingEvent(Long branchId, RealtimeEventDto event) {
        if (branchId == null || event == null) {
            log.warn("Cannot send booking event with null branchId or event");
            return;
        }
        String destination = "/topic/branch/" + branchId + "/bookings";
        try {
            log.info("Broadcasting booking event [{}] to {}", event.getEventType(), destination);
            messagingTemplate.convertAndSend(destination, event);
        } catch (Exception ex) {
            log.error("Failed to broadcast WebSocket booking event to {}: {}", destination, ex.getMessage(), ex);
        }
    }

    @Override
    public void sendDispatchEvent(Long branchId, RealtimeEventDto event) {
        if (branchId == null || event == null) {
            log.warn("Cannot send dispatch event with null branchId or event");
            return;
        }
        String destination = "/topic/branch/" + branchId + "/dispatch";
        try {
            log.info("Broadcasting dispatch event [{}] to {}", event.getEventType(), destination);
            messagingTemplate.convertAndSend(destination, event);
        } catch (Exception ex) {
            log.error("Failed to broadcast WebSocket dispatch event to {}: {}", destination, ex.getMessage(), ex);
        }
    }

    private String resolveCustomerName(BookingEntity booking) {
        if (booking.getCustomerName() != null && !booking.getCustomerName().isBlank()) {
            return booking.getCustomerName();
        }
        if (booking.getCustomer() != null && booking.getCustomer().getFullName() != null && !booking.getCustomer().getFullName().isBlank()) {
            return booking.getCustomer().getFullName();
        }
        return "Khách hàng";
    }

    private String resolveCustomerPhone(BookingEntity booking) {
        if (booking.getCustomerPhone() != null && !booking.getCustomerPhone().isBlank()) {
            return booking.getCustomerPhone();
        }
        if (booking.getCustomer() != null && booking.getCustomer().getPhone() != null) {
            return booking.getCustomer().getPhone();
        }
        return null;
    }

    @Override
    public void notifyBookingCreated(BookingEntity booking) {
        if (booking == null || booking.getBranch() == null) {
            return;
        }
        Long branchId = booking.getBranch().getId();
        String timeStr = booking.getBookingTime() != null ? booking.getBookingTime().format(TIME_FMT) : "";
        String customerName = resolveCustomerName(booking);
        String customerPhone = resolveCustomerPhone(booking);
        String stylistName = booking.getStaff() != null ? booking.getStaff().getFullName() : "Stylist bất kỳ";

        Map<String, Object> data = new HashMap<>();
        data.put("bookingId", booking.getId());
        data.put("bookingCode", booking.getBookingCode());
        data.put("customerName", customerName);
        data.put("customerPhone", customerPhone);
        data.put("bookingTime", booking.getBookingTime() != null ? booking.getBookingTime().toString() : null);
        data.put("stylistName", stylistName);
        data.put("totalPrice", booking.getTotalPrice());
        data.put("depositAmount", booking.getDepositAmount());
        data.put("status", booking.getStatus() != null ? booking.getStatus().name() : null);
        data.put("branchId", branchId);
        data.put("branchName", booking.getBranch().getName());

        RealtimeEventDto event = RealtimeEventDto.builder()
                .eventType("BOOKING_CREATED")
                .branchId(branchId)
                .referenceId(booking.getId())
                .code(booking.getBookingCode())
                .title("Lịch hẹn mới: " + booking.getBookingCode())
                .message(String.format("Khách %s vừa đặt lịch hẹn lúc %s (Stylist: %s)", customerName, timeStr, stylistName))
                .timestamp(LocalDateTime.now())
                .data(data)
                .build();

        sendBookingEvent(branchId, event);
    }

    @Override
    public void notifyBookingConfirmed(BookingEntity booking) {
        if (booking == null || booking.getBranch() == null) {
            return;
        }
        Long branchId = booking.getBranch().getId();
        String customerName = resolveCustomerName(booking);
        String customerPhone = resolveCustomerPhone(booking);
        String depositStr = booking.getDepositAmount() != null ? booking.getDepositAmount().toPlainString() + "đ" : "";

        Map<String, Object> data = new HashMap<>();
        data.put("bookingId", booking.getId());
        data.put("bookingCode", booking.getBookingCode());
        data.put("customerName", customerName);
        data.put("customerPhone", customerPhone);
        data.put("depositAmount", booking.getDepositAmount());
        data.put("status", BookingStatus.CONFIRMED.name());
        data.put("branchId", branchId);

        RealtimeEventDto event = RealtimeEventDto.builder()
                .eventType("BOOKING_CONFIRMED")
                .branchId(branchId)
                .referenceId(booking.getId())
                .code(booking.getBookingCode())
                .title("Xác nhận cọc 20%: " + booking.getBookingCode())
                .message(String.format("Khách %s đã thanh toán cọc thành công (%s)", customerName, depositStr))
                .timestamp(LocalDateTime.now())
                .data(data)
                .build();

        sendBookingEvent(branchId, event);
    }

    @Override
    public void notifyBookingStatusChanged(BookingEntity booking, BookingStatus oldStatus, BookingStatus newStatus) {
        if (booking == null || booking.getBranch() == null) {
            return;
        }
        Long branchId = booking.getBranch().getId();
        String customerName = resolveCustomerName(booking);
        String customerPhone = resolveCustomerPhone(booking);

        Map<String, Object> data = new HashMap<>();
        data.put("bookingId", booking.getId());
        data.put("bookingCode", booking.getBookingCode());
        data.put("customerName", customerName);
        data.put("customerPhone", customerPhone);
        data.put("oldStatus", oldStatus != null ? oldStatus.name() : null);
        data.put("newStatus", newStatus != null ? newStatus.name() : null);
        data.put("branchId", branchId);

        RealtimeEventDto event = RealtimeEventDto.builder()
                .eventType("BOOKING_STATUS_CHANGED")
                .branchId(branchId)
                .referenceId(booking.getId())
                .code(booking.getBookingCode())
                .title("Cập nhật trạng thái: " + booking.getBookingCode())
                .message(String.format("Lịch hẹn của %s chuyển trạng thái sang %s", customerName, newStatus))
                .timestamp(LocalDateTime.now())
                .data(data)
                .build();

        sendBookingEvent(branchId, event);
    }

    @Override
    public void notifyOrderCheckedIn(com.smartsalon.pos.entity.OrderEntity order) {
        if (order == null || order.getBranch() == null) {
            return;
        }
        Long branchId = order.getBranch().getId();
        Map<String, Object> data = new HashMap<>();
        data.put("orderId", order.getId());
        data.put("orderCode", order.getOrderCode());
        data.put("customerName", order.getCustomerName());
        data.put("customerPhone", order.getCustomerPhone());
        data.put("status", order.getStatus() != null ? order.getStatus().name() : null);
        data.put("branchId", branchId);
        if (order.getBooking() != null) {
            data.put("bookingId", order.getBooking().getId());
            data.put("bookingCode", order.getBooking().getBookingCode());
        }

        RealtimeEventDto event = RealtimeEventDto.builder()
                .eventType("ORDER_CHECKED_IN")
                .branchId(branchId)
                .referenceId(order.getId())
                .code(order.getOrderCode())
                .title("Khách check-in: " + order.getOrderCode())
                .message(String.format("Khách %s đã check-in thành công (Mã đơn: %s)", order.getCustomerName(), order.getOrderCode()))
                .timestamp(LocalDateTime.now())
                .data(data)
                .build();

        sendDispatchEvent(branchId, event);
    }

    @Override
    public void notifyWalkInCreated(com.smartsalon.pos.entity.OrderEntity order) {
        if (order == null || order.getBranch() == null) {
            return;
        }
        Long branchId = order.getBranch().getId();
        Map<String, Object> data = new HashMap<>();
        data.put("orderId", order.getId());
        data.put("orderCode", order.getOrderCode());
        data.put("customerName", order.getCustomerName());
        data.put("customerPhone", order.getCustomerPhone());
        data.put("status", order.getStatus() != null ? order.getStatus().name() : null);
        data.put("branchId", branchId);

        RealtimeEventDto event = RealtimeEventDto.builder()
                .eventType("WALK_IN_CREATED")
                .branchId(branchId)
                .referenceId(order.getId())
                .code(order.getOrderCode())
                .title("Khách vãng lai mới: " + order.getOrderCode())
                .message(String.format("Tạo đơn khách vãng lai %s (Mã đơn: %s)", order.getCustomerName(), order.getOrderCode()))
                .timestamp(LocalDateTime.now())
                .data(data)
                .build();

        sendDispatchEvent(branchId, event);
    }

    @Override
    public void notifyOrderUpdated(com.smartsalon.pos.entity.OrderEntity order) {
        if (order == null || order.getBranch() == null) {
            return;
        }
        Long branchId = order.getBranch().getId();
        Map<String, Object> data = new HashMap<>();
        data.put("orderId", order.getId());
        data.put("orderCode", order.getOrderCode());
        data.put("status", order.getStatus() != null ? order.getStatus().name() : null);
        data.put("branchId", branchId);

        RealtimeEventDto event = RealtimeEventDto.builder()
                .eventType("ORDER_UPDATED")
                .branchId(branchId)
                .referenceId(order.getId())
                .code(order.getOrderCode())
                .title("Cập nhật đơn hàng: " + order.getOrderCode())
                .message(String.format("Đơn %s chuyển sang trạng thái %s", order.getOrderCode(), order.getStatus()))
                .timestamp(LocalDateTime.now())
                .data(data)
                .build();

        sendDispatchEvent(branchId, event);
    }

    @Override
    public void notifyVisualLogSaved(com.smartsalon.pos.entity.OrderEntity order) {
        if (order == null || order.getBranch() == null) {
            return;
        }
        Long branchId = order.getBranch().getId();
        Map<String, Object> data = new HashMap<>();
        data.put("orderId", order.getId());
        data.put("orderCode", order.getOrderCode());
        data.put("status", order.getStatus() != null ? order.getStatus().name() : null);
        data.put("branchId", branchId);

        RealtimeEventDto event = RealtimeEventDto.builder()
                .eventType("VISUAL_LOG_SAVED")
                .branchId(branchId)
                .referenceId(order.getId())
                .code(order.getOrderCode())
                .title("Cập nhật Visual Log: " + order.getOrderCode())
                .message(String.format("Đã lưu công thức pha chế & ảnh kết quả cho đơn %s", order.getOrderCode()))
                .timestamp(LocalDateTime.now())
                .data(data)
                .build();

        sendDispatchEvent(branchId, event);
    }
}
