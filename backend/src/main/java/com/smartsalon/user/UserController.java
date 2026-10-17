package com.smartsalon.user;

import com.smartsalon.auth.dto.UserDto;
import com.smartsalon.common.ApiResponse;
import com.smartsalon.user.dto.UserCreateRequest;
import com.smartsalon.user.service.UserService;
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
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Quản lý nhân viên nội bộ và phân quyền")
public class UserController {

    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Tạo mới tài khoản nhân viên (Admin hoặc Manager)")
    public ResponseEntity<ApiResponse<UserDto>> createStaff(@Valid @RequestBody UserCreateRequest request) {
        UserDto userDto = userService.createStaff(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo tài khoản nhân viên thành công", userDto));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Lấy danh sách nhân viên theo chi nhánh")
    public ResponseEntity<ApiResponse<List<UserDto>>> getUsers(@RequestParam(required = false) Long branchId) {
        List<UserDto> users = userService.getUsers(branchId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách người dùng thành công", users));
    }
}
