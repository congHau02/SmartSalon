package com.smartsalon.common;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ApiResponseTest {

    @Test
    @DisplayName("Should create successful response with result")
    void shouldCreateSuccessResponseWithResult() {
        String data = "sample data";
        ApiResponse<String> response = ApiResponse.success(data);

        assertEquals(1000, response.code());
        assertEquals("Success", response.message());
        assertEquals("sample data", response.result());
        assertNotNull(response.timestamp());
    }

    @Test
    @DisplayName("Should create successful response with custom message and result")
    void shouldCreateSuccessResponseWithMessageAndResult() {
        ApiResponse<Integer> response = ApiResponse.success("Operation completed", 42);

        assertEquals(1000, response.code());
        assertEquals("Operation completed", response.message());
        assertEquals(42, response.result());
        assertNotNull(response.timestamp());
    }

    @Test
    @DisplayName("Should create error response with custom code and message")
    void shouldCreateErrorResponse() {
        ApiResponse<Void> response = ApiResponse.error(1001, "Invalid data");

        assertEquals(1001, response.code());
        assertEquals("Invalid data", response.message());
        assertNull(response.result());
        assertNotNull(response.timestamp());
    }
}
