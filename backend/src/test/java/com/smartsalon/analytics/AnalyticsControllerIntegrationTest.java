package com.smartsalon.analytics;

import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.config.TestAuthConfig;
import com.smartsalon.inventory.entity.InventoryTransactionEntity;
import com.smartsalon.inventory.entity.InventoryTransactionType;
import com.smartsalon.inventory.entity.ProductEntity;
import com.smartsalon.inventory.repository.InventoryTransactionRepository;
import com.smartsalon.inventory.repository.ProductRepository;
import com.smartsalon.pos.entity.CommissionLedgerEntity;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.pos.entity.OrderItemEntity;
import com.smartsalon.pos.entity.OrderItemType;
import com.smartsalon.pos.entity.OrderStatus;
import com.smartsalon.pos.repository.CommissionLedgerRepository;
import com.smartsalon.pos.repository.OrderRepository;
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
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
@Transactional
class AnalyticsControllerIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private InventoryTransactionRepository inventoryTransactionRepository;

    @Autowired
    private CommissionLedgerRepository commissionLedgerRepository;

    private MockMvc mockMvc;
    private BranchEntity branch;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        seedTestData();
    }

    private void seedTestData() {
        branch = branchRepository.findAll().stream().findFirst().orElseGet(() ->
                branchRepository.save(BranchEntity.builder()
                        .name("SmartSalon Flagship - Quận 1")
                        .address("123 Nguyễn Huệ, Q1")
                        .phone("0901234567")
                        .isActive(true)
                        .build())
        );

        RoleEntity stylistRole = roleRepository.findByName("STYLIST").orElseGet(() ->
                roleRepository.save(RoleEntity.builder().name("STYLIST").description("Thợ tạo kiểu").build())
        );
        RoleEntity customerRole = roleRepository.findByName("CUSTOMER").orElseGet(() ->
                roleRepository.save(RoleEntity.builder().name("CUSTOMER").description("Khách hàng").build())
        );

        UserEntity stylist = userRepository.findByUsernameAndIsDeletedFalse("stylist.minh").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("stylist.minh")
                        .passwordHash("hashed")
                        .fullName("Trần Minh Tuấn")
                        .phone("0911000001")
                        .branch(branch)
                        .baseSalary(new BigDecimal("12000000.00"))
                        .isActive(true)
                        .roles(Set.of(stylistRole))
                        .build())
        );
        if (stylist.getBaseSalary().compareTo(BigDecimal.ZERO) == 0) {
            stylist.setBaseSalary(new BigDecimal("12000000.00"));
            userRepository.save(stylist);
        }

        UserEntity customer = userRepository.findByUsernameAndIsDeletedFalse("cust.ha").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("cust.ha")
                        .passwordHash("hashed")
                        .fullName("Nguyễn Thu Hà")
                        .phone("0988111222")
                        .branch(branch)
                        .isActive(true)
                        .roles(Set.of(customerRole))
                        .build())
        );

        ServiceEntity service = serviceRepository.findAll().stream().findFirst().orElseGet(() ->
                serviceRepository.save(ServiceEntity.builder()
                        .name("Nhuộm tóc thời trang")
                        .category("COLOR")
                        .basePrice(new BigDecimal("850000.00"))
                        .commissionPoolRate(new BigDecimal("20.00"))
                        .durationMinutes(120)
                        .isActive(true)
                        .build())
        );

        ProductEntity productShampoo = productRepository.findBySkuAndIsDeletedFalse("PRD-SHAMPOO-KERASTASE").orElseGet(() ->
                productRepository.save(ProductEntity.builder()
                        .name("Dầu gội Kérastase")
                        .sku("PRD-SHAMPOO-KERASTASE")
                        .unit("Chai")
                        .volumeOrWeightPerUnit(new BigDecimal("1000.00"))
                        .volumeUnit("ml")
                        .costPrice(new BigDecimal("750000.00"))
                        .retailPrice(new BigDecimal("1250000.00"))
                        .isActive(true)
                        .build())
        );

        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        Instant t1 = LocalDate.of(2026, 10, 15).atTime(10, 30).atZone(zone).toInstant();
        Instant t2 = LocalDate.of(2026, 10, 16).atTime(14, 0).atZone(zone).toInstant();
        Instant t3 = LocalDate.of(2026, 10, 17).atTime(11, 0).atZone(zone).toInstant();
        Instant t4 = LocalDate.of(2026, 10, 18).atTime(15, 0).atZone(zone).toInstant();

        // Order 1: Mixed service + retail product with 100,000 discount
        OrderEntity o1 = orderRepository.findByOrderCodeAndIsDeletedFalse("ORD-20261015-001").orElseGet(() -> {
            OrderEntity order = OrderEntity.builder()
                    .branch(branch)
                    .customer(customer)
                    .orderCode("ORD-20261015-001")
                    .status(OrderStatus.PAID)
                    .customerName("Nguyễn Thu Hà")
                    .customerPhone("0988111222")
                    .subtotal(new BigDecimal("2100000.00"))
                    .discountAmount(new BigDecimal("100000.00"))
                    .depositDeducted(new BigDecimal("170000.00"))
                    .finalAmount(new BigDecimal("1830000.00"))
                    .paymentMethod("CASH")
                    .items(new ArrayList<>())
                    .build();
            order.setCreatedAt(t1);

            OrderItemEntity itemSvc = OrderItemEntity.builder()
                    .order(order)
                    .service(service)
                    .itemType(OrderItemType.SERVICE)
                    .quantity(1)
                    .unitPrice(new BigDecimal("850000.00"))
                    .totalPrice(new BigDecimal("850000.00"))
                    .build();
            order.addItem(itemSvc);

            OrderItemEntity itemProd = OrderItemEntity.builder()
                    .order(order)
                    .product(productShampoo)
                    .itemType(OrderItemType.PRODUCT)
                    .quantity(1)
                    .unitPrice(new BigDecimal("1250000.00"))
                    .totalPrice(new BigDecimal("1250000.00"))
                    .build();
            order.addItem(itemProd);

            OrderEntity saved = orderRepository.save(order);

            // Snapshotted chemical cogs: 77,000
            inventoryTransactionRepository.save(InventoryTransactionEntity.builder()
                    .branch(branch)
                    .product(productShampoo)
                    .transactionType(InventoryTransactionType.SERVICE_CONSUMPTION)
                    .quantityUnits(0)
                    .volumeAmount(new BigDecimal("-70.00"))
                    .unit("ml")
                    .balanceAfterVolume(new BigDecimal("930.00"))
                    .referenceOrderId(saved.getId())
                    .unitCostSnapshot(new BigDecimal("1100.0000"))
                    .totalCostAmount(new BigDecimal("77000.00"))
                    .build());

            // Snapshotted retail cogs: 750,000
            inventoryTransactionRepository.save(InventoryTransactionEntity.builder()
                    .branch(branch)
                    .product(productShampoo)
                    .transactionType(InventoryTransactionType.RETAIL_SALE)
                    .quantityUnits(-1)
                    .volumeAmount(BigDecimal.ZERO)
                    .unit("Chai")
                    .balanceAfterVolume(new BigDecimal("930.00"))
                    .referenceOrderId(saved.getId())
                    .unitCostSnapshot(new BigDecimal("750000.0000"))
                    .totalCostAmount(new BigDecimal("750000.00"))
                    .build());

            // Staff commission: 170,000
            commissionLedgerRepository.save(CommissionLedgerEntity.builder()
                    .staff(stylist)
                    .order(saved)
                    .amount(new BigDecimal("170000.00"))
                    .status("EARNED")
                    .calculationNotes("850k x 20%")
                    .build());

            return saved;
        });

        // Order 2, 3, 4
        createSimpleOrder("ORD-20261016-002", t2, customer, stylist, service, new BigDecimal("250000.00"), new BigDecimal("22500.00"), new BigDecimal("50000.00"));
        createSimpleOrder("ORD-20261017-003", t3, customer, stylist, service, new BigDecimal("650000.00"), new BigDecimal("58500.00"), new BigDecimal("130000.00"));
        createSimpleOrder("ORD-20261018-004", t4, customer, stylist, service, new BigDecimal("180000.00"), new BigDecimal("15000.00"), new BigDecimal("36000.00"));
    }

    private void createSimpleOrder(String orderCode, Instant time, UserEntity customer, UserEntity stylist, ServiceEntity service, BigDecimal price, BigDecimal cogs, BigDecimal commission) {
        if (orderRepository.findByOrderCodeAndIsDeletedFalse(orderCode).isPresent()) {
            return;
        }
        OrderEntity order = OrderEntity.builder()
                .branch(branch)
                .customer(customer)
                .orderCode(orderCode)
                .status(OrderStatus.PAID)
                .customerName(customer.getFullName())
                .customerPhone(customer.getPhone())
                .subtotal(price)
                .discountAmount(BigDecimal.ZERO)
                .depositDeducted(BigDecimal.ZERO)
                .finalAmount(price)
                .paymentMethod("VIETQR")
                .items(new ArrayList<>())
                .build();
        order.setCreatedAt(time);

        OrderItemEntity item = OrderItemEntity.builder()
                .order(order)
                .service(service)
                .itemType(OrderItemType.SERVICE)
                .quantity(1)
                .unitPrice(price)
                .totalPrice(price)
                .build();
        order.addItem(item);

        OrderEntity saved = orderRepository.save(order);

        ProductEntity dummyProduct = productRepository.findAll().stream().findFirst().orElse(null);
        if (dummyProduct != null) {
            inventoryTransactionRepository.save(InventoryTransactionEntity.builder()
                    .branch(branch)
                    .product(dummyProduct)
                    .transactionType(InventoryTransactionType.SERVICE_CONSUMPTION)
                    .quantityUnits(0)
                    .volumeAmount(new BigDecimal("-30.00"))
                    .unit("ml")
                    .balanceAfterVolume(new BigDecimal("500.00"))
                    .referenceOrderId(saved.getId())
                    .unitCostSnapshot(cogs.divide(new BigDecimal("30"), 4, java.math.RoundingMode.HALF_UP))
                    .totalCostAmount(cogs)
                    .build());
        }

        commissionLedgerRepository.save(CommissionLedgerEntity.builder()
                .staff(stylist)
                .order(saved)
                .amount(commission)
                .status("EARNED")
                .calculationNotes("commission")
                .build());
    }

    @Test
    @DisplayName("GET /api/v1/analytics/pnl - Successfully calculate Realized P&L, pro-rated discounts, COGS, commissions, and dual-tier net profit")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void shouldReturnPnlAnalyticsReport() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/pnl")
                        .param("branchId", branch.getId().toString())
                        .param("startDate", "2026-10-15")
                        .param("endDate", "2026-10-18")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.branchId").value(branch.getId().intValue()))
                .andExpect(jsonPath("$.result.totalOrders", greaterThanOrEqualTo(4)))
                .andExpect(jsonPath("$.result.grossServiceRevenue", greaterThan(0.0)))
                .andExpect(jsonPath("$.result.grossRetailRevenue", greaterThan(0.0)))
                .andExpect(jsonPath("$.result.totalNetRevenue", greaterThan(0.0)))
                .andExpect(jsonPath("$.result.chemicalCogs", greaterThan(0.0)))
                .andExpect(jsonPath("$.result.retailCogs", greaterThan(0.0)))
                .andExpect(jsonPath("$.result.totalCommissions", greaterThan(0.0)))
                .andExpect(jsonPath("$.result.operationalNetProfit", notNullValue()))
                .andExpect(jsonPath("$.result.fixedBaseSalaryCost", greaterThan(0.0)))
                .andExpect(jsonPath("$.result.netProfitAfterPayroll", notNullValue()))
                .andExpect(jsonPath("$.result.dailySeries", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.result.orders", hasSize(greaterThanOrEqualTo(4))))
                // Assert pro-rated discount on Order 1
                .andExpect(jsonPath("$.result.orders[?(@.orderCode == 'ORD-20261015-001')].grossServiceRevenue").value(hasItem(850000.0)))
                .andExpect(jsonPath("$.result.orders[?(@.orderCode == 'ORD-20261015-001')].grossRetailRevenue").value(hasItem(1250000.0)))
                .andExpect(jsonPath("$.result.orders[?(@.orderCode == 'ORD-20261015-001')].chemicalCogs").value(hasItem(77000.0)))
                .andExpect(jsonPath("$.result.orders[?(@.orderCode == 'ORD-20261015-001')].retailCogs").value(hasItem(750000.0)))
                .andExpect(jsonPath("$.result.orders[?(@.orderCode == 'ORD-20261015-001')].staffCommissions").value(hasItem(170000.0)))
                .andExpect(jsonPath("$.result.orders[?(@.orderCode == 'ORD-20261015-001')].orderNetProfit").value(hasItem(1003000.0)));
    }

    @Test
    @DisplayName("GET /api/v1/analytics/pnl - Deny access for CUSTOMER role")
    @WithMockUser(username = "customer", roles = {"CUSTOMER"})
    void shouldDenyPnlAccessForCustomer() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/pnl")
                        .param("branchId", branch.getId().toString())
                        .param("startDate", "2026-10-15")
                        .param("endDate", "2026-10-18")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }
}
