package com.smartsalon.pos.service.impl;

import com.smartsalon.shift.service.impl.ShiftDayView;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingServiceItemEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.inventory.entity.ProductEntity;
import com.smartsalon.inventory.repository.ProductRepository;
import com.smartsalon.pos.dto.*;
import com.smartsalon.pos.entity.*;
import com.smartsalon.pos.repository.OrderRepository;
import com.smartsalon.pos.repository.OrderStepAssignmentRepository;
import com.smartsalon.pos.repository.TechnicalLogRepository;
import com.smartsalon.pos.service.OrderBomResolver;
import com.smartsalon.pos.service.PosOrderService;
import com.smartsalon.realtime.service.RealtimeNotificationService;
import com.smartsalon.user.entity.MembershipTier;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.UserRepository;
import com.smartsalon.user.service.CustomerIdentityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import jakarta.persistence.EntityManager;
import com.smartsalon.inventory.service.InventoryService;
import com.smartsalon.payment.entity.PaymentTransactionEntity;
import com.smartsalon.payment.repository.PaymentTransactionRepository;
import com.smartsalon.pos.repository.CommissionLedgerRepository;
import com.smartsalon.shift.entity.StaffScheduleEntity;
import com.smartsalon.shift.entity.StaffScheduleStatus;
import com.smartsalon.shift.repository.StaffScheduleRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PosOrderServiceImpl implements PosOrderService {

    private static final DateTimeFormatter BASIC_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final String ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final OrderRepository orderRepository;
    private final OrderStepAssignmentRepository stepAssignmentRepository;
    private final BookingRepository bookingRepository;
    private final BranchRepository branchRepository;
    private final ServiceRepository serviceRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final TechnicalLogRepository technicalLogRepository;
    private final RealtimeNotificationService realtimeNotificationService;
    private final InventoryService inventoryService;
    private final CommissionLedgerRepository commissionLedgerRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final CustomerIdentityService customerIdentityService;
    private final OrderBomResolver orderBomResolver;
    private final EntityManager entityManager;
    private final com.smartsalon.security.BranchScopeGuard branchScopeGuard;
    private final StaffScheduleRepository staffScheduleRepository;
    private final com.smartsalon.shift.repository.StaffAttendanceRepository staffAttendanceRepository;

    @Value("${app.payos.bank-id:MB}")
    private String bankId;

    @Value("${app.payos.account-no:0988888888}")
    private String accountNo;

    @Value("${app.payos.account-name:SMART SALON VIETNAM}")
    private String accountName;

    @Override
    @Transactional
    public PosOrderResponse checkInBooking(Long bookingId) {
        BookingEntity booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));
        branchScopeGuard.checkBranchAccess(booking.getBranch() != null ? booking.getBranch().getId() : null);

        if (booking.isDeleted()) {
            throw new AppException(ErrorCode.BOOKING_NOT_FOUND);
        }

        if (orderRepository.existsByBookingIdAndStatusNotAndIsDeletedFalse(bookingId, OrderStatus.CANCELLED)) {
            throw new AppException(ErrorCode.ORDER_ALREADY_EXISTS_FOR_BOOKING);
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED && booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
        }

        BookingStatus oldStatus = booking.getStatus();
        booking.setStatus(BookingStatus.CHECKED_IN);
        bookingRepository.save(booking);

        String customerName = booking.resolvedCustomerName();
        String customerPhone = booking.resolvedCustomerPhone();

        BigDecimal depositDeducted = BigDecimal.ZERO;
        if (booking.getDepositStatus() == DepositStatus.PAID && booking.getDepositAmount() != null) {
            depositDeducted = booking.getDepositAmount();
        }

        String orderCode = generateOrderCode();

        OrderEntity order = OrderEntity.builder()
                .branch(booking.getBranch())
                .customer(booking.getCustomer())
                .booking(booking)
                .orderCode(orderCode)
                .status(OrderStatus.CHECKED_IN)
                .customerName(customerName)
                .customerPhone(customerPhone)
                .depositDeducted(depositDeducted)
                .notes(booking.getNotes())
                .subtotal(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(BigDecimal.ZERO)
                .items(new ArrayList<>())
                .build();

        UserEntity defaultStaff = booking.getStaff() != null ? booking.getStaff() : resolveDefaultStaff(booking.getBranch());

        for (BookingServiceItemEntity item : booking.getItems()) {
            ServiceEntity service = item.getService();
            BigDecimal price = item.getPrice() != null ? item.getPrice() : service.getBasePrice();

            OrderItemEntity orderItem = OrderItemEntity.builder()
                    .itemType(OrderItemType.SERVICE)
                    .service(service)
                    .quantity(1)
                    .unitPrice(price)
                    .totalPrice(price)
                    .stepAssignments(new ArrayList<>())
                    .build();

            order.addItem(orderItem);
            orderItem.populateDefaultStepAssignments(defaultStaff);
        }

        order.recalculateTotals();
        applyMembershipTierDiscountIfAutomatic(order);

        OrderEntity savedOrder = orderRepository.save(order);

        realtimeNotificationService.notifyBookingStatusChanged(booking, oldStatus, BookingStatus.CHECKED_IN);
        realtimeNotificationService.notifyOrderCheckedIn(savedOrder);

        return mapToOrderResponse(savedOrder);
    }

    @Override
    @Transactional
    public PosOrderResponse createWalkInOrder(WalkInOrderRequest request) {
        branchScopeGuard.checkBranchAccess(request.getBranchId());
        BranchEntity branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));

        CustomerIdentityService.ResolvedWalkInCustomer resolvedCustomer =
                customerIdentityService.resolveForWalkIn(
                        request.isQuickGuest(),
                        request.getCustomerPhone(),
                        request.getCustomerName(),
                        branch
                );
        UserEntity customerUser = resolvedCustomer.user();
        String customerName = resolvedCustomer.customerName();
        String customerPhone = resolvedCustomer.customerPhone();

        UserEntity assignedStylist = null;
        if (request.getStylistId() != null) {
            assignedStylist = userRepository.findById(request.getStylistId()).orElse(null);
        }
        if (assignedStylist == null) {
            assignedStylist = resolveDefaultStaff(branch);
        }

        String orderCode = generateOrderCode();

        OrderEntity order = OrderEntity.builder()
                .branch(branch)
                .customer(customerUser)
                .booking(null)
                .orderCode(orderCode)
                .status(OrderStatus.CHECKED_IN)
                .customerName(customerName)
                .customerPhone(customerPhone)
                .notes(request.getNotes())
                .subtotal(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .depositDeducted(BigDecimal.ZERO)
                .finalAmount(BigDecimal.ZERO)
                .items(new ArrayList<>())
                .build();

        if (request.getServiceIds() != null && !request.getServiceIds().isEmpty()) {
            for (Long serviceId : request.getServiceIds()) {
                ServiceEntity service = serviceRepository.findByIdAndIsDeletedFalse(serviceId)
                        .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));
                BigDecimal price = service.getBasePrice();

                OrderItemEntity orderItem = OrderItemEntity.builder()
                        .itemType(OrderItemType.SERVICE)
                        .service(service)
                        .quantity(1)
                        .unitPrice(price)
                        .totalPrice(price)
                        .stepAssignments(new ArrayList<>())
                        .build();

                order.addItem(orderItem);
                orderItem.populateDefaultStepAssignments(assignedStylist);
            }
        }

        if (request.getProductItems() != null && !request.getProductItems().isEmpty()) {
            for (ProductItemRequest pReq : request.getProductItems()) {
                ProductEntity product = productRepository.findByIdAndIsDeletedFalse(pReq.getProductId())
                        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
                int qty = pReq.getQuantity() > 0 ? pReq.getQuantity() : 1;
                BigDecimal unitPrice = product.getRetailPrice() != null ? product.getRetailPrice() : BigDecimal.ZERO;
                BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(qty));

                OrderItemEntity prodItem = OrderItemEntity.builder()
                        .itemType(OrderItemType.PRODUCT)
                        .product(product)
                        .quantity(qty)
                        .unitPrice(unitPrice)
                        .totalPrice(totalPrice)
                        .build();

                order.addItem(prodItem);
            }
        }

        order.recalculateTotals();
        applyMembershipTierDiscountIfAutomatic(order);

        OrderEntity savedOrder = orderRepository.save(order);
        realtimeNotificationService.notifyWalkInCreated(savedOrder);

        return mapToOrderResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public DispatchBoardResponse getDispatchBoard(Long branchId, LocalDate date) {
        BranchEntity branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));
        branchScopeGuard.checkBranchAccess(branchId);

        LocalDate targetDate = (date != null) ? date : LocalDate.now();
        LocalDateTime dayStart = targetDate.atStartOfDay();
        LocalDateTime dayEnd = targetDate.plusDays(1).atStartOfDay();

        Instant startInstant = dayStart.atZone(ZoneId.systemDefault()).toInstant();
        Instant endInstant = dayEnd.atZone(ZoneId.systemDefault()).toInstant();

        // 1. Fetch bookings for this branch and day
        List<BookingEntity> bookings = bookingRepository.findBookingsByBranchAndDay(branchId, dayStart, dayEnd);
        List<DispatchBoardBookingDto> upcomingBookings = new ArrayList<>();

        for (BookingEntity b : bookings) {
            Optional<OrderEntity> linkedOrder = orderRepository.findByBookingIdAndIsDeletedFalse(b.getId());
            Long linkedOrderId = linkedOrder.map(OrderEntity::getId).orElse(null);

            List<String> serviceNames = b.getItems().stream()
                    .filter(i -> !i.isDeleted())
                    .map(i -> i.getService().getName())
                    .toList();

            String staffName = b.getStaff() != null ? b.getStaff().getFullName() : "Stylist bất kỳ";
            String cName = b.resolvedCustomerName();
            String cPhone = b.resolvedCustomerPhone();

            DispatchBoardBookingDto bDto = DispatchBoardBookingDto.builder()
                    .id(b.getId())
                    .bookingCode(b.getBookingCode())
                    .customerId(b.getCustomer() != null ? b.getCustomer().getId() : null)
                    .customerName(cName)
                    .customerPhone(cPhone)
                    .staffId(b.getStaff() != null ? b.getStaff().getId() : null)
                    .staffName(staffName)
                    .bookingTime(b.getBookingTime())
                    .endTime(b.getEndTime())
                    .totalDurationMinutes(b.getTotalDurationMinutes())
                    .totalPrice(b.getTotalPrice())
                    .depositAmount(b.getDepositAmount())
                    .depositStatus(b.getDepositStatus() != null ? b.getDepositStatus().name() : null)
                    .status(b.getStatus() != null ? b.getStatus().name() : null)
                    .serviceNames(serviceNames)
                    .linkedOrderId(linkedOrderId)
                    .build();

            // Sắp đến / Chờ check-in: CONFIRMED or PENDING_PAYMENT without active order
            if ((b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.PENDING_PAYMENT)
                    && linkedOrderId == null) {
                upcomingBookings.add(bDto);
            }
        }

        // 2. Fetch orders for this branch
        List<OrderEntity> ordersInRange = orderRepository.findByBranchAndDateRange(branchId, startInstant, endInstant);
        Map<Long, OrderEntity> orderMap = new LinkedHashMap<>();
        for (OrderEntity o : ordersInRange) {
            orderMap.put(o.getId(), o);
        }
        // Carry-over active orders created earlier only belong on today's live floor view,
        // not on past/future audit dates.
        if (targetDate.equals(LocalDate.now())) {
            List<OrderEntity> activeOrders = orderRepository.findByBranchIdAndStatusIn(
                    branchId, List.of(OrderStatus.CHECKED_IN, OrderStatus.IN_PROGRESS, OrderStatus.READY_FOR_CHECKOUT));
            for (OrderEntity o : activeOrders) {
                orderMap.put(o.getId(), o);
            }
        }

        List<PosOrderResponse> checkedInOrders = new ArrayList<>();
        List<PosOrderResponse> inProgressOrders = new ArrayList<>();
        List<PosOrderResponse> readyOrPaidOrders = new ArrayList<>();

        for (OrderEntity o : orderMap.values()) {
            PosOrderResponse resp = mapToOrderResponse(o);
            if (o.getStatus() == OrderStatus.CHECKED_IN) {
                checkedInOrders.add(resp);
            } else if (o.getStatus() == OrderStatus.IN_PROGRESS) {
                inProgressOrders.add(resp);
            } else if (o.getStatus() == OrderStatus.READY_FOR_CHECKOUT || o.getStatus() == OrderStatus.PAID) {
                readyOrPaidOrders.add(resp);
            }
        }

        // 3. Stylist availability strip
        List<UserEntity> stylists = userRepository.findActiveStylistsByBranchId(branchId);
        List<StaffScheduleEntity> branchSchedules = staffScheduleRepository.findByBranchIdAndScheduleDateAndIsDeletedFalse(branchId, targetDate);
        boolean hasBranchRoster = !branchSchedules.isEmpty();
        Map<Long, StaffScheduleEntity> scheduleMap = branchSchedules.stream()
                .filter(s -> s.getUser() != null)
                .collect(Collectors.toMap(s -> s.getUser().getId(), s -> s, (s1, s2) -> s1));
        List<com.smartsalon.shift.entity.StaffAttendanceEntity> branchAttendances = staffAttendanceRepository
                .findByBranchIdAndAttendanceDateAndIsDeletedFalse(branchId, targetDate);
        Map<Long, com.smartsalon.shift.entity.StaffAttendanceEntity> attendanceMap = branchAttendances.stream()
                .filter(a -> a.getUser() != null)
                .collect(Collectors.toMap(a -> a.getUser().getId(), a -> a, (a1, a2) -> a1));
        List<StylistAvailabilityDto> stylistDtos = new ArrayList<>();

        for (UserEntity stylist : stylists) {
            List<OrderStepAssignmentEntity> activeSteps = stepAssignmentRepository
                    .findByStaffIdAndStatus(stylist.getId(), StepAssignmentStatus.IN_PROGRESS);

            boolean isBusy = !activeSteps.isEmpty();
            String currentOrderCode = null;
            String currentCustomerName = null;
            String currentStepName = null;

            if (isBusy) {
                OrderStepAssignmentEntity activeStep = activeSteps.get(0);
                currentStepName = activeStep.getStepName();
                if (activeStep.getOrderItem() != null && activeStep.getOrderItem().getOrder() != null) {
                    OrderEntity activeOrder = activeStep.getOrderItem().getOrder();
                    currentOrderCode = activeOrder.getOrderCode();
                    currentCustomerName = activeOrder.getCustomerName();
                }
            }

            StaffScheduleEntity schedule = scheduleMap.get(stylist.getId());
            String shiftCode = null;
            String shiftName = null;
            LocalTime shiftStart = null;
            LocalTime shiftEnd = null;
            Boolean isWorking = true;

            ShiftDayView sv = ShiftDayView.resolve(schedule, hasBranchRoster);
            shiftCode = sv.code();
            shiftName = sv.name();
            shiftStart = sv.start();
            shiftEnd = sv.end();
            isWorking = sv.working();

            com.smartsalon.shift.entity.StaffAttendanceEntity attendance = attendanceMap.get(stylist.getId());
            com.smartsalon.shift.entity.StaffAttendanceStatus attendanceStatus = (attendance != null) ? attendance.getStatus() : null;
            LocalDateTime clockInAt = (attendance != null) ? attendance.getClockInAt() : null;
            LocalDateTime clockOutAt = (attendance != null) ? attendance.getClockOutAt() : null;
            int overtimeMinutes = (attendance != null) ? attendance.getOvertimeMinutes() : 0;

            stylistDtos.add(StylistAvailabilityDto.builder()
                    .stylistId(stylist.getId())
                    .fullName(stylist.getFullName())
                    .phone(stylist.getPhone())
                    .avatarUrl(stylist.getAvatarUrl())
                    .isBusy(isBusy)
                    .currentOrderCode(currentOrderCode)
                    .currentCustomerName(currentCustomerName)
                    .currentStepName(currentStepName)
                    .shiftCode(shiftCode)
                    .shiftName(shiftName)
                    .shiftStartTime(shiftStart)
                    .shiftEndTime(shiftEnd)
                    .isWorking(isWorking)
                    .attendanceStatus(attendanceStatus)
                    .clockInAt(clockInAt)
                    .clockOutAt(clockOutAt)
                    .overtimeMinutes(overtimeMinutes)
                    .build());
        }

        return DispatchBoardResponse.builder()
                .branchId(branch.getId())
                .branchName(branch.getName())
                .date(targetDate.toString())
                .upcomingBookings(upcomingBookings)
                .checkedInOrders(checkedInOrders)
                .inProgressOrders(inProgressOrders)
                .readyOrPaidOrders(readyOrPaidOrders)
                .stylists(stylistDtos)
                .build();
    }

    private OrderEntity getOrderEntity(Long orderId) {
        OrderEntity order = orderRepository.findByIdAndIsDeletedFalse(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        branchScopeGuard.checkBranchAccess(order.getBranch() != null ? order.getBranch().getId() : null);
        return order;
    }
    @Override
    @Transactional(readOnly = true)
    public PosOrderResponse getOrderById(Long orderId) {
        OrderEntity order = getOrderEntity(orderId);
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional
    public PosOrderResponse addServiceItem(Long orderId, AddServiceItemRequest request) {
        OrderEntity order = orderRepository.findByIdAndIsDeletedFalse(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        branchScopeGuard.checkBranchAccess(order.getBranch() != null ? order.getBranch().getId() : null);

        if (order.getStatus() == OrderStatus.PAID || order.getStatus() == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
        }

        ServiceEntity service = serviceRepository.findByIdAndIsDeletedFalse(request.getServiceId())
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));

        UserEntity assignedStaff = null;
        if (request.getStaffId() != null) {
            assignedStaff = userRepository.findById(request.getStaffId()).orElse(null);
        }
        if (assignedStaff == null) {
            assignedStaff = resolveDefaultStaff(order.getBranch());
        }

        BigDecimal price = service.getBasePrice();

        OrderItemEntity orderItem = OrderItemEntity.builder()
                .itemType(OrderItemType.SERVICE)
                .service(service)
                .quantity(1)
                .unitPrice(price)
                .totalPrice(price)
                .stepAssignments(new ArrayList<>())
                .build();

        order.addItem(orderItem);
        orderItem.populateDefaultStepAssignments(assignedStaff);

        order.recalculateTotals();
        applyMembershipTierDiscountIfAutomatic(order);
        OrderEntity savedOrder = orderRepository.save(order);
        realtimeNotificationService.notifyOrderUpdated(savedOrder);

        return mapToOrderResponse(savedOrder);
    }

    @Override
    @Transactional
    public PosOrderResponse addProductItem(Long orderId, AddProductItemRequest request) {
        OrderEntity order = orderRepository.findByIdAndIsDeletedFalse(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        branchScopeGuard.checkBranchAccess(order.getBranch() != null ? order.getBranch().getId() : null);

        if (order.getStatus() == OrderStatus.PAID || order.getStatus() == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
        }

        ProductEntity product = productRepository.findByIdAndIsDeletedFalse(request.getProductId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        int qty = request.getQuantity() > 0 ? request.getQuantity() : 1;
        BigDecimal unitPrice = product.getRetailPrice() != null ? product.getRetailPrice() : BigDecimal.ZERO;
        BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(qty));

        OrderItemEntity prodItem = OrderItemEntity.builder()
                .itemType(OrderItemType.PRODUCT)
                .product(product)
                .quantity(qty)
                .unitPrice(unitPrice)
                .totalPrice(totalPrice)
                .build();

        order.addItem(prodItem);

        order.recalculateTotals();
        applyMembershipTierDiscountIfAutomatic(order);
        OrderEntity savedOrder = orderRepository.save(order);
        realtimeNotificationService.notifyOrderUpdated(savedOrder);

        return mapToOrderResponse(savedOrder);
    }

    @Override
    @Transactional
    public PosOrderResponse updateOrder(Long orderId, UpdateOrderRequest request) {
        OrderEntity order = orderRepository.findByIdAndIsDeletedFalse(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        branchScopeGuard.checkBranchAccess(order.getBranch() != null ? order.getBranch().getId() : null);

        if (order.getStatus() == OrderStatus.PAID || order.getStatus() == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
        }

        if (request.getDiscountAmount() != null) {
            applyManualDiscount(order, request.getDiscountAmount());
        }
        if (request.getNotes() != null) {
            order.setNotes(request.getNotes());
        }

        order.recalculateTotals();
        applyMembershipTierDiscountIfAutomatic(order);
        OrderEntity savedOrder = orderRepository.save(order);
        realtimeNotificationService.notifyOrderUpdated(savedOrder);

        return mapToOrderResponse(savedOrder);
    }

    @Override
    @Transactional
    public PosOrderResponse removeOrderItem(Long orderId, Long itemId) {
        OrderEntity order = orderRepository.findByIdAndIsDeletedFalse(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        branchScopeGuard.checkBranchAccess(order.getBranch() != null ? order.getBranch().getId() : null);

        if (order.getStatus() == OrderStatus.PAID || order.getStatus() == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
        }

        OrderItemEntity itemToRemove = order.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_ITEM_NOT_FOUND));

        order.removeItem(itemToRemove);

        order.recalculateTotals();
        applyMembershipTierDiscountIfAutomatic(order);
        OrderEntity savedOrder = orderRepository.save(order);
        realtimeNotificationService.notifyOrderUpdated(savedOrder);

        return mapToOrderResponse(savedOrder);
    }

    @Override
    @Transactional
    public PosStepAssignmentResponse updateStepAssignment(Long orderId, Long stepId, UpdateStepAssignmentRequest request) {
        OrderEntity order = orderRepository.findByIdAndIsDeletedFalse(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        branchScopeGuard.checkBranchAccess(order.getBranch() != null ? order.getBranch().getId() : null);

        if (order.getStatus() == OrderStatus.PAID || order.getStatus() == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
        }

        OrderStepAssignmentEntity step = stepAssignmentRepository.findById(stepId)
                .orElseThrow(() -> new AppException(ErrorCode.STEP_ASSIGNMENT_NOT_FOUND));

        if (!step.getOrderItem().getOrder().getId().equals(orderId)) {
            throw new AppException(ErrorCode.STEP_ASSIGNMENT_NOT_FOUND);
        }

        if (request.getStaffId() != null) {
            UserEntity staff = userRepository.findById(request.getStaffId())
                    .orElseThrow(() -> new AppException(ErrorCode.STYLIST_NOT_FOUND));
            step.setStaff(staff);
        }

        if (request.getCommissionRate() != null) {
            step.setCommissionRate(request.getCommissionRate());
        }

        step.recalculateCommissionAmount();

        OrderStepAssignmentEntity savedStep = stepAssignmentRepository.save(step);
        realtimeNotificationService.notifyStepUpdated(order);

        return mapToStepResponse(savedStep);
    }

    @Override
    @Transactional
    public PosStepAssignmentResponse updateStepStatus(Long orderId, Long stepId, UpdateStepStatusRequest request) {
        OrderEntity order = orderRepository.findByIdAndIsDeletedFalse(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        branchScopeGuard.checkBranchAccess(order.getBranch() != null ? order.getBranch().getId() : null);

        if (order.getStatus() == OrderStatus.PAID || order.getStatus() == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
        }

        OrderStepAssignmentEntity step = stepAssignmentRepository.findById(stepId)
                .orElseThrow(() -> new AppException(ErrorCode.STEP_ASSIGNMENT_NOT_FOUND));

        if (!step.getOrderItem().getOrder().getId().equals(orderId)) {
            throw new AppException(ErrorCode.STEP_ASSIGNMENT_NOT_FOUND);
        }

        StepAssignmentStatus newStatus = request.getStatus();
        step.setStatus(newStatus);

        if (newStatus == StepAssignmentStatus.IN_PROGRESS) {
            if (step.getStartedAt() == null) {
                step.setStartedAt(LocalDateTime.now());
            }
            if (order.getStatus() == OrderStatus.CHECKED_IN) {
                order.setStatus(OrderStatus.IN_PROGRESS);
                advanceLinkedBookingToInProgress(order);
            }
        } else if (newStatus == StepAssignmentStatus.COMPLETED) {
            if (step.getCompletedAt() == null) {
                step.setCompletedAt(LocalDateTime.now());
            }
            if (order.getStatus() == OrderStatus.CHECKED_IN) {
                order.setStatus(OrderStatus.IN_PROGRESS);
                advanceLinkedBookingToInProgress(order);
            }
            List<OrderStepAssignmentEntity> allSteps = stepAssignmentRepository.findByOrderId(orderId);
            boolean allCompleted = allSteps.stream()
                    .allMatch(s -> s.getId().equals(stepId) || s.getStatus() == StepAssignmentStatus.COMPLETED);
            if (allCompleted) {
                order.setStatus(OrderStatus.READY_FOR_CHECKOUT);
            }
        }

        OrderStepAssignmentEntity savedStep = stepAssignmentRepository.save(step);
        OrderEntity savedOrder = orderRepository.save(order);
        realtimeNotificationService.notifyStepUpdated(savedOrder);

        return mapToStepResponse(savedStep);
    }

    private void advanceLinkedBookingToInProgress(OrderEntity order) {
        if (order.getBooking() != null && order.getBooking().getStatus() != BookingStatus.IN_PROGRESS) {
            BookingStatus oldBStatus = order.getBooking().getStatus();
            order.getBooking().setStatus(BookingStatus.IN_PROGRESS);
            bookingRepository.save(order.getBooking());
            realtimeNotificationService.notifyBookingStatusChanged(order.getBooking(), oldBStatus, BookingStatus.IN_PROGRESS);
        }
    }

    private PosStepAssignmentResponse mapToStepResponse(OrderStepAssignmentEntity s) {
        return PosStepAssignmentResponse.builder()
                .id(s.getId())
                .stepName(s.getStepName())
                .staffId(s.getStaff() != null ? s.getStaff().getId() : null)
                .staffName(s.getStaff() != null ? s.getStaff().getFullName() : null)
                .commissionRate(s.getCommissionRate())
                .commissionAmount(s.getCommissionAmount())
                .status(s.getStatus())
                .startedAt(s.getStartedAt())
                .completedAt(s.getCompletedAt())
                .build();
    }

    private UserEntity resolveDefaultStaff(BranchEntity branch) {
        List<UserEntity> stylists = userRepository.findActiveStylistsByBranchId(branch.getId());
        if (!stylists.isEmpty()) {
            LocalDate today = LocalDate.now();
            List<StaffScheduleEntity> branchSchedules = staffScheduleRepository.findByBranchIdAndScheduleDateAndIsDeletedFalse(branch.getId(), today);
            Map<Long, StaffScheduleEntity> scheduleMap = branchSchedules.stream()
                    .filter(s -> s.getUser() != null)
                    .collect(Collectors.toMap(s -> s.getUser().getId(), s -> s, (s1, s2) -> s1));

            List<com.smartsalon.shift.entity.StaffAttendanceEntity> branchAttendances = staffAttendanceRepository.findByBranchIdAndAttendanceDateAndIsDeletedFalse(branch.getId(), today);
            Map<Long, com.smartsalon.shift.entity.StaffAttendanceEntity> attendanceMap = branchAttendances.stream()
                    .filter(a -> a.getUser() != null)
                    .collect(Collectors.toMap(a -> a.getUser().getId(), a -> a, (a1, a2) -> a1));

            List<UserEntity> availableStylists = stylists.stream()
                    .filter(s -> {
                        StaffScheduleEntity sched = scheduleMap.get(s.getId());
                        if (sched != null && sched.getStatus() == StaffScheduleStatus.OFF) return false;
                        com.smartsalon.shift.entity.StaffAttendanceEntity att = attendanceMap.get(s.getId());
                        if (att != null && (att.getStatus() == com.smartsalon.shift.entity.StaffAttendanceStatus.ABSENT
                                || att.getStatus() == com.smartsalon.shift.entity.StaffAttendanceStatus.ON_BREAK)) {
                            return false;
                        }
                        return true;
                    })
                    .toList();

            if (!availableStylists.isEmpty()) {
                return availableStylists.get(0);
            }
            return stylists.get(0);
        }
        return userRepository.findAllActiveStylists().stream()
                .findFirst()
                .orElse(null);
    }

    private String generateOrderCode() {
        String datePart = LocalDate.now().format(BASIC_DATE_FORMATTER);
        String orderCode;
        int attempts = 0;
        do {
            if (attempts >= 10) {
                throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION, "Không thể tạo mã đơn hàng duy nhất");
            }
            char[] randChars = new char[6];
            for (int i = 0; i < 6; i++) {
                randChars[i] = ALPHANUMERIC.charAt(SECURE_RANDOM.nextInt(ALPHANUMERIC.length()));
            }
            orderCode = "ORD-" + datePart + "-" + new String(randChars);
            attempts++;
        } while (orderRepository.existsByOrderCode(orderCode));
        return orderCode;
    }

    @Override
    @Transactional(readOnly = true)
    public TechnicalLogResponse getVisualLog(Long orderId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        branchScopeGuard.checkBranchAccess(order.getBranch() != null ? order.getBranch().getId() : null);

        Optional<TechnicalLogEntity> existingLogOpt = technicalLogRepository.findByOrderIdAndIsDeletedFalse(orderId);

        if (existingLogOpt.isPresent()) {
            TechnicalLogEntity techLogEntity = existingLogOpt.get();
            List<ActualBomItemDto> bomItems = orderBomResolver.parseActualBomJson(techLogEntity.getActualBomJson(), orderId);
            if (!bomItems.isEmpty() || StringUtils.hasText(techLogEntity.getActualBomJson())) {
                return TechnicalLogResponse.builder()
                        .id(techLogEntity.getId())
                        .orderId(order.getId())
                        .orderCode(order.getOrderCode())
                        .customerId(techLogEntity.getCustomer() != null ? techLogEntity.getCustomer().getId() : (order.getCustomer() != null ? order.getCustomer().getId() : null))
                        .customerName(order.getCustomerName() != null ? order.getCustomerName() : (techLogEntity.getCustomer() != null ? techLogEntity.getCustomer().getFullName() : null))
                        .staffId(techLogEntity.getStaff() != null ? techLogEntity.getStaff().getId() : null)
                        .staffName(techLogEntity.getStaff() != null ? techLogEntity.getStaff().getFullName() : null)
                        .formulaNotes(techLogEntity.getFormulaNotes())
                        .hairConditionNotes(techLogEntity.getHairConditionNotes())
                        .beforeImageUrl(techLogEntity.getBeforeImageUrl())
                        .afterImageUrl(techLogEntity.getAfterImageUrl())
                        .bomItems(bomItems)
                        .isSaved(true)
                        .createdAt(techLogEntity.getCreatedAt())
                        .updatedAt(techLogEntity.getUpdatedAt())
                        .build();
            }
        }

        List<ActualBomItemDto> synthesizedBomItems = orderBomResolver.buildStandardBomItems(order);

        // Suggest staff: from existing log, or first step assignment stylist, or null
        Long suggestedStaffId = null;
        String suggestedStaffName = null;
        if (existingLogOpt.isPresent() && existingLogOpt.get().getStaff() != null) {
            suggestedStaffId = existingLogOpt.get().getStaff().getId();
            suggestedStaffName = existingLogOpt.get().getStaff().getFullName();
        } else {
            UserEntity resolvedStaff = resolveOrderStaff(order);
            if (resolvedStaff != null) {
                suggestedStaffId = resolvedStaff.getId();
                suggestedStaffName = resolvedStaff.getFullName();
            }
        }

        return TechnicalLogResponse.builder()
                .id(existingLogOpt.map(TechnicalLogEntity::getId).orElse(null))
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .customerId(order.getCustomer() != null ? order.getCustomer().getId() : null)
                .customerName(order.getCustomerName() != null ? order.getCustomerName() : (order.getCustomer() != null ? order.getCustomer().getFullName() : null))
                .staffId(suggestedStaffId)
                .staffName(suggestedStaffName)
                .formulaNotes(existingLogOpt.map(TechnicalLogEntity::getFormulaNotes).orElse(null))
                .hairConditionNotes(existingLogOpt.map(TechnicalLogEntity::getHairConditionNotes).orElse(null))
                .beforeImageUrl(existingLogOpt.map(TechnicalLogEntity::getBeforeImageUrl).orElse(null))
                .afterImageUrl(existingLogOpt.map(TechnicalLogEntity::getAfterImageUrl).orElse(null))
                .bomItems(synthesizedBomItems)
                .isSaved(false)
                .createdAt(existingLogOpt.map(TechnicalLogEntity::getCreatedAt).orElse(null))
                .updatedAt(existingLogOpt.map(TechnicalLogEntity::getUpdatedAt).orElse(null))
                .build();
    }

    @Override
    @Transactional
    public TechnicalLogResponse saveVisualLog(Long orderId, SaveTechnicalLogRequest request) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        branchScopeGuard.checkBranchAccess(order.getBranch() != null ? order.getBranch().getId() : null);

        UserEntity customer = order.getCustomer();
        if (customer == null) {
            customer = customerIdentityService.resolveWalkInGuest();
        }

        UserEntity staff = null;
        if (request.getStaffId() != null) {
            staff = userRepository.findById(request.getStaffId())
                    .orElseThrow(() -> new AppException(ErrorCode.STYLIST_NOT_FOUND));
        } else {
            staff = resolveOrderStaff(order);
            if (staff == null) {
                staff = userRepository.findAllActiveStylists().stream().findFirst()
                        .orElseThrow(() -> new AppException(ErrorCode.STYLIST_NOT_FOUND));
            }
        }

        final UserEntity effectiveCustomer = (order.getCustomer() != null) ? order.getCustomer() : customer;
        final UserEntity effectiveStaff = staff;

        TechnicalLogEntity techLog = technicalLogRepository.findByOrderIdAndIsDeletedFalse(orderId)
                .orElseGet(() -> TechnicalLogEntity.builder()
                        .order(order)
                        .customer(effectiveCustomer)
                        .staff(effectiveStaff)
                        .build());

        techLog.setStaff(staff);
        techLog.setFormulaNotes(request.getFormulaNotes());
        techLog.setHairConditionNotes(request.getHairConditionNotes());
        techLog.setBeforeImageUrl(request.getBeforeImageUrl());
        techLog.setAfterImageUrl(request.getAfterImageUrl());

        List<ActualBomItemDto> items = request.getBomItems() != null ? request.getBomItems() : new ArrayList<>();
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

        try {
            techLog.setActualBomJson(orderBomResolver.serializeActualBomJson(items, orderId));
        } catch (Exception e) {
            log.error("Failed to serialize bomItems for order {}: {}", orderId, e.getMessage());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        TechnicalLogEntity saved = technicalLogRepository.save(techLog);

        // Broadcast realtime notification
        realtimeNotificationService.notifyVisualLogSaved(order);

        return TechnicalLogResponse.builder()
                .id(saved.getId())
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .customerId(saved.getCustomer() != null ? saved.getCustomer().getId() : null)
                .customerName(order.getCustomerName() != null ? order.getCustomerName() : (saved.getCustomer() != null ? saved.getCustomer().getFullName() : null))
                .staffId(saved.getStaff() != null ? saved.getStaff().getId() : null)
                .staffName(saved.getStaff() != null ? saved.getStaff().getFullName() : null)
                .formulaNotes(saved.getFormulaNotes())
                .hairConditionNotes(saved.getHairConditionNotes())
                .beforeImageUrl(saved.getBeforeImageUrl())
                .afterImageUrl(saved.getAfterImageUrl())
                .bomItems(items)
                .isSaved(true)
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

    /** Non-mutating preview: unpaid orders show the amount net of the customer's available credit. */
    private BigDecimal payableAfterCredit(OrderEntity order, BigDecimal amount) {
        if (amount == null || order.getStatus() == OrderStatus.PAID || order.getCustomer() == null
                || "walkin.guest".equalsIgnoreCase(order.getCustomer().getUsername())) {
            return amount;
        }
        BigDecimal credit = order.getCustomer().getCreditBalance() != null ? order.getCustomer().getCreditBalance() : BigDecimal.ZERO;
        return credit.signum() > 0 ? amount.subtract(credit).max(BigDecimal.ZERO) : amount;
    }

    private PosOrderResponse mapToOrderResponse(OrderEntity order) {
        List<PosOrderItemResponse> itemResponses = order.getItems().stream()
                .filter(i -> !i.isDeleted())
                .map(i -> {
                    List<PosStepAssignmentResponse> stepResponses = i.getStepAssignments().stream()
                            .map(this::mapToStepResponse)
                            .toList();

                    return PosOrderItemResponse.builder()
                            .id(i.getId())
                            .itemType(i.getItemType())
                            .serviceId(i.getService() != null ? i.getService().getId() : null)
                            .serviceName(i.getService() != null ? i.getService().getName() : null)
                            .commissionPoolRate(i.getService() != null ? i.getService().getCommissionPoolRate() : null)
                            .productId(i.getProduct() != null ? i.getProduct().getId() : null)
                            .productName(i.getProduct() != null ? i.getProduct().getName() : null)
                            .productSku(i.getProduct() != null ? i.getProduct().getSku() : null)
                            .quantity(i.getQuantity())
                            .unitPrice(i.getUnitPrice())
                            .totalPrice(i.getTotalPrice())
                            .steps(stepResponses)
                            .build();
                })
                .toList();

        MembershipTier customerTier = MembershipTier.STANDARD;
        Integer customerDiscountPercent = 0;
        BigDecimal customerCreditBalance = BigDecimal.ZERO;

        if (order.getCustomer() != null) {
            if (order.getCustomer().getMembershipTier() != null) {
                customerTier = order.getCustomer().getMembershipTier();
            }
            customerDiscountPercent = customerTier.getDiscountPercent();
            if (order.getCustomer().getCreditBalance() != null) {
                customerCreditBalance = order.getCustomer().getCreditBalance();
            }
        }

        return PosOrderResponse.builder()
                .id(order.getId())
                .branchId(order.getBranch() != null ? order.getBranch().getId() : null)
                .branchName(order.getBranch() != null ? order.getBranch().getName() : null)
                .customerId(order.getCustomer() != null ? order.getCustomer().getId() : null)
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .bookingId(order.getBooking() != null ? order.getBooking().getId() : null)
                .bookingCode(order.getBooking() != null ? order.getBooking().getBookingCode() : null)
                .orderCode(order.getOrderCode())
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .isDiscountManual(order.isDiscountManual())
                .customerMembershipTier(customerTier.name())
                .customerDiscountPercent(customerDiscountPercent)
                .customerCreditBalance(customerCreditBalance)
                .depositDeducted(order.getDepositDeducted())
                .finalAmount(payableAfterCredit(order, order.getFinalAmount()))
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .notes(order.getNotes())
                .settledById(order.getSettledBy() != null ? order.getSettledBy().getId() : null)
                .settledByName(order.getSettledBy() != null ? order.getSettledBy().getFullName() : null)
                .settledAt(order.getSettledAt())
                .createdAt(order.getCreatedAt())
                .items(itemResponses)
                .build();
    }

    private UserEntity resolveOrderStaff(OrderEntity order) {
        if (order.getItems() != null) {
            for (OrderItemEntity item : order.getItems()) {
                if (item.getStepAssignments() != null) {
                    for (OrderStepAssignmentEntity step : item.getStepAssignments()) {
                        if (step.getStaff() != null) {
                            return step.getStaff();
                        }
                    }
                }
            }
        }
        return userRepository.findAllActiveStylists().stream().findFirst().orElse(null);
    }

    @Override
    @Transactional
    public PosOrderResponse checkoutOrder(Long orderId, CheckoutRequest request) {
        OrderEntity order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        branchScopeGuard.checkBranchAccess(order.getBranch() != null ? order.getBranch().getId() : null);

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
            applyManualDiscount(order, request.getDiscountAmount());
        }

        if (request != null && request.getNotes() != null) {
            order.setNotes(request.getNotes());
        }

        order.recalculateTotals();

        String paymentMethod = (request != null && StringUtils.hasText(request.getPaymentMethod()))
                ? request.getPaymentMethod().trim().toUpperCase()
                : "CASH";

        UserEntity settlingUser = resolveCurrentUser();
        return executeUnifiedSettlement(order, paymentMethod, settlingUser);
    }

    private PosOrderResponse executeUnifiedSettlement(OrderEntity order, String paymentMethod, UserEntity settlingUser) {
        if (order.getStatus() == OrderStatus.PAID || order.getStatus() == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
        }

        // 1. Lock customer row & atomically apply and deduct retained deposit (creditBalance), if any
        UserEntity customer = order.getCustomer();
        UserEntity lockedCustomer = null;
        if (customer != null && !"walkin.guest".equalsIgnoreCase(customer.getUsername())) {
            lockedCustomer = userRepository.findByIdForUpdate(customer.getId()).orElse(customer);
            if (entityManager != null) {
                entityManager.refresh(lockedCustomer);
            }
            BigDecimal credit = lockedCustomer.getCreditBalance() != null ? lockedCustomer.getCreditBalance() : BigDecimal.ZERO;
            if (credit.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal subtotal = order.getSubtotal() != null ? order.getSubtotal() : BigDecimal.ZERO;
                BigDecimal discount = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;
                BigDecimal existingDeposit = order.getDepositDeducted() != null ? order.getDepositDeducted() : BigDecimal.ZERO;
                BigDecimal payableBeforeCredit = subtotal.subtract(discount).subtract(existingDeposit).max(BigDecimal.ZERO);
                if (payableBeforeCredit.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal appliedCredit = credit.min(payableBeforeCredit);
                    lockedCustomer.setCreditBalance(credit.subtract(appliedCredit));
                    order.setDepositDeducted(existingDeposit.add(appliedCredit));
                    order.recalculateTotals();
                }
            }
        }

        // 2. Deduct chemical BOM consumables
        deductChemicalConsumables(order);

        // 3. Deduct retail product sealed units
        deductRetailProducts(order);

        // 4. Mark step assignments COMPLETED and record immutable Commission Ledger
        completeStepsAndRecordCommission(order);

        // 5. Record Payment Transaction
        PaymentTransactionEntity tx = PaymentTransactionEntity.builder()
                .orderId(order.getId())
                .booking(order.getBooking())
                .paymentMethod(paymentMethod)
                .transactionCode("TX-POS-" + order.getOrderCode() + "-" + System.currentTimeMillis())
                .amount(order.getFinalAmount())
                .status(PaymentTransactionEntity.STATUS_SUCCESS)
                .build();
        paymentTransactionRepository.save(tx);

        // 6. Update Order status to PAID, stamp settling user and settledAt
        order.setPaymentMethod(paymentMethod);
        order.setSettledBy(settlingUser);
        order.setSettledAt(Instant.now());
        order.setStatus(OrderStatus.PAID);
        OrderEntity savedOrder = orderRepository.save(order);

        // 7. Update customer cumulative spend and membership tier under row lock
        if (lockedCustomer != null) {
            BigDecimal netRevenue = savedOrder.calculateRevenueBreakdown().totalNetRevenue();
            BigDecimal currentSpent = lockedCustomer.getTotalSpent() != null ? lockedCustomer.getTotalSpent() : BigDecimal.ZERO;
            BigDecimal updatedSpent = currentSpent.add(netRevenue);
            lockedCustomer.setTotalSpent(updatedSpent);
            lockedCustomer.setMembershipTier(MembershipTier.fromTotalSpent(updatedSpent));
            userRepository.saveAndFlush(lockedCustomer);
        }

        // 8. Update linked Booking to COMPLETED
        if (savedOrder.getBooking() != null) {
            BookingEntity booking = savedOrder.getBooking();
            BookingStatus oldBookingStatus = booking.getStatus();
            booking.setStatus(BookingStatus.COMPLETED);
            bookingRepository.save(booking);
            if (realtimeNotificationService != null && oldBookingStatus != BookingStatus.COMPLETED) {
                realtimeNotificationService.notifyBookingStatusChanged(booking, oldBookingStatus, BookingStatus.COMPLETED);
            }
        }

        // 9. Broadcast realtime WebSocket event
        realtimeNotificationService.notifyOrderCheckedOut(savedOrder);

        return mapToOrderResponse(savedOrder);
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
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        for (OrderItemEntity item : order.getItems()) {
            if (item.isDeleted() || item.getItemType() != OrderItemType.SERVICE) {
                continue;
            }

            for (OrderStepAssignmentEntity step : item.getStepAssignments()) {
                if (step.getStartedAt() == null) {
                    step.setStartedAt(now);
                }
                if (step.getCompletedAt() == null) {
                    step.setCompletedAt(now);
                }
                step.setStatus(StepAssignmentStatus.COMPLETED);

                BigDecimal commissionAmount = step.recalculateCommissionAmount();
                UserEntity staff = step.getStaff() != null ? step.getStaff() : resolveOrderStaff(order);
                String calculationNotes = step.formatCalculationNotes();

                // 1.2x Overtime Commission Multiplier check
                boolean isOvertime = isStepOvertime(order, step, staff, now, zone);
                if (isOvertime) {
                    commissionAmount = commissionAmount.multiply(new BigDecimal("1.2")).setScale(0, RoundingMode.HALF_UP);
                    step.setCommissionAmount(commissionAmount);
                    calculationNotes = (calculationNotes != null ? calculationNotes : "") + " [OT 1.2x]";
                }

                stepAssignmentRepository.save(step);

                CommissionLedgerEntity ledger = CommissionLedgerEntity.builder()
                        .staff(staff)
                        .order(order)
                        .stepAssignment(step)
                        .amount(commissionAmount)
                        .status("EARNED")
                        .calculationNotes(calculationNotes)
                        .overtime(isOvertime)
                        .build();
                commissionLedgerRepository.save(ledger);
            }
        }
    }

    private boolean isStepOvertime(OrderEntity order, OrderStepAssignmentEntity step, UserEntity staff, LocalDateTime now, ZoneId zone) {
        if (staff == null) {
            return false;
        }

        LocalDate stepDate;
        if (order.getBooking() != null && order.getBooking().getBookingTime() != null) {
            stepDate = order.getBooking().getBookingTime().toLocalDate();
        } else if (step.getCompletedAt() != null) {
            stepDate = step.getCompletedAt().toLocalDate();
        } else if (order.getSettledAt() != null) {
            stepDate = order.getSettledAt().atZone(zone).toLocalDate();
        } else {
            stepDate = now.toLocalDate();
        }

        LocalTime finishTime = step.getCompletedAt() != null ? step.getCompletedAt().toLocalTime() : now.toLocalTime();
        if (order.getBooking() != null && order.getBooking().getEndTime() != null) {
            LocalTime bookingFinish = order.getBooking().getEndTime().toLocalTime();
            if (finishTime == null || bookingFinish.isAfter(finishTime)) {
                finishTime = bookingFinish;
            }
        }

        Optional<com.smartsalon.shift.entity.StaffScheduleEntity> scheduleOpt =
                staffScheduleRepository.findByUserIdAndScheduleDateAndIsDeletedFalse(staff.getId(), stepDate);

        if (scheduleOpt.isPresent()) {
            com.smartsalon.shift.entity.StaffScheduleEntity schedule = scheduleOpt.get();
            if (schedule.getStatus() == StaffScheduleStatus.OFF || schedule.getShiftTemplate() == null) {
                // Scheduled OFF cover day
                return true;
            }
            LocalTime shiftEndTime = schedule.getShiftTemplate().getEndTime();
            LocalTime shiftStartTime = schedule.getShiftTemplate().getStartTime();
            boolean startedEarly = order.getBooking() != null && order.getBooking().getBookingTime() != null
                    && order.getBooking().getBookingTime().toLocalTime().isBefore(shiftStartTime);
            return startedEarly || finishTime.isAfter(shiftEndTime);
        }

        // Stylist has no individual schedule on this date: check if branch has published schedules
        Long branchId = order.getBranch() != null ? order.getBranch().getId()
                : (staff.getBranch() != null ? staff.getBranch().getId() : null);
        if (branchId != null) {
            List<com.smartsalon.shift.entity.StaffScheduleEntity> branchSchedules =
                    staffScheduleRepository.findByBranchIdAndScheduleDateAndIsDeletedFalse(branchId, stepDate);
            if (!branchSchedules.isEmpty()) {
                // Branch has active roster, but this stylist is unscheduled -> unscheduled extra cover day
                return true;
            }
        }

        // Historical period or unconfigured roster date: fallback to branch standard operating closing time (20:30)
        return finishTime.isAfter(LocalTime.of(20, 30));
    }

    @Override
    @Transactional(readOnly = true)
    public PosVietQrResponse getPosVietQr(Long orderId) {
        return getPosVietQr(orderId, null);
    }

    @Override
    @Transactional(readOnly = true)
    public PosVietQrResponse getPosVietQr(Long orderId, BigDecimal draftDiscountAmount) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        branchScopeGuard.checkBranchAccess(order.getBranch() != null ? order.getBranch().getId() : null);

        if (order.isDeleted()) {
            throw new AppException(ErrorCode.ORDER_NOT_FOUND);
        }

        BigDecimal finalAmount = payableAfterCredit(order, order.calculateFinalAmountWithDraftDiscount(draftDiscountAmount));
        String desc = order.getOrderCode();
        String qrCodeUrl = com.smartsalon.payment.VietQrUrlBuilder.buildCompactQrUrl(
                bankId, accountNo, accountName, finalAmount, desc);

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

    @Override
    @Transactional(readOnly = true)
    public CommissionLedgerSummaryResponse getCommissionLedger(Long branchId, LocalDate date) {
        BranchEntity branch = branchRepository.findByIdAndIsDeletedFalse(branchId)
                .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));
        branchScopeGuard.checkBranchAccess(branchId);

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

            UserEntity staff = ledger.getStaff();
            if (staff != null) {
                StaffCommissionSummaryDto summary = staffSummaryMap.computeIfAbsent(staff.getId(), k ->
                        StaffCommissionSummaryDto.builder()
                                .staffId(staff.getId())
                                .staffName(staff.getFullName())
                                .totalAmount(BigDecimal.ZERO)
                                .stepCount(0)
                                .build()
                );
                summary.setTotalAmount(summary.getTotalAmount().add(amt));
                summary.setStepCount(summary.getStepCount() + 1);
            }

            entryDtos.add(CommissionLedgerEntryDto.builder()
                    .id(ledger.getId())
                    .staffId(staff != null ? staff.getId() : null)
                    .staffName(staff != null ? staff.getFullName() : null)
                    .orderId(ledger.getOrder() != null ? ledger.getOrder().getId() : null)
                    .orderCode(ledger.getOrder() != null ? ledger.getOrder().getOrderCode() : null)
                    .serviceName(ledger.resolveServiceName())
                    .stepName(ledger.resolveStepName())
                    .commissionRate(ledger.resolveCommissionRate())
                    .amount(amt)
                    .status(ledger.getStatus())
                    .calculationNotes(ledger.getCalculationNotes())
                    .isOvertime(ledger.isOvertime())
                    .createdAt(ledger.getCreatedAt())
                    .build());
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

    private void applyMembershipTierDiscountIfAutomatic(OrderEntity order) {
        if (order.isDiscountManual()) {
            order.recalculateTotals();
            return;
        }

        UserEntity customer = order.getCustomer();
        if (customer != null && !"walkin.guest".equalsIgnoreCase(customer.getUsername())) {
            MembershipTier tier = customer.getMembershipTier() != null
                    ? customer.getMembershipTier()
                    : MembershipTier.STANDARD;
            BigDecimal subtotal = order.getSubtotal() != null ? order.getSubtotal() : BigDecimal.ZERO;
            BigDecimal autoDiscount = tier.calculateDiscount(subtotal);
            order.setDiscountAmount(autoDiscount);
        }
        order.recalculateTotals();
    }

    /** Clamps to [0, max(0, subtotal - depositDeducted)]; flags manual only when it differs from the tier discount. */
    private void applyManualDiscount(OrderEntity order, BigDecimal requested) {
        order.recalculateTotals();
        BigDecimal deposit = order.getDepositDeducted() != null ? order.getDepositDeducted() : BigDecimal.ZERO;
        BigDecimal cap = order.getSubtotal().subtract(deposit).max(BigDecimal.ZERO);
        BigDecimal clamped = requested.max(BigDecimal.ZERO).min(cap);

        UserEntity customer = order.getCustomer();
        MembershipTier tier = customer != null && customer.getMembershipTier() != null
                ? customer.getMembershipTier()
                : MembershipTier.STANDARD;
        BigDecimal auto = tier.calculateDiscount(order.getSubtotal()).min(cap);
        order.setDiscountAmount(clamped);
        order.setDiscountManual(clamped.compareTo(auto) != 0);
    }

    private UserEntity resolveCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return userRepository.findByUsernameAndIsDeletedFalse(auth.getName()).orElse(null);
        }
        return null;
    }

    @Override
    @Transactional
    public PosOrderResponse createQuickServiceTicket(QuickServiceTicketRequest request) {
        BranchEntity branch = branchRepository.findByIdAndIsDeletedFalse(request.getBranchId())
                .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));
        branchScopeGuard.checkBranchAccess(request.getBranchId());

        UserEntity currentUser = resolveCurrentUser();
        UserEntity assignedStylist = null;
        if (request.getStylistId() != null) {
            assignedStylist = userRepository.findByIdAndIsDeletedFalse(request.getStylistId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy stylist với ID: " + request.getStylistId()));
        } else if (currentUser != null && currentUser.getRoles().stream().anyMatch(r -> "STYLIST".equals(r.getName()))) {
            assignedStylist = currentUser;
        } else {
            assignedStylist = resolveDefaultStaff(branch);
        }

        CustomerIdentityService.ResolvedWalkInCustomer resolvedCustomer =
                customerIdentityService.resolveForWalkIn(
                        request.isQuickGuest(),
                        request.getCustomerPhone(),
                        request.getCustomerName(),
                        branch
                );
        UserEntity customerUser = resolvedCustomer.user();
        String customerName = resolvedCustomer.customerName();
        String customerPhone = resolvedCustomer.customerPhone();

        String orderCode = generateOrderCode();
        OrderEntity order = OrderEntity.builder()
                .branch(branch)
                .customer(customerUser)
                .orderCode(orderCode)
                .status(OrderStatus.CHECKED_IN)
                .customerName(customerName)
                .customerPhone(customerPhone)
                .depositDeducted(BigDecimal.ZERO)
                .notes(request.getNotes())
                .subtotal(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(BigDecimal.ZERO)
                .items(new ArrayList<>())
                .build();

        if (request.getServiceIds() != null && !request.getServiceIds().isEmpty()) {
            for (Long serviceId : request.getServiceIds()) {
                ServiceEntity service = serviceRepository.findByIdAndIsDeletedFalse(serviceId)
                        .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));
                BigDecimal price = service.getBasePrice();

                OrderItemEntity orderItem = OrderItemEntity.builder()
                        .itemType(OrderItemType.SERVICE)
                        .service(service)
                        .quantity(1)
                        .unitPrice(price)
                        .totalPrice(price)
                        .stepAssignments(new ArrayList<>())
                        .build();

                order.addItem(orderItem);
                orderItem.populateDefaultStepAssignments(assignedStylist);
            }
        }

        if (request.getProductItems() != null && !request.getProductItems().isEmpty()) {
            for (ProductItemRequest pReq : request.getProductItems()) {
                if (pReq.getProductId() == null) continue;
                ProductEntity product = productRepository.findByIdAndIsDeletedFalse(pReq.getProductId())
                        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
                int qty = pReq.getQuantity() > 0 ? pReq.getQuantity() : 1;
                BigDecimal unitPrice = product.getRetailPrice() != null ? product.getRetailPrice() : BigDecimal.ZERO;
                BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(qty));

                OrderItemEntity prodItem = OrderItemEntity.builder()
                        .itemType(OrderItemType.PRODUCT)
                        .product(product)
                        .quantity(qty)
                        .unitPrice(unitPrice)
                        .totalPrice(totalPrice)
                        .build();

                order.addItem(prodItem);
            }
        }

        order.recalculateTotals();

        if (request.getDiscountAmount() != null) {
            applyManualDiscount(order, request.getDiscountAmount());
        } else {
            applyMembershipTierDiscountIfAutomatic(order);
        }
        order.recalculateTotals();

        String paymentMethod = StringUtils.hasText(request.getPaymentMethod())
                ? request.getPaymentMethod().trim().toUpperCase()
                : "CASH";
        order.setPaymentMethod(paymentMethod);

        // Save order first so it has an ID and persisted items/steps
        OrderEntity savedOrder = orderRepository.save(order);
        OrderEntity lockedOrder = orderRepository.findByIdForUpdate(savedOrder.getId()).orElse(savedOrder);

        UserEntity settlingUser = currentUser != null ? currentUser : assignedStylist;
        return executeUnifiedSettlement(lockedOrder, paymentMethod, settlingUser);
    }

    @Override
    @Transactional
    public PosOrderResponse quickCompleteBooking(Long bookingId, QuickCompleteBookingRequest request) {
        BookingEntity booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));
        branchScopeGuard.checkBranchAccess(booking.getBranch() != null ? booking.getBranch().getId() : null);

        if (booking.isDeleted()) {
            throw new AppException(ErrorCode.BOOKING_NOT_FOUND);
        }

        UserEntity currentUser = resolveCurrentUser();
        UserEntity stylist = booking.getStaff();
        if (stylist == null) {
            if (currentUser != null && currentUser.getRoles().stream().anyMatch(r -> "STYLIST".equals(r.getName()))) {
                stylist = currentUser;
            } else {
                stylist = resolveDefaultStaff(booking.getBranch());
            }
        }

        // Check if order already exists for this booking
        OrderEntity order = orderRepository.findByBookingIdAndIsDeletedFalse(booking.getId()).orElse(null);
        if (order == null) {
            // Check in booking to create order; pin executing stylist so steps aren't defaulted to the branch's first stylist
            if (booking.getStaff() == null) {
                booking.setStaff(stylist);
                bookingRepository.save(booking);
            }
            checkInBooking(booking.getId());
            order = orderRepository.findByBookingIdAndIsDeletedFalse(booking.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        }

        // Lock order row before checking status or settling
        order = orderRepository.findByIdForUpdate(order.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if (order.getStatus() == OrderStatus.PAID || order.getStatus() == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVALID_ORDER_STATUS, "Đơn hàng đã được thanh toán");
        }

        // Add additional services if provided in request
        if (request != null && request.getServiceIds() != null && !request.getServiceIds().isEmpty()) {
            Set<Long> existingServiceIds = new HashSet<>();
            for (OrderItemEntity item : order.getItems()) {
                if (!item.isDeleted() && item.getItemType() == OrderItemType.SERVICE && item.getService() != null) {
                    existingServiceIds.add(item.getService().getId());
                }
            }
            for (Long sId : request.getServiceIds()) {
                if (!existingServiceIds.contains(sId)) {
                    ServiceEntity service = serviceRepository.findByIdAndIsDeletedFalse(sId)
                            .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));
                    BigDecimal price = service.getBasePrice();
                    OrderItemEntity orderItem = OrderItemEntity.builder()
                            .itemType(OrderItemType.SERVICE)
                            .service(service)
                            .quantity(1)
                            .unitPrice(price)
                            .totalPrice(price)
                            .stepAssignments(new ArrayList<>())
                            .build();
                    order.addItem(orderItem);
                    orderItem.populateDefaultStepAssignments(stylist);
                }
            }
        }

        // Ensure all step assignments have staff assigned
        for (OrderItemEntity item : order.getItems()) {
            if (!item.isDeleted() && item.getStepAssignments() != null) {
                for (OrderStepAssignmentEntity step : item.getStepAssignments()) {
                    if (step.getStaff() == null) {
                        step.setStaff(stylist);
                    }
                }
            }
        }

        if (request != null && request.getDiscountAmount() != null) {
            applyManualDiscount(order, request.getDiscountAmount());
        }
        if (request != null && request.getNotes() != null) {
            order.setNotes(request.getNotes());
        }

        order.recalculateTotals();

        String paymentMethod = (request != null && StringUtils.hasText(request.getPaymentMethod()))
                ? request.getPaymentMethod().trim().toUpperCase()
                : "CASH";
        order.setPaymentMethod(paymentMethod);

        UserEntity settlingUser = currentUser != null ? currentUser : stylist;
        return executeUnifiedSettlement(order, paymentMethod, settlingUser);
    }

    @Override
    @Transactional(readOnly = true)
    public StylistDailyWorklogResponse getStylistDailyWorklog(Long branchId, Long stylistId, LocalDate date) {
        Long effectiveBranchId = branchScopeGuard.getEffectiveBranchId(branchId);
        LocalDate queryDate = date != null ? date : LocalDate.now();
        UserEntity currentUser = resolveCurrentUser();

        UserEntity targetStylist = null;
        if (currentUser != null && currentUser.getRoles().stream().anyMatch(r -> "STYLIST".equals(r.getName()))) {
            targetStylist = currentUser;
        } else if (stylistId != null) {
            targetStylist = userRepository.findByIdAndIsDeletedFalse(stylistId)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy nhân viên với ID: " + stylistId));
        } else if (currentUser != null) {
            targetStylist = currentUser;
        }

        BranchEntity branch = null;
        if (branchId != null) {
            branch = branchRepository.findByIdAndIsDeletedFalse(branchId).orElse(null);
        } else if (targetStylist != null && targetStylist.getBranch() != null) {
            branch = targetStylist.getBranch();
        } else if (currentUser != null && currentUser.getBranch() != null) {
            branch = currentUser.getBranch();
        }
        if (branch == null) {
            branch = branchRepository.findAllByIsDeletedFalseAndIsActiveTrue().stream().findFirst().orElse(null);
        }

        Long finalBranchId = effectiveBranchId != null ? effectiveBranchId : (branch != null ? branch.getId() : 1L);
        String finalBranchName = branch != null ? branch.getName() : "";
        Long finalStylistId = targetStylist != null ? targetStylist.getId() : (currentUser != null ? currentUser.getId() : null);
        String finalStylistName = targetStylist != null ? targetStylist.getFullName() : (currentUser != null ? currentUser.getFullName() : "");

        Instant startDate = queryDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endDate = queryDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        // 1. Fetch all PAID orders in branch & date range
        List<OrderEntity> paidOrders = orderRepository.findByBranchAndStatusAndDateRange(finalBranchId, OrderStatus.PAID, startDate, endDate);

        // 2. Fetch earned commission ledgers for this stylist in date range
        List<CommissionLedgerEntity> ledgers = finalStylistId != null
                ? commissionLedgerRepository.findByStaffIdAndDateRange(finalStylistId, startDate, endDate)
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

        int totalTicketCount = 0;
        int totalCompletedStepCount = 0;
        BigDecimal totalServiceRevenue = BigDecimal.ZERO;

        int selfSettledOrderCount = 0;
        BigDecimal cashCollectedToHandover = BigDecimal.ZERO;
        BigDecimal transferCollectedAmount = BigDecimal.ZERO;

        List<StylistWorklogTicketDto> ticketDtos = new ArrayList<>();

        for (OrderEntity o : paidOrders) {
            boolean stylistWorkedOnOrder = false;
            int stylistStepsInOrder = 0;
            List<String> serviceNames = new ArrayList<>();
            List<String> stepNames = new ArrayList<>();
            BigDecimal serviceRevenueInOrder = BigDecimal.ZERO;

            if (o.getItems() != null) {
                for (OrderItemEntity item : o.getItems()) {
                    if (item.isDeleted()) continue;
                    if (item.getItemType() == OrderItemType.SERVICE && item.getService() != null) {
                        serviceNames.add(item.getService().getName());
                        boolean stylistDidStep = false;
                        if (item.getStepAssignments() != null) {
                            for (OrderStepAssignmentEntity step : item.getStepAssignments()) {
                                if (step.getStaff() != null
                                        && finalStylistId != null && step.getStaff().getId().equals(finalStylistId)) {
                                    stylistStepsInOrder++;
                                    stylistWorkedOnOrder = true;
                                    stylistDidStep = true;
                                    stepNames.add(step.getStepName());
                                }
                            }
                        }
                        if (stylistDidStep) {
                            serviceRevenueInOrder = serviceRevenueInOrder.add(item.getTotalPrice() != null ? item.getTotalPrice() : BigDecimal.ZERO);
                        }
                    }
                }
            }

            boolean settledByThisStylist = o.getSettledBy() != null && finalStylistId != null && o.getSettledBy().getId().equals(finalStylistId);

            // Shift Handover metrics: orders settled by this stylist
            if (settledByThisStylist) {
                selfSettledOrderCount++;
                String pMethod = o.getPaymentMethod() != null ? o.getPaymentMethod().toUpperCase() : "CASH";
                if ("CASH".equals(pMethod)) {
                    cashCollectedToHandover = cashCollectedToHandover.add(o.getFinalAmount() != null ? o.getFinalAmount() : BigDecimal.ZERO);
                } else if ("VIETQR".equals(pMethod) || "CARD".equals(pMethod) || "PAYOS".equals(pMethod)) {
                    transferCollectedAmount = transferCollectedAmount.add(o.getFinalAmount() != null ? o.getFinalAmount() : BigDecimal.ZERO);
                }
            }

            // Production metrics: orders where stylist worked on at least one step
            if (stylistWorkedOnOrder) {
                totalTicketCount++;
                totalCompletedStepCount += stylistStepsInOrder;
                totalServiceRevenue = totalServiceRevenue.add(serviceRevenueInOrder);
            }

            // Include in itemized tickets if stylist worked on it OR personally settled it
            if (stylistWorkedOnOrder || settledByThisStylist) {
                BigDecimal earnedCommission = orderCommissionMap.getOrDefault(o.getId(), BigDecimal.ZERO);
                ticketDtos.add(StylistWorklogTicketDto.builder()
                        .orderId(o.getId())
                        .orderCode(o.getOrderCode())
                        .bookingCode(o.getBooking() != null ? o.getBooking().getBookingCode() : null)
                        .customerName(o.getCustomerName())
                        .customerPhone(o.getCustomerPhone())
                        .serviceNames(serviceNames)
                        .stepNames(stepNames)
                        .orderFinalAmount(o.getFinalAmount())
                        .paymentMethod(o.getPaymentMethod())
                        .settledByMe(settledByThisStylist)
                        .earnedCommission(earnedCommission)
                        .completedAt(o.getSettledAt() != null ? o.getSettledAt() : o.getCreatedAt())
                        .build());
            }
        }

        BigDecimal totalSelfCollectedAmount = cashCollectedToHandover.add(transferCollectedAmount);

        // 3. Fetch upcoming bookings for today in branch
        LocalDateTime dayStart = queryDate.atStartOfDay();
        LocalDateTime dayEnd = queryDate.plusDays(1).atStartOfDay();
        List<BookingEntity> bookings = bookingRepository.findBookingsByBranchAndDay(finalBranchId, dayStart, dayEnd);
        List<DispatchBoardBookingDto> upcomingBookings = new ArrayList<>();
        for (BookingEntity b : bookings) {
            if (b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.PENDING_PAYMENT) {
                if (finalStylistId == null || b.getStaff() == null || b.getStaff().getId().equals(finalStylistId)) {
                    Optional<OrderEntity> linkedOrder = orderRepository.findByBookingIdAndIsDeletedFalse(b.getId());
                    if (linkedOrder.isEmpty() || linkedOrder.get().getStatus() != OrderStatus.PAID) {
                        List<String> bServiceNames = b.getItems().stream()
                                .filter(i -> !i.isDeleted() && i.getService() != null)
                                .map(i -> i.getService().getName())
                                .toList();
                        String staffName = b.getStaff() != null ? b.getStaff().getFullName() : "Chưa chỉ định";
                        upcomingBookings.add(DispatchBoardBookingDto.builder()
                                .id(b.getId())
                                .bookingCode(b.getBookingCode())
                                .customerId(b.getCustomer() != null ? b.getCustomer().getId() : null)
                                .customerName(b.resolvedCustomerName())
                                .customerPhone(b.resolvedCustomerPhone())
                                .staffId(b.getStaff() != null ? b.getStaff().getId() : null)
                                .staffName(staffName)
                                .bookingTime(b.getBookingTime())
                                .endTime(b.getEndTime())
                                .totalDurationMinutes(b.getTotalDurationMinutes())
                                .totalPrice(b.getTotalPrice())
                                .depositAmount(b.getDepositAmount())
                                .depositStatus(b.getDepositStatus() != null ? b.getDepositStatus().name() : null)
                                .status(b.getStatus() != null ? b.getStatus().name() : null)
                                .serviceNames(bServiceNames)
                                .linkedOrderId(linkedOrder.map(OrderEntity::getId).orElse(null))
                                .build());
                    }
                }
            }
        }

        // Weekly schedule and today shift/attendance for stylist
        String worklogShiftCode = null;
        String worklogShiftName = null;
        LocalTime worklogShiftStart = null;
        LocalTime worklogShiftEnd = null;
        Boolean worklogIsWorking = true;
        com.smartsalon.shift.entity.StaffAttendanceStatus worklogAttendanceStatus = null;
        LocalDateTime worklogClockIn = null;
        LocalDateTime worklogBreakStart = null;
        LocalDateTime worklogBreakEnd = null;
        LocalDateTime worklogClockOut = null;
        int worklogOvertimeMinutes = 0;
        List<PersonalWeeklyScheduleDayDto> weeklyScheduleList = new ArrayList<>();

        if (finalStylistId != null) {
            StaffScheduleEntity todaySched = staffScheduleRepository.findByUserIdAndScheduleDateAndIsDeletedFalse(finalStylistId, queryDate).orElse(null);
            com.smartsalon.shift.entity.StaffAttendanceEntity todayAtt = staffAttendanceRepository.findByUserIdAndAttendanceDateAndIsDeletedFalse(finalStylistId, queryDate).orElse(null);

            ShiftDayView wv = ShiftDayView.resolve(todaySched, false);
            worklogShiftCode = wv.code();
            worklogShiftName = wv.name();
            worklogShiftStart = wv.start();
            worklogShiftEnd = wv.end();
            worklogIsWorking = wv.working();

            if (todayAtt != null) {
                worklogAttendanceStatus = todayAtt.getStatus();
                worklogClockIn = todayAtt.getClockInAt();
                worklogBreakStart = todayAtt.getBreakStartAt();
                worklogBreakEnd = todayAtt.getBreakEndAt();
                worklogClockOut = todayAtt.getClockOutAt();
                worklogOvertimeMinutes = todayAtt.getOvertimeMinutes();
            }

            LocalDate monday = queryDate.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
            List<StaffScheduleEntity> weekScheds = staffScheduleRepository.findByUserIdAndScheduleDateBetweenAndIsDeletedFalseOrderByScheduleDateAsc(finalStylistId, monday, monday.plusDays(6));
            Map<LocalDate, StaffScheduleEntity> wsMap = weekScheds.stream().collect(Collectors.toMap(StaffScheduleEntity::getScheduleDate, s -> s, (s1, s2) -> s1));

            List<com.smartsalon.shift.entity.StaffAttendanceEntity> weekAtts = staffAttendanceRepository.findByUserIdAndAttendanceDateBetweenAndIsDeletedFalseOrderByAttendanceDateAsc(finalStylistId, monday, monday.plusDays(6));
            Map<LocalDate, com.smartsalon.shift.entity.StaffAttendanceEntity> waMap = weekAtts.stream().collect(Collectors.toMap(com.smartsalon.shift.entity.StaffAttendanceEntity::getAttendanceDate, a -> a, (a1, a2) -> a1));

            String[] dNames = {"T2", "T3", "T4", "T5", "T6", "T7", "CN"};
            for (int i = 0; i < 7; i++) {
                LocalDate d = monday.plusDays(i);
                StaffScheduleEntity s = wsMap.get(d);
                com.smartsalon.shift.entity.StaffAttendanceEntity a = waMap.get(d);

                String sc = (s != null && s.getShiftTemplate() != null) ? s.getShiftTemplate().getCode() : (s != null && s.getStatus() == StaffScheduleStatus.OFF ? "OFF" : "FULL_DAY");
                String sn = (s != null && s.getShiftTemplate() != null) ? s.getShiftTemplate().getName() : (s != null && s.getStatus() == StaffScheduleStatus.OFF ? "Nghỉ (OFF)" : "Ca Cả ngày");
                LocalTime st = (s != null && s.getShiftTemplate() != null) ? s.getShiftTemplate().getStartTime() : (sc.equals("OFF") ? null : LocalTime.of(8, 30));
                LocalTime et = (s != null && s.getShiftTemplate() != null) ? s.getShiftTemplate().getEndTime() : (sc.equals("OFF") ? null : LocalTime.of(20, 30));
                Boolean iw = (s != null) ? (s.getStatus() == StaffScheduleStatus.WORKING) : true;
                String as = (a != null && a.getStatus() != null) ? a.getStatus().name() : null;

                weeklyScheduleList.add(PersonalWeeklyScheduleDayDto.builder()
                        .date(d)
                        .dayOfWeek(dNames[i])
                        .shiftCode(sc)
                        .shiftName(sn)
                        .shiftStartTime(st)
                        .shiftEndTime(et)
                        .isWorking(iw)
                        .attendanceStatus(as)
                        .build());
            }
        }

        return StylistDailyWorklogResponse.builder()
                .shiftCode(worklogShiftCode)
                .shiftName(worklogShiftName)
                .shiftStartTime(worklogShiftStart)
                .shiftEndTime(worklogShiftEnd)
                .isWorking(worklogIsWorking)
                .attendanceStatus(worklogAttendanceStatus)
                .clockInAt(worklogClockIn)
                .breakStartAt(worklogBreakStart)
                .breakEndAt(worklogBreakEnd)
                .clockOutAt(worklogClockOut)
                .overtimeMinutes(worklogOvertimeMinutes)
                .weeklySchedule(weeklyScheduleList)
                .stylistId(finalStylistId)
                .stylistName(finalStylistName)
                .branchId(finalBranchId)
                .branchName(finalBranchName)
                .date(queryDate)
                .totalTicketCount(totalTicketCount)
                .totalCompletedStepCount(totalCompletedStepCount)
                .totalServiceRevenue(totalServiceRevenue)
                .totalEarnedCommission(totalEarnedCommission)
                .selfSettledOrderCount(selfSettledOrderCount)
                .cashCollectedToHandover(cashCollectedToHandover)
                .transferCollectedAmount(transferCollectedAmount)
                .totalSelfCollectedAmount(totalSelfCollectedAmount)
                .tickets(ticketDtos)
                .upcomingBookings(upcomingBookings)
                .build();
    }
}
