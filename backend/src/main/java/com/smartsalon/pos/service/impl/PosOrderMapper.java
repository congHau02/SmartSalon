package com.smartsalon.pos.service.impl;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.pos.dto.*;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.pos.entity.OrderItemEntity;
import com.smartsalon.pos.entity.OrderStepAssignmentEntity;
import com.smartsalon.pos.entity.TechnicalLogEntity;
import com.smartsalon.user.entity.MembershipTier;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class PosOrderMapper {

    public PosOrderResponse toOrderResponse(OrderEntity order) {
        List<PosOrderItemResponse> itemResponses = order.getItems().stream()
                .filter(i -> !i.isDeleted())
                .map(this::toOrderItemResponse)
                .toList();

        MembershipTier customerTier = MembershipTier.STANDARD;
        BigDecimal customerCreditBalance = BigDecimal.ZERO;
        if (order.getCustomer() != null) {
            if (order.getCustomer().getMembershipTier() != null) {
                customerTier = order.getCustomer().getMembershipTier();
            }
            if (order.getCustomer().getCreditBalance() != null) {
                customerCreditBalance = order.getCustomer().getCreditBalance();
            }
        }

        return PosOrderResponse.builder()
                .id(order.getId())
                .branchId(order.getBranch() != null ? order.getBranch().getId() : null)
                .branchName(order.getBranch() != null ? order.getBranch().getName() : null)
                .customerId(order.getCustomer() != null ? order.getCustomer().getId() : null)
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .bookingId(order.getBooking() != null ? order.getBooking().getId() : null)
                .bookingCode(order.getBooking() != null ? order.getBooking().getBookingCode() : null)
                .orderCode(order.getOrderCode())
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .isDiscountManual(order.isDiscountManual())
                .customerMembershipTier(customerTier.name())
                .customerDiscountPercent(customerTier.getDiscountPercent())
                .customerCreditBalance(customerCreditBalance)
                .depositDeducted(order.getDepositDeducted())
                .finalAmount(order.payableAfterCredit(order.getFinalAmount()))
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .notes(order.getNotes())
                .settledById(order.getSettledBy() != null ? order.getSettledBy().getId() : null)
                .settledByName(order.getSettledBy() != null ? order.getSettledBy().getFullName() : null)
                .settledAt(order.getSettledAt())
                .createdAt(order.getCreatedAt())
                .items(itemResponses)
                .build();
    }

    public PosOrderItemResponse toOrderItemResponse(OrderItemEntity i) {
        List<PosStepAssignmentResponse> stepResponses = i.getStepAssignments() != null
                ? i.getStepAssignments().stream().map(this::toStepResponse).toList()
                : List.of();

        return PosOrderItemResponse.builder()
                .id(i.getId())
                .itemType(i.getItemType())
                .serviceId(i.getService() != null ? i.getService().getId() : null)
                .serviceName(i.getService() != null ? i.getService().getName() : null)
                .commissionPoolRate(i.getService() != null ? i.getService().getCommissionPoolRate() : null)
                .productId(i.getProduct() != null ? i.getProduct().getId() : null)
                .productName(i.getProduct() != null ? i.getProduct().getName() : null)
                .productSku(i.getProduct() != null ? i.getProduct().getSku() : null)
                .quantity(i.getQuantity())
                .unitPrice(i.getUnitPrice())
                .totalPrice(i.getTotalPrice())
                .steps(stepResponses)
                .build();
    }

    public PosStepAssignmentResponse toStepResponse(OrderStepAssignmentEntity s) {
        return PosStepAssignmentResponse.builder()
                .id(s.getId())
                .stepName(s.getStepName())
                .staffId(s.getStaff() != null ? s.getStaff().getId() : null)
                .staffName(s.getStaff() != null ? s.getStaff().getFullName() : null)
                .commissionRate(s.getCommissionRate())
                .commissionAmount(s.getCommissionAmount())
                .status(s.getStatus())
                .startedAt(s.getStartedAt())
                .completedAt(s.getCompletedAt())
                .build();
    }

    public DispatchBoardBookingDto toDispatchBookingDto(BookingEntity b, Long linkedOrderId, String fallbackStaffLabel) {
        List<String> serviceNames = b.getItems().stream()
                .filter(i -> !i.isDeleted() && i.getService() != null)
                .map(i -> i.getService().getName())
                .toList();

        String staffName = b.getStaff() != null ? b.getStaff().getFullName() : fallbackStaffLabel;
        return DispatchBoardBookingDto.builder()
                .id(b.getId())
                .bookingCode(b.getBookingCode())
                .customerId(b.getCustomer() != null ? b.getCustomer().getId() : null)
                .customerName(b.resolvedCustomerName())
                .customerPhone(b.resolvedCustomerPhone())
                .staffId(b.getStaff() != null ? b.getStaff().getId() : null)
                .staffName(staffName)
                .bookingTime(b.getBookingTime())
                .endTime(b.getEndTime())
                .totalDurationMinutes(b.getTotalDurationMinutes())
                .totalPrice(b.getTotalPrice())
                .depositAmount(b.getDepositAmount())
                .depositStatus(b.getDepositStatus() != null ? b.getDepositStatus().name() : null)
                .status(b.getStatus() != null ? b.getStatus().name() : null)
                .serviceNames(serviceNames)
                .linkedOrderId(linkedOrderId)
                .build();
    }

    public TechnicalLogResponse toTechnicalLogResponse(
            TechnicalLogEntity techLog,
            OrderEntity order,
            List<ActualBomItemDto> bomItems,
            boolean isSaved,
            Long fallbackStaffId,
            String fallbackStaffName) {

        Long customerId = (techLog != null && techLog.getCustomer() != null)
                ? techLog.getCustomer().getId()
                : (order.getCustomer() != null ? order.getCustomer().getId() : null);
        String customerName = order.getCustomerName() != null
                ? order.getCustomerName()
                : (techLog != null && techLog.getCustomer() != null
                        ? techLog.getCustomer().getFullName()
                        : (order.getCustomer() != null ? order.getCustomer().getFullName() : null));

        return TechnicalLogResponse.builder()
                .id(techLog != null ? techLog.getId() : null)
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .customerId(customerId)
                .customerName(customerName)
                .staffId(fallbackStaffId)
                .staffName(fallbackStaffName)
                .formulaNotes(techLog != null ? techLog.getFormulaNotes() : null)
                .hairConditionNotes(techLog != null ? techLog.getHairConditionNotes() : null)
                .beforeImageUrl(techLog != null ? techLog.getBeforeImageUrl() : null)
                .afterImageUrl(techLog != null ? techLog.getAfterImageUrl() : null)
                .bomItems(bomItems)
                .isSaved(isSaved)
                .createdAt(techLog != null ? techLog.getCreatedAt() : null)
                .updatedAt(techLog != null ? techLog.getUpdatedAt() : null)
                .build();
    }
}
