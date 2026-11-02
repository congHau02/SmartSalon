package com.smartsalon.voucher.dto;

import com.smartsalon.voucher.entity.VoucherType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateVoucherRequest {

    private String name;

    private String description;

    @NotNull(message = "Loại giảm giá không được để trống")
    private VoucherType type;

    @NotNull(message = "Giá trị giảm giá không được để trống")
    @DecimalMin(value = "0.01", message = "Giá trị giảm giá phải lớn hơn 0")
    private BigDecimal value;

    private BigDecimal maxDiscount;

    private BigDecimal minOrderAmount;

    private Instant startsAt;

    private Instant endsAt;

    @Min(value = 1, message = "Giới hạn sử dụng phải từ 1 lượt trở lên")
    private Integer usageLimit;

    @Min(value = 1, message = "Giới hạn mỗi khách hàng phải từ 1 lượt trở lên")
    private Integer perCustomerLimit;

    private Set<Long> branchIds;
}
