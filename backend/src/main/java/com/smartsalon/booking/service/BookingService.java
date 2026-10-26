package com.smartsalon.booking.service;

import com.smartsalon.booking.dto.BookingResponse;
import com.smartsalon.booking.dto.CreateBookingRequest;
import com.smartsalon.booking.dto.UpdateBookingStatusRequest;
import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;

import java.time.LocalDate;
import java.util.List;

public interface BookingService {

    BookingResponse holdSlotAndCreate(CreateBookingRequest request);

    BookingResponse getBookingByCode(String code);

    List<BookingResponse> lookupBookingsByPhone(String phone, String bookingCode);

    default List<BookingResponse> lookupBookingsByPhone(String phone) {
        return lookupBookingsByPhone(phone, null);
    }

    List<BookingResponse> getBookings(Long branchId, BookingStatus status, LocalDate date, String search);

    BookingResponse updateBookingStatus(Long id, UpdateBookingStatusRequest request);

    BookingEntity cancelBooking(BookingEntity booking);
}
