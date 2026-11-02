package com.smartsalon.voucher.dto;

import com.smartsalon.voucher.entity.VoucherType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherResponse {
    private Long id;
    private String code;
    private String name;
    private String description;
    private VoucherType type;
    private BigDecimal value;
    private BigDecimal maxDiscount;
    private BigDecimal minOrderAmount;
    private Instant startsAt;
    private Instant endsAt;
    private Integer usageLimit;
    private Integer perCustomerLimit;
    private Integer usedCount;
    private boolean active;
    private boolean chainWide;
    private Set<Long> branchIds;
    private List<String> branchNames;
    private Instant createdAt;
    private Instant updatedAt;
}
