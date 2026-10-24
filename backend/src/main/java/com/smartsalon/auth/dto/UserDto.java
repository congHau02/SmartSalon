package com.smartsalon.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String username;
    private String fullName;
    private String phone;
    private String email;
    private String avatarUrl;
    private Long branchId;
    private String branchName;
    private List<String> roles;
    private String membershipTier;
    private Integer discountPercent;
    private BigDecimal totalSpent;
    private String nextTier;
    private BigDecimal amountToNextTier;
    private BigDecimal creditBalance;
    private Boolean isProvisional;
}
