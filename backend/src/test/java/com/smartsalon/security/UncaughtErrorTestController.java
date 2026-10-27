package com.smartsalon.security;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Test-only endpoint (component-scanned from src/test) that raises an uncaught exception. */
@RestController
@RequestMapping("/api/v1/test-support")
class UncaughtErrorTestController {

    @GetMapping("/uncaught")
    String uncaught() {
        throw new RuntimeException("Raw database connection failure: syntax error near SELECT * FROM orders");
    }
}
