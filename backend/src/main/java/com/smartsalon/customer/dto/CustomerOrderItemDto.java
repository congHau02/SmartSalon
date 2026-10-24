package com.smartsalon.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerOrderItemDto {
    private Long id;
    private String itemType;
    private Long serviceId;
    private Long productId;
    private String name;
    private BigDecimal unitPrice;
    private int quantity;
    private BigDecimal totalPrice;
}
