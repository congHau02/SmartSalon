package com.smartsalon.pos.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddServiceItemRequest {

    @NotNull(message = "serviceId không được để trống")
    private Long serviceId;

    private Long staffId;
}
