package com.smartsalon.catalog;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsalon.auth.dto.LoginRequest;
import com.smartsalon.auth.dto.RegisterRequest;
import com.smartsalon.catalog.dto.ServiceBomDto;
import com.smartsalon.catalog.dto.ServiceCreateRequest;
import com.smartsalon.catalog.dto.ServiceDefaultStepDto;
import com.smartsalon.catalog.dto.ServiceUpdateRequest;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.config.TestAuthConfig;
import com.smartsalon.inventory.entity.ProductEntity;
import com.smartsalon.inventory.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
class ServiceCatalogIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private MockMvc mockMvc;

    private String adminToken;
    private String customerToken;
    private ProductEntity testProduct;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        // 1. Get Admin Token
        LoginRequest adminLogin = LoginRequest.builder()
                .identifier("admin")
                .password("Admin@123")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        adminToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("result").get("accessToken").asText();

        // 2. Get Customer Token
        long timestamp = System.currentTimeMillis() % 1000000;
        RegisterRequest registerReq = RegisterRequest.builder()
                .username("cat_cust_" + timestamp)
                .password("Pass@123456")
                .fullName("Customer Catalog")
                .phone("09" + String.format("%08d", timestamp + 10))
                .build();

        MvcResult regResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        customerToken = objectMapper.readTree(regResult.getResponse().getContentAsString())
                .get("result").get("accessToken").asText();

        // 3. Ensure a test chemical product exists for BOM testing
        if (testProduct == null) {
            testProduct = productRepository.findBySkuAndIsDeletedFalse("TEST-BLEACH-01")
                    .orElseGet(() -> productRepository.save(ProductEntity.builder()
                            .name("Bột Tẩy Loreal Blond Studio")
                            .sku("TEST-BLEACH-01")
                            .unit("hộp")
                            .volumeOrWeightPerUnit(new BigDecimal("500.00"))
                            .volumeUnit("gram")
                            .currentStockUnits(10)
                            .currentVolume(new BigDecimal("5000.00"))
                            .minStockAlertUnits(2)
                            .costPrice(new BigDecimal("450000.00"))
                            .retailPrice(new BigDecimal("600000.00"))
                            .isActive(true)
                            .build()));
        }
    }

    @Test
    @DisplayName("Khách hàng hoặc người dùng vãng lai được phép xem danh mục dịch vụ công khai")
    void shouldAllowPublicAccessToServicesCatalogAndCategories() throws Exception {
        // Public call without any authorization header
        mockMvc.perform(get("/api/v1/services"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result").isArray());

        mockMvc.perform(get("/api/v1/services/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result").isArray());
    }

    @Test
    @DisplayName("Admin tạo mới dịch vụ hoàn chỉnh với định lượng BOM và các bước kỹ thuật")
    void shouldCreateServiceWithBomAndDefaultStepsAsAdmin() throws Exception {
        ServiceCreateRequest request = ServiceCreateRequest.builder()
                .name("Tẩy Tóc Bạch Kim VIP")
                .description("Quy trình tẩy tóc chuyên sâu sử dụng bột tẩy cao cấp và Olaplex")
                .category("Uốn Nhuộm")
                .basePrice(new BigDecimal("800000.00"))
                .durationMinutes(120)
                .isActive(true)
                .bomList(List.of(
                        ServiceBomDto.builder()
                                .productId(testProduct.getId())
                                .standardAmount(new BigDecimal("50.00"))
                                .unit("gram")
                                .build()
                ))
                .defaultSteps(List.of(
                        ServiceDefaultStepDto.builder()
                                .stepName("Tẩy nền tóc lần 1")
                                .stepOrder(1)
                                .commissionRate(new BigDecimal("30.00"))
                                .build(),
                        ServiceDefaultStepDto.builder()
                                .stepName("Khử vàng và xả dưỡng")
                                .stepOrder(2)
                                .commissionRate(new BigDecimal("20.00"))
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/services")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").isNumber())
                .andExpect(jsonPath("$.result.name").value("Tẩy Tóc Bạch Kim VIP"))
                .andExpect(jsonPath("$.result.category").value("Uốn Nhuộm"))
                .andExpect(jsonPath("$.result.bomList", hasSize(1)))
                .andExpect(jsonPath("$.result.bomList[0].productSku").value("TEST-BLEACH-01"))
                .andExpect(jsonPath("$.result.bomList[0].standardAmount").value(50.00))
                .andExpect(jsonPath("$.result.defaultSteps", hasSize(2)))
                .andExpect(jsonPath("$.result.defaultSteps[0].stepName").value("Tẩy nền tóc lần 1"))
                .andExpect(jsonPath("$.result.defaultSteps[0].commissionRate").value(30.00));
    }

    @Test
    @DisplayName("Báo lỗi 400 khi tổng tỷ lệ hoa hồng các bước kỹ thuật vượt quá 100%")
    void shouldRejectServiceCreationWhenCommissionRatesExceed100Percent() throws Exception {
        ServiceCreateRequest request = ServiceCreateRequest.builder()
                .name("Dịch vụ Test Hoa Hồng Vượt Quá")
                .category("Cắt Gội")
                .basePrice(new BigDecimal("200000.00"))
                .durationMinutes(45)
                .isActive(true)
                .defaultSteps(List.of(
                        ServiceDefaultStepDto.builder()
                                .stepName("Bước 1")
                                .stepOrder(1)
                                .commissionRate(new BigDecimal("60.00"))
                                .build(),
                        ServiceDefaultStepDto.builder()
                                .stepName("Bước 2")
                                .stepOrder(2)
                                .commissionRate(new BigDecimal("50.00")) // Total = 110% > 100%
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/services")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(2003));
    }

    @Test
    @DisplayName("Khách hàng bị từ chối 403 khi cố gắng tạo dịch vụ")
    void shouldForbidCustomerFromCreatingService() throws Exception {
        ServiceCreateRequest request = ServiceCreateRequest.builder()
                .name("Hack Service")
                .category("Khác")
                .basePrice(new BigDecimal("10000.00"))
                .durationMinutes(30)
                .isActive(true)
                .build();

        mockMvc.perform(post("/api/v1/services")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(1003));
    }

    @Test
    @DisplayName("Admin cập nhật thông tin dịch vụ và cấu hình BOM, bước kỹ thuật")
    void shouldUpdateServiceAndItsBomAndSteps() throws Exception {
        // 1. Create a service
        ServiceCreateRequest createReq = ServiceCreateRequest.builder()
                .name("Gội Đầu Dưỡng Sinh Cơ Bản")
                .category("Chăm Sóc")
                .basePrice(new BigDecimal("150000.00"))
                .durationMinutes(45)
                .isActive(true)
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/v1/services")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        long serviceId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("result").get("id").asLong();

        // 2. Update service
        ServiceUpdateRequest updateReq = ServiceUpdateRequest.builder()
                .name("Gội Đầu Dưỡng Sinh Nâng Cao")
                .description("Thêm massage cổ vai gáy và tinh dầu thảo dược")
                .category("Chăm Sóc")
                .basePrice(new BigDecimal("250000.00"))
                .durationMinutes(60)
                .isActive(true)
                .defaultSteps(List.of(
                        ServiceDefaultStepDto.builder()
                                .stepName("Gội và massage")
                                .stepOrder(1)
                                .commissionRate(new BigDecimal("40.00"))
                                .build()
                ))
                .build();

        mockMvc.perform(put("/api/v1/services/" + serviceId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.name").value("Gội Đầu Dưỡng Sinh Nâng Cao"))
                .andExpect(jsonPath("$.result.basePrice").value(250000.00))
                .andExpect(jsonPath("$.result.durationMinutes").value(60))
                .andExpect(jsonPath("$.result.defaultSteps", hasSize(1)));
    }

    @Test
    @DisplayName("Xóa mềm dịch vụ và tra cứu lại trả về lỗi 404 SERVICE_NOT_FOUND")
    void shouldSoftDeleteService() throws Exception {
        // 1. Create service
        ServiceCreateRequest createReq = ServiceCreateRequest.builder()
                .name("Dịch vụ sẽ bị xóa")
                .category("Tạm thời")
                .basePrice(new BigDecimal("100000.00"))
                .durationMinutes(30)
                .isActive(true)
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/v1/services")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        long serviceId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("result").get("id").asLong();

        // 2. Delete service
        mockMvc.perform(delete("/api/v1/services/" + serviceId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));

        // 3. Get deleted service -> 404
        mockMvc.perform(get("/api/v1/services/" + serviceId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(2002));
    }
}
