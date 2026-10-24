-- ============================================================================
-- SmartSalon Database Migration: V6__customer_crm_loyalty_and_reviews.sql
-- Module: Customer CRM, Loyalty Membership Tiers, Provisional In-Place Claim & Service Reviews
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================================

-- 1. Bổ sung các cột tích luỹ chi tiêu, hạng thành viên, số dư bảo lưu cọc và cờ tài khoản tạm vào bảng users
ALTER TABLE users ADD COLUMN total_spent DECIMAL(15, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE users ADD COLUMN membership_tier VARCHAR(20) NOT NULL DEFAULT 'STANDARD';
ALTER TABLE users ADD COLUMN credit_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE users ADD COLUMN is_provisional TINYINT(1) NOT NULL DEFAULT 0;

-- 2. Bổ sung cờ giảm giá thủ công vào bảng orders
ALTER TABLE orders ADD COLUMN is_discount_manual TINYINT(1) NOT NULL DEFAULT 0;

-- 3. Tạo bảng đánh giá dịch vụ sau thanh toán (service_reviews)
CREATE TABLE IF NOT EXISTS service_reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    stylist_id BIGINT NOT NULL,
    branch_id BIGINT NOT NULL,
    rating INT NOT NULL,
    comment TEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT fk_service_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_service_reviews_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_service_reviews_stylist FOREIGN KEY (stylist_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_service_reviews_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    INDEX idx_service_reviews_stylist (stylist_id, is_deleted),
    INDEX idx_service_reviews_customer (customer_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Seed Data & Backfill: Cập nhật Tích luỹ chi tiêu & Hạng thành viên lịch sử
-- ============================================================================
-- Customer 8 (cust.ha): Đơn 1 (2.000.000 net) + Đơn 3 (600.000 net) = 2.600.000 VND -> SILVER (5%)
UPDATE users SET total_spent = 2600000.00, membership_tier = 'SILVER' WHERE username = 'cust.ha';

-- Customer 9 (cust.tri): Đơn 2 (250.000 net) + Đơn 5 (1.800.000 net) = 2.050.000 VND -> SILVER (5%)
UPDATE users SET total_spent = 2050000.00, membership_tier = 'SILVER' WHERE username = 'cust.tri';

-- Customer 10 (cust.ngoc): Đơn 4 (180.000 net) = 180.000 VND -> STANDARD (0%)
UPDATE users SET total_spent = 180000.00, membership_tier = 'STANDARD' WHERE username = 'cust.ngoc';

-- ============================================================================
-- Seed Data: Đánh giá dịch vụ thực tế (Historical Service Reviews)
-- ============================================================================
INSERT INTO service_reviews (id, order_id, customer_id, stylist_id, branch_id, rating, comment, created_at, created_by)
VALUES
    (1, 1, 8, 2, 1, 5, 'Dịch vụ nhuộm tóc rất ưng ý, màu lên chuẩn bóng mượt, stylist Minh tư vấn rất nhiệt tình!', '2026-10-15 12:00:00', 'cust.ha'),
    (2, 2, 9, 3, 1, 5, 'Gội đầu dưỡng sinh thư giãn, giảm stress hiệu quả sau giờ làm việc.', '2026-10-16 15:30:00', 'cust.tri'),
    (3, 3, 8, 2, 1, 5, 'Liệu trình phục hồi Kérastase phục hồi tóc xơ rất tốt, tóc mềm mại trở lại.', '2026-10-17 12:00:00', 'cust.ha'),
    (4, 4, 10, 4, 1, 4, 'Cắt layer nữ rất đẹp, nhân viên phục vụ chu đáo, sẽ quay lại.', '2026-10-17 16:15:00', 'cust.ngoc'),
    (5, 5, 9, 3, 1, 5, 'Nhuộm màu thời trang rất đẹp, stylist Lan khéo tay và cẩn thận.', '2026-10-18 12:15:00', 'cust.tri')
ON DUPLICATE KEY UPDATE id = VALUES(id);
