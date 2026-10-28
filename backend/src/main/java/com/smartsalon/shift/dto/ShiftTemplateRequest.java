package com.smartsalon.shift.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftTemplateRequest {
    @NotNull(message = "Chi nhánh không được để trống")
    private Long branchId;

    @NotBlank(message = "Mã ca không được để trống")
    private String code;

    @NotBlank(message = "Tên ca không được để trống")
    private String name;

    @NotNull(message = "Giờ bắt đầu không được để trống")
    private LocalTime startTime;

    @NotNull(message = "Giờ kết thúc không được để trống")
    private LocalTime endTime;

    @Min(value = 0, message = "Số phút làm thêm tối đa không được âm")
    @Max(value = 180, message = "Số phút làm thêm tối đa không vượt quá 180 phút")
    @Builder.Default
    private int maxOvertimeMinutes = 0;

    @Builder.Default
    private Boolean isActive = true;
}
