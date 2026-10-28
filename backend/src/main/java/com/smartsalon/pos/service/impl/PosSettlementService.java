package com.smartsalon.pos.service.impl;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.pos.dto.CheckoutRequest;
import com.smartsalon.pos.dto.PosOrderResponse;
import com.smartsalon.pos.dto.QuickCompleteBookingRequest;
import com.smartsalon.pos.dto.QuickServiceTicketRequest;
import com.smartsalon.pos.entity.*;
import com.smartsalon.pos.repository.OrderRepository;
import com.smartsalon.user.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class PosSettlementService {

    private final OrderRepository orderRepository;
    private final PosOrderLifecycleService lifecycleService;
    private final PosOrderCreationHelper creationHelper;
    private final PosInventoryAndCommissionSettler inventoryAndCommissionSettler;
    private final PosCustomerAndPaymentSettler customerAndPaymentSettler;
    private final PosOrderMapper orderMapper;

    @Transactional
    public PosOrderResponse checkoutOrder(Long orderId, CheckoutRequest request) {
        OrderEntity order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        customerAndPaymentSettler.checkBranchAccess(order);
        if (order.isDeleted()) {
            throw new AppException(ErrorCode.ORDER_NOT_FOUND);
        }
        if (order.getStatus() == OrderStatus.PAID || order.getStatus() == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
        }

        long activeItemCount = order.getItems().stream().filter(i -> !i.isDeleted()).count();
        if (activeItemCount == 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        if (request != null && request.getDiscountAmount() != null) {
            if (request.getDiscountAmount().compareTo(BigDecimal.ZERO) < 0) {
                throw new AppException(ErrorCode.VALIDATION_ERROR);
            }
            order.applyManualDiscount(request.getDiscountAmount());
        }
        if (request != null && request.getNotes() != null) {
            order.setNotes(request.getNotes());
        }
        order.recalculateTotals();

        String paymentMethod = resolvePaymentMethod(request != null ? request.getPaymentMethod() : null);
        return executeUnifiedSettlement(order, paymentMethod, creationHelper.resolveCurrentUser());
    }

    @Transactional
    public PosOrderResponse createQuickServiceTicket(QuickServiceTicketRequest request) {
        BranchEntity branch = creationHelper.findBranchOrThrow(request.getBranchId(), true);
        UserEntity currentUser = creationHelper.resolveCurrentUser();
        UserEntity assignedStylist = resolveQuickStylist(request.getStylistId(), currentUser, branch);

        OrderEntity order = creationHelper.buildDraftWalkInOrQuickOrder(
                branch, request.isQuickGuest(), request.getCustomerPhone(), request.getCustomerName(),
                request.getNotes(), assignedStylist, request.getServiceIds(), request.getProductItems());

        if (request.getDiscountAmount() != null) {
            order.applyManualDiscount(request.getDiscountAmount());
        } else {
            order.applyMembershipTierDiscountIfAutomatic();
        }
        order.recalculateTotals();

        String paymentMethod = resolvePaymentMethod(request.getPaymentMethod());
        order.setPaymentMethod(paymentMethod);

        OrderEntity savedOrder = orderRepository.save(order);
        OrderEntity lockedOrder = orderRepository.findByIdForUpdate(savedOrder.getId()).orElse(savedOrder);
        UserEntity settlingUser = currentUser != null ? currentUser : assignedStylist;
        return executeUnifiedSettlement(lockedOrder, paymentMethod, settlingUser);
    }

    @Transactional
    public PosOrderResponse quickCompleteBooking(Long bookingId, QuickCompleteBookingRequest request) {
        BookingEntity booking = creationHelper.findBookingOrThrow(bookingId);
        UserEntity currentUser = creationHelper.resolveCurrentUser();
        UserEntity stylist = resolveBookingStylist(booking, currentUser);

        OrderEntity order = ensureAndLockOrderForBooking(booking, stylist);
        if (order.getStatus() == OrderStatus.PAID || order.getStatus() == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVALID_ORDER_STATUS, "Đơn hàng đã được thanh toán");
        }

        if (request != null && request.getServiceIds() != null && !request.getServiceIds().isEmpty()) {
            appendMissingServices(order, request.getServiceIds(), stylist);
        }
        ensureAllStepsHaveStaff(order, stylist);

        if (request != null && request.getDiscountAmount() != null) {
            order.applyManualDiscount(request.getDiscountAmount());
        }
        if (request != null && request.getNotes() != null) {
            order.setNotes(request.getNotes());
        }
        order.recalculateTotals();

        String paymentMethod = resolvePaymentMethod(request != null ? request.getPaymentMethod() : null);
        order.setPaymentMethod(paymentMethod);

        UserEntity settlingUser = currentUser != null ? currentUser : stylist;
        return executeUnifiedSettlement(order, paymentMethod, settlingUser);
    }

    private PosOrderResponse executeUnifiedSettlement(OrderEntity order, String paymentMethod, UserEntity settlingUser) {
        if (order.getStatus() == OrderStatus.PAID || order.getStatus() == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
        }

        UserEntity lockedCustomer = customerAndPaymentSettler.lockCustomerAndApplyRetainedCredit(order);
        inventoryAndCommissionSettler.deductInventoryAndRecordCommissions(order);
        customerAndPaymentSettler.recordPaymentTransaction(order, paymentMethod);

        order.setPaymentMethod(paymentMethod);
        order.setSettledBy(settlingUser);
        order.setSettledAt(Instant.now());
        order.setStatus(OrderStatus.PAID);
        OrderEntity savedOrder = orderRepository.save(order);

        customerAndPaymentSettler.finalizePostSettlement(savedOrder, lockedCustomer);
        return orderMapper.toOrderResponse(savedOrder);
    }

    private UserEntity resolveQuickStylist(Long requestedStylistId, UserEntity currentUser, BranchEntity branch) {
        if (requestedStylistId != null) {
            return creationHelper.findActiveStaffByIdOrThrow(
                    requestedStylistId, "Không tìm thấy stylist với ID: " + requestedStylistId);
        }
        if (currentUser != null && currentUser.getRoles().stream().anyMatch(r -> "STYLIST".equals(r.getName()))) {
            return currentUser;
        }
        return creationHelper.resolveDefaultStaff(branch);
    }

    private UserEntity resolveBookingStylist(BookingEntity booking, UserEntity currentUser) {
        if (booking.getStaff() != null) return booking.getStaff();
        if (currentUser != null && currentUser.getRoles().stream().anyMatch(r -> "STYLIST".equals(r.getName()))) {
            return currentUser;
        }
        return creationHelper.resolveDefaultStaff(booking.getBranch());
    }

    private OrderEntity ensureAndLockOrderForBooking(BookingEntity booking, UserEntity stylist) {
        OrderEntity order = orderRepository.findByBookingIdAndIsDeletedFalse(booking.getId()).orElse(null);
        if (order == null) {
            if (booking.getStaff() == null) {
                booking.setStaff(stylist);
                creationHelper.saveBooking(booking);
            }
            lifecycleService.checkInBooking(booking.getId());
            order = orderRepository.findByBookingIdAndIsDeletedFalse(booking.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        }
        return orderRepository.findByIdForUpdate(order.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    }

    private void appendMissingServices(OrderEntity order, List<Long> requestedServiceIds, UserEntity stylist) {
        Set<Long> existingServiceIds = new HashSet<>();
        for (OrderItemEntity item : order.getItems()) {
            if (!item.isDeleted() && item.getItemType() == OrderItemType.SERVICE && item.getService() != null) {
                existingServiceIds.add(item.getService().getId());
            }
        }
        for (Long serviceId : requestedServiceIds) {
            if (!existingServiceIds.contains(serviceId)) {
                creationHelper.addServiceToOrder(order, serviceId, stylist);
            }
        }
    }

    private void ensureAllStepsHaveStaff(OrderEntity order, UserEntity fallbackStylist) {
        for (OrderItemEntity item : order.getItems()) {
            if (item.isDeleted() || item.getStepAssignments() == null) continue;
            for (OrderStepAssignmentEntity step : item.getStepAssignments()) {
                if (step.getStaff() == null) {
                    step.setStaff(fallbackStylist);
                }
            }
        }
    }

    private String resolvePaymentMethod(String requestedMethod) {
        return StringUtils.hasText(requestedMethod) ? requestedMethod.trim().toUpperCase() : "CASH";
    }
}
