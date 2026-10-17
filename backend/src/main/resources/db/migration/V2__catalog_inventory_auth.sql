-- ============================================================================
-- SmartSalon Database Migration: V2__catalog_inventory_auth.sql
-- Module: Catalog, Service Steps, Branch Inventory & Baseline Seeds
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================================

-- 1. Thêm cột phân nhóm dịch vụ (category) vào bảng services
ALTER TABLE services 
    ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'GENERAL' AFTER description;

CREATE INDEX idx_services_category ON services (category);

-- 2. Bảng cấu hình các bước kỹ thuật mặc định của Dịch vụ (service_default_steps)
CREATE TABLE IF NOT EXISTS service_default_steps (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    service_id BIGINT NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_order INT NOT NULL DEFAULT 1,
    commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_default_step_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    INDEX idx_default_step_service (service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng quản lý tồn kho chi nhánh (branch_inventories)
CREATE TABLE IF NOT EXISTS branch_inventories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    stock_units INT NOT NULL DEFAULT 0,
    current_volume DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    min_stock_alert_units INT NOT NULL DEFAULT 5,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),
    created_by VARCHAR(100) NULL,
    CONSTRAINT fk_branch_inv_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_branch_inv_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    UNIQUE KEY uk_branch_product (branch_id, product_id),
    INDEX idx_branch_inv_product (product_id),
    INDEX idx_branch_inv_branch (branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Seed Data: Baseline Entities
-- ============================================================================

-- A. Khởi tạo Chi nhánh mẫu Flagship
INSERT INTO branches (id, name, address, phone, is_active, created_by)
VALUES (1, 'SmartSalon Flagship - Quận 1', '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', '0901234567', 1, 'SYSTEM')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- B. Khởi tạo Super Admin User (admin / Admin@123)
INSERT INTO users (id, branch_id, username, password_hash, full_name, phone, email, is_active, created_by)
VALUES (1, 1, 'admin', '$2a$10$DZJ6dkpX7yQ3qTx1TVzLOOCBc8qXRqkF5ji.FkPez./skNqXqxWTm', 'Hệ thống Quản trị viên', '0988888888', 'admin@smartsalon.vn', 1, 'SYSTEM')
ON DUPLICATE KEY UPDATE username = VALUES(username);

-- Gán quyền ADMIN cho Super Admin
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'ADMIN'
ON DUPLICATE KEY UPDATE user_id = VALUES(user_id);

-- C. Khởi tạo Danh mục Sản phẩm Master (Master Catalog)
INSERT INTO products (id, branch_id, name, sku, barcode, unit, volume_or_weight_per_unit, volume_unit, current_stock_units, current_volume, min_stock_alert_units, cost_price, retail_price, is_active, created_by)
VALUES 
    (1, NULL, 'Kem nhuộm tóc Wella Color Perfect', 'PRD-COLOR-WELLA-01', '893123456701', 'Tuýp', 100.00, 'ml', 0, 0.00, 5, 95000.00, 160000.00, 1, 'SYSTEM'),
    (2, NULL, 'Trợ nhuộm L''Oréal Oxydant Creme 6%', 'PRD-OXY-LOREAL-01', '893123456702', 'Chai', 1000.00, 'ml', 0, 0.00, 3, 150000.00, 280000.00, 1, 'SYSTEM'),
    (3, NULL, 'Dầu gội phục hồi Kérastase Bain Nutritive', 'PRD-SHAMPOO-KERASTASE', '893123456703', 'Chai', 1000.00, 'ml', 0, 0.00, 2, 750000.00, 1250000.00, 1, 'SYSTEM'),
    (4, NULL, 'Mặt nạ ủ tóc Kérastase Masque Magistral', 'PRD-MASK-KERASTASE', '893123456704', 'Hộp', 500.00, 'g', 0, 0.00, 2, 650000.00, 1100000.00, 1, 'SYSTEM')
ON DUPLICATE KEY UPDATE sku = VALUES(sku);

-- D. Khởi tạo Tồn kho ban đầu cho Chi nhánh Flagship (Branch 1)
INSERT INTO branch_inventories (id, branch_id, product_id, stock_units, current_volume, min_stock_alert_units, created_by)
VALUES
    (1, 1, 1, 20, 0.00, 5, 'SYSTEM'),
    (2, 1, 2, 10, 450.00, 3, 'SYSTEM'),
    (3, 1, 3, 8, 800.00, 2, 'SYSTEM'),
    (4, 1, 4, 5, 200.00, 2, 'SYSTEM')
ON DUPLICATE KEY UPDATE stock_units = VALUES(stock_units), current_volume = VALUES(current_volume);

-- E. Khởi tạo Dịch vụ mẫu (Services)
INSERT INTO services (id, name, description, category, base_price, duration_minutes, is_active, created_by)
VALUES
    (1, 'Nhuộm tóc thời trang cao cấp', 'Kỹ thuật nhuộm tóc chuẩn salon với kem nhuộm Wella và trợ nhuộm dưỡng chất L''Oréal.', 'Uốn - Nhuộm chuyên sâu', 850000.00, 120, 1, 'SYSTEM'),
    (2, 'Gội đầu dưỡng sinh & Massage cổ vai gáy', 'Quy trình gội thảo dược thư giãn, đả thông kinh lạc vùng đầu, cổ vai gáy bằng dầu gội Kérastase.', 'Gội đầu dưỡng sinh & Spa', 250000.00, 60, 1, 'SYSTEM'),
    (3, 'Phục hồi tóc hư tổn chuyên sâu Kérastase', 'Liệu trình phục hồi chuyên sâu bù đắp dưỡng chất keratin cho tóc xơ gãy với mặt nạ ủ Kérastase cao cấp.', 'Phục hồi tóc cao cấp', 650000.00, 90, 1, 'SYSTEM'),
    (4, 'Cắt tóc & Tạo kiểu Nam/Nữ VIP', 'Thiết kế form tóc thịnh hành phù hợp từng khuôn mặt bởi Stylist giàu kinh nghiệm.', 'Cắt tóc & Tạo kiểu', 180000.00, 45, 1, 'SYSTEM')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- F. Khởi tạo Định mức BOM (Bill of Materials) cho Dịch vụ
-- Dịch vụ 1: 60ml Wella Color + 60ml L'Oréal Oxy
INSERT INTO service_bom (id, service_id, product_id, standard_amount, unit)
VALUES
    (1, 1, 1, 60.00, 'ml'),
    (2, 1, 2, 60.00, 'ml'),
    -- Dịch vụ 2: 30ml Dầu gội Kérastase
    (3, 2, 3, 30.00, 'ml'),
    -- Dịch vụ 3: 25ml Dầu gội Kérastase + 40g Mặt nạ ủ tóc Kérastase
    (4, 3, 3, 25.00, 'ml'),
    (5, 3, 4, 40.00, 'g')
ON DUPLICATE KEY UPDATE standard_amount = VALUES(standard_amount);

-- G. Khởi tạo Bước dịch vụ & Tỷ lệ hoa hồng mặc định (Service Default Steps)
INSERT INTO service_default_steps (id, service_id, step_name, step_order, commission_rate)
VALUES
    -- Dịch vụ 1: Nhuộm tóc
    (1, 1, 'Chuẩn bị & Xả tóc', 1, 15.00),
    (2, 1, 'Pha & Vào thuốc nhuộm', 2, 65.00),
    (3, 1, 'Gội xả & Sấy tạo kiểu', 3, 20.00),
    -- Dịch vụ 2: Gội dưỡng sinh
    (4, 2, 'Khai huyệt & Gội dưỡng sinh', 1, 70.00),
    (5, 2, 'Sấy khô & Xịt dưỡng', 2, 30.00),
    -- Dịch vụ 3: Phục hồi tóc
    (6, 3, 'Gội sạch sâu', 1, 20.00),
    (7, 3, 'Đưa dưỡng chất & Hấp nhiệt', 2, 60.00),
    (8, 3, 'Xả nguội & Sấy tạo kiểu', 3, 20.00),
    -- Dịch vụ 4: Cắt tóc & Tạo kiểu
    (9, 4, 'Tư vấn & Cắt tóc định hình', 1, 80.00),
    (10, 4, 'Sấy vuốt sáp tạo kiểu', 2, 20.00)
ON DUPLICATE KEY UPDATE commission_rate = VALUES(commission_rate);
