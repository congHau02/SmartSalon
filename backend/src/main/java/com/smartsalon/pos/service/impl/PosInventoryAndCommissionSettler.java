package com.smartsalon.pos.service.impl;

import com.smartsalon.inventory.service.InventoryService;
import com.smartsalon.pos.entity.*;
import com.smartsalon.pos.repository.CommissionLedgerRepository;
import com.smartsalon.pos.repository.OrderStepAssignmentRepository;
import com.smartsalon.pos.repository.TechnicalLogRepository;
import com.smartsalon.pos.service.OrderBomResolver;
import com.smartsalon.user.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class PosInventoryAndCommissionSettler {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final InventoryService inventoryService;
    private final TechnicalLogRepository technicalLogRepository;
    private final OrderBomResolver orderBomResolver;
    private final OrderStepAssignmentRepository stepAssignmentRepository;
    private final CommissionLedgerRepository commissionLedgerRepository;
    private final PosStaffResolutionHelper staffResolutionHelper;

    public void deductInventoryAndRecordCommissions(OrderEntity order) {
        deductChemicalConsumables(order);
        deductRetailProducts(order);
        completeStepsAndRecordCommission(order);
    }

    private void deductChemicalConsumables(OrderEntity order) {
        Long branchId = order.getBranch().getId();
        Optional<TechnicalLogEntity> techLogOpt = technicalLogRepository.findByOrderIdAndIsDeletedFalse(order.getId());
        Map<Long, BigDecimal> effectiveBom = orderBomResolver.resolveEffectiveDeductionVolumes(order, techLogOpt);

        for (Map.Entry<Long, BigDecimal> entry : effectiveBom.entrySet()) {
            if (entry.getValue() != null && entry.getValue().compareTo(BigDecimal.ZERO) > 0) {
                inventoryService.deductConsumables(branchId, entry.getKey(), entry.getValue(), order.getId());
            }
        }
    }

    private void deductRetailProducts(OrderEntity order) {
        Long branchId = order.getBranch().getId();
        for (OrderItemEntity item : order.getItems()) {
            if (!item.isDeleted() && item.getItemType() == OrderItemType.PRODUCT && item.getProduct() != null) {
                inventoryService.deductRetailProduct(branchId, item.getProduct().getId(), item.getQuantity(), order.getId());
            }
        }
    }

    private void completeStepsAndRecordCommission(OrderEntity order) {
        LocalDateTime now = LocalDateTime.now();
        for (OrderItemEntity item : order.getItems()) {
            if (item.isDeleted() || item.getItemType() != OrderItemType.SERVICE) {
                continue;
            }
            for (OrderStepAssignmentEntity step : item.getStepAssignments()) {
                completeSingleStepAndRecordLedger(order, step, now);
            }
        }
    }

    private void completeSingleStepAndRecordLedger(
            OrderEntity order,
            OrderStepAssignmentEntity step,
            LocalDateTime now) {

        if (step.getStartedAt() == null) step.setStartedAt(now);
        if (step.getCompletedAt() == null) step.setCompletedAt(now);
        step.setStatus(StepAssignmentStatus.COMPLETED);

        BigDecimal commissionAmount = step.recalculateCommissionAmount();
        UserEntity staff = step.getStaff() != null ? step.getStaff() : staffResolutionHelper.resolveOrderStaff(order);
        String calculationNotes = step.formatCalculationNotes();

        boolean isOvertime = staffResolutionHelper.isStepOvertime(order, step, staff, now, DEFAULT_ZONE);
        if (isOvertime) {
            commissionAmount = commissionAmount.multiply(new BigDecimal("1.2")).setScale(0, RoundingMode.HALF_UP);
            step.setCommissionAmount(commissionAmount);
            calculationNotes = (calculationNotes != null ? calculationNotes : "") + " [OT 1.2x]";
        }

        stepAssignmentRepository.save(step);
        commissionLedgerRepository.save(CommissionLedgerEntity.builder()
                .staff(staff)
                .order(order)
                .stepAssignment(step)
                .amount(commissionAmount)
                .status("EARNED")
                .calculationNotes(calculationNotes)
                .overtime(isOvertime)
                .build());
    }
}
