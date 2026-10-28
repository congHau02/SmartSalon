package com.smartsalon.customer.service.impl;

import com.smartsalon.booking.dto.BookingServiceItemDto;
import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.customer.dto.*;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.pos.entity.OrderItemEntity;
import com.smartsalon.pos.entity.OrderStatus;
import com.smartsalon.pos.entity.OrderStepAssignmentEntity;
import com.smartsalon.pos.entity.TechnicalLogEntity;
import com.smartsalon.pos.repository.TechnicalLogRepository;
import com.smartsalon.review.entity.ServiceReviewEntity;
import com.smartsalon.review.repository.ServiceReviewRepository;
import com.smartsalon.user.entity.MembershipTier;
import com.smartsalon.user.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Component
@RequiredArgsConstructor
public class CustomerPortalMapper {

    private final TechnicalLogRepository technicalLogRepository;
    private final ServiceReviewRepository serviceReviewRepository;

    public CustomerLoyaltyDto toLoyaltyDto(UserEntity user, boolean canViewFullPii) {
        MembershipTier tier = user.getMembershipTier() != null ? user.getMembershipTier() : MembershipTier.STANDARD;
        BigDecimal spent = user.getTotalSpent() != null ? user.getTotalSpent() : BigDecimal.ZERO;
        BigDecimal credit = user.getCreditBalance() != null ? user.getCreditBalance() : BigDecimal.ZERO;

        return CustomerLoyaltyDto.builder()
                .customerId(canViewFullPii ? user.getId() : null)
                .fullName(canViewFullPii ? user.getFullName() : maskFullName(user.getFullName()))
                .phone(user.getPhone())
                .membershipTier(tier)
                .discountPercent(tier.getDiscountPercent())
                .totalSpent(canViewFullPii ? spent : null)
                .nextTier(tier.getNextTier())
                .amountToNextTier(tier.getAmountToNextTier(spent))
                .creditBalance(canViewFullPii ? credit : null)
                .isProvisional(user.isProvisional())
                .build();
    }

    public CustomerLoyaltyDto defaultLoyaltyPreview(String phone, boolean canViewFullPii) {
        MembershipTier standard = MembershipTier.STANDARD;
        return CustomerLoyaltyDto.builder()
                .phone(phone)
                .membershipTier(standard)
                .discountPercent(standard.getDiscountPercent())
                .totalSpent(canViewFullPii ? BigDecimal.ZERO : null)
                .nextTier(standard.getNextTier())
                .amountToNextTier(standard.getAmountToNextTier(BigDecimal.ZERO))
                .creditBalance(canViewFullPii ? BigDecimal.ZERO : null)
                .isProvisional(true)
                .build();
    }

    public CustomerSummaryDto toSummaryDto(UserEntity user, long completedVisits, long upcomingBookings) {
        MembershipTier tier = user.getMembershipTier() != null ? user.getMembershipTier() : MembershipTier.STANDARD;
        BigDecimal spent = user.getTotalSpent() != null ? user.getTotalSpent() : BigDecimal.ZERO;
        BigDecimal credit = user.getCreditBalance() != null ? user.getCreditBalance() : BigDecimal.ZERO;

        return CustomerSummaryDto.builder()
                .customerId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .membershipTier(tier)
                .discountPercent(tier.getDiscountPercent())
                .totalSpent(spent)
                .nextTier(tier.getNextTier())
                .amountToNextTier(tier.getAmountToNextTier(spent))
                .creditBalance(credit)
                .isProvisional(user.isProvisional())
                .totalCompletedVisits(completedVisits)
                .upcomingBookingCount(upcomingBookings)
                .build();
    }

