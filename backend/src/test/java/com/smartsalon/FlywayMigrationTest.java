package com.smartsalon;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;

import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class FlywayMigrationTest {

    @Autowired
    private DataSource dataSource;

    @Test
    @DisplayName("Should validate Flyway migration V1 and V2 scripts against database")
    void shouldExecuteFlywayMigration() {
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .cleanDisabled(false)
                .baselineOnMigrate(true)
                .load();
        flyway.clean();
        var result = flyway.migrate();
        System.out.println("Flyway migrations applied: " + result.migrationsExecuted);
        assertTrue(result.migrationsExecuted >= 2, "Expected at least 2 migrations (V1 and V2)");

        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);

        // 1. Verify Super Admin User & Role
        Integer adminUserCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE username = 'admin'", Integer.class);
        assertEquals(1, adminUserCount, "Admin user must be seeded");

        Integer adminRoleCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM user_roles ur " +
                "JOIN users u ON ur.user_id = u.id " +
                "JOIN roles r ON ur.role_id = r.id " +
                "WHERE u.username = 'admin' AND r.name = 'ADMIN'", Integer.class);
        assertEquals(1, adminRoleCount, "Admin role must be assigned to admin user");

        // 2. Verify Services with Category
        Integer serviceCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM services WHERE category IS NOT NULL", Integer.class);
        assertTrue(serviceCount != null && serviceCount >= 4, "Expected at least 4 seeded services with categories");

        // 3. Verify Service Default Steps
        Integer stepCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM service_default_steps", Integer.class);
        assertTrue(stepCount != null && stepCount >= 10, "Expected at least 10 seeded default steps");

        // 4. Verify Master Products & Branch Inventories
        Integer productCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM products", Integer.class);
        assertTrue(productCount != null && productCount >= 4, "Expected at least 4 master products");

        Integer branchInvCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM branch_inventories WHERE branch_id = 1", Integer.class);
        assertTrue(branchInvCount != null && branchInvCount >= 4, "Expected at least 4 branch inventory records for branch 1");

        // 5. Verify Service BOM
        Integer bomCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM service_bom", Integer.class);
        assertTrue(bomCount != null && bomCount >= 5, "Expected at least 5 service BOM records");
    }
}
