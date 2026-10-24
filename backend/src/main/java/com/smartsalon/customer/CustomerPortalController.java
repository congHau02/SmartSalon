package com.smartsalon.customer;

import com.smartsalon.common.ApiResponse;
import com.smartsalon.customer.dto.CustomerBookingResponse;
import com.smartsalon.customer.dto.CustomerSummaryDto;
import com.smartsalon.customer.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Customer Portal Workspace", description = "API Không gian cá nhân khách hàng, lịch hẹn và bảo lưu cọc")
public class CustomerPortalController {

    private final CustomerService customerService;

    @GetMapping({"/api/v1/customer/me/summary", "/api/v1/customers/me/summary"})
    @Operation(summary = "Lấy thông tin tổng quan hồ sơ, hạng thành viên, chi tiêu và số dư bảo lưu cọc")
    public ResponseEntity<ApiResponse<CustomerSummaryDto>> getMySummary() {
        String username = getAuthenticatedUsername();
        CustomerSummaryDto summary = customerService.getCustomerSummary(username);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin tổng quan thành công", summary));
    }

    @GetMapping({"/api/v1/customer/me/bookings", "/api/v1/customers/me/bookings"})
    @Operation(summary = "Lấy danh sách lịch hẹn của tôi với trạng thái cho phép hủy trực tuyến")
    public ResponseEntity<ApiResponse<List<CustomerBookingResponse>>> getMyBookings() {
        String username = getAuthenticatedUsername();
        List<CustomerBookingResponse> bookings = customerService.getCustomerBookings(username);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách lịch hẹn thành công", bookings));
    }

    @PostMapping({
            "/api/v1/customer/me/bookings/{bookingId}/cancel",
            "/api/v1/customers/me/bookings/{bookingId}/cancel",
            "/api/v1/customer/bookings/{bookingId}/cancel"
    })
    @Operation(summary = "Hủy lịch hẹn trực tuyến trước 2 tiếng và bảo lưu cọc vào ví credit")
    public ResponseEntity<ApiResponse<CustomerBookingResponse>> cancelMyBooking(@PathVariable Long bookingId) {
        String username = getAuthenticatedUsername();
        CustomerBookingResponse response = customerService.cancelCustomerBooking(username, bookingId);
        return ResponseEntity.ok(ApiResponse.success("Hủy lịch hẹn thành công", response));
    }

    private String getAuthenticatedUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new com.smartsalon.exception.AppException(com.smartsalon.exception.ErrorCode.UNAUTHORIZED);
        }
        return auth.getName();
    }
}
