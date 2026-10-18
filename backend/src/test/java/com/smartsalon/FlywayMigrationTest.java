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
    @DisplayName("Should validate Flyway migration V1, V2, and V3 scripts against database")
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
        assertTrue(result.migrationsExecuted >= 3, "Expected at least 3 migrations (V1, V2, and V3)");

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

        // 6. Verify V3 Bookings Columns & Table booking_services
        Integer bookingServiceCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM booking_services", Integer.class);
        assertNotNull(bookingServiceCount, "Table booking_services must exist and be queryable");

        // Assert new columns exist on bookings and booking_services by selecting them
        jdbcTemplate.execute("SELECT booking_code, end_time, total_duration_minutes, total_price, customer_name, customer_phone FROM bookings WHERE 1=0");
        jdbcTemplate.execute("SELECT price, duration_minutes, created_by, is_deleted FROM booking_services WHERE 1=0");

        // 7. Verify V3 Seed Data: Branch 2, Stylists & Staff
        Integer branchCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM branches WHERE id = 2", Integer.class);
        assertEquals(1, branchCount, "Branch 2 (SmartSalon Luxury - Quận 3) must be seeded");

        Integer branch1StylistCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users u " +
                "JOIN user_roles ur ON u.id = ur.user_id " +
                "JOIN roles r ON ur.role_id = r.id " +
                "WHERE r.name = 'STYLIST' AND u.branch_id = 1", Integer.class);
        assertTrue(branch1StylistCount != null && branch1StylistCount >= 3, "Expected at least 3 seeded stylists at Branch 1");

        Integer branch2StylistCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users u " +
                "JOIN user_roles ur ON u.id = ur.user_id " +
                "JOIN roles r ON ur.role_id = r.id " +
                "WHERE r.name = 'STYLIST' AND u.branch_id = 2", Integer.class);
        assertEquals(1, branch2StylistCount, "Expected at least 1 seeded stylist at Branch 2");

        Integer staffCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE username = 'staff.le'", Integer.class);
        assertEquals(1, staffCount, "Receptionist staff.le must be seeded");

        // 8. Verify V4 Schema & Seeds: commission_pool_rate, orders snapshot cols, actual_bom_json, and walkin.guest
        assertTrue(result.migrationsExecuted >= 4, "Expected at least 4 migrations (including V4)");
        jdbcTemplate.execute("SELECT commission_pool_rate FROM services WHERE 1=0");
        jdbcTemplate.execute("SELECT customer_name, customer_phone, payment_method, notes FROM orders WHERE 1=0");
        jdbcTemplate.execute("SELECT actual_bom_json FROM technical_logs WHERE 1=0");

        Integer walkinGuestCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE username = 'walkin.guest'", Integer.class);
        assertEquals(1, walkinGuestCount, "walkin.guest user must be seeded");

        Integer walkinRoleCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM user_roles ur " +
                "JOIN users u ON ur.user_id = u.id " +
                "JOIN roles r ON ur.role_id = r.id " +
                "WHERE u.username = 'walkin.guest' AND r.name = 'CUSTOMER'", Integer.class);
        assertEquals(1, walkinRoleCount, "walkin.guest user must have CUSTOMER role");
    }
}
