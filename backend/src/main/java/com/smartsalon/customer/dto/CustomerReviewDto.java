package com.smartsalon.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerReviewDto {
    private Long id;
    private Long orderId;
    private Long customerId;
    private Long stylistId;
    private String stylistName;
    private String stylistAvatarUrl;
    private Long branchId;
    private int rating;
    private String comment;
    private Instant createdAt;
}
