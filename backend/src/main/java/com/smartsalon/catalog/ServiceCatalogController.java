package com.smartsalon.catalog;

import com.smartsalon.catalog.dto.ServiceCreateRequest;
import com.smartsalon.catalog.dto.ServiceResponse;
import com.smartsalon.catalog.dto.ServiceUpdateRequest;
import com.smartsalon.catalog.service.ServiceCatalogService;
import com.smartsalon.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/services")
@RequiredArgsConstructor
@Tag(name = "Service Catalog", description = "Quản lý danh mục dịch vụ, định lượng hoá chất (BOM) và hoa hồng kỹ thuật")
public class ServiceCatalogController {

    private final ServiceCatalogService serviceCatalogService;

    @GetMapping
    @Operation(summary = "Lấy danh sách dịch vụ (lọc theo danh mục hoặc trạng thái hoạt động)")
    public ResponseEntity<ApiResponse<List<ServiceResponse>>> getServices(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean activeOnly) {
        List<ServiceResponse> services = serviceCatalogService.getServices(category, activeOnly);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách dịch vụ thành công", services));
    }

    @GetMapping("/categories")
    @Operation(summary = "Lấy danh sách các danh mục dịch vụ đang có")
    public ResponseEntity<ApiResponse<List<String>>> getCategories() {
        List<String> categories = serviceCatalogService.getCategories();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh mục dịch vụ thành công", categories));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết dịch vụ bao gồm định lượng BOM và các bước kỹ thuật")
    public ResponseEntity<ApiResponse<ServiceResponse>> getServiceById(@PathVariable Long id) {
        ServiceResponse service = serviceCatalogService.getServiceById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin dịch vụ thành công", service));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Tạo mới dịch vụ kèm định lượng BOM và các bước chia hoa hồng")
    public ResponseEntity<ApiResponse<ServiceResponse>> createService(@Valid @RequestBody ServiceCreateRequest request) {
        ServiceResponse service = serviceCatalogService.createService(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo dịch vụ mới thành công", service));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Cập nhật dịch vụ, định lượng BOM và các bước kỹ thuật")
    public ResponseEntity<ApiResponse<ServiceResponse>> updateService(
            @PathVariable Long id,
            @Valid @RequestBody ServiceUpdateRequest request) {
        ServiceResponse service = serviceCatalogService.updateService(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật dịch vụ thành công", service));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Xóa mềm dịch vụ khỏi danh mục")
    public ResponseEntity<ApiResponse<Void>> deleteService(@PathVariable Long id) {
        serviceCatalogService.deleteService(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa dịch vụ thành công", null));
    }
}
