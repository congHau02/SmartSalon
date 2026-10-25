package com.smartsalon.pos.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuickServiceTicketRequest {

    @NotNull(message = "Chi nhánh không được để trống")
    private Long branchId;

    private Long stylistId;

    @NotEmpty(message = "Vui lòng chọn ít nhất một dịch vụ")
    @Builder.Default
    private List<Long> serviceIds = new ArrayList<>();

    @Builder.Default
    private List<ProductItemRequest> productItems = new ArrayList<>();

    @Builder.Default
    private boolean quickGuest = true;

    private String customerPhone;

    private String customerName;

    @Builder.Default
    private String paymentMethod = "CASH";

    private BigDecimal discountAmount;

    private String notes;
}
