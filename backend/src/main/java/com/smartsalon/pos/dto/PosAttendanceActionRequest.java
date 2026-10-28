package com.smartsalon.pos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PosAttendanceActionRequest {
    @NotNull(message = "Mã chi nhánh không được để trống")
    private Long branchId;

    @NotNull(message = "Mã nhân viên không được để trống")
    private Long userId;

    @NotBlank(message = "Thao tác chấm công không được để trống")
    private String action; // CLOCK_IN, TOGGLE_BREAK, CLOCK_OUT, MARK_ABSENT

    private String pin;

    private Boolean overridePin;

    private String notes;
}
