package com.smartsalon.booking;

import com.smartsalon.booking.dto.BookingResponse;
import com.smartsalon.booking.dto.BookingServiceItemDto;
import com.smartsalon.booking.entity.BookingEntity;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class BookingMapper {

    public BookingResponse toResponse(BookingEntity entity) {
        if (entity == null) {
            return null;
        }

        List<BookingServiceItemDto> items = entity.getItems().stream()
                .map(item -> new BookingServiceItemDto(
                        item.getId(),
                        item.getService() != null ? item.getService().getId() : null,
                        item.getService() != null ? item.getService().getName() : "",
                        item.getPrice(),
                        item.getDurationMinutes()
                ))
                .toList();

        return new BookingResponse(
                entity.getId(),
                entity.getBookingCode(),
                entity.getBranch().getId(),
                entity.getBranch().getName(),
                entity.getCustomer() != null ? entity.getCustomer().getId() : null,
                entity.getCustomerName() != null ? entity.getCustomerName() : (entity.getCustomer() != null ? entity.getCustomer().getFullName() : ""),
                entity.getCustomerPhone() != null ? entity.getCustomerPhone() : (entity.getCustomer() != null ? entity.getCustomer().getPhone() : ""),
                entity.getStaff() != null ? entity.getStaff().getId() : null,
                entity.getStaff() != null ? entity.getStaff().getFullName() : null,
                entity.isStylistRequested(),
                entity.getBookingTime(),
                entity.getEndTime(),
                entity.getTotalDurationMinutes(),
                entity.getTotalPrice(),
                entity.getDepositAmount(),
                entity.getDepositStatus(),
                entity.getStatus(),
                entity.getSlotLockExpiresAt(),
                entity.getNotes(),
                items,
                entity.getCreatedAt()
        );
    }
}
