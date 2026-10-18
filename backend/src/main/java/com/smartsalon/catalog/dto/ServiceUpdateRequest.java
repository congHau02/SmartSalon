package com.smartsalon.catalog.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceUpdateRequest {

    @NotBlank(message = "Tên dịch vụ không được để trống")
    private String name;

    private String description;

    @NotBlank(message = "Nhóm dịch vụ không được để trống")
    private String category;

    @NotNull(message = "Giá dịch vụ không được để trống")
    @DecimalMin(value = "0.0", message = "Giá dịch vụ không thể âm")
    private BigDecimal basePrice;

    @Min(value = 1, message = "Thời lượng dịch vụ phải tối thiểu 1 phút")
    @Builder.Default
    private Integer durationMinutes = 30;

    @DecimalMin(value = "0.0", message = "Tỷ lệ quỹ hoa hồng không được âm")
    @DecimalMax(value = "100.0", message = "Tỷ lệ quỹ hoa hồng không được vượt quá 100%")
    private BigDecimal commissionPoolRate;

    @JsonProperty("isActive")
    @Builder.Default
    private Boolean isActive = true;

    @Valid
    private List<ServiceBomDto> bomList;

    @Valid
    private List<ServiceDefaultStepDto> defaultSteps;

    public boolean isActive() {
        return isActive == null || isActive;
    }
}
