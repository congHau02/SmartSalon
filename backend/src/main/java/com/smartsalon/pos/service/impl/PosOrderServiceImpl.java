package com.smartsalon.pos.service.impl;

import com.smartsalon.pos.dto.*;
import com.smartsalon.pos.service.PosOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class PosOrderServiceImpl implements PosOrderService {

    private final PosOrderLifecycleService lifecycleService;
    private final PosSettlementService settlementService;
    private final PosDispatchQueryService dispatchQueryService;
    private final PosVisualLogService visualLogService;

    @Override
    @Transactional
    public PosOrderResponse checkInBooking(Long bookingId) {
        return lifecycleService.checkInBooking(bookingId);
    }

    @Override
    @Transactional
    public PosOrderResponse createWalkInOrder(WalkInOrderRequest request) {
        return lifecycleService.createWalkInOrder(request);
    }

    @Override
    @Transactional(readOnly = true)
    public DispatchBoardResponse getDispatchBoard(Long branchId, LocalDate date) {
        return dispatchQueryService.getDispatchBoard(branchId, date);
    }

    @Override
    @Transactional(readOnly = true)
    public PosOrderResponse getOrderById(Long orderId) {
        return lifecycleService.getOrderById(orderId);
    }

    @Override
    @Transactional
    public PosOrderResponse addServiceItem(Long orderId, AddServiceItemRequest request) {
        return lifecycleService.addServiceItem(orderId, request);
    }

    @Override
    @Transactional
    public PosOrderResponse addProductItem(Long orderId, AddProductItemRequest request) {
        return lifecycleService.addProductItem(orderId, request);
    }

    @Override
    @Transactional
    public PosOrderResponse updateOrder(Long orderId, UpdateOrderRequest request) {
        return lifecycleService.updateOrder(orderId, request);
    }

    @Override
    @Transactional
    public PosOrderResponse removeOrderItem(Long orderId, Long itemId) {
        return lifecycleService.removeOrderItem(orderId, itemId);
    }

    @Override
    @Transactional
    public PosStepAssignmentResponse updateStepAssignment(Long orderId, Long stepId, UpdateStepAssignmentRequest request) {
        return lifecycleService.updateStepAssignment(orderId, stepId, request);
    }

    @Override
    @Transactional
    public PosStepAssignmentResponse updateStepStatus(Long orderId, Long stepId, UpdateStepStatusRequest request) {
        return lifecycleService.updateStepStatus(orderId, stepId, request);
    }

    @Override
    @Transactional(readOnly = true)
    public TechnicalLogResponse getVisualLog(Long orderId) {
        return visualLogService.getVisualLog(orderId);
    }

    @Override
    @Transactional
    public TechnicalLogResponse saveVisualLog(Long orderId, SaveTechnicalLogRequest request) {
        return visualLogService.saveVisualLog(orderId, request);
    }

    @Override
    @Transactional
    public PosOrderResponse checkoutOrder(Long orderId, CheckoutRequest request) {
        return settlementService.checkoutOrder(orderId, request);
    }

    @Override
    @Transactional(readOnly = true)
    public PosVietQrResponse getPosVietQr(Long orderId) {
        return lifecycleService.getPosVietQr(orderId, null);
    }

    @Override
    @Transactional(readOnly = true)
    public PosVietQrResponse getPosVietQr(Long orderId, BigDecimal draftDiscountAmount) {
        return lifecycleService.getPosVietQr(orderId, draftDiscountAmount);
    }

    @Override
    @Transactional(readOnly = true)
    public CommissionLedgerSummaryResponse getCommissionLedger(Long branchId, LocalDate date) {
        return dispatchQueryService.getCommissionLedger(branchId, date);
    }

    @Override
    @Transactional
    public PosOrderResponse createQuickServiceTicket(QuickServiceTicketRequest request) {
        return settlementService.createQuickServiceTicket(request);
    }

    @Override
    @Transactional
    public PosOrderResponse quickCompleteBooking(Long bookingId, QuickCompleteBookingRequest request) {
        return settlementService.quickCompleteBooking(bookingId, request);
    }

    @Override
    @Transactional(readOnly = true)
    public StylistDailyWorklogResponse getStylistDailyWorklog(Long branchId, Long stylistId, LocalDate date) {
        return dispatchQueryService.getStylistDailyWorklog(branchId, stylistId, date);
    }
}
