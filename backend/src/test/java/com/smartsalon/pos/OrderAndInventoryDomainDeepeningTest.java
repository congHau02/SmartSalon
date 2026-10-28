package com.smartsalon.pos;

import com.smartsalon.analytics.dto.StockAlertLevel;
import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.catalog.entity.ServiceDefaultStepEntity;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.inventory.entity.BranchInventoryEntity;
import com.smartsalon.inventory.entity.ProductEntity;
import com.smartsalon.payment.VietQrUrlBuilder;
import com.smartsalon.pos.entity.*;
import com.smartsalon.shift.entity.StaffAttendanceEntity;
import com.smartsalon.shift.entity.StaffAttendanceStatus;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.service.CustomerIdentityService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class OrderAndInventoryDomainDeepeningTest {

    @Test
    @DisplayName("OrderEntity.recalculateTotals: tính đúng subtotal, trừ discountAmount và depositDeducted, không âm")
    void orderEntity_recalculateTotals_computesSubtotalAndFinalAmount() {
        OrderEntity order = OrderEntity.builder()
                .discountAmount(new BigDecimal("50000"))
                .depositDeducted(new BigDecimal("100000"))
                .items(new ArrayList<>())
                .build();

        OrderItemEntity serviceItem = OrderItemEntity.builder()
                .itemType(OrderItemType.SERVICE)
                .quantity(1)
                .unitPrice(new BigDecimal("400000"))
                .totalPrice(new BigDecimal("400000"))
                .build();

        OrderItemEntity retailItem = OrderItemEntity.builder()
                .itemType(OrderItemType.PRODUCT)
                .quantity(2)
                .unitPrice(new BigDecimal("150000"))
                .totalPrice(new BigDecimal("300000"))
                .build();

        OrderItemEntity deletedItem = OrderItemEntity.builder()
                .itemType(OrderItemType.PRODUCT)
                .quantity(1)
                .unitPrice(new BigDecimal("999000"))
                .totalPrice(new BigDecimal("999000"))
                .isDeleted(true)
                .build();

        order.addItem(serviceItem);
        order.addItem(retailItem);
        order.addItem(deletedItem);

        order.recalculateTotals();

        assertThat(order.getSubtotal()).isEqualByComparingTo("700000");
        assertThat(order.getFinalAmount()).isEqualByComparingTo("550000");
        assertThat(order.calculateFinalAmountWithDraftDiscount(new BigDecimal("200000")))
                .isEqualByComparingTo("400000");
        assertThat(order.calculateFinalAmountWithDraftDiscount(new BigDecimal("900000")))
                .isEqualByComparingTo("0");
    }

    @Test
    @DisplayName("OrderEntity.calculateRevenueBreakdown: phân bổ giảm giá theo tỷ lệ doanh thu dịch vụ và bán lẻ (ADR-0010)")
    void orderEntity_calculateRevenueBreakdown_proratesDiscountCorrectly() {
        OrderEntity order = OrderEntity.builder()
                .discountAmount(new BigDecimal("100000"))
                .items(new ArrayList<>())
                .build();

        order.addItem(OrderItemEntity.builder()
                .itemType(OrderItemType.SERVICE)
                .totalPrice(new BigDecimal("750000"))
                .build());
        order.addItem(OrderItemEntity.builder()
                .itemType(OrderItemType.PRODUCT)
                .totalPrice(new BigDecimal("250000"))
                .build());

        OrderEntity.RevenueBreakdown breakdown = order.calculateRevenueBreakdown();

        assertThat(breakdown.grossServiceRevenue()).isEqualByComparingTo("750000");
        assertThat(breakdown.grossRetailRevenue()).isEqualByComparingTo("250000");
        assertThat(breakdown.serviceDiscount()).isEqualByComparingTo("75000.00");
        assertThat(breakdown.retailDiscount()).isEqualByComparingTo("25000.00");
        assertThat(breakdown.netServiceRevenue()).isEqualByComparingTo("675000.00");
        assertThat(breakdown.netRetailRevenue()).isEqualByComparingTo("225000.00");
        assertThat(breakdown.totalNetRevenue()).isEqualByComparingTo("900000.00");
    }

    @Test
    @DisplayName("OrderItemEntity.populateDefaultStepAssignments: tính đúng hoa hồng 2 cấp Service Commission Pool (ADR-0009)")
    void orderItemEntity_populateDefaultSteps_computesTwoTierCommissionPool() {
        ServiceEntity service = ServiceEntity.builder()
                .name("Uốn lạnh Hàn Quốc")
                .basePrice(new BigDecimal("1000000"))
                .commissionPoolRate(new BigDecimal("20.00"))
                .defaultSteps(List.of(
                        ServiceDefaultStepEntity.builder().stepName("Gội chuẩn bị").stepOrder(1).commissionRate(new BigDecimal("15.00")).build(),
                        ServiceDefaultStepEntity.builder().stepName("Uốn chính").stepOrder(2).commissionRate(new BigDecimal("65.00")).build(),
                        ServiceDefaultStepEntity.builder().stepName("Sấy tạo kiểu").stepOrder(3).commissionRate(new BigDecimal("20.00")).build()
                ))
                .build();

        UserEntity stylist = UserEntity.builder().fullName("Stylist A").build();
        stylist.setId(5L);

        OrderItemEntity orderItem = OrderItemEntity.builder()
                .itemType(OrderItemType.SERVICE)
                .service(service)
                .quantity(1)
                .unitPrice(new BigDecimal("1000000"))
                .totalPrice(new BigDecimal("1000000"))
                .stepAssignments(new ArrayList<>())
                .build();

        orderItem.populateDefaultStepAssignments(stylist);

        assertThat(orderItem.getStepAssignments()).hasSize(3);
        assertThat(orderItem.getStepAssignments().get(0).getCommissionAmount()).isEqualByComparingTo("30000");
        assertThat(orderItem.getStepAssignments().get(1).getCommissionAmount()).isEqualByComparingTo("130000");
        assertThat(orderItem.getStepAssignments().get(2).getCommissionAmount()).isEqualByComparingTo("40000");
    }

    @Test
    @DisplayName("ProductEntity & BranchInventoryEntity: tính đúng tổng dung tích khả dụng, giá vốn/ml và phân loại 3 mức cảnh báo tồn kho (ADR-0004 & ADR-0010)")
    void productAndBranchInventory_valuationAndStockAlertClassification() {
        ProductEntity product = ProductEntity.builder()
                .name("Olaplex No.1")
                .sku("OLA-1")
                .unit("chai")
                .volumeOrWeightPerUnit(new BigDecimal("500.00"))
                .volumeUnit("ml")
                .minStockAlertUnits(2)
                .costPrice(new BigDecimal("1000000.00"))
                .build();

        assertThat(product.calculateVolumeUnitCostSnapshot()).isEqualByComparingTo("2000.0000");
        assertThat(product.calculateVolumeCostAmount(new BigDecimal("-35.50"))).isEqualByComparingTo("71000.00");

        BranchInventoryEntity inventory = BranchInventoryEntity.builder()
                .product(product)
                .stockUnits(3)
                .currentVolume(new BigDecimal("120.00"))
                .minStockAlertUnits(2)
                .build();

        // 3 * 500 + 120 = 1620ml
        assertThat(inventory.calculateTotalAvailableVolume()).isEqualByComparingTo("1620.00");
        assertThat(inventory.isLowStock()).isFalse();
        // With 3 units == minStockAlert (2) + 1 -> NEAR_THRESHOLD
        assertThat(inventory.classifyStockAlertLevel(BigDecimal.ZERO)).isEqualTo(StockAlertLevel.NEAR_THRESHOLD);

        // With 5 units and high daily burn (400ml/day -> 2620 / 400 = 6 days <= 7) -> NEAR_THRESHOLD
        inventory.setStockUnits(5);
        assertThat(inventory.calculateEstimatedDaysRemaining(new BigDecimal("400.00"))).isEqualTo(6);
        assertThat(inventory.classifyStockAlertLevel(new BigDecimal("400.00"))).isEqualTo(StockAlertLevel.NEAR_THRESHOLD);

        // With 5 units and low daily burn (50ml/day -> 52 days) -> HEALTHY
        assertThat(inventory.classifyStockAlertLevel(new BigDecimal("50.00"))).isEqualTo(StockAlertLevel.HEALTHY);

        // With 0 units and 0 volume -> OUT_OF_STOCK
        inventory.setStockUnits(0);
        inventory.setCurrentVolume(BigDecimal.ZERO);
        assertThat(inventory.classifyStockAlertLevel(BigDecimal.ZERO)).isEqualTo(StockAlertLevel.OUT_OF_STOCK);
    }

    @Test
    @DisplayName("BookingEntity: tính cọc 20%, kiểm tra hết hạn giữ chỗ và chuyển trạng thái hợp lệ")
    void bookingEntity_depositAndLifecycleTransitions() {
        assertThat(BookingEntity.calculateDepositAmount(new BigDecimal("350000")))
                .isEqualByComparingTo("70000");

        BookingEntity booking = BookingEntity.builder()
                .status(BookingStatus.PENDING_PAYMENT)
                .depositStatus(DepositStatus.UNPAID)
                .slotLockExpiresAt(LocalDateTime.now().minusSeconds(10))
                .build();

        assertThat(booking.isHoldExpired(LocalDateTime.now())).isTrue();
        assertThat(booking.canTransitionTo(BookingStatus.CONFIRMED)).isTrue();

        booking.confirmDeposit();
        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
        assertThat(booking.getDepositStatus()).isEqualTo(DepositStatus.PAID);
        assertThat(booking.getSlotLockExpiresAt()).isNull();
    }

    @Test
    @DisplayName("CustomerIdentityService.isIdentifiedCustomer & VietQrUrlBuilder: nhận diện khách định danh và tạo URL VietQR chuẩn")
    void customerIdentityAndVietQrBuilder_contracts() {
        UserEntity walkInUser = UserEntity.builder()
                .username("walkin.guest")
                .phone("0000000000")
                .fullName("Khách vãng lai (Walk-in)")
                .build();
        walkInUser.setId(1L);

        UserEntity realCustomer = UserEntity.builder()
                .username("0912345678")
                .phone("0912345678")
                .fullName("Lê Thị Hoa")
                .build();
        realCustomer.setId(2L);

        assertThat(CustomerIdentityService.isIdentifiedCustomer(walkInUser, "0000000000")).isFalse();
        assertThat(CustomerIdentityService.isIdentifiedCustomer(realCustomer, "0912345678")).isTrue();
        assertThat(CustomerIdentityService.isIdentifiedCustomer(realCustomer, "0000000000")).isFalse();

        String qrUrl = VietQrUrlBuilder.buildCompactQrUrl("MB", "0988888888", "SMART SALON VIETNAM", new BigDecimal("120000"), "ORD-123");
        assertThat(qrUrl).isEqualTo("https://img.vietqr.io/image/MB-0988888888-compact2.png?amount=120000&addInfo=ORD-123&accountName=SMART+SALON+VIETNAM");
    }

    @Test
    @DisplayName("StaffAttendanceEntity.createForAction: khởi tạo đúng status và timestamp theo từng action")
    void staffAttendanceEntity_createForAction_initializesProperly() {
        LocalDateTime now = LocalDateTime.of(2026, 10, 28, 8, 30);
        LocalDate today = now.toLocalDate();
        BranchEntity branch = BranchEntity.builder().name("Chi nhánh 1").build();
        UserEntity user = UserEntity.builder().fullName("Nguyễn Văn A").build();

        StaffAttendanceEntity in = StaffAttendanceEntity.createForAction(branch, user, null, today, "CLOCK_IN", now, "Vào ca");
        assertThat(in.getStatus()).isEqualTo(StaffAttendanceStatus.PRESENT);
        assertThat(in.getClockInAt()).isEqualTo(now);
        assertThat(in.getBreakStartAt()).isNull();

        StaffAttendanceEntity brk = StaffAttendanceEntity.createForAction(branch, user, null, today, "TOGGLE_BREAK", now, "Nghỉ trưa");
        assertThat(brk.getStatus()).isEqualTo(StaffAttendanceStatus.ON_BREAK);
        assertThat(brk.getClockInAt()).isEqualTo(now);
        assertThat(brk.getBreakStartAt()).isEqualTo(now);

        StaffAttendanceEntity out = StaffAttendanceEntity.createForAction(branch, user, null, today, "CLOCK_OUT", now, "Hết ca");
        assertThat(out.getStatus()).isEqualTo(StaffAttendanceStatus.COMPLETED);
        assertThat(out.getClockInAt()).isEqualTo(now);
        assertThat(out.getClockOutAt()).isEqualTo(now);

        StaffAttendanceEntity absent = StaffAttendanceEntity.createForAction(branch, user, null, today, "MARK_ABSENT", now, "Nghỉ phép");
        assertThat(absent.getStatus()).isEqualTo(StaffAttendanceStatus.ABSENT);
        assertThat(absent.getClockInAt()).isNull();
    }

    @Test
    @DisplayName("StaffAttendanceEntity: toggleBreak và clockOut trên bản ghi đã vắng mặt không bị ghi đè clockInAt")
    void staffAttendanceEntity_existingAbsentRecord_doesNotOverwriteClockInAt() {
        LocalDateTime now = LocalDateTime.of(2026, 10, 28, 14, 0);
        StaffAttendanceEntity absentRecord = StaffAttendanceEntity.builder()
                .status(StaffAttendanceStatus.ABSENT)
                .clockInAt(null)
                .build();

        absentRecord.toggleBreak(now, "Tạm nghỉ");
        assertThat(absentRecord.getStatus()).isEqualTo(StaffAttendanceStatus.ON_BREAK);
        assertThat(absentRecord.getClockInAt()).isNull();

        absentRecord.clockOut(now.plusHours(1), null, "Về");
        assertThat(absentRecord.getStatus()).isEqualTo(StaffAttendanceStatus.COMPLETED);
        assertThat(absentRecord.getClockInAt()).isNull();
    }

    @Test
    @DisplayName("BookingEntity.canCancelOnline: tuân thủ đúng policy 2 tiếng và trạng thái hợp lệ")
    void bookingEntity_canCancelOnline_rules() {
        LocalDateTime refNow = LocalDateTime.of(2026, 10, 28, 10, 0);

        BookingEntity bookingValid = BookingEntity.builder()
                .status(BookingStatus.CONFIRMED)
                .bookingTime(refNow.plusHours(3))
                .build();
        assertThat(bookingValid.canCancelOnline(refNow)).isTrue();

        BookingEntity bookingTooLate = BookingEntity.builder()
                .status(BookingStatus.CONFIRMED)
                .bookingTime(refNow.plusMinutes(90))
                .build();
        assertThat(bookingTooLate.canCancelOnline(refNow)).isFalse();

        BookingEntity bookingCancelled = BookingEntity.builder()
                .status(BookingStatus.CANCELLED)
                .bookingTime(refNow.plusHours(4))
                .build();
        assertThat(bookingCancelled.canCancelOnline(refNow)).isFalse();
    }
}
