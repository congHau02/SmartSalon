package com.smartsalon.shift.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRosterCellRequest {
    @NotNull(message = "ID nhân viên không được để trống")
    private Long userId;

    @NotNull(message = "Ngày làm việc không được để trống")
    private LocalDate scheduleDate;

    @NotNull(message = "Trạng thái không được để trống (WORKING hoặc OFF)")
    private String status; // WORKING, OFF

    private Long shiftTemplateId; // Required when status is WORKING

    private String notes;
}
