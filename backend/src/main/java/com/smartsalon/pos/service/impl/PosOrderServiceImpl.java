package com.smartsalon.pos.service.impl;

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

import com.smartsalon.inventory.service.InventoryService;
import com.smartsalon.payment.entity.PaymentTransactionEntity;
import com.smartsalon.payment.repository.PaymentTransactionRepository;
import com.smartsalon.pos.repository.CommissionLedgerRepository;
import org.springframework.beans.factory.annotation.Value;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PosOrderServiceImpl implements PosOrderService {

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
        applyCustomerCreditBalanceIfAvailable(order);

        OrderEntity savedOrder = orderRepository.save(order);

        realtimeNotificationService.notifyBookingStatusChanged(booking, oldStatus, BookingStatus.CHECKED_IN);
        realtimeNotificationService.notifyOrderCheckedIn(savedOrder);

        return mapToOrderResponse(savedOrder);
    }

    @Override
    @Transactional
    public PosOrderResponse createWalkInOrder(WalkInOrderRequest request) {
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
        applyCustomerCreditBalanceIfAvailable(order);

        OrderEntity savedOrder = orderRepository.save(order);
        realtimeNotificationService.notifyWalkInCreated(savedOrder);

        return mapToOrderResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public DispatchBoardResponse getDispatchBoard(Long branchId, LocalDate date) {
        BranchEntity branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));

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

            stylistDtos.add(StylistAvailabilityDto.builder()
                    .stylistId(stylist.getId())
                    .fullName(stylist.getFullName())
                    .phone(stylist.getPhone())
                    .avatarUrl(stylist.getAvatarUrl())
                    .isBusy(isBusy)
                    .currentOrderCode(currentOrderCode)
                    .currentCustomerName(currentCustomerName)
                    .currentStepName(currentStepName)
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

    @Override
    @Transactional(readOnly = true)
    public PosOrderResponse getOrderById(Long orderId) {
        OrderEntity order = orderRepository.findByIdAndIsDeletedFalse(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional
    public PosOrderResponse addServiceItem(Long orderId, AddServiceItemRequest request) {
        OrderEntity order = orderRepository.findByIdAndIsDeletedFalse(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

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

        if (order.getStatus() == OrderStatus.PAID || order.getStatus() == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
        }

        if (request.getDiscountAmount() != null) {
            order.setDiscountAmount(request.getDiscountAmount());
            order.setDiscountManual(true);
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
            return stylists.get(0);
        }
        return userRepository.findAllActiveStylists().stream()
                .findFirst()
                .orElse(null);
    }

    private String generateOrderCode() {
        return "ORD-" + (System.currentTimeMillis() % 100000000);
    }

    @Override
    @Transactional(readOnly = true)
    public TechnicalLogResponse getVisualLog(Long orderId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

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
                .finalAmount(order.getFinalAmount())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .notes(order.getNotes())
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
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

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

        if (request.getDiscountAmount() != null) {
            if (request.getDiscountAmount().compareTo(BigDecimal.ZERO) < 0) {
                throw new AppException(ErrorCode.VALIDATION_ERROR);
            }
            order.setDiscountAmount(request.getDiscountAmount());
            order.setDiscountManual(true);
        }

        if (request.getNotes() != null) {
            order.setNotes(request.getNotes());
        }

        order.recalculateTotals();

        String paymentMethod = StringUtils.hasText(request.getPaymentMethod())
                ? request.getPaymentMethod().trim().toUpperCase()
                : "CASH";
        order.setPaymentMethod(paymentMethod);

        // 1. Deduct chemical BOM consumables
        deductChemicalConsumables(order);

        // 2. Deduct retail product sealed units
        deductRetailProducts(order);

        // 3. Mark step assignments COMPLETED and record immutable Commission Ledger
        completeStepsAndRecordCommission(order);

        // 4. Record Payment Transaction
        PaymentTransactionEntity tx = PaymentTransactionEntity.builder()
                .orderId(order.getId())
                .booking(order.getBooking())
                .paymentMethod(paymentMethod)
                .transactionCode("TX-POS-" + order.getOrderCode() + "-" + System.currentTimeMillis())
                .amount(order.getFinalAmount())
                .status(PaymentTransactionEntity.STATUS_SUCCESS)
                .build();
        paymentTransactionRepository.save(tx);

        // 5. Update Order status to PAID and linked Booking to COMPLETED
        order.setStatus(OrderStatus.PAID);
        OrderEntity savedOrder = orderRepository.save(order);

        // 5b. Update customer cumulative spend and membership tier (excluding walkin.guest)
        if (order.getCustomer() != null && !"walkin.guest".equalsIgnoreCase(order.getCustomer().getUsername())) {
            UserEntity customer = order.getCustomer();
            BigDecimal netRevenue = order.calculateRevenueBreakdown().totalNetRevenue();
            BigDecimal currentSpent = customer.getTotalSpent() != null ? customer.getTotalSpent() : BigDecimal.ZERO;
            BigDecimal updatedSpent = currentSpent.add(netRevenue);
            customer.setTotalSpent(updatedSpent);
            customer.setMembershipTier(MembershipTier.fromTotalSpent(updatedSpent));
            userRepository.save(customer);
        }

        if (order.getBooking() != null) {
            BookingEntity booking = order.getBooking();
            BookingStatus oldBookingStatus = booking.getStatus();
            booking.setStatus(BookingStatus.COMPLETED);
            bookingRepository.save(booking);
            if (realtimeNotificationService != null && oldBookingStatus != BookingStatus.COMPLETED) {
                realtimeNotificationService.notifyBookingStatusChanged(booking, oldBookingStatus, BookingStatus.COMPLETED);
            }
        }

        // 6. Broadcast realtime WebSocket event
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
                stepAssignmentRepository.save(step);

                UserEntity staff = step.getStaff() != null ? step.getStaff() : resolveOrderStaff(order);
                String calculationNotes = step.formatCalculationNotes();

                CommissionLedgerEntity ledger = CommissionLedgerEntity.builder()
                        .staff(staff)
                        .order(order)
                        .stepAssignment(step)
                        .amount(commissionAmount)
                        .status("EARNED")
                        .calculationNotes(calculationNotes)
                        .build();
                commissionLedgerRepository.save(ledger);
            }
        }
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

        if (order.isDeleted()) {
            throw new AppException(ErrorCode.ORDER_NOT_FOUND);
        }

        BigDecimal finalAmount = order.calculateFinalAmountWithDraftDiscount(draftDiscountAmount);
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

    private void applyCustomerCreditBalanceIfAvailable(OrderEntity order) {
        UserEntity customer = order.getCustomer();
        if (customer == null || "walkin.guest".equalsIgnoreCase(customer.getUsername())) {
            return;
        }
        BigDecimal credit = customer.getCreditBalance();
        if (credit == null || credit.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        BigDecimal subtotal = order.getSubtotal() != null ? order.getSubtotal() : BigDecimal.ZERO;
        BigDecimal discount = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal currentDepositDeducted = order.getDepositDeducted() != null ? order.getDepositDeducted() : BigDecimal.ZERO;

        BigDecimal maxApplicable = subtotal.subtract(discount).subtract(currentDepositDeducted);
        if (maxApplicable.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal applied = credit.min(maxApplicable);
            order.setDepositDeducted(currentDepositDeducted.add(applied));
            customer.setCreditBalance(credit.subtract(applied));
            userRepository.save(customer);
            order.recalculateTotals();
        }
    }
}
