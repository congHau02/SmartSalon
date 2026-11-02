package com.smartsalon.voucher.mapper;

import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.voucher.dto.VoucherResponse;
import com.smartsalon.voucher.entity.VoucherEntity;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class VoucherMapper {

    public VoucherResponse toResponse(VoucherEntity voucher) {
        if (voucher == null) {
            return null;
        }

        Set<Long> branchIds = voucher.getBranches() != null
                ? voucher.getBranches().stream().map(BranchEntity::getId).collect(Collectors.toSet())
                : Collections.emptySet();

        List<String> branchNames = voucher.getBranches() != null
                ? voucher.getBranches().stream().map(BranchEntity::getName).toList()
                : Collections.emptyList();

        return VoucherResponse.builder()
                .id(voucher.getId())
                .code(voucher.getCode())
                .name(voucher.getName())
                .description(voucher.getDescription())
                .type(voucher.getType())
                .value(voucher.getValue())
                .maxDiscount(voucher.getMaxDiscount())
                .minOrderAmount(voucher.getMinOrderAmount())
                .startsAt(voucher.getStartsAt())
                .endsAt(voucher.getEndsAt())
                .usageLimit(voucher.getUsageLimit())
                .perCustomerLimit(voucher.getPerCustomerLimit())
                .usedCount(voucher.getUsedCount())
                .active(voucher.isActive())
                .chainWide(branchIds.isEmpty())
                .branchIds(branchIds)
                .branchNames(branchNames)
                .createdAt(voucher.getCreatedAt())
                .updatedAt(voucher.getUpdatedAt())
                .build();
    }
}
