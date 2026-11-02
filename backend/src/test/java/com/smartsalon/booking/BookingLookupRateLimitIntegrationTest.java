package com.smartsalon.booking;

import com.smartsalon.config.TestAuthConfig;
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
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
class BookingLookupRateLimitIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
    }

    @Test
    @DisplayName("Public lookup rate limit: Cho phép tối đa 5 lần tra cứu trong 10 phút, lần thứ 6 trả về 429 TOO_MANY_REQUESTS")
    @WithMockUser(username = "staff_lookup", roles = {"STAFF"})
    void lookupBookings_rateLimit_allow5_reject6th() throws Exception {
        String testIp = "10.0.0.1";
        String testPhone = "0911223344";

        // First 5 requests must succeed
        for (int i = 1; i <= 5; i++) {
            mockMvc.perform(get("/api/v1/bookings/lookup")
                            .with(request -> {
                                request.setRemoteAddr(testIp);
                                return request;
                            })
                            .param("phone", testPhone)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code", is(1000)));
        }

        // 6th request from same IP and phone must be rejected with 429 TOO_MANY_REQUESTS
        mockMvc.perform(get("/api/v1/bookings/lookup")
                        .with(request -> {
                            request.setRemoteAddr(testIp);
                            return request;
                        })
                        .param("phone", testPhone)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code", is(2013)))
                .andExpect(jsonPath("$.message", is("Quá nhiều yêu cầu, vui lòng thử lại sau.")));
    }

    @Test
    @DisplayName("Public lookup rate limit: Số điện thoại khác hoặc IP khác được tính độc lập")
    @WithMockUser(username = "staff_lookup", roles = {"STAFF"})
    void lookupBookings_rateLimit_independentKeys() throws Exception {
        String ipA = "10.0.0.2";
        String ipB = "10.0.0.3";
        String phoneA = "0933445566";
        String phoneB = "0977889900";

        // Exhaust quota for (ipA, phoneA)
        for (int i = 1; i <= 5; i++) {
            mockMvc.perform(get("/api/v1/bookings/lookup")
                            .with(request -> {
                                request.setRemoteAddr(ipA);
                                return request;
                            })
                            .param("phone", phoneA)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());
        }

        // 6th attempt on (ipA, phoneA) is blocked
        mockMvc.perform(get("/api/v1/bookings/lookup")
                        .with(request -> {
                            request.setRemoteAddr(ipA);
                            return request;
                        })
                        .param("phone", phoneA)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isTooManyRequests());

        // Different phoneB on same ipA must still be allowed
        mockMvc.perform(get("/api/v1/bookings/lookup")
                        .with(request -> {
                            request.setRemoteAddr(ipA);
                            return request;
                        })
                        .param("phone", phoneB)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)));

        // Different ipB with original phoneA must also still be allowed
        mockMvc.perform(get("/api/v1/bookings/lookup")
                        .with(request -> {
                            request.setRemoteAddr(ipB);
                            return request;
                        })
                        .param("phone", phoneA)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)));
    }
}
