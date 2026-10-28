package com.smartsalon.pos;

import com.smartsalon.booking.dto.CreateBookingRequest;
import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.booking.service.BookingService;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceBomEntity;
import com.smartsalon.catalog.entity.ServiceDefaultStepEntity;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.catalog.repository.ServiceBomRepository;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.config.TestAuthConfig;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.inventory.entity.BranchInventoryEntity;
import com.smartsalon.inventory.entity.ProductEntity;
import com.smartsalon.inventory.repository.BranchInventoryRepository;
import com.smartsalon.inventory.repository.ProductRepository;
import com.smartsalon.payment.entity.PaymentTransactionEntity;
import com.smartsalon.payment.repository.PaymentTransactionRepository;
import com.smartsalon.pos.dto.AddProductItemRequest;
import com.smartsalon.pos.dto.CheckoutRequest;
import com.smartsalon.pos.dto.PosOrderResponse;
import com.smartsalon.pos.dto.WalkInOrderRequest;
import com.smartsalon.pos.entity.CommissionLedgerEntity;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.pos.entity.OrderItemEntity;
import com.smartsalon.pos.entity.OrderItemType;
import com.smartsalon.pos.entity.OrderStatus;
import com.smartsalon.pos.entity.OrderStepAssignmentEntity;
import com.smartsalon.pos.entity.StepAssignmentStatus;
import com.smartsalon.pos.repository.CommissionLedgerRepository;
import com.smartsalon.pos.repository.OrderRepository;
import com.smartsalon.pos.service.PosOrderService;
import com.smartsalon.user.entity.MembershipTier;
import com.smartsalon.user.entity.RoleEntity;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.RoleRepository;
import com.smartsalon.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@Import(TestAuthConfig.class)
class PosConcurrencyIntegrationTest {

    @Autowired
    private PosOrderService posOrderService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private ServiceBomRepository serviceBomRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BranchInventoryRepository branchInventoryRepository;

    @Autowired
    private CommissionLedgerRepository commissionLedgerRepository;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private BookingRepository bookingRepository;

    private BranchEntity branch;
    private UserEntity stylist;
    private ServiceEntity service;
    private ProductEntity chemicalProduct;
    private ProductEntity retailProduct;
    private BranchInventoryEntity chemicalInventory;
    private BranchInventoryEntity retailInventory;