    public CustomerBookingResponse toBookingResponse(BookingEntity b, LocalDateTime now) {
        List<BookingServiceItemDto> items = (b.getItems() != null) ? b.getItems().stream()
                .map(item -> new BookingServiceItemDto(
                        item.getId(),
                        item.getService() != null ? item.getService().getId() : null,
                        item.getService() != null ? item.getService().getName() : "",
                        item.getPrice(),
                        item.getDurationMinutes()
                ))
                .toList() : List.of();

        return new CustomerBookingResponse(
                b.getId(),
                b.getBookingCode(),
                b.getBranch() != null ? b.getBranch().getId() : null,
                b.getBranch() != null ? b.getBranch().getName() : "",
                b.getCustomer() != null ? b.getCustomer().getId() : null,
                b.resolvedCustomerName(),
                b.resolvedCustomerPhone(),
                b.getStaff() != null ? b.getStaff().getId() : null,
                b.getStaff() != null ? b.getStaff().getFullName() : null,
                b.isStylistRequested(),
                b.getBookingTime(),
                b.getEndTime(),
                b.getTotalDurationMinutes(),
                b.getTotalPrice(),
                b.getDepositAmount(),
                b.getDepositStatus(),
                b.getStatus(),
                b.getNotes(),
                b.canCancelOnline(now),
                b.resolveCancelPolicyNotice(now),
                items,
                b.getCreatedAt()
        );
    }

    public List<CustomerStylistDto> resolveParticipatingStylists(OrderEntity order) {
        Optional<TechnicalLogEntity> techLogOpt = technicalLogRepository.findByOrderIdAndIsDeletedFalse(order.getId());
        return resolveParticipatingStylists(order, techLogOpt.orElse(null));
    }

    public CustomerOrderResponse toOrderResponse(OrderEntity order) {
        Optional<TechnicalLogEntity> techLogOpt = technicalLogRepository.findByOrderIdAndIsDeletedFalse(order.getId());
        Optional<ServiceReviewEntity> reviewOpt = serviceReviewRepository.findByOrderIdAndIsDeletedFalse(order.getId());
        List<CustomerStylistDto> participatingStylists = resolveParticipatingStylists(order, techLogOpt.orElse(null));
        CustomerStylistDto primaryStylist = participatingStylists.isEmpty() ? null : participatingStylists.get(0);
        CustomerReviewDto reviewDto = reviewOpt.map(this::toReviewDto).orElse(null);
        boolean canReview = (reviewDto == null) && (order.getStatus() == OrderStatus.PAID) && order.hasServiceItems();
        OrderEntity.RevenueBreakdown breakdown = order.calculateRevenueBreakdown();

        return CustomerOrderResponse.builder()
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .branchId(order.getBranch() != null ? order.getBranch().getId() : null)
                .branchName(order.getBranch() != null ? order.getBranch().getName() : "")
                .createdAt(order.getCreatedAt())
                .status(order.getStatus())
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .depositDeducted(order.getDepositDeducted())
                .finalAmount(order.getFinalAmount())
                .netRevenue(breakdown.totalNetRevenue())
                .items(mapOrderItems(order))
                .participatingStylists(participatingStylists)
                .primaryStylist(primaryStylist)
                .visualLog(techLogOpt.map(this::toVisualLogDto).orElse(null))
                .review(reviewDto)
                .canReview(canReview)
                .build();
    }

    public CustomerReviewDto toReviewDto(ServiceReviewEntity r) {
        return CustomerReviewDto.builder()
                .id(r.getId())
                .orderId(r.getOrder() != null ? r.getOrder().getId() : null)
                .customerId(r.getCustomer() != null ? r.getCustomer().getId() : null)
                .stylistId(r.getStylist() != null ? r.getStylist().getId() : null)
                .stylistName(r.getStylist() != null ? r.getStylist().getFullName() : null)
                .stylistAvatarUrl(r.getStylist() != null ? r.getStylist().getAvatarUrl() : null)
                .branchId(r.getBranch() != null ? r.getBranch().getId() : null)
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .build();
    }

    private CustomerVisualLogDto toVisualLogDto(TechnicalLogEntity t) {
        return CustomerVisualLogDto.builder()
                .id(t.getId())
                .beforeImageUrl(t.getBeforeImageUrl())
                .afterImageUrl(t.getAfterImageUrl())
                .hairConditionNotes(t.getHairConditionNotes())
                .formulaNotes(t.getFormulaNotes())
                .createdAt(t.getCreatedAt())
                .build();
    }

