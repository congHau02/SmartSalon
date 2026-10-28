package com.smartsalon.pos.service.impl;

import com.smartsalon.pos.dto.StylistWorklogTicketDto;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.pos.entity.OrderItemEntity;
import com.smartsalon.pos.entity.OrderItemType;
import com.smartsalon.pos.entity.OrderStepAssignmentEntity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

final class PosWorklogMetricsAccumulator {

    int totalTicketCount = 0;
    int totalCompletedStepCount = 0;
    BigDecimal totalServiceRevenue = BigDecimal.ZERO;
    int selfSettledOrderCount = 0;
    BigDecimal cashCollectedToHandover = BigDecimal.ZERO;
    BigDecimal transferCollectedAmount = BigDecimal.ZERO;
    final List<StylistWorklogTicketDto> tickets = new ArrayList<>();

    static PosWorklogMetricsAccumulator compute(
            List<OrderEntity> paidOrders,
            Long stylistId,
            Map<Long, BigDecimal> orderCommissionMap) {
        PosWorklogMetricsAccumulator acc = new PosWorklogMetricsAccumulator();
        for (OrderEntity o : paidOrders) {
            acc.processOrder(o, stylistId, orderCommissionMap.getOrDefault(o.getId(), BigDecimal.ZERO));
        }
        return acc;
    }

    private void processOrder(OrderEntity o, Long stylistId, BigDecimal earnedCommission) {
        List<String> serviceNames = new ArrayList<>();
        List<String> stepNames = new ArrayList<>();
        BigDecimal serviceRevenueInOrder = BigDecimal.ZERO;

        if (o.getItems() != null) {
            for (OrderItemEntity item : o.getItems()) {
                if (item.isDeleted() || item.getItemType() != OrderItemType.SERVICE || item.getService() == null) continue;
                serviceNames.add(item.getService().getName());
                if (collectStylistSteps(item, stylistId, stepNames)) {
                    serviceRevenueInOrder = serviceRevenueInOrder.add(
                            item.getTotalPrice() != null ? item.getTotalPrice() : BigDecimal.ZERO);
                }
            }
        }

        int stylistStepsInOrder = stepNames.size();
        boolean stylistWorked = stylistStepsInOrder > 0;
        boolean settledByStylist = o.getSettledBy() != null && stylistId != null && o.getSettledBy().getId().equals(stylistId);

        if (settledByStylist) {
            recordSettledCollection(o);
        }
        if (stylistWorked) {
            totalTicketCount++;
            totalCompletedStepCount += stylistStepsInOrder;
            totalServiceRevenue = totalServiceRevenue.add(serviceRevenueInOrder);
        }
        if (stylistWorked || settledByStylist) {
            tickets.add(StylistWorklogTicketDto.builder()
                    .orderId(o.getId())
                    .orderCode(o.getOrderCode())
                    .bookingCode(o.getBooking() != null ? o.getBooking().getBookingCode() : null)
                    .customerName(o.getCustomerName())
                    .customerPhone(o.getCustomerPhone())
                    .serviceNames(serviceNames)
                    .stepNames(stepNames)
                    .orderFinalAmount(o.getFinalAmount())
                    .paymentMethod(o.getPaymentMethod())
                    .settledByMe(settledByStylist)
                    .earnedCommission(earnedCommission)
                    .completedAt(o.getSettledAt() != null ? o.getSettledAt() : o.getCreatedAt())
                    .build());
        }
    }

    private boolean collectStylistSteps(OrderItemEntity item, Long stylistId, List<String> stepNames) {
        boolean didStep = false;
        if (item.getStepAssignments() != null && stylistId != null) {
            for (OrderStepAssignmentEntity step : item.getStepAssignments()) {
                if (step.getStaff() != null && step.getStaff().getId().equals(stylistId)) {
                    didStep = true;
                    stepNames.add(step.getStepName());
                }
            }
        }
        return didStep;
    }

    private void recordSettledCollection(OrderEntity o) {
        selfSettledOrderCount++;
        String pMethod = o.getPaymentMethod() != null ? o.getPaymentMethod().toUpperCase() : "CASH";
        BigDecimal finalAmt = o.getFinalAmount() != null ? o.getFinalAmount() : BigDecimal.ZERO;
        if ("CASH".equals(pMethod)) {
            cashCollectedToHandover = cashCollectedToHandover.add(finalAmt);
        } else if ("VIETQR".equals(pMethod) || "CARD".equals(pMethod) || "PAYOS".equals(pMethod)) {
            transferCollectedAmount = transferCollectedAmount.add(finalAmt);
        }
    }
}
