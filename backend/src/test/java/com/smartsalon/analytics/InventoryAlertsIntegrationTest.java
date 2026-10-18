package com.smartsalon.analytics;

import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceBomEntity;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.catalog.repository.ServiceBomRepository;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.config.TestAuthConfig;
import com.smartsalon.inventory.entity.BranchInventoryEntity;
import com.smartsalon.inventory.entity.InventoryTransactionEntity;
import com.smartsalon.inventory.entity.InventoryTransactionType;
import com.smartsalon.inventory.entity.ProductEntity;
import com.smartsalon.inventory.repository.BranchInventoryRepository;
import com.smartsalon.inventory.repository.InventoryTransactionRepository;
import com.smartsalon.inventory.repository.ProductRepository;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.pos.entity.OrderItemEntity;
import com.smartsalon.pos.entity.OrderItemType;
import com.smartsalon.pos.entity.OrderStatus;
import com.smartsalon.pos.repository.OrderRepository;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
@Transactional
class InventoryAlertsIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BranchInventoryRepository branchInventoryRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private ServiceBomRepository serviceBomRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private InventoryTransactionRepository inventoryTransactionRepository;

    @Autowired
    private com.smartsalon.user.repository.UserRepository userRepository;

    @Autowired
    private com.smartsalon.user.repository.RoleRepository roleRepository;

    private MockMvc mockMvc;
    private BranchEntity branch;
    private com.smartsalon.user.entity.UserEntity customer;
    private ProductEntity productWella;
    private ProductEntity productOxy;
    private ProductEntity productOutOfStock;
    private ProductEntity productHealthy;

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

        // 1. Product Wella: min_alert = 5, costPrice = 95,000, 100ml -> unitVolumeCost = 950 VND/ml
        productWella = productRepository.findBySkuAndIsDeletedFalse("SKU-WELLA-001").orElseGet(() ->
                productRepository.save(ProductEntity.builder()
                        .name("Kem nhuộm tóc Wella Color Perfect")
                        .sku("SKU-WELLA-001")
                        .unit("Tuýp")
                        .volumeUnit("ml")
                        .volumeOrWeightPerUnit(new BigDecimal("100.00"))
                        .costPrice(new BigDecimal("95000.00"))
                        .minStockAlertUnits(5)
                        .isActive(true)
                        .build())
        );

        // 2. Product Oxy: min_alert = 3, costPrice = 150,000, 1000ml -> unitVolumeCost = 150 VND/ml
        productOxy = productRepository.findBySkuAndIsDeletedFalse("SKU-OXY-002").orElseGet(() ->
                productRepository.save(ProductEntity.builder()
                        .name("Trợ nhuộm L'Oréal Oxydant 6%")
                        .sku("SKU-OXY-002")
                        .unit("Chai")
                        .volumeUnit("ml")
                        .volumeOrWeightPerUnit(new BigDecimal("1000.00"))
                        .costPrice(new BigDecimal("150000.00"))
                        .minStockAlertUnits(3)
                        .isActive(true)
                        .build())
        );

        // 3. Product Out of stock: min_alert = 2
        productOutOfStock = productRepository.findBySkuAndIsDeletedFalse("SKU-BLONDOR-003").orElseGet(() ->
                productRepository.save(ProductEntity.builder()
                        .name("Thuốc tẩy tóc Blondor")
                        .sku("SKU-BLONDOR-003")
                        .unit("Hộp")
                        .volumeUnit("g")
                        .volumeOrWeightPerUnit(new BigDecimal("500.00"))
                        .costPrice(new BigDecimal("450000.00"))
                        .minStockAlertUnits(2)
                        .isActive(true)
                        .build())
        );

        // 4. Product Healthy: min_alert = 2
        productHealthy = productRepository.findBySkuAndIsDeletedFalse("SKU-SHAMPOO-004").orElseGet(() ->
                productRepository.save(ProductEntity.builder()
                        .name("Dầu gội xả thảo dược")
                        .sku("SKU-SHAMPOO-004")
                        .unit("Chai")
                        .volumeUnit("ml")
                        .volumeOrWeightPerUnit(new BigDecimal("1000.00"))
                        .costPrice(new BigDecimal("200000.00"))
                        .minStockAlertUnits(2)
                        .isActive(true)
                        .build())
        );

        // Branch inventories:
        // Wella: stock_units = 3 (<= 5) -> LOW_STOCK
        branchInventoryRepository.save(BranchInventoryEntity.builder()
                .branch(branch)
                .product(productWella)
                .stockUnits(3)
                .currentVolume(new BigDecimal("40.00"))
                .minStockAlertUnits(5)
                .build());

        // Oxy: stock_units = 4 (== 3 + 1) -> NEAR_THRESHOLD
        branchInventoryRepository.save(BranchInventoryEntity.builder()
                .branch(branch)
                .product(productOxy)
                .stockUnits(4)
                .currentVolume(new BigDecimal("450.00"))
                .minStockAlertUnits(3)
                .build());

        // Out of stock: stock_units = 0, current_volume = 0 -> OUT_OF_STOCK
        branchInventoryRepository.save(BranchInventoryEntity.builder()
                .branch(branch)
                .product(productOutOfStock)
                .stockUnits(0)
                .currentVolume(BigDecimal.ZERO)
                .minStockAlertUnits(2)
                .build());

        // Healthy: stock_units = 15, current_volume = 800 -> HEALTHY
        branchInventoryRepository.save(BranchInventoryEntity.builder()
                .branch(branch)
                .product(productHealthy)
                .stockUnits(15)
                .currentVolume(new BigDecimal("800.00"))
                .minStockAlertUnits(2)
                .build());

        // Service with BOM: 60ml Wella + 60ml Oxy
        ServiceEntity dyeService = serviceRepository.save(ServiceEntity.builder()
                .name("Nhuộm tóc phủ bóng cao cấp")
                .category("COLOR")
                .basePrice(new BigDecimal("900000.00"))
                .commissionPoolRate(new BigDecimal("20.00"))
                .durationMinutes(120)
                .isActive(true)
                .build());

        serviceBomRepository.save(ServiceBomEntity.builder()
                .service(dyeService)
                .product(productWella)
                .standardAmount(new BigDecimal("60.00"))
                .unit("ml")
                .build());

        serviceBomRepository.save(ServiceBomEntity.builder()
                .service(dyeService)
                .product(productOxy)
                .standardAmount(new BigDecimal("60.00"))
                .unit("ml")
                .build());

        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        Instant txTime = LocalDate.of(2026, 10, 15).atTime(11, 0).atZone(zone).toInstant();

        com.smartsalon.user.entity.RoleEntity customerRole = roleRepository.findByName("CUSTOMER").orElseGet(() ->
                roleRepository.save(com.smartsalon.user.entity.RoleEntity.builder().name("CUSTOMER").description("Khách hàng").build())
        );

        customer = userRepository.findByUsernameAndIsDeletedFalse("cust.invtest").orElseGet(() ->
                userRepository.save(com.smartsalon.user.entity.UserEntity.builder()
                        .username("cust.invtest")
                        .passwordHash("hashed")
                        .fullName("Nguyễn Thị Khách")
                        .phone("0988000111")
                        .branch(branch)
                        .isActive(true)
                        .roles(java.util.Set.of(customerRole))
                        .build())
        );

        // Order 1 (PAID) with 2x dyeService -> standard BOM = 120ml Wella, 120ml Oxy
        OrderEntity order = OrderEntity.builder()
                .branch(branch)
                .customer(customer)
                .orderCode("ORD-20261015-INV01")
                .status(OrderStatus.PAID)
                .customerName("Nguyễn Thị Khách")
                .customerPhone("0988000111")
                .subtotal(new BigDecimal("1800000.00"))
                .discountAmount(BigDecimal.ZERO)
                .depositDeducted(BigDecimal.ZERO)
                .finalAmount(new BigDecimal("1800000.00"))
                .paymentMethod("CASH")
                .items(new ArrayList<>())
                .build();
        order.setCreatedAt(txTime);

        OrderItemEntity item = OrderItemEntity.builder()
                .order(order)
                .service(dyeService)
                .itemType(OrderItemType.SERVICE)
                .quantity(2)
                .unitPrice(new BigDecimal("900000.00"))
                .totalPrice(new BigDecimal("1800000.00"))
                .build();
        order.addItem(item);
        orderRepository.save(order);

        // Inventory Transactions:
        // 1. Service consumption: Wella 135ml (negative volume)
        inventoryTransactionRepository.save(InventoryTransactionEntity.builder()
                .branch(branch)
                .product(productWella)
                .transactionType(InventoryTransactionType.SERVICE_CONSUMPTION)
                .quantityUnits(0)
                .volumeAmount(new BigDecimal("-135.00"))
                .unit("ml")
                .balanceAfterVolume(new BigDecimal("40.00"))
                .unitCostSnapshot(new BigDecimal("950.0000"))
                .totalCostAmount(new BigDecimal("128250.00"))
                .notes("Tiêu hao thực tế dịch vụ")
                .build());

        // 2. Negative Stock adjustment: Wella 25ml shrinkage
        inventoryTransactionRepository.save(InventoryTransactionEntity.builder()
                .branch(branch)
                .product(productWella)
                .transactionType(InventoryTransactionType.STOCK_ADJUSTMENT)
                .quantityUnits(0)
                .volumeAmount(new BigDecimal("-25.00"))
                .unit("ml")
                .balanceAfterVolume(new BigDecimal("40.00"))
                .unitCostSnapshot(new BigDecimal("950.0000"))
                .totalCostAmount(new BigDecimal("23750.00"))
                .notes("Hao hụt rò rỉ tuýp pha")
                .build());
    }

    @Test
    @DisplayName("Should deny unauthenticated access to inventory alerts endpoint")
    void shouldDenyUnauthenticatedAccess() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/inventory-alerts")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should deny access to inventory alerts endpoint for CUSTOMER role")
    @WithMockUser(username = "customer", roles = {"CUSTOMER"})
    void shouldDenyCustomerAccess() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/inventory-alerts")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should return 3-tier stock alerts, burn-rate estimates, and BOM wastage variance for ADMIN")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void shouldReturnInventoryAlertsAndBomWastage() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/inventory-alerts")
                        .param("branchId", String.valueOf(branch.getId()))
                        .param("startDate", "2026-10-01")
                        .param("endDate", "2026-10-31")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.branchId").value(branch.getId().intValue()))
                .andExpect(jsonPath("$.result.totalProducts", greaterThanOrEqualTo(4)))
                .andExpect(jsonPath("$.result.outOfStockCount", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.result.lowStockCount", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.result.nearThresholdCount", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.result.healthyCount", greaterThanOrEqualTo(1)))
                // Verify 3-tier classifications exist in alerts
                .andExpect(jsonPath("$.result.alerts[*].alertLevel", hasItem("OUT_OF_STOCK")))
                .andExpect(jsonPath("$.result.alerts[*].alertLevel", hasItem("LOW_STOCK")))
                .andExpect(jsonPath("$.result.alerts[*].alertLevel", hasItem("NEAR_THRESHOLD")))
                .andExpect(jsonPath("$.result.alerts[*].alertLevel", hasItem("HEALTHY")))
                // Verify burn-rate velocity and days-to-depletion assertions (340ml / 4.35ml/day = 78 days)
                .andExpect(jsonPath("$.result.alerts[?(@.productId == " + productWella.getId() + ")].avgDailyConsumptionVolume").value(4.35))
                .andExpect(jsonPath("$.result.alerts[?(@.productId == " + productWella.getId() + ")].estimatedDaysRemaining").value(78))
                .andExpect(jsonPath("$.result.alerts[?(@.productId == " + productWella.getId() + ")].branchId").value(branch.getId().intValue()))
                .andExpect(jsonPath("$.result.alerts[?(@.productId == " + productWella.getId() + ")].branchName").value(branch.getName()))
                // Verify BOM Wastage calculations
                .andExpect(jsonPath("$.result.bomWastages", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.result.totalWastageCostAmount", greaterThan(0.0)))
                // Verify Wella Color Perfect exact numbers:
                // Standard BOM = 120.00 ml
                // Actual Service Consumption = 135.00 ml
                // Adjustment Loss = 25.00 ml
                // Actual Total Volume = 160.00 ml
                // Wastage Volume = 40.00 ml
                // Wastage Percentage = 33.33 %
                // Unit Cost = 950 VND/ml (from immutable transaction snapshot)
                // Wastage Cost Amount = 38,000.00 VND
                .andExpect(jsonPath("$.result.bomWastages[?(@.productId == " + productWella.getId() + ")].unitCostSnapshot").value(950.0))
                .andExpect(jsonPath("$.result.bomWastages[?(@.productId == " + productWella.getId() + ")].standardBomVolume").value(120.0))
                .andExpect(jsonPath("$.result.bomWastages[?(@.productId == " + productWella.getId() + ")].serviceConsumptionVolume").value(135.0))
                .andExpect(jsonPath("$.result.bomWastages[?(@.productId == " + productWella.getId() + ")].adjustmentLossVolume").value(25.0))
                .andExpect(jsonPath("$.result.bomWastages[?(@.productId == " + productWella.getId() + ")].actualTotalVolume").value(160.0))
                .andExpect(jsonPath("$.result.bomWastages[?(@.productId == " + productWella.getId() + ")].wastageVolume").value(40.0))
                .andExpect(jsonPath("$.result.bomWastages[?(@.productId == " + productWella.getId() + ")].wastagePercentage").value(33.33))
                .andExpect(jsonPath("$.result.bomWastages[?(@.productId == " + productWella.getId() + ")].wastageCostAmount").value(38000.0));
    }
}
