package com.smartsalon;

import com.smartsalon.security.JwtProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class SecurityAndExceptionSmokeTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JwtProvider jwtProvider;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
    }

    @Test
    @DisplayName("Public health endpoint should be accessible without token and return UP status")
    void publicHealthEndpoint_shouldReturnSuccessEnvelopeWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/v1/public/health")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.message", containsString("Operational")))
                .andExpect(jsonPath("$.result.status", is("UP")))
                .andExpect(jsonPath("$.timestamp", notNullValue()));
    }

    @Test
    @DisplayName("Secured endpoint without JWT token should reject with 403 Forbidden")
    void securedEndpoint_withoutToken_shouldBeRejected() throws Exception {
        mockMvc.perform(get("/api/v1/system/me")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Secured endpoint with valid JWT token should succeed with user details and ROLE_ prefix")
    void securedEndpoint_withValidToken_shouldSucceed() throws Exception {
        String token = jwtProvider.generateAccessToken("stylist_mai", List.of("STYLIST"));

        mockMvc.perform(get("/api/v1/system/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.username", is("stylist_mai")))
                .andExpect(jsonPath("$.result.authorities", hasItem("ROLE_STYLIST")));
    }

    @Test
    @DisplayName("GlobalExceptionHandler should map AppException to appropriate HTTP status and ApiResponse body")
    void exceptionHandler_shouldFormatAppException() throws Exception {
        String token = jwtProvider.generateAccessToken("manager_tuan", List.of("MANAGER"));

        // Test SLOT_ALREADY_LOCKED (409 CONFLICT, Code 2001)
        mockMvc.perform(get("/api/v1/system/simulate-error")
                        .param("type", "slot")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is(2001)))
                .andExpect(jsonPath("$.message", containsString("giữ chỗ")))
                .andExpect(jsonPath("$.result").doesNotExist());

        // Test INSUFFICIENT_STOCK (400 BAD_REQUEST, Code 3001)
        mockMvc.perform(get("/api/v1/system/simulate-error")
                        .param("type", "stock")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is(3001)))
                .andExpect(jsonPath("$.message", containsString("vật tư")));
    }
}
