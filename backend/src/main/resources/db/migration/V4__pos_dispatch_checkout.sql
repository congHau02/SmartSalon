-- ============================================================================
-- SmartSalon Database Migration: V4__pos_dispatch_checkout.sql
-- Module: POS Dispatch Board, Multi-Staff Step Assignment, Visual Log & Two-Tier Commission
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================================

-- 1. Thêm tỷ lệ quỹ hoa hồng dịch vụ (commission_pool_rate) vào bảng services (Mặc định 20.00%)
ALTER TABLE services ADD COLUMN commission_pool_rate DECIMAL(5, 2) NOT NULL DEFAULT 20.00;

-- 2. Thêm các cột snapshot thông tin khách hàng, phương thức thanh toán và ghi chú vào bảng orders
ALTER TABLE orders ADD COLUMN customer_name VARCHAR(150) NULL;
ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(20) NULL;
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(30) NULL;
ALTER TABLE orders ADD COLUMN notes VARCHAR(500) NULL;
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'CHECKED_IN';

CREATE INDEX idx_orders_customer_phone ON orders (customer_phone);

-- 3. Thêm cột actual_bom_json lưu trữ thực tế tiêu hao hóa chất vào bảng technical_logs
ALTER TABLE technical_logs ADD COLUMN actual_bom_json JSON NULL;

-- 4. Khởi tạo tài khoản người dùng mặc định cho Khách lẻ / Vãng lai (walkin.guest)
INSERT INTO users (id, branch_id, username, password_hash, full_name, phone, email, is_active, created_by)
VALUES (7, NULL, 'walkin.guest', '$2a$10$DZJ6dkpX7yQ3qTx1TVzLOOCBc8qXRqkF5ji.FkPez./skNqXqxWTm', 'Khách vãng lai (Walk-in)', '0000000000', 'walkin@smartsalon.vn', 1, 'SYSTEM')
ON DUPLICATE KEY UPDATE username = VALUES(username);

-- Gán quyền CUSTOMER cho walkin.guest
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'walkin.guest' AND r.name = 'CUSTOMER'
ON DUPLICATE KEY UPDATE user_id = VALUES(user_id);
