package com.smartsalon.pos.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddProductItemRequest {

    @NotNull(message = "productId không được để trống")
    private Long productId;

    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    @Builder.Default
    private int quantity = 1;
}
