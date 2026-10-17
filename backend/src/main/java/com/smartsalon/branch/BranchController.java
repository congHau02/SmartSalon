package com.smartsalon.branch;

import com.smartsalon.branch.dto.BranchDto;
import com.smartsalon.branch.service.BranchService;
import com.smartsalon.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/branches")
@RequiredArgsConstructor
@Tag(name = "Branch Management", description = "Quản lý và tra cứu thông tin chi nhánh Salon")
public class BranchController {

    private final BranchService branchService;

    @GetMapping
    @Operation(summary = "Lấy danh sách các chi nhánh đang hoạt động")
    public ResponseEntity<ApiResponse<List<BranchDto>>> getActiveBranches() {
        List<BranchDto> dtos = branchService.getActiveBranches();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách chi nhánh thành công", dtos));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết thông tin chi nhánh theo ID")
    public ResponseEntity<ApiResponse<BranchDto>> getBranchById(@PathVariable Long id) {
        BranchDto dto = branchService.getBranchById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin chi nhánh thành công", dto));
    }
}
