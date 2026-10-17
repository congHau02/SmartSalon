package com.smartsalon.branch.service.impl;

import com.smartsalon.branch.dto.BranchDto;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.branch.service.BranchService;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BranchServiceImpl implements BranchService {

    private final BranchRepository branchRepository;

    @Override
    public List<BranchDto> getActiveBranches() {
        return branchRepository.findAllByIsDeletedFalseAndIsActiveTrue().stream()
                .map(this::mapToDto)
                .toList();
    }

    @Override
    public BranchDto getBranchById(Long id) {
        BranchEntity branch = branchRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND, "Không tìm thấy chi nhánh với ID: " + id));
        return mapToDto(branch);
    }

    private BranchDto mapToDto(BranchEntity entity) {
        return BranchDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .address(entity.getAddress())
                .phone(entity.getPhone())
                .isActive(entity.isActive())
                .build();
    }
}
