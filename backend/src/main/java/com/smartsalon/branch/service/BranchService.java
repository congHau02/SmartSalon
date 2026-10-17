package com.smartsalon.branch.service;

import com.smartsalon.branch.dto.BranchDto;

import java.util.List;

public interface BranchService {
    List<BranchDto> getActiveBranches();
    BranchDto getBranchById(Long id);
}
