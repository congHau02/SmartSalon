package com.smartsalon.pos.service.impl;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.pos.dto.*;
import com.smartsalon.pos.entity.*;
import com.smartsalon.pos.repository.CommissionLedgerRepository;
import com.smartsalon.pos.repository.OrderRepository;
import com.smartsalon.user.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Component
@RequiredArgsConstructor
public class PosDispatchQueryService {

    private final OrderRepository orderRepository;
    private final BookingRepository bookingRepository;
    private final BranchRepository branchRepository;
    private final CommissionLedgerRepository commissionLedgerRepository;
    private final PosStaffScheduleQueryHelper scheduleQueryHelper;
    private final PosOrderMapper orderMapper;

    @Transactional(readOnly = true)
    public DispatchBoardResponse getDispatchBoard(Long branchId, LocalDate date) {
        BranchEntity branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));
        scheduleQueryHelper.checkBranchAccess(branchId);

        LocalDate targetDate = date != null ? date : LocalDate.now();
        LocalDateTime dayStart = targetDate.atStartOfDay();
        LocalDateTime dayEnd = targetDate.plusDays(1).atStartOfDay();

        List<DispatchBoardBookingDto> upcomingBookings = collectUpcomingDispatchBookings(branchId, dayStart, dayEnd);
        Collection<OrderEntity> orders = collectDispatchOrders(branchId, targetDate, dayStart, dayEnd);

        List<PosOrderResponse> checkedInOrders = new ArrayList<>();
        List<PosOrderResponse> inProgressOrders = new ArrayList<>();
        List<PosOrderResponse> readyOrPaidOrders = new ArrayList<>();
        categorizeDispatchOrders(orders, checkedInOrders, inProgressOrders, readyOrPaidOrders);

        return DispatchBoardResponse.builder()
                .branchId(branch.getId())
                .branchName(branch.getName())
                .date(targetDate.toString())
                .upcomingBookings(upcomingBookings)
                .checkedInOrders(checkedInOrders)
                .inProgressOrders(inProgressOrders)
                .readyOrPaidOrders(readyOrPaidOrders)
                .stylists(scheduleQueryHelper.buildStylistAvailabilityStrip(branchId, targetDate))
                .build();
    }

    @Transactional(readOnly = true)
    public CommissionLedgerSummaryResponse getCommissionLedger(Long branchId, LocalDate date) {
        BranchEntity branch = branchRepository.findByIdAndIsDeletedFalse(branchId)
                .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));
        scheduleQueryHelper.checkBranchAccess(branchId);

        LocalDate queryDate = date != null ? date : LocalDate.now();
        Instant startDate = queryDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endDate = queryDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        List<CommissionLedgerEntity> ledgers = commissionLedgerRepository.findByBranchAndDateRange(branchId, startDate, endDate);
        BigDecimal totalCommission = BigDecimal.ZERO;
        Map<Long, StaffCommissionSummaryDto> staffSummaryMap = new LinkedHashMap<>();
        List<CommissionLedgerEntryDto> entryDtos = new ArrayList<>();

        for (CommissionLedgerEntity ledger : ledgers) {
            BigDecimal amt = ledger.safeAmount();
            totalCommission = totalCommission.add(amt);
            accumulateStaffCommissionSummary(staffSummaryMap, ledger.getStaff(), amt);
            entryDtos.add(orderMapper.toCommissionEntryDto(ledger, amt));
        }

        return CommissionLedgerSummaryResponse.builder()
                .branchId(branch.getId())
                .branchName(branch.getName())
                .date(queryDate)
                .totalCommissionAmount(totalCommission)
                .staffSummaries(new ArrayList<>(staffSummaryMap.values()))
                .entries(entryDtos)
                .build();
    }

    @Transactional(readOnly = true)
    public StylistDailyWorklogResponse getStylistDailyWorklog(Long branchId, Long stylistId, LocalDate date) {
        LocalDate queryDate = date != null ? date : LocalDate.now();
        PosStaffScheduleQueryHelper.WorklogContext ctx = scheduleQueryHelper.resolveWorklogContext(branchId, stylistId);

        Instant startDate = queryDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endDate = queryDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        List<OrderEntity> paidOrders = orderRepository.findByBranchAndStatusAndDateRange(
                ctx.branchId(), OrderStatus.PAID, startDate, endDate);
        List<CommissionLedgerEntity> ledgers = ctx.stylistId() != null
                ? commissionLedgerRepository.findByStaffIdAndDateRange(ctx.stylistId(), startDate, endDate)
                : Collections.emptyList();

        Map<Long, BigDecimal> orderCommissionMap = new HashMap<>();
        BigDecimal totalEarnedCommission = BigDecimal.ZERO;
        for (CommissionLedgerEntity ledger : ledgers) {
            BigDecimal amt = ledger.safeAmount();
            totalEarnedCommission = totalEarnedCommission.add(amt);
            if (ledger.getOrder() != null) {
                orderCommissionMap.merge(ledger.getOrder().getId(), amt, BigDecimal::add);
            }
        }

        PosWorklogMetricsAccumulator metrics = PosWorklogMetricsAccumulator.compute(
                paidOrders, ctx.stylistId(), orderCommissionMap);
        List<DispatchBoardBookingDto> upcomingBookings = collectWorklogUpcomingBookings(
                ctx.branchId(), ctx.stylistId(), queryDate);
        PosStaffScheduleQueryHelper.StylistShiftSnapshot shift =
                scheduleQueryHelper.buildStylistShiftSnapshot(ctx.stylistId(), queryDate);

        return orderMapper.toWorklogResponse(ctx, queryDate, totalEarnedCommission, metrics, upcomingBookings, shift);
    }

    private List<DispatchBoardBookingDto> collectUpcomingDispatchBookings(
            Long branchId, LocalDateTime dayStart, LocalDateTime dayEnd) {
        List<BookingEntity> bookings = bookingRepository.findBookingsByBranchAndDay(branchId, dayStart, dayEnd);
        List<DispatchBoardBookingDto> upcomingBookings = new ArrayList<>();
        for (BookingEntity b : bookings) {
            Long linkedOrderId = orderRepository.findByBookingIdAndIsDeletedFalse(b.getId())
                    .map(OrderEntity::getId).orElse(null);
            if ((b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.PENDING_PAYMENT)
                    && linkedOrderId == null) {
                upcomingBookings.add(orderMapper.toDispatchBookingDto(b, null, "Stylist bất kỳ"));
            }
        }
        return upcomingBookings;
    }

    private Collection<OrderEntity> collectDispatchOrders(
            Long branchId, LocalDate targetDate, LocalDateTime dayStart, LocalDateTime dayEnd) {
        Instant startInstant = dayStart.atZone(ZoneId.systemDefault()).toInstant();
        Instant endInstant = dayEnd.atZone(ZoneId.systemDefault()).toInstant();

        Map<Long, OrderEntity> orderMap = new LinkedHashMap<>();
        for (OrderEntity o : orderRepository.findByBranchAndDateRange(branchId, startInstant, endInstant)) {
            orderMap.put(o.getId(), o);
        }
        if (targetDate.equals(LocalDate.now())) {
            List<OrderEntity> activeOrders = orderRepository.findByBranchIdAndStatusIn(
                    branchId, List.of(OrderStatus.CHECKED_IN, OrderStatus.IN_PROGRESS, OrderStatus.READY_FOR_CHECKOUT));
            for (OrderEntity o : activeOrders) {
                orderMap.put(o.getId(), o);
            }
        }
        return orderMap.values();
    }

    private void categorizeDispatchOrders(
            Collection<OrderEntity> orders,
            List<PosOrderResponse> checkedInOrders,
            List<PosOrderResponse> inProgressOrders,
            List<PosOrderResponse> readyOrPaidOrders) {
        for (OrderEntity o : orders) {
            PosOrderResponse resp = orderMapper.toOrderResponse(o);
            if (o.getStatus() == OrderStatus.CHECKED_IN) {
                checkedInOrders.add(resp);
            } else if (o.getStatus() == OrderStatus.IN_PROGRESS) {
                inProgressOrders.add(resp);
            } else if (o.getStatus() == OrderStatus.READY_FOR_CHECKOUT || o.getStatus() == OrderStatus.PAID) {
                readyOrPaidOrders.add(resp);
            }
        }
    }

    private void accumulateStaffCommissionSummary(
            Map<Long, StaffCommissionSummaryDto> staffSummaryMap, UserEntity staff, BigDecimal amt) {
        if (staff == null) return;
        StaffCommissionSummaryDto summary = staffSummaryMap.computeIfAbsent(staff.getId(), k ->
                StaffCommissionSummaryDto.builder()
                        .staffId(staff.getId())
                        .staffName(staff.getFullName())
                        .totalAmount(BigDecimal.ZERO)
                        .stepCount(0)
                        .build());
        summary.setTotalAmount(summary.getTotalAmount().add(amt));
        summary.setStepCount(summary.getStepCount() + 1);
    }

    private List<DispatchBoardBookingDto> collectWorklogUpcomingBookings(
            Long branchId, Long stylistId, LocalDate queryDate) {
        LocalDateTime dayStart = queryDate.atStartOfDay();
        LocalDateTime dayEnd = queryDate.plusDays(1).atStartOfDay();
        List<BookingEntity> bookings = bookingRepository.findBookingsByBranchAndDay(branchId, dayStart, dayEnd);
        List<DispatchBoardBookingDto> upcomingBookings = new ArrayList<>();

        for (BookingEntity b : bookings) {
            if (b.getStatus() != BookingStatus.CONFIRMED && b.getStatus() != BookingStatus.PENDING_PAYMENT) continue;
            if (stylistId != null && b.getStaff() != null && !b.getStaff().getId().equals(stylistId)) continue;
            Optional<OrderEntity> linkedOrder = orderRepository.findByBookingIdAndIsDeletedFalse(b.getId());
            if (linkedOrder.isEmpty() || linkedOrder.get().getStatus() != OrderStatus.PAID) {
                upcomingBookings.add(orderMapper.toDispatchBookingDto(
                        b, linkedOrder.map(OrderEntity::getId).orElse(null), "Chưa chỉ định"));
            }
        }
        return upcomingBookings;
    }
}
