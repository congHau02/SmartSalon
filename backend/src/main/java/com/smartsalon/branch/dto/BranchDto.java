package com.smartsalon.branch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchDto {
    private Long id;
    private String name;
    private String address;
    private String phone;
    private java.math.BigDecimal latitude;
    private java.math.BigDecimal longitude;
    private boolean isActive;
}
