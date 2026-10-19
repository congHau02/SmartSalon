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
import com.smartsalon.pos.entity.*;
import com.smartsalon.pos.repository.CommissionLedgerRepository;
import com.smartsalon.pos.repository.OrderRepository;
import com.smartsalon.user.entity.RoleEntity;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.RoleRepository;
import com.smartsalon.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
@Transactional
class ReportExportIntegrationTest {

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

    @Autowired
    private EntityManager entityManager;

    private MockMvc mockMvc;
    private BranchEntity branch;
    private UserEntity stylist;

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

        stylist = userRepository.findByUsernameAndIsDeletedFalse("stylist.minh").orElseGet(() ->
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
        stylist.setBaseSalary(new BigDecimal("12000000.00"));
        userRepository.save(stylist);

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

            OrderItemEntity itemSvc = OrderItemEntity.builder()
                    .order(order)
                    .service(service)
                    .itemType(OrderItemType.SERVICE)
                    .quantity(1)
                    .unitPrice(new BigDecimal("850000.00"))
                    .totalPrice(new BigDecimal("850000.00"))
                    .stepAssignments(new ArrayList<>())
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

            OrderStepAssignmentEntity step = OrderStepAssignmentEntity.builder()
                    .orderItem(itemSvc)
                    .stepName("Pha & Vào thuốc nhuộm")
                    .staff(stylist)
                    .commissionAmount(new BigDecimal("170000.00"))
                    .commissionRate(new BigDecimal("20.00"))
                    .status(StepAssignmentStatus.COMPLETED)
                    .build();
            itemSvc.getStepAssignments().add(step);

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

            CommissionLedgerEntity ledger = commissionLedgerRepository.save(CommissionLedgerEntity.builder()
                    .staff(stylist)
                    .order(saved)
                    .stepAssignment(step)
                    .amount(new BigDecimal("170000.00"))
                    .status("EARNED")
                    .calculationNotes("850k x 20%")
                    .build());

            entityManager.createNativeQuery("UPDATE orders SET created_at = :cat WHERE id = :id")
                    .setParameter("cat", t1)
                    .setParameter("id", saved.getId())
                    .executeUpdate();

            entityManager.createNativeQuery("UPDATE commission_ledgers SET created_at = :cat WHERE id = :id")
                    .setParameter("cat", t1)
                    .setParameter("id", ledger.getId())
                    .executeUpdate();

            return saved;
        });
    }

    @Test
    @DisplayName("GET /api/v1/analytics/export/pnl/xlsx - Successfully export Multi-Sheet P&L Excel Workbook")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void shouldExportPnlReportAsExcel() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/analytics/export/pnl/xlsx")
                        .param("branchId", branch.getId().toString())
                        .param("startDate", "2026-10-15")
                        .param("endDate", "2026-10-18"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("Bao_Cao_PL_")))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString(".xlsx")))
                .andReturn();

        byte[] content = result.getResponse().getContentAsByteArray();
        assertThat(content).isNotEmpty();
        // OOXML Zip file magic header: PK (0x50 0x4B 0x03 0x04)
        assertThat(content[0]).isEqualTo((byte) 'P');
        assertThat(content[1]).isEqualTo((byte) 'K');

        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(content))) {
            assertThat(workbook.getNumberOfSheets()).isGreaterThanOrEqualTo(2);

            Sheet summarySheet = workbook.getSheet("Tong_Hop_Ket_Qua_Kinh_Doanh");
            if (summarySheet == null) {
                summarySheet = workbook.getSheet("Tong_Hop_P_L");
            }
            assertThat(summarySheet).isNotNull();

            Sheet detailSheet = workbook.getSheet("Chi_Tiet_Lai_Lo_Tung_Ca");
            assertThat(detailSheet).isNotNull();
            assertThat(detailSheet.getLastRowNum()).isGreaterThan(0);
        }
    }

    @Test
    @DisplayName("GET /api/v1/analytics/export/pnl/pdf - Successfully export Printable Vietnamese P&L PDF Document")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void shouldExportPnlReportAsPdf() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/analytics/export/pnl/pdf")
                        .param("branchId", branch.getId().toString())
                        .param("startDate", "2026-10-15")
                        .param("endDate", "2026-10-18"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("Bao_Cao_PL_")))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString(".pdf")))
                .andReturn();

        byte[] content = result.getResponse().getContentAsByteArray();
        assertThat(content).isNotEmpty();
        String headerPrefix = new String(content, 0, Math.min(content.length, 5), StandardCharsets.US_ASCII);
        assertThat(headerPrefix).isEqualTo("%PDF-");
    }

    @Test
    @DisplayName("GET /api/v1/analytics/export/staff-payroll/xlsx - Successfully export Multi-Sheet Staff Payroll & Commission Excel Workbook")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void shouldExportStaffPayrollAsExcel() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/analytics/export/staff-payroll/xlsx")
                        .param("branchId", branch.getId().toString())
                        .param("startDate", "2026-10-15")
                        .param("endDate", "2026-10-18"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("Bang_Luong_Hoa_Hong_")))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString(".xlsx")))
                .andReturn();

        byte[] content = result.getResponse().getContentAsByteArray();
        assertThat(content).isNotEmpty();
        assertThat(content[0]).isEqualTo((byte) 'P');
        assertThat(content[1]).isEqualTo((byte) 'K');

        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(content))) {
            assertThat(workbook.getNumberOfSheets()).isGreaterThanOrEqualTo(2);

            Sheet summarySheet = workbook.getSheet("Tong_Hop_Bang_Luong_KPI");
            assertThat(summarySheet).isNotNull();

            Sheet detailSheet = workbook.getSheet("Chi_Tiet_Hoa_Hong_Tung_Ca");
            assertThat(detailSheet).isNotNull();
        }
    }

    @Test
    @DisplayName("GET /api/v1/analytics/export/staff-payroll/pdf - Successfully export Printable Vietnamese Staff Payroll PDF Document")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void shouldExportStaffPayrollAsPdf() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/analytics/export/staff-payroll/pdf")
                        .param("branchId", branch.getId().toString())
                        .param("startDate", "2026-10-15")
                        .param("endDate", "2026-10-18"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("Bang_Luong_Hoa_Hong_")))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString(".pdf")))
                .andReturn();

        byte[] content = result.getResponse().getContentAsByteArray();
        assertThat(content).isNotEmpty();
        String headerPrefix = new String(content, 0, Math.min(content.length, 5), StandardCharsets.US_ASCII);
        assertThat(headerPrefix).isEqualTo("%PDF-");
    }

    @Test
    @DisplayName("Export Endpoints - Deny access for CUSTOMER role")
    @WithMockUser(username = "customer", roles = {"CUSTOMER"})
    void shouldDenyExportForCustomerRole() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/export/pnl/xlsx"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/analytics/export/staff-payroll/pdf"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Export Endpoints - Return 400 Bad Request for unsupported report type or format")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void shouldReturnBadRequestForInvalidReportTypeOrFormat() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/export/unknown-report/xlsx"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/v1/analytics/export/pnl/csv"))
                .andExpect(status().isBadRequest());
    }
}
