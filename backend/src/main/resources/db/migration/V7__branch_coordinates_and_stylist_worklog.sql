-- ============================================================================
-- SmartSalon Database Migration: V7__branch_coordinates_and_stylist_worklog.sql
-- Module: Branch Geolocation Coordinates & Stylist Worklog Settlement Tracking
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================================

-- 1. Bổ sung toạ độ địa lý (latitude, longitude) vào bảng branches
ALTER TABLE branches ADD COLUMN latitude DECIMAL(10, 7) NULL;
ALTER TABLE branches ADD COLUMN longitude DECIMAL(10, 7) NULL;

-- Cập nhật toạ độ TP.HCM cho các chi nhánh đang hoạt động
-- Chi nhánh 1: SmartSalon Flagship - Quận 1 (123 Nguyễn Huệ, Quận 1, TP.HCM)
UPDATE branches SET latitude = 10.7745000, longitude = 106.7036000 WHERE id = 1;

-- Chi nhánh 2: SmartSalon Luxury - Quận 3 (456 Lê Văn Sỹ, Quận 3, TP.HCM)
UPDATE branches SET latitude = 10.7882000, longitude = 106.6789000 WHERE id = 2;

-- 2. Bổ sung thông tin nhân sự chốt thu tiền (settled_by_user_id, settled_at) vào bảng orders
ALTER TABLE orders ADD COLUMN settled_by_user_id BIGINT NULL;
ALTER TABLE orders ADD COLUMN settled_at DATETIME(6) NULL;
ALTER TABLE orders ADD CONSTRAINT fk_orders_settled_by FOREIGN KEY (settled_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_orders_settled_by ON orders(settled_by_user_id);
CREATE INDEX idx_orders_settled_at ON orders(settled_at);

-- 3. Backfill dữ liệu settled_by_user_id và settled_at từ created_by cho các đơn hàng đã thanh toán (PAID)
UPDATE orders SET settled_by_user_id = (SELECT id FROM users WHERE username = orders.created_by), settled_at = created_at WHERE status = 'PAID';
UPDATE orders SET settled_by_user_id = 5, settled_at = created_at WHERE status = 'PAID' AND settled_by_user_id IS NULL;
