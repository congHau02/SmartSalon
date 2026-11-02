package com.smartsalon.voucher.service.impl;

import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.security.BranchScopeGuard;
import com.smartsalon.voucher.dto.CreateVoucherRequest;
import com.smartsalon.voucher.dto.ToggleVoucherActiveRequest;
import com.smartsalon.voucher.dto.UpdateVoucherRequest;
import com.smartsalon.voucher.dto.VoucherResponse;
import com.smartsalon.voucher.entity.VoucherEntity;
import com.smartsalon.voucher.mapper.VoucherMapper;
import com.smartsalon.voucher.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class VoucherAdminService {

    private final VoucherRepository voucherRepository;
    private final BranchRepository branchRepository;
    private final BranchScopeGuard branchScopeGuard;
    private final VoucherMapper voucherMapper;

    @Transactional
    public VoucherResponse createVoucher(CreateVoucherRequest request) {
        String normalizedCode = request.getCode().trim().toUpperCase();
        if (voucherRepository.existsByCodeIgnoreCaseAndIsDeletedFalse(normalizedCode)) {
            throw new AppException(ErrorCode.VOUCHER_ALREADY_EXISTS);
        }

        Set<BranchEntity> branches = resolveBranches(request.getBranchIds());
        VoucherEntity voucher = voucherMapper.toEntity(request, normalizedCode, branches);
        VoucherEntity saved = voucherRepository.save(voucher);
        return voucherMapper.toResponse(saved);
    }

    @Transactional
    public VoucherResponse updateVoucher(Long id, UpdateVoucherRequest request) {
        VoucherEntity voucher = voucherRepository.findById(id)
                .filter(v -> !v.isDeleted())
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        Set<BranchEntity> branches = resolveBranches(request.getBranchIds());
        voucherMapper.updateEntity(voucher, request, branches);
        VoucherEntity saved = voucherRepository.save(voucher);
        return voucherMapper.toResponse(saved);
    }

    @Transactional
    public VoucherResponse toggleActive(Long id, ToggleVoucherActiveRequest request) {
        VoucherEntity voucher = voucherRepository.findById(id)
                .filter(v -> !v.isDeleted())
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        voucher.setActive(Boolean.TRUE.equals(request.getActive()));
        VoucherEntity saved = voucherRepository.save(voucher);
        return voucherMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<VoucherResponse> getVouchers() {
        if (branchScopeGuard.isCurrentUserAdmin()) {
            return voucherRepository.findByIsDeletedFalseOrderByCreatedAtDesc().stream()
                    .map(voucherMapper::toResponse)
                    .toList();
        }

        Long callerBranchId = branchScopeGuard.getCallerBranchId();
        if (callerBranchId == null) {
            return List.of();
        }

        return voucherRepository.findValidForBranch(callerBranchId).stream()
                .map(voucherMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public VoucherResponse getVoucherById(Long id) {
        VoucherEntity voucher = voucherRepository.findById(id)
                .filter(v -> !v.isDeleted())
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        if (!branchScopeGuard.isCurrentUserAdmin()) {
            Long callerBranchId = branchScopeGuard.getCallerBranchId();
            if (callerBranchId != null && !voucher.isBranchAllowed(callerBranchId)) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        }

        return voucherMapper.toResponse(voucher);
    }

    private Set<BranchEntity> resolveBranches(Set<Long> branchIds) {
        if (branchIds == null || branchIds.isEmpty()) {
            return new HashSet<>();
        }
        return new HashSet<>(branchRepository.findAllById(branchIds));
    }
}
