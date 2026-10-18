package com.smartsalon.pos.dto;

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
public class PosOrderResponse {
    private Long id;
    private Long branchId;
    private String branchName;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private Long bookingId;
    private String bookingCode;
    private String orderCode;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal depositDeducted;
    private BigDecimal finalAmount;
    private OrderStatus status;
    private String paymentMethod;
    private String notes;
    private Instant createdAt;
    @Builder.Default
    private List<PosOrderItemResponse> items = new ArrayList<>();
}
