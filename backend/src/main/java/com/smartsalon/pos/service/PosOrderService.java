package com.smartsalon.pos.service;

import com.smartsalon.pos.dto.DispatchBoardResponse;
import com.smartsalon.pos.dto.PosOrderResponse;
import com.smartsalon.pos.dto.WalkInOrderRequest;

import java.time.LocalDate;

public interface PosOrderService {

    PosOrderResponse checkInBooking(Long bookingId);

    PosOrderResponse createWalkInOrder(WalkInOrderRequest request);

    DispatchBoardResponse getDispatchBoard(Long branchId, LocalDate date);

    PosOrderResponse getOrderById(Long orderId);
}
