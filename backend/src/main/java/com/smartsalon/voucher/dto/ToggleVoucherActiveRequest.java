package com.smartsalon.voucher.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToggleVoucherActiveRequest {

    @NotNull(message = "Trạng thái kích hoạt không được để trống")
    private Boolean active;
}
