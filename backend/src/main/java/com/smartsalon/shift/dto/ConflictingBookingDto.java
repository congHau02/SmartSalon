package com.smartsalon.shift.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConflictingBookingDto {
    private String bookingCode;
    private String customerName;
    private String customerPhone;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String reason;
}
