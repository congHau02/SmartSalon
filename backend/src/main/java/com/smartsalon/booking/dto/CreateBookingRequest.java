package com.smartsalon.booking.dto;

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

        String notes
) {}
