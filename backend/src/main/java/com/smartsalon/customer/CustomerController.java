package com.smartsalon.customer;

import com.smartsalon.common.ApiResponse;
import com.smartsalon.customer.dto.CustomerLoyaltyDto;
import com.smartsalon.customer.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
@Tag(name = "Customer CRM & Loyalty", description = "API Tra cứu tích lũy điểm và hạng thành viên")
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping("/loyalty-preview")
    @Operation(summary = "Xem trước hạng thành viên và tỷ lệ chiết khấu theo số điện thoại")
    public ResponseEntity<ApiResponse<CustomerLoyaltyDto>> getLoyaltyPreview(@RequestParam("phone") String phone) {
        CustomerLoyaltyDto preview = customerService.getLoyaltyPreview(phone);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin ưu đãi thành viên thành công", preview));
    }
}