    @BeforeEach
    void setUp() {
        branch = branchRepository.findAll().stream().findFirst().orElseGet(() ->
                branchRepository.save(BranchEntity.builder()
                        .name("SmartSalon Concurrency Branch")
                        .address("456 Lê Lợi, Q1")
                        .phone("0909998888")
                        .isActive(true)
                        .build())
        );

        RoleEntity stylistRole = roleRepository.findByName("STYLIST").orElseGet(() ->
                roleRepository.save(RoleEntity.builder().name("STYLIST").description("Stylist").build())
        );

        stylist = userRepository.findByUsernameAndIsDeletedFalse("stylist.concurrency").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("stylist.concurrency")
                        .passwordHash("password")
                        .fullName("Nguyễn Văn Stylist")
                        .phone("0981112233")
                        .roles(Set.of(stylistRole))
                        .branch(branch)
                        .isActive(true)
                        .build())
        );

        // Retail product: retail price 250,000 VND
        retailProduct = productRepository.findBySkuAndIsDeletedFalse("RETAIL-CONC-01").orElseGet(() ->
                productRepository.save(ProductEntity.builder()
                        .name("Dầu gội Moroccanoil Concurrency")
                        .sku("RETAIL-CONC-01")
                        .barcode("893000000001")
                        .unit("chai")
                        .retailPrice(new BigDecimal("250000.00"))
                        .costPrice(new BigDecimal("150000.00"))
                        .isActive(true)
                        .build())
        );

        // Chemical product: 500ml per unit, used in BOM
        chemicalProduct = productRepository.findBySkuAndIsDeletedFalse("CHEM-CONC-01").orElseGet(() ->
                productRepository.save(ProductEntity.builder()
                        .name("Thuốc nhuộm Goldwell Concurrency")
                        .sku("CHEM-CONC-01")
                        .barcode("893000000002")
                        .unit("chai")
                        .costPrice(new BigDecimal("300000.00"))
                        .volumeOrWeightPerUnit(new BigDecimal("500.00"))
                        .volumeUnit("ml")
                        .isActive(true)
                        .build())
        );

        // Inventory setup: 5 retail units, 1 chemical unit with 500ml volume
        retailInventory = branchInventoryRepository.findByBranchIdAndProductId(branch.getId(), retailProduct.getId())
                .orElseGet(() -> branchInventoryRepository.save(BranchInventoryEntity.builder()
                        .branch(branch)
                        .product(retailProduct)
                        .stockUnits(5)
                        .currentVolume(BigDecimal.ZERO)
                        .minStockAlertUnits(1)
                        .build()));
        retailInventory.setStockUnits(5);
        retailInventory.setCurrentVolume(BigDecimal.ZERO);
        branchInventoryRepository.save(retailInventory);

        chemicalInventory = branchInventoryRepository.findByBranchIdAndProductId(branch.getId(), chemicalProduct.getId())
                .orElseGet(() -> branchInventoryRepository.save(BranchInventoryEntity.builder()
                        .branch(branch)
                        .product(chemicalProduct)
                        .stockUnits(1)
                        .currentVolume(new BigDecimal("500.00"))
                        .minStockAlertUnits(1)
                        .build()));
        chemicalInventory.setStockUnits(1);
        chemicalInventory.setCurrentVolume(new BigDecimal("500.00"));
        branchInventoryRepository.save(chemicalInventory);

        // Service with BOM: consumes 50ml of chemicalProduct
        service = serviceRepository.findAll().stream()
                .filter(s -> "Nhuộm tóc Concurrency Test".equals(s.getName()))
                .findFirst()
                .orElseGet(() -> {
                    ServiceEntity s = ServiceEntity.builder()
                            .name("Nhuộm tóc Concurrency Test")
                            .category("HAIR_COLOR")
                            .basePrice(new BigDecimal("850000.00"))
                            .commissionPoolRate(new BigDecimal("20.00"))
                            .durationMinutes(90)
                            .isActive(true)
                            .defaultSteps(new ArrayList<>())
                            .build();
                    s.getDefaultSteps().add(ServiceDefaultStepEntity.builder()
                            .service(s)
                            .stepName("Pha thuốc")
                            .stepOrder(1)
                            .commissionRate(new BigDecimal("40.00"))
                            .build());
                    s.getDefaultSteps().add(ServiceDefaultStepEntity.builder()
                            .service(s)
                            .stepName("Nhuộm chính")
                            .stepOrder(2)
                            .commissionRate(new BigDecimal("60.00"))
                            .build());
                    ServiceEntity savedS = serviceRepository.save(s);

                    serviceBomRepository.save(ServiceBomEntity.builder()
                            .service(savedS)
                            .product(chemicalProduct)
                            .standardAmount(new BigDecimal("50.00"))
                            .unit("ml")
                            .build());
                    return savedS;
                });
    }

    @Test
    @DisplayName("Concurrent Checkout Race: Simultaneous checkout requests on same order succeed exactly once and preserve inventory/commission")
    void concurrentCheckoutOrder_onlyOneSucceeds_andInventoryCommissionsDeductedOnce() throws Exception {
        // Create customer
        RoleEntity customerRole = roleRepository.findByName("CUSTOMER").orElseThrow();
        UserEntity customer = userRepository.save(UserEntity.builder()
                .username("cust.race." + System.currentTimeMillis())
                .passwordHash("password")
                .fullName("Khách hàng Đua Checkout")
                .phone("097" + (System.currentTimeMillis() % 10000000))
                .roles(Set.of(customerRole))
                .branch(branch)
                .membershipTier(MembershipTier.STANDARD)
                .totalSpent(BigDecimal.ZERO)
                .creditBalance(BigDecimal.ZERO)
                .isActive(true)
                .build());

        // Create Order with 1 service and 1 retail product
        OrderEntity order = OrderEntity.builder()
                .branch(branch)
                .customer(customer)
                .orderCode("ORD-RACE-" + System.currentTimeMillis())
                .status(OrderStatus.READY_FOR_CHECKOUT)
                .customerName(customer.getFullName())
                .customerPhone(customer.getPhone())
                .depositDeducted(BigDecimal.ZERO)
                .subtotal(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(BigDecimal.ZERO)
                .items(new ArrayList<>())
                .build();

        OrderItemEntity serviceItem = OrderItemEntity.builder()
                .itemType(OrderItemType.SERVICE)
                .service(service)
                .quantity(1)
                .unitPrice(service.getBasePrice())
                .totalPrice(service.getBasePrice())
                .stepAssignments(new ArrayList<>())
                .build();
        order.addItem(serviceItem);

        OrderStepAssignmentEntity step1 = OrderStepAssignmentEntity.builder()
                .stepName("Pha thuốc")
                .staff(stylist)
                .commissionRate(new BigDecimal("40.00"))
                .commissionAmount(new BigDecimal("68000.00"))
                .status(StepAssignmentStatus.PENDING)
                .build();
        OrderStepAssignmentEntity step2 = OrderStepAssignmentEntity.builder()
                .stepName("Nhuộm chính")
                .staff(stylist)
                .commissionRate(new BigDecimal("60.00"))
                .commissionAmount(new BigDecimal("102000.00"))
                .status(StepAssignmentStatus.PENDING)
                .build();
        serviceItem.addStepAssignment(step1);
        serviceItem.addStepAssignment(step2);

        OrderItemEntity retailItem = OrderItemEntity.builder()
                .itemType(OrderItemType.PRODUCT)
                .product(retailProduct)
                .quantity(1)
                .unitPrice(retailProduct.getRetailPrice())
                .totalPrice(retailProduct.getRetailPrice())
                .build();
        order.addItem(retailItem);

        order.recalculateTotals();
        OrderEntity savedOrder = orderRepository.save(order);
        Long orderId = savedOrder.getId();

        // Prepare 2 concurrent threads
        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        List<PosOrderResponse> successList = new CopyOnWriteArrayList<>();
        List<Throwable> errorList = new CopyOnWriteArrayList<>();

        CheckoutRequest request = CheckoutRequest.builder()
                .paymentMethod("CASH")
                .notes("Thanh toán đồng thời")
                .build();

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    PosOrderResponse resp = posOrderService.checkoutOrder(orderId, request);
                    successList.add(resp);
                } catch (Throwable t) {
                    errorList.add(t);
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        // Release threads simultaneously
        startLatch.countDown();
        boolean finished = doneLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(finished).isTrue();
        // Exactly 1 thread must succeed
        assertThat(successList).hasSize(1);
        // The second thread must fail
        assertThat(errorList).hasSize(1);
        Throwable error = errorList.get(0);
        while (error.getCause() != null && !(error instanceof AppException)) {
            error = error.getCause();
        }
        assertThat(error).isInstanceOf(AppException.class);
        assertEquals(ErrorCode.INVALID_ORDER_STATUS, ((AppException) error).getErrorCode());

        // Verify Database State:
        // 1. Order is PAID
        OrderEntity finalOrder = orderRepository.findById(orderId).orElseThrow();
        assertEquals(OrderStatus.PAID, finalOrder.getStatus());

        // 2. Retail inventory deducted exactly ONCE (5 - 1 = 4 units)
        BranchInventoryEntity updatedRetail = branchInventoryRepository.findByBranchIdAndProductId(branch.getId(), retailProduct.getId()).orElseThrow();
        assertEquals(4, updatedRetail.getStockUnits(), "Retail product units must be deducted exactly once");

        // 3. Chemical inventory deducted exactly ONCE (500ml - 50ml = 450ml)
        BranchInventoryEntity updatedChem = branchInventoryRepository.findByBranchIdAndProductId(branch.getId(), chemicalProduct.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("450.00").compareTo(updatedChem.getCurrentVolume()),
                "Chemical consumable volume must be deducted exactly once");

        // 4. Commission ledgers created exactly ONCE (2 steps in service = 2 ledger rows)
        List<CommissionLedgerEntity> ledgers = commissionLedgerRepository.findAll().stream()
                .filter(l -> l.getOrder() != null && l.getOrder().getId().equals(orderId))
                .toList();
        assertEquals(2, ledgers.size(), "Commission ledger entries must be created exactly once per step");

        // 5. Payment transaction recorded exactly ONCE
        List<PaymentTransactionEntity> txs = paymentTransactionRepository.findAll().stream()
                .filter(t -> t.getOrderId() != null && t.getOrderId().equals(orderId))
                .toList();
        assertEquals(1, txs.size(), "Payment transaction must be recorded exactly once");
    }

    @Test
    @DisplayName("Concurrent Retained Deposit Double-Spend: Simultaneous booking requests using same credit balance succeed at most once")
    void concurrentBooking_retainedDeposit_onlyOneBookingCoveredByCredit() throws Exception {
        RoleEntity customerRole = roleRepository.findByName("CUSTOMER").orElseThrow();
        // Customer has 170,000 VND credit balance (exactly enough for ONE 20% deposit on an 850,000 service)
        UserEntity customer = userRepository.save(UserEntity.builder()
                .username("cust.credit." + System.currentTimeMillis())
                .passwordHash("password")
                .fullName("Khách hàng Cọc Bảo Lưu Đua")
                .phone("096" + (System.currentTimeMillis() % 10000000))
                .roles(Set.of(customerRole))
                .branch(branch)
                .membershipTier(MembershipTier.STANDARD)
                .totalSpent(BigDecimal.ZERO)
                .creditBalance(new BigDecimal("170000.00"))
                .isActive(true)
                .build());

        LocalDateTime time1 = LocalDateTime.now().plusDays(15).withHour(10).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime time2 = LocalDateTime.now().plusDays(16).withHour(10).withMinute(0).withSecond(0).withNano(0);

        CreateBookingRequest req1 = new CreateBookingRequest(
                branch.getId(),
                stylist.getId(),
                List.of(service.getId()),
                time1,
                customer.getFullName(),
                customer.getPhone(),
                "Đặt hẹn 1"
        );

        CreateBookingRequest req2 = new CreateBookingRequest(
                branch.getId(),
                stylist.getId(),
                List.of(service.getId()),
                time2,
                customer.getFullName(),
                customer.getPhone(),
                "Đặt hẹn 2"
        );

        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        List<Throwable> errors = new CopyOnWriteArrayList<>();

        executor.submit(() -> {
            try {
                startLatch.await();
                bookingService.holdSlotAndCreate(req1);
            } catch (Throwable t) {
                errors.add(t);
            } finally {
                doneLatch.countDown();
            }
        });

        executor.submit(() -> {
            try {
                startLatch.await();
                bookingService.holdSlotAndCreate(req2);
            } catch (Throwable t) {
                errors.add(t);
            } finally {
                doneLatch.countDown();
            }
        });

        startLatch.countDown();
        boolean finished = doneLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(finished).isTrue();
        assertThat(errors).isEmpty();

        // Verify in database:
        List<BookingEntity> bookings = bookingRepository.findByCustomerPhoneAndIsDeletedFalseOrderByBookingTimeDesc(customer.getPhone());
        assertEquals(2, bookings.size());

        // Exactly 1 booking was covered by credit (CONFIRMED + PAID)
        long coveredCount = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED && b.getDepositStatus() == DepositStatus.PAID)
                .count();
        assertEquals(1, coveredCount, "Exactly 1 booking should be covered by retained deposit");

        // Exactly 1 booking was NOT covered by credit (PENDING_PAYMENT + UNPAID)
        long pendingCount = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.PENDING_PAYMENT && b.getDepositStatus() == DepositStatus.UNPAID)
                .count();
        assertEquals(1, pendingCount, "The second booking should be PENDING_PAYMENT due to depleted credit");

        // Customer credit balance must be exactly 0 (never negative)
        UserEntity finalCust = userRepository.findById(customer.getId()).orElseThrow();
        assertEquals(0, BigDecimal.ZERO.compareTo(finalCust.getCreditBalance()),
                "Customer credit balance must be exactly 0 VND, never negative");

        // PaymentTransaction with METHOD_CREDIT_BALANCE must exist exactly once
        List<PaymentTransactionEntity> creditTxs = paymentTransactionRepository.findAll().stream()
                .filter(t -> PaymentTransactionEntity.METHOD_CREDIT_BALANCE.equals(t.getPaymentMethod())
                        && bookings.stream().anyMatch(b -> b.getId().equals(t.getBooking() != null ? t.getBooking().getId() : null)))
                .toList();
        assertEquals(1, creditTxs.size(), "Exactly 1 credit balance transaction should be recorded");
    }

    @Test
    @DisplayName("Draft Order Credit Safety: Modifying items on draft order does not deduct or destroy creditBalance until settlement")
    void draftOrderModification_doesNotDeductCreditBalance_untilSettlement() {
        RoleEntity customerRole = roleRepository.findByName("CUSTOMER").orElseThrow();
        UserEntity customer = userRepository.save(UserEntity.builder()
                .username("cust.draft." + System.currentTimeMillis())
                .passwordHash("password")
                .fullName("Khách hàng Giữ Cọc Draft")
                .phone("095" + (System.currentTimeMillis() % 10000000))
                .roles(Set.of(customerRole))
                .branch(branch)
                .membershipTier(MembershipTier.STANDARD)
                .totalSpent(BigDecimal.ZERO)
                .creditBalance(new BigDecimal("200000.00"))
                .isActive(true)
                .build());

        // 1. Create walk-in order
        WalkInOrderRequest walkInReq = WalkInOrderRequest.builder()
                .branchId(branch.getId())
                .customerPhone(customer.getPhone())
                .customerName(customer.getFullName())
                .serviceIds(List.of(service.getId())) // 850,000 VND
                .isQuickGuest(false)
                .notes("Đơn nháp kiểm tra cọc bảo lưu")
                .build();

        PosOrderResponse draftOrder = posOrderService.createWalkInOrder(walkInReq);
        assertEquals(0, BigDecimal.ZERO.compareTo(draftOrder.getDepositDeducted()),
                "Draft order must have depositDeducted = 0");

        // Verify customer credit balance is untouched
        UserEntity custAfterWalkIn = userRepository.findById(customer.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("200000.00").compareTo(custAfterWalkIn.getCreditBalance()),
                "Credit balance must remain 200,000 VND during draft order");

        // 2. Add product item to draft order
        AddProductItemRequest addProductReq = AddProductItemRequest.builder()
                .productId(retailProduct.getId())
                .quantity(1)
                .build();
        posOrderService.addProductItem(draftOrder.getId(), addProductReq);

        // Verify customer credit balance is STILL untouched
        UserEntity custAfterAddItem = userRepository.findById(customer.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("200000.00").compareTo(custAfterAddItem.getCreditBalance()),
                "Credit balance must remain 200,000 VND after adding product item");

        // 3. Checkout order
        CheckoutRequest checkoutReq = CheckoutRequest.builder()
                .paymentMethod("CASH")
                .notes("Thanh toán đơn sau khi chỉnh sửa")
                .build();

        PosOrderResponse settledOrder = posOrderService.checkoutOrder(draftOrder.getId(), checkoutReq);
        assertEquals(OrderStatus.PAID, settledOrder.getStatus());
        // Subtotal = 850k + 250k = 1,100,000 VND
        // Applied credit = 200,000 VND
        // Final amount = 900,000 VND
        assertEquals(0, new BigDecimal("200000.00").compareTo(settledOrder.getDepositDeducted()),
                "Full 200,000 VND credit balance must be applied at final settlement");
        assertEquals(0, new BigDecimal("900000.00").compareTo(settledOrder.getFinalAmount()),
                "Final amount must reflect the 200,000 VND credit deduction");

        // Customer credit balance is now 0 VND
        UserEntity custAfterSettlement = userRepository.findById(customer.getId()).orElseThrow();
        assertEquals(0, BigDecimal.ZERO.compareTo(custAfterSettlement.getCreditBalance()),
                "Credit balance must be deducted at settlement");
    }
}
