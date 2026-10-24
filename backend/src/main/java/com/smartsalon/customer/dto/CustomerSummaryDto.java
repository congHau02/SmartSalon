package com.smartsalon.customer.dto;

import com.smartsalon.user.entity.MembershipTier;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerSummaryDto {
    private Long customerId;
    private String username;
    private String fullName;
    private String phone;
    private String email;
    private MembershipTier membershipTier;
    private Integer discountPercent;
    private BigDecimal totalSpent;
    private MembershipTier nextTier;
    private BigDecimal amountToNextTier;
    private BigDecimal creditBalance;
    private boolean isProvisional;
    private long totalCompletedVisits;
    private long upcomingBookingCount;
}
