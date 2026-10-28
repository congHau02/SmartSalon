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
public class CopyWeekRosterRequest {
    @NotNull(message = "Chi nhánh không được để trống")
    private Long branchId;

    @NotNull(message = "Ngày bắt đầu tuần nguồn không được để trống")
    private LocalDate sourceStartDate;

    @NotNull(message = "Ngày bắt đầu tuần đích không được để trống")
    private LocalDate targetStartDate;
}
