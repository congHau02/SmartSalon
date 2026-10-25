package com.smartsalon.pos.service;

import com.smartsalon.pos.dto.*;

import java.time.LocalDate;

public interface PosOrderService {

    PosOrderResponse checkInBooking(Long bookingId);

    PosOrderResponse createWalkInOrder(WalkInOrderRequest request);

    DispatchBoardResponse getDispatchBoard(Long branchId, LocalDate date);

    PosOrderResponse getOrderById(Long orderId);

    PosOrderResponse addServiceItem(Long orderId, AddServiceItemRequest request);

    PosOrderResponse addProductItem(Long orderId, AddProductItemRequest request);

    PosOrderResponse updateOrder(Long orderId, UpdateOrderRequest request);

    PosOrderResponse removeOrderItem(Long orderId, Long itemId);

    PosStepAssignmentResponse updateStepAssignment(Long orderId, Long stepId, UpdateStepAssignmentRequest request);

    PosStepAssignmentResponse updateStepStatus(Long orderId, Long stepId, UpdateStepStatusRequest request);

    TechnicalLogResponse getVisualLog(Long orderId);

    TechnicalLogResponse saveVisualLog(Long orderId, SaveTechnicalLogRequest request);

    PosOrderResponse checkoutOrder(Long orderId, CheckoutRequest request);

    PosVietQrResponse getPosVietQr(Long orderId);

    PosVietQrResponse getPosVietQr(Long orderId, java.math.BigDecimal draftDiscountAmount);

    CommissionLedgerSummaryResponse getCommissionLedger(Long branchId, LocalDate date);

    PosOrderResponse createQuickServiceTicket(QuickServiceTicketRequest request);

    PosOrderResponse quickCompleteBooking(Long bookingId, QuickCompleteBookingRequest request);

    StylistDailyWorklogResponse getStylistDailyWorklog(Long branchId, Long stylistId, LocalDate date);
}
