package com.smartsalon.pos.service.impl;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.payment.VietQrUrlBuilder;
import com.smartsalon.pos.dto.*;
import com.smartsalon.pos.entity.*;
import com.smartsalon.pos.repository.OrderRepository;
import com.smartsalon.pos.repository.OrderStepAssignmentRepository;
import com.smartsalon.realtime.service.RealtimeNotificationService;
import com.smartsalon.user.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PosOrderLifecycleService {

    private final OrderRepository orderRepository;
    private final OrderStepAssignmentRepository stepAssignmentRepository;
    private final RealtimeNotificationService realtimeNotificationService;
    private final PosOrderCreationHelper creationHelper;
    private final PosStaffResolutionHelper staffResolutionHelper;
    private final PosOrderMapper orderMapper;

    @Value("${app.payos.bank-id:MB}")
    private String bankId;

    @Value("${app.payos.account-no:0988888888}")
    private String accountNo;

    @Value("${app.payos.account-name:SMART SALON VIETNAM}")
    private String accountName;

    @Transactional
    public PosOrderResponse checkInBooking(Long bookingId) {
        BookingEntity booking = creationHelper.findBookingOrThrow(bookingId);
        if (orderRepository.existsByBookingIdAndStatusNotAndIsDeletedFalse(bookingId, OrderStatus.CANCELLED)) {
            throw new AppException(ErrorCode.ORDER_ALREADY_EXISTS_FOR_BOOKING);
        }
        if (booking.getStatus() != BookingStatus.CONFIRMED && booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
        }

        BookingStatus oldStatus = booking.getStatus();
        booking.setStatus(BookingStatus.CHECKED_IN);
        creationHelper.saveBooking(booking);

        OrderEntity order = creationHelper.buildOrderFromBooking(booking);
        OrderEntity savedOrder = orderRepository.save(order);

        realtimeNotificationService.notifyBookingStatusChanged(booking, oldStatus, BookingStatus.CHECKED_IN);
        realtimeNotificationService.notifyOrderCheckedIn(savedOrder);
        return orderMapper.toOrderResponse(savedOrder);
    }

    @Transactional
    public PosOrderResponse createWalkInOrder(WalkInOrderRequest request) {
        BranchEntity branch = creationHelper.findBranchOrThrow(request.getBranchId(), false);
        UserEntity assignedStylist = staffResolutionHelper.findStaffByIdOrNull(request.getStylistId());
        if (assignedStylist == null) {
            assignedStylist = staffResolutionHelper.resolveDefaultStaff(branch);
        }

        OrderEntity order = creationHelper.buildDraftWalkInOrQuickOrder(
                branch, request.isQuickGuest(), request.getCustomerPhone(), request.getCustomerName(),
                request.getNotes(), assignedStylist, request.getServiceIds(), request.getProductItems());
        order.applyMembershipTierDiscountIfAutomatic();

        OrderEntity savedOrder = orderRepository.save(order);
        realtimeNotificationService.notifyWalkInCreated(savedOrder);
        return orderMapper.toOrderResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public PosOrderResponse getOrderById(Long orderId) {
        return orderMapper.toOrderResponse(findEditableOrReadableOrder(orderId, false));
    }

    @Transactional
    public PosOrderResponse addServiceItem(Long orderId, AddServiceItemRequest request) {
        OrderEntity order = findEditableOrReadableOrder(orderId, true);
        UserEntity assignedStaff = staffResolutionHelper.findStaffByIdOrNull(request.getStaffId());
        creationHelper.addServiceToOrder(order, request.getServiceId(), assignedStaff);
        return recalculateSaveAndNotify(order);
    }

    @Transactional
    public PosOrderResponse addProductItem(Long orderId, AddProductItemRequest request) {
        OrderEntity order = findEditableOrReadableOrder(orderId, true);
        creationHelper.addProductToOrder(order, request.getProductId(), request.getQuantity());
        return recalculateSaveAndNotify(order);
    }

    @Transactional
    public PosOrderResponse updateOrder(Long orderId, UpdateOrderRequest request) {
        OrderEntity order = findEditableOrReadableOrder(orderId, true);
        if (request.getDiscountAmount() != null) {
            order.applyManualDiscount(request.getDiscountAmount());
        }
        if (request.getNotes() != null) {
            order.setNotes(request.getNotes());
        }
        return recalculateSaveAndNotify(order);
    }

    @Transactional
    public PosOrderResponse removeOrderItem(Long orderId, Long itemId) {
        OrderEntity order = findEditableOrReadableOrder(orderId, true);
        OrderItemEntity itemToRemove = order.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_ITEM_NOT_FOUND));
        order.removeItem(itemToRemove);
        return recalculateSaveAndNotify(order);
    }

    @Transactional
    public PosStepAssignmentResponse updateStepAssignment(Long orderId, Long stepId, UpdateStepAssignmentRequest request) {
        OrderEntity order = findEditableOrReadableOrder(orderId, true);
        OrderStepAssignmentEntity step = findStepBelongingToOrder(orderId, stepId);

        if (request.getStaffId() != null) {
            step.setStaff(staffResolutionHelper.findStaffByIdOrThrow(request.getStaffId(), ErrorCode.STYLIST_NOT_FOUND));
        }
        if (request.getCommissionRate() != null) {
            step.setCommissionRate(request.getCommissionRate());
        }
        step.recalculateCommissionAmount();

        OrderStepAssignmentEntity savedStep = stepAssignmentRepository.save(step);
        realtimeNotificationService.notifyStepUpdated(order);
        return orderMapper.toStepResponse(savedStep);
    }

    @Transactional
    public PosStepAssignmentResponse updateStepStatus(Long orderId, Long stepId, UpdateStepStatusRequest request) {
        OrderEntity order = findEditableOrReadableOrder(orderId, true);
        OrderStepAssignmentEntity step = findStepBelongingToOrder(orderId, stepId);

        StepAssignmentStatus newStatus = request.getStatus();
        step.setStatus(newStatus);
        applyOrderAndBookingStepTransition(order, step, stepId, newStatus);

        OrderStepAssignmentEntity savedStep = stepAssignmentRepository.save(step);
        OrderEntity savedOrder = orderRepository.save(order);
        realtimeNotificationService.notifyStepUpdated(savedOrder);
        return orderMapper.toStepResponse(savedStep);
    }

    @Transactional(readOnly = true)
    public PosVietQrResponse getPosVietQr(Long orderId, BigDecimal draftDiscountAmount) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        staffResolutionHelper.checkBranchAccess(order.getBranch() != null ? order.getBranch().getId() : null);
        if (order.isDeleted()) {
            throw new AppException(ErrorCode.ORDER_NOT_FOUND);
        }

        BigDecimal finalAmount = order.payableAfterCredit(order.calculateFinalAmountWithDraftDiscount(draftDiscountAmount));
        String desc = order.getOrderCode();
        String qrCodeUrl = VietQrUrlBuilder.buildCompactQrUrl(bankId, accountNo, accountName, finalAmount, desc);

        return PosVietQrResponse.builder()
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .finalAmount(finalAmount)
                .bankId(bankId)
                .accountNo(accountNo)
                .accountName(accountName)
                .qrCodeUrl(qrCodeUrl)
                .description(desc)
                .build();
    }

    private OrderEntity findEditableOrReadableOrder(Long orderId, boolean requireEditable) {
        OrderEntity order = orderRepository.findByIdAndIsDeletedFalse(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        staffResolutionHelper.checkBranchAccess(order.getBranch() != null ? order.getBranch().getId() : null);
        if (requireEditable && (order.getStatus() == OrderStatus.PAID || order.getStatus() == OrderStatus.CANCELLED)) {
            throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
        }
        return order;
    }

    private OrderStepAssignmentEntity findStepBelongingToOrder(Long orderId, Long stepId) {
        OrderStepAssignmentEntity step = stepAssignmentRepository.findById(stepId)
                .orElseThrow(() -> new AppException(ErrorCode.STEP_ASSIGNMENT_NOT_FOUND));
        if (!step.getOrderItem().getOrder().getId().equals(orderId)) {
            throw new AppException(ErrorCode.STEP_ASSIGNMENT_NOT_FOUND);
        }
        return step;
    }

    private PosOrderResponse recalculateSaveAndNotify(OrderEntity order) {
        order.recalculateTotals();
        order.applyMembershipTierDiscountIfAutomatic();
        OrderEntity savedOrder = orderRepository.save(order);
        realtimeNotificationService.notifyOrderUpdated(savedOrder);
        return orderMapper.toOrderResponse(savedOrder);
    }

    private void applyOrderAndBookingStepTransition(
            OrderEntity order,
            OrderStepAssignmentEntity step,
            Long stepId,
            StepAssignmentStatus newStatus) {

        if (newStatus != StepAssignmentStatus.IN_PROGRESS && newStatus != StepAssignmentStatus.COMPLETED) {
            return;
        }
        if (newStatus == StepAssignmentStatus.IN_PROGRESS && step.getStartedAt() == null) {
            step.setStartedAt(LocalDateTime.now());
        }
        if (newStatus == StepAssignmentStatus.COMPLETED && step.getCompletedAt() == null) {
            step.setCompletedAt(LocalDateTime.now());
        }
        if (order.getStatus() == OrderStatus.CHECKED_IN) {
            order.setStatus(OrderStatus.IN_PROGRESS);
            BookingStatus oldBookingStatus = creationHelper.advanceLinkedBookingToInProgressIfNeeded(order);
            if (oldBookingStatus != null) {
                realtimeNotificationService.notifyBookingStatusChanged(order.getBooking(), oldBookingStatus, BookingStatus.IN_PROGRESS);
            }
        }
        if (newStatus == StepAssignmentStatus.COMPLETED) {
            List<OrderStepAssignmentEntity> allSteps = stepAssignmentRepository.findByOrderId(order.getId());
            boolean allCompleted = allSteps.stream()
                    .allMatch(s -> s.getId().equals(stepId) || s.getStatus() == StepAssignmentStatus.COMPLETED);
            if (allCompleted) {
                order.setStatus(OrderStatus.READY_FOR_CHECKOUT);
            }
        }
    }
}
