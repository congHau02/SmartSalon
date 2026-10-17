package com.smartsalon.inventory;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsalon.auth.dto.LoginRequest;
import com.smartsalon.auth.dto.RegisterRequest;
import com.smartsalon.config.TestAuthConfig;
import com.smartsalon.inventory.dto.ProductRequest;
import com.smartsalon.inventory.dto.StockAdjustmentRequest;
import com.smartsalon.inventory.dto.StockInRequest;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
class InventoryIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private MockMvc mockMvc;

    private String adminToken;
    private String customerToken;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        // Admin login
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

        // Customer register
        long timestamp = System.currentTimeMillis() % 1000000;
        RegisterRequest registerReq = RegisterRequest.builder()
                .username("inv_cust_" + timestamp)
                .password("Pass@123456")
                .fullName("Customer Inventory")
                .phone("09" + String.format("%08d", timestamp + 25))
                .build();

        MvcResult regResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        customerToken = objectMapper.readTree(regResult.getResponse().getContentAsString())
                .get("result").get("accessToken").asText();
    }

    @Test
    @DisplayName("Khách hàng hoặc người dùng vãng lai được phép xem danh mục sản phẩm công khai")
    void shouldAllowPublicAccessToProductCatalog() throws Exception {
        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result").isArray());
    }

    @Test
    @DisplayName("Admin tạo mới Master Product và tra cứu chi tiết thành công")
    void shouldCreateAndRetrieveProductAsAdmin() throws Exception {
        long timestamp = System.currentTimeMillis() % 100000;
        String sku = "SKU-KERATIN-" + timestamp;

        ProductRequest request = ProductRequest.builder()
                .name("Hấp Dầu Phục Hồi Keratin Kerasilk")
                .sku(sku)
                .barcode("893850123" + timestamp)
                .unit("hũ")
                .volumeOrWeightPerUnit(new BigDecimal("500.00"))
                .volumeUnit("ml")
                .minStockAlertUnits(3)
                .costPrice(new BigDecimal("350000.00"))
                .retailPrice(new BigDecimal("550000.00"))
                .isActive(true)
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/v1/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").isNumber())
                .andExpect(jsonPath("$.result.name").value("Hấp Dầu Phục Hồi Keratin Kerasilk"))
                .andExpect(jsonPath("$.result.sku").value(sku))
                .andExpect(jsonPath("$.result.volumeOrWeightPerUnit").value(500.00))
                .andReturn();

        long productId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("result").get("id").asLong();

        // Get by ID
        mockMvc.perform(get("/api/v1/products/" + productId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value(productId));
    }

    @Test
    @DisplayName("Báo lỗi 409 Conflict khi tạo sản phẩm có mã SKU đã tồn tại")
    void shouldRejectDuplicateSkuOnCreate() throws Exception {
        long timestamp = System.currentTimeMillis() % 100000;
        String sku = "SKU-DUP-" + timestamp;

        ProductRequest request = ProductRequest.builder()
                .name("Sáp Vuốt Tóc Moroccanoil")
                .sku(sku)
                .unit("hộp")
                .volumeOrWeightPerUnit(new BigDecimal("100.00"))
                .volumeUnit("gram")
                .costPrice(new BigDecimal("200000.00"))
                .retailPrice(new BigDecimal("350000.00"))
                .build();

        // Create 1st time -> OK
        mockMvc.perform(post("/api/v1/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Create 2nd time -> 409 CONFLICT
        mockMvc.perform(post("/api/v1/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(3003));
    }

    @Test
    @DisplayName("Admin thực hiện Nhập kho (Stock In) và Kiểm kê điều chỉnh kho (Stock Adjustment) tại chi nhánh")
    void shouldPerformStockInAndAdjustmentForBranchInventory() throws Exception {
        // 1. Tạo sản phẩm
        long timestamp = System.currentTimeMillis() % 100000;
        ProductRequest productReq = ProductRequest.builder()
                .name("Dầu Gội Xả Moroccanoil Moisture")
                .sku("SKU-MOROC-" + timestamp)
                .unit("chai")
                .volumeOrWeightPerUnit(new BigDecimal("1000.00"))
                .volumeUnit("ml")
                .minStockAlertUnits(5)
                .costPrice(new BigDecimal("600000.00"))
                .retailPrice(new BigDecimal("900000.00"))
                .isActive(true)
                .build();

        MvcResult prodResult = mockMvc.perform(post("/api/v1/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(productReq)))
                .andExpect(status().isCreated())
                .andReturn();

        long productId = objectMapper.readTree(prodResult.getResponse().getContentAsString())
                .get("result").get("id").asLong();

        // 2. Nhập kho 10 chai vào Chi nhánh 1
        StockInRequest stockInReq = StockInRequest.builder()
                .productId(productId)
                .quantityUnits(10)
                .notes("Nhập kho định kỳ tuần 42")
                .build();

        mockMvc.perform(post("/api/v1/branches/1/inventory/stock-in")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(stockInReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.stockUnits").value(10))
                .andExpect(jsonPath("$.result.totalAvailableVolume").value(10000.00));

        // 3. Điều chỉnh kiểm kê thực tế: 9 chai, dở dang 850ml
        StockAdjustmentRequest adjustReq = StockAdjustmentRequest.builder()
                .productId(productId)
                .actualStockUnits(9)
                .actualVolume(new BigDecimal("850.00"))
                .reason("Khai báo khui nắp chai đầu tiên và sử dụng cho khách")
                .build();

        mockMvc.perform(post("/api/v1/branches/1/inventory/adjustment")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adjustReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.stockUnits").value(9))
                .andExpect(jsonPath("$.result.currentVolume").value(850.00))
                .andExpect(jsonPath("$.result.totalAvailableVolume").value(9850.00));

        // 4. Lấy lịch sử biến động kho của sản phẩm
        mockMvc.perform(get("/api/v1/branches/1/inventory/transactions")
                        .param("productId", String.valueOf(productId))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result", hasSize(2)))
                .andExpect(jsonPath("$.result[0].transactionType").value("STOCK_ADJUSTMENT"))
                .andExpect(jsonPath("$.result[1].transactionType").value("STOCK_IN"));
    }

    @Test
    @DisplayName("Khách hàng bị từ chối 403 khi thao tác tạo sản phẩm hoặc truy vấn kho chi nhánh")
    void shouldForbidCustomerFromMutatingProductsAndAccessingBranchInventory() throws Exception {
        // Customer attempts to create product
        ProductRequest productReq = ProductRequest.builder()
                .name("Hack Product")
                .sku("HACK-01")
                .unit("chai")
                .volumeOrWeightPerUnit(new BigDecimal("100.00"))
                .costPrice(BigDecimal.ZERO)
                .retailPrice(BigDecimal.ZERO)
                .build();

        mockMvc.perform(post("/api/v1/products")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(productReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(1003));

        // Customer attempts to view branch inventory
        mockMvc.perform(get("/api/v1/branches/1/inventory")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(1003));
    }
}
