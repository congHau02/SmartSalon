package com.smartsalon.booking.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public record CreateBookingRequest(
        @NotNull(message = "Chi nhánh không được để trống")
        Long branchId,

        Long stylistId,

        @NotEmpty(message = "Danh sách dịch vụ không được để trống")
        List<Long> serviceIds,

        @NotNull(message = "Thời gian hẹn không được để trống")
        LocalDateTime bookingTime,

        @NotBlank(message = "Tên khách hàng không được để trống")
        String customerName,

        @NotBlank(message = "Số điện thoại khách hàng không được để trống")
        String customerPhone,

        @Email(message = "Email không đúng định dạng")
        String customerEmail,

        String notes
) {
    public CreateBookingRequest(
            Long branchId,
            Long stylistId,
            List<Long> serviceIds,
            LocalDateTime bookingTime,
            String customerName,
            String customerPhone,
            String notes
    ) {
        this(branchId, stylistId, serviceIds, bookingTime, customerName, customerPhone, null, notes);
    }
}
