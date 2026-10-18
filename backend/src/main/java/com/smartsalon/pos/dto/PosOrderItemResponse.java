package com.smartsalon.pos.dto;

import com.smartsalon.pos.entity.OrderItemType;
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
public class PosOrderItemResponse {
    private Long id;
    private OrderItemType itemType;
    private Long serviceId;
    private String serviceName;
    private BigDecimal commissionPoolRate;
    private Long productId;
    private String productName;
    private String productSku;
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    @Builder.Default
    private List<PosStepAssignmentResponse> steps = new ArrayList<>();
}
