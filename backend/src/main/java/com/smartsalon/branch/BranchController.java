package com.smartsalon.branch;

import com.smartsalon.branch.dto.BranchDto;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/branches")
@RequiredArgsConstructor
@Tag(name = "Branch Management", description = "Quản lý và tra cứu thông tin chi nhánh Salon")
public class BranchController {

    private final BranchRepository branchRepository;

    @GetMapping
    @Operation(summary = "Lấy danh sách các chi nhánh đang hoạt động")
    public ResponseEntity<ApiResponse<List<BranchDto>>> getActiveBranches() {
        List<BranchEntity> branches = branchRepository.findAllByIsDeletedFalseAndIsActiveTrue();
        List<BranchDto> dtos = branches.stream()
                .map(b -> BranchDto.builder()
                        .id(b.getId())
                        .name(b.getName())
                        .address(b.getAddress())
                        .phone(b.getPhone())
                        .isActive(b.isActive())
                        .build())
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách chi nhánh thành công", dtos));
    }
}
