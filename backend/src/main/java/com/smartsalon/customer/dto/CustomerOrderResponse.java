package com.smartsalon.customer.dto;

import com.smartsalon.pos.entity.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerOrderResponse {
    private Long orderId;
    private String orderCode;
    private Long branchId;
    private String branchName;
    private Instant createdAt;
    private OrderStatus status;

    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal depositDeducted;
    private BigDecimal finalAmount;
    private BigDecimal netRevenue;

    @Builder.Default
    private List<CustomerOrderItemDto> items = new ArrayList<>();

    @Builder.Default
    private List<CustomerStylistDto> participatingStylists = new ArrayList<>();
    private CustomerStylistDto primaryStylist;

    private CustomerVisualLogDto visualLog;

    private CustomerReviewDto review;
    private boolean canReview;
}
