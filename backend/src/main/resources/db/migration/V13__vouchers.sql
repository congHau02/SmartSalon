-- ============================================================================
-- SmartSalon Database Migration: V13__vouchers.sql
-- Module: Vouchers, Branch Restrictions, Redemptions & Order Voucher Association
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================================

-- 1. Bảng lưu trữ mã giảm giá / khuyến mãi (vouchers)
CREATE TABLE IF NOT EXISTS vouchers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NULL,
    description VARCHAR(500) NULL,
    `type` VARCHAR(20) NOT NULL,
    `value` DECIMAL(15, 2) NOT NULL,
    max_discount DECIMAL(15, 2) NULL,
    min_order_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    starts_at DATETIME(6) NULL,
    ends_at DATETIME(6) NULL,
    usage_limit INT NULL,
    per_customer_limit INT NOT NULL DEFAULT 1,
    used_count INT NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    INDEX idx_vouchers_code (code),
    INDEX idx_vouchers_active_dates (active, starts_at, ends_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng liên kết giới hạn chi nhánh áp dụng voucher (voucher_branches)
-- Tập rỗng = áp dụng toàn chuỗi (chain-wide)
CREATE TABLE IF NOT EXISTS voucher_branches (
    voucher_id BIGINT NOT NULL,
    branch_id BIGINT NOT NULL,
    PRIMARY KEY (voucher_id, branch_id),
    CONSTRAINT fk_vb_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
    CONSTRAINT fk_vb_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng ghi nhận lượt đổi mã giảm giá khi đơn hàng chuyển sang PAID (voucher_redemptions)
CREATE TABLE IF NOT EXISTS voucher_redemptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    voucher_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL UNIQUE,
    customer_id BIGINT NULL,
    discount_amount DECIMAL(15, 2) NOT NULL,
    redeemed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_vr_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_vr_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_vr_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_vr_customer_voucher (customer_id, voucher_id),
    INDEX idx_vr_redeemed_at (redeemed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bổ sung trường voucher_id vào bảng orders để truy vết mã giảm giá thắng cuộc
ALTER TABLE orders ADD COLUMN voucher_id BIGINT NULL;
ALTER TABLE orders ADD CONSTRAINT fk_orders_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL;
