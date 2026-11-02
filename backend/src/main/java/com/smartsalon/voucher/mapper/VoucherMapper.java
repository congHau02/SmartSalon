package com.smartsalon.voucher.mapper;

import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.voucher.dto.CreateVoucherRequest;
import com.smartsalon.voucher.dto.UpdateVoucherRequest;
import com.smartsalon.voucher.dto.VoucherResponse;
import com.smartsalon.voucher.entity.VoucherEntity;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class VoucherMapper {

    public VoucherEntity toEntity(CreateVoucherRequest request, String normalizedCode, Set<BranchEntity> branches) {
        return VoucherEntity.builder()
                .code(normalizedCode)
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .value(request.getValue())
                .maxDiscount(request.getMaxDiscount())
                .minOrderAmount(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : BigDecimal.ZERO)
                .startsAt(request.getStartsAt())
                .endsAt(request.getEndsAt())
                .usageLimit(request.getUsageLimit())
                .perCustomerLimit(request.getPerCustomerLimit() != null ? request.getPerCustomerLimit() : 1)
                .usedCount(0)
                .active(true)
                .branches(branches)
                .build();
    }

    public void updateEntity(VoucherEntity voucher, UpdateVoucherRequest request, Set<BranchEntity> branches) {
        voucher.setName(request.getName());
        voucher.setDescription(request.getDescription());
        voucher.setType(request.getType());
        voucher.setValue(request.getValue());
        voucher.setMaxDiscount(request.getMaxDiscount());
        voucher.setMinOrderAmount(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : BigDecimal.ZERO);
        voucher.setStartsAt(request.getStartsAt());
        voucher.setEndsAt(request.getEndsAt());
        voucher.setUsageLimit(request.getUsageLimit());
        if (request.getPerCustomerLimit() != null) {
            voucher.setPerCustomerLimit(request.getPerCustomerLimit());
        }
        voucher.setBranches(branches);
    }

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
