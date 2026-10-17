package com.smartsalon.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsalon.auth.dto.*;
import com.smartsalon.config.TestAuthConfig;
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

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
class AuthIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
    }

    @Test
    @DisplayName("Đăng nhập thành công bằng Username của Super Admin")
    void shouldLoginSuccessfullyWithUsername() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .identifier("admin")
                .password("Admin@123")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.result.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.result.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.result.user.username").value("admin"))
                .andExpect(jsonPath("$.result.user.roles", hasItem("ADMIN")));
    }

    @Test
    @DisplayName("Đăng nhập thành công bằng Số điện thoại (Dual-Identifier)")
    void shouldLoginSuccessfullyWithPhone() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .identifier("0988888888")
                .password("Admin@123")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.result.user.phone").value("0988888888"));
    }

    @Test
    @DisplayName("Từ chối đăng nhập khi sai mật khẩu")
    void shouldRejectInvalidPassword() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .identifier("admin")
                .password("WrongPassword999")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(1006));
    }

    @Test
    @DisplayName("Đăng ký tài khoản khách hàng mới thành công")
    void shouldRegisterNewCustomerSuccessfully() throws Exception {
        long timestamp = System.currentTimeMillis() % 1000000;
        RegisterRequest request = RegisterRequest.builder()
                .username("customer_" + timestamp)
                .password("Pass@123456")
                .fullName("Khách hàng Test " + timestamp)
                .phone("09" + String.format("%08d", timestamp))
                .email("cust" + timestamp + "@gmail.com")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.result.user.roles", hasItem("CUSTOMER")));
    }

    @Test
    @DisplayName("Xoay vòng Refresh Token (Token Rotation) và ngăn tái sử dụng token cũ")
    void shouldRotateRefreshTokenSuccessfully() throws Exception {
        // 1. Login to get tokens
        LoginRequest loginRequest = LoginRequest.builder()
                .identifier("admin")
                .password("Admin@123")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String initialRefreshToken = loginJson.get("result").get("refreshToken").asText();

        // 2. Refresh token
        RefreshTokenRequest refreshRequest = RefreshTokenRequest.builder()
                .refreshToken(initialRefreshToken)
                .build();

        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.result.refreshToken").isNotEmpty())
                .andReturn();

        JsonNode refreshJson = objectMapper.readTree(refreshResult.getResponse().getContentAsString());
        String newRefreshToken = refreshJson.get("result").get("refreshToken").asText();

        assertNotEquals(initialRefreshToken, newRefreshToken, "New refresh token must be rotated");

        // 3. Attempting to reuse the consumed initial refresh token must fail with 401
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(1007));
    }

    @Test
    @DisplayName("Thu hồi phiên đăng nhập khi Logout")
    void shouldLogoutAndRevokeRefreshToken() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .identifier("admin")
                .password("Admin@123")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String refreshToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("result").get("refreshToken").asText();

        // Logout
        RefreshTokenRequest logoutRequest = RefreshTokenRequest.builder()
                .refreshToken(refreshToken)
                .build();

        mockMvc.perform(post("/api/v1/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logoutRequest)))
                .andExpect(status().isOk());

        // Refresh attempt should now fail
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logoutRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(1007));
    }

    @Test
    @DisplayName("Lấy thông tin người dùng hiện tại qua endpoint /me")
    void shouldGetCurrentUserWithBearerToken() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .identifier("admin")
                .password("Admin@123")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String accessToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("result").get("accessToken").asText();

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.username").value("admin"))
                .andExpect(jsonPath("$.result.fullName").value("Hệ thống Quản trị viên"));
    }

    @Test
    @DisplayName("Kiểm tra phân quyền RBAC: Khách hàng bị chặn 403 khi vào endpoint nội bộ /api/v1/users")
    void shouldEnforceRbacAccessControl() throws Exception {
        // Register customer
        long timestamp = System.currentTimeMillis() % 1000000;
        RegisterRequest registerReq = RegisterRequest.builder()
                .username("rbac_cust_" + timestamp)
                .password("Pass@123456")
                .fullName("Customer RBAC")
                .phone("09" + String.format("%08d", timestamp + 50))
                .build();

        MvcResult regResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String customerToken = objectMapper.readTree(regResult.getResponse().getContentAsString())
                .get("result").get("accessToken").asText();

        // Customer attempts to access internal users API -> 403 Forbidden
        mockMvc.perform(get("/api/v1/users")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        // Admin login -> access internal users API -> 200 OK
        LoginRequest adminLogin = LoginRequest.builder()
                .identifier("admin")
                .password("Admin@123")
                .build();

        MvcResult adminResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        String adminToken = objectMapper.readTree(adminResult.getResponse().getContentAsString())
                .get("result").get("accessToken").asText();

        mockMvc.perform(get("/api/v1/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").isArray());
    }
}
