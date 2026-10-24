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
public class CustomerStylistDto {
    private Long id;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private BigDecimal totalCommission;
}
