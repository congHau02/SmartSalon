package com.smartsalon.realtime.service;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.realtime.dto.RealtimeEventDto;

public interface RealtimeNotificationService {

    void sendBookingEvent(Long branchId, RealtimeEventDto event);

    void sendDispatchEvent(Long branchId, RealtimeEventDto event);

    void notifyBookingCreated(BookingEntity booking);

    void notifyBookingConfirmed(BookingEntity booking);

    void notifyBookingStatusChanged(BookingEntity booking, BookingStatus oldStatus, BookingStatus newStatus);

    void notifyOrderCheckedIn(OrderEntity order);

    void notifyWalkInCreated(OrderEntity order);

    void notifyOrderUpdated(OrderEntity order);

    void notifyVisualLogSaved(OrderEntity order);

    void notifyOrderCheckedOut(OrderEntity order);
}
