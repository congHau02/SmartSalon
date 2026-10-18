package com.smartsalon.pos.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalkInOrderRequest {

    @NotNull(message = "Chi nhánh không được để trống")
    private Long branchId;

    private String customerName;

    private String customerPhone;

    @JsonProperty("isQuickGuest")
    @Builder.Default
    private Boolean isQuickGuest = false;

    @Builder.Default
    private List<Long> serviceIds = new ArrayList<>();

    @Valid
    @Builder.Default
    private List<ProductItemRequest> productItems = new ArrayList<>();

    private Long stylistId;

    private String notes;

    public boolean isQuickGuest() {
        return Boolean.TRUE.equals(isQuickGuest);
    }
}