    private List<CustomerOrderItemDto> mapOrderItems(OrderEntity order) {
        if (order.getItems() == null) return List.of();
        return order.getItems().stream()
                .filter(i -> !i.isDeleted())
                .map(i -> CustomerOrderItemDto.builder()
                        .id(i.getId())
                        .itemType(i.getItemType() != null ? i.getItemType().name() : null)
                        .serviceId(i.getService() != null ? i.getService().getId() : null)
                        .productId(i.getProduct() != null ? i.getProduct().getId() : null)
                        .name(i.getService() != null ? i.getService().getName() : (i.getProduct() != null ? i.getProduct().getName() : ""))
                        .unitPrice(i.getUnitPrice())
                        .quantity(i.getQuantity())
                        .totalPrice(i.getTotalPrice())
                        .build())
                .toList();
    }

    private List<CustomerStylistDto> resolveParticipatingStylists(OrderEntity order, TechnicalLogEntity techLog) {
        Map<Long, StylistAccumulator> stylistMap = collectStylistAccumulators(order, techLog);
        Long bookingStaffId = (order.getBooking() != null && order.getBooking().getStaff() != null)
                ? order.getBooking().getStaff().getId() : null;

        List<StylistAccumulator> accumulators = new ArrayList<>(stylistMap.values());
        accumulators.sort((a, b) -> compareAccumulators(a, b, bookingStaffId));

        return accumulators.stream()
                .map(acc -> CustomerStylistDto.builder()
                        .id(acc.staff.getId())
                        .fullName(acc.staff.getFullName())
                        .phone(acc.staff.getPhone())
                        .avatarUrl(acc.staff.getAvatarUrl())
                        .totalCommission(acc.commissionAmount)
                        .build())
                .toList();
    }

    private Map<Long, StylistAccumulator> collectStylistAccumulators(OrderEntity order, TechnicalLogEntity techLog) {
        Map<Long, StylistAccumulator> stylistMap = new LinkedHashMap<>();
        if (order.getItems() != null) {
            for (OrderItemEntity item : order.getItems()) {
                if (item.isDeleted() || item.getStepAssignments() == null) continue;
                for (OrderStepAssignmentEntity step : item.getStepAssignments()) {
                    if (step.getStaff() != null) {
                        UserEntity staff = step.getStaff();
                        stylistMap.computeIfAbsent(staff.getId(), id -> new StylistAccumulator(staff))
                                .addCommission(step.getCommissionAmount());
                    }
                }
            }
        }
        if (order.getBooking() != null && order.getBooking().getStaff() != null) {
            UserEntity bs = order.getBooking().getStaff();
            stylistMap.computeIfAbsent(bs.getId(), id -> new StylistAccumulator(bs));
        }
        if (techLog != null && techLog.getStaff() != null) {
            UserEntity ts = techLog.getStaff();
            stylistMap.computeIfAbsent(ts.getId(), id -> new StylistAccumulator(ts));
        }
        return stylistMap;
    }

    private int compareAccumulators(StylistAccumulator a, StylistAccumulator b, Long bookingStaffId) {
        int cmp = b.commissionAmount.compareTo(a.commissionAmount);
        if (cmp != 0) return cmp;
        boolean aIsBooking = bookingStaffId != null && bookingStaffId.equals(a.staff.getId());
        boolean bIsBooking = bookingStaffId != null && bookingStaffId.equals(b.staff.getId());
        if (aIsBooking && !bIsBooking) return -1;
        if (!aIsBooking && bIsBooking) return 1;
        return a.staff.getId().compareTo(b.staff.getId());
    }

    private String maskFullName(String fullName) {
        if (fullName == null || fullName.isBlank()) return "***";
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 1) {
            String p = parts[0];
            return p.length() <= 2 ? p.charAt(0) + "*" : p.charAt(0) + "*".repeat(p.length() - 2) + p.charAt(p.length() - 1);
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            String p = parts[i];
            if (i > 0) sb.append(" ");
            sb.append(p.charAt(0)).append(p.length() <= 2 ? "*" : "*".repeat(p.length() - 1));
        }
        return sb.toString();
    }

    private static class StylistAccumulator {
        private final UserEntity staff;
        private BigDecimal commissionAmount = BigDecimal.ZERO;

        StylistAccumulator(UserEntity staff) {
            this.staff = staff;
        }

        void addCommission(BigDecimal amount) {
            if (amount != null) {
                this.commissionAmount = this.commissionAmount.add(amount);
            }
        }
    }
}
