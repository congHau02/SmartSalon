-- ============================================================================
-- SmartSalon Database Migration: V3__smart_booking_payos.sql
-- Module: Smart Booking, Booking Services, Time-Window Overlap & Stylist Seeds
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================================

-- 1. Bổ sung các cột phục vụ thuật toán Overlap & Tra cứu vào bảng bookings
ALTER TABLE bookings ADD COLUMN booking_code VARCHAR(30) NOT NULL;
ALTER TABLE bookings ADD COLUMN end_time DATETIME NOT NULL;
ALTER TABLE bookings ADD COLUMN total_duration_minutes INT NOT NULL DEFAULT 30;
ALTER TABLE bookings ADD COLUMN total_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE bookings ADD COLUMN customer_name VARCHAR(150) NULL;
ALTER TABLE bookings ADD COLUMN customer_phone VARCHAR(20) NULL;

ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'PENDING_PAYMENT';

CREATE UNIQUE INDEX uk_bookings_code ON bookings (booking_code);
CREATE INDEX idx_bookings_stylist_window ON bookings (staff_id, booking_time, end_time);
CREATE INDEX idx_bookings_customer_phone ON bookings (customer_phone);

-- 2. Bảng trung gian chi tiết các dịch vụ được chọn cho mỗi lịch hẹn (booking_services)
CREATE TABLE IF NOT EXISTS booking_services (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    duration_minutes INT NOT NULL DEFAULT 30,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT fk_booking_services_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_services_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
    INDEX idx_booking_services_booking (booking_id),
    INDEX idx_booking_services_service (service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Seed Data: Baseline Branches, Stylists & Staff
-- ============================================================================

-- A. Khởi tạo Chi nhánh mẫu số 2 (Luxury - Quận 3)
INSERT INTO branches (id, name, address, phone, is_active, created_by)
VALUES (2, 'SmartSalon Luxury - Quận 3', '456 Lê Văn Sỹ, Phường 12, Quận 3, TP. Hồ Chí Minh', '0909876543', 1, 'SYSTEM')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- B. Khởi tạo danh sách Stylists và Lễ tân mẫu (Mật khẩu mặc định: Admin@123)
-- BCrypt: $2a$10$DZJ6dkpX7yQ3qTx1TVzLOOCBc8qXRqkF5ji.FkPez./skNqXqxWTm
INSERT INTO users (id, branch_id, username, password_hash, full_name, phone, email, is_active, created_by)
VALUES
    (2, 1, 'stylist.minh', '$2a$10$DZJ6dkpX7yQ3qTx1TVzLOOCBc8qXRqkF5ji.FkPez./skNqXqxWTm', 'Trần Minh Tuấn (Master Stylist)', '0911000001', 'minh.tuan@smartsalon.vn', 1, 'SYSTEM'),
    (3, 1, 'stylist.lan', '$2a$10$DZJ6dkpX7yQ3qTx1TVzLOOCBc8qXRqkF5ji.FkPez./skNqXqxWTm', 'Nguyễn Lan Anh (Senior Stylist)', '0911000002', 'lan.anh@smartsalon.vn', 1, 'SYSTEM'),
    (4, 1, 'stylist.hung', '$2a$10$DZJ6dkpX7yQ3qTx1TVzLOOCBc8qXRqkF5ji.FkPez./skNqXqxWTm', 'Lê Hoàng Hùng (Creative Stylist)', '0911000003', 'hoang.hung@smartsalon.vn', 1, 'SYSTEM'),
    (5, 1, 'staff.le', '$2a$10$DZJ6dkpX7yQ3qTx1TVzLOOCBc8qXRqkF5ji.FkPez./skNqXqxWTm', 'Phạm Thanh Lê (Lễ tân Flagship)', '0911000004', 'thanh.le@smartsalon.vn', 1, 'SYSTEM'),
    (6, 2, 'stylist.thao', '$2a$10$DZJ6dkpX7yQ3qTx1TVzLOOCBc8qXRqkF5ji.FkPez./skNqXqxWTm', 'Đặng Phương Thảo (Master Stylist Q3)', '0911000005', 'phuong.thao@smartsalon.vn', 1, 'SYSTEM')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), branch_id = VALUES(branch_id);

-- Gán quyền STYLIST cho thợ
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username IN ('stylist.minh', 'stylist.lan', 'stylist.hung', 'stylist.thao') AND r.name = 'STYLIST'
ON DUPLICATE KEY UPDATE user_id = VALUES(user_id);

-- Gán quyền STAFF cho Lễ tân
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'staff.le' AND r.name = 'STAFF'
ON DUPLICATE KEY UPDATE user_id = VALUES(user_id);

-- C. Khởi tạo Tồn kho ban đầu cho Chi nhánh 2 (Luxury - Quận 3)
INSERT INTO branch_inventories (id, branch_id, product_id, stock_units, current_volume, min_stock_alert_units, created_by)
VALUES
    (5, 2, 1, 15, 0.00, 5, 'SYSTEM'),
    (6, 2, 2, 8, 300.00, 3, 'SYSTEM'),
    (7, 2, 3, 6, 500.00, 2, 'SYSTEM'),
    (8, 2, 4, 4, 150.00, 2, 'SYSTEM')
ON DUPLICATE KEY UPDATE stock_units = VALUES(stock_units), current_volume = VALUES(current_volume);
