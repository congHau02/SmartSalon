package com.smartsalon.pos.service.impl;

import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.inventory.repository.ProductRepository;
import com.smartsalon.pos.dto.ActualBomItemDto;
import com.smartsalon.pos.dto.SaveTechnicalLogRequest;
import com.smartsalon.pos.dto.TechnicalLogResponse;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.pos.entity.TechnicalLogEntity;
import com.smartsalon.pos.repository.OrderRepository;
import com.smartsalon.pos.repository.TechnicalLogRepository;
import com.smartsalon.pos.service.OrderBomResolver;
import com.smartsalon.realtime.service.RealtimeNotificationService;
import com.smartsalon.user.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class PosVisualLogService {

    private final OrderRepository orderRepository;
    private final TechnicalLogRepository technicalLogRepository;
    private final ProductRepository productRepository;
    private final OrderBomResolver orderBomResolver;
    private final RealtimeNotificationService realtimeNotificationService;
    private final PosStaffResolutionHelper staffResolutionHelper;

    @Transactional(readOnly = true)
    public TechnicalLogResponse getVisualLog(Long orderId) {
        OrderEntity order = findOrderAndCheckBranch(orderId);
        Optional<TechnicalLogEntity> existingLogOpt = technicalLogRepository.findByOrderIdAndIsDeletedFalse(orderId);

        if (existingLogOpt.isPresent()) {
            TechnicalLogEntity techLog = existingLogOpt.get();
            List<ActualBomItemDto> bomItems = orderBomResolver.parseActualBomJson(techLog.getActualBomJson(), orderId);
            if (!bomItems.isEmpty() || StringUtils.hasText(techLog.getActualBomJson())) {
                Long staffId = techLog.getStaff() != null ? techLog.getStaff().getId() : null;
                String staffName = techLog.getStaff() != null ? techLog.getStaff().getFullName() : null;
                return buildResponse(techLog, order, bomItems, true, staffId, staffName);
            }
        }

        List<ActualBomItemDto> synthesizedBomItems = orderBomResolver.buildStandardBomItems(order);
        UserEntity suggestedStaff = resolveSuggestedStaff(existingLogOpt.orElse(null), order);
        Long suggestedStaffId = suggestedStaff != null ? suggestedStaff.getId() : null;
        String suggestedStaffName = suggestedStaff != null ? suggestedStaff.getFullName() : null;

        return buildResponse(existingLogOpt.orElse(null), order, synthesizedBomItems, false, suggestedStaffId, suggestedStaffName);
    }

    @Transactional
    public TechnicalLogResponse saveVisualLog(Long orderId, SaveTechnicalLogRequest request) {
        OrderEntity order = findOrderAndCheckBranch(orderId);
        UserEntity effectiveCustomer = order.getCustomer() != null
                ? order.getCustomer()
                : staffResolutionHelper.resolveWalkInGuest();
        UserEntity effectiveStaff = resolveSavingStaff(request.getStaffId(), order);

        TechnicalLogEntity techLog = technicalLogRepository.findByOrderIdAndIsDeletedFalse(orderId)
                .orElseGet(() -> TechnicalLogEntity.builder()
                        .order(order)
                        .customer(effectiveCustomer)
                        .staff(effectiveStaff)
                        .build());

        techLog.setStaff(effectiveStaff);
        techLog.setFormulaNotes(request.getFormulaNotes());
        techLog.setHairConditionNotes(request.getHairConditionNotes());
        techLog.setBeforeImageUrl(request.getBeforeImageUrl());
        techLog.setAfterImageUrl(request.getAfterImageUrl());

        List<ActualBomItemDto> items = enrichBomProductMetadata(request.getBomItems());
        serializeAndAssignBomJson(techLog, items, orderId);

        TechnicalLogEntity saved = technicalLogRepository.save(techLog);
        realtimeNotificationService.notifyVisualLogSaved(order);

        Long staffId = saved.getStaff() != null ? saved.getStaff().getId() : null;
        String staffName = saved.getStaff() != null ? saved.getStaff().getFullName() : null;
        return buildResponse(saved, order, items, true, staffId, staffName);
    }

    private OrderEntity findOrderAndCheckBranch(Long orderId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        staffResolutionHelper.checkBranchAccess(order.getBranch() != null ? order.getBranch().getId() : null);
        return order;
    }

    private UserEntity resolveSuggestedStaff(TechnicalLogEntity existingLog, OrderEntity order) {
        if (existingLog != null && existingLog.getStaff() != null) {
            return existingLog.getStaff();
        }
        return staffResolutionHelper.resolveOrderStaff(order);
    }

    private UserEntity resolveSavingStaff(Long requestedStaffId, OrderEntity order) {
        if (requestedStaffId != null) {
            return staffResolutionHelper.findStaffByIdOrThrow(requestedStaffId, ErrorCode.STYLIST_NOT_FOUND);
        }
        UserEntity resolved = staffResolutionHelper.resolveOrderStaff(order);
        return resolved != null ? resolved : staffResolutionHelper.resolveFallbackActiveStylistOrThrow();
    }

    private List<ActualBomItemDto> enrichBomProductMetadata(List<ActualBomItemDto> rawItems) {
        List<ActualBomItemDto> items = rawItems != null ? rawItems : new ArrayList<>();
        for (ActualBomItemDto item : items) {
            if (!StringUtils.hasText(item.getProductName()) && item.getProductId() != null) {
                productRepository.findById(item.getProductId()).ifPresent(p -> {
                    item.setProductName(p.getName());
                    item.setProductSku(p.getSku());
                    if (!StringUtils.hasText(item.getUnit()) && StringUtils.hasText(p.getUnit())) {
                        item.setUnit(p.getUnit());
                    }
                });
            }
        }
        return items;
    }

    private void serializeAndAssignBomJson(TechnicalLogEntity techLog, List<ActualBomItemDto> items, Long orderId) {
        try {
            techLog.setActualBomJson(orderBomResolver.serializeActualBomJson(items, orderId));
        } catch (Exception e) {
            log.error("Failed to serialize bomItems for order {}: {}", orderId, e.getMessage());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private TechnicalLogResponse buildResponse(
            TechnicalLogEntity techLog,
            OrderEntity order,
            List<ActualBomItemDto> bomItems,
            boolean isSaved,
            Long staffId,
            String staffName) {

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
                .staffId(staffId)
                .staffName(staffName)
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
