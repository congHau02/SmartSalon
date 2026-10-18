-- ============================================================================
-- SmartSalon Database Migration: V5__analytics_pnl_and_payroll.sql
-- Module: Financial Analytics, Realized P&L, Staff Payroll & Cost Snapshots
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================================

-- 1. Bổ sung lương cứng (base_salary) vào bảng users
ALTER TABLE users ADD COLUMN base_salary DECIMAL(15, 2) NOT NULL DEFAULT 0.00;

-- 2. Bổ sung cờ khách chỉ định stylist đích danh (is_stylist_requested) vào bảng bookings
ALTER TABLE bookings ADD COLUMN is_stylist_requested TINYINT(1) NOT NULL DEFAULT 0;

-- 3. Bổ sung giá vốn snapshot tại thời điểm phát sinh (unit_cost_snapshot & total_cost_amount) vào inventory_transactions
ALTER TABLE inventory_transactions ADD COLUMN unit_cost_snapshot DECIMAL(15, 4) NOT NULL DEFAULT 0.0000;
ALTER TABLE inventory_transactions ADD COLUMN total_cost_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00;

CREATE INDEX idx_inv_tx_ref_order ON inventory_transactions (reference_order_id);
CREATE INDEX idx_inv_tx_created_at ON inventory_transactions (created_at);

-- ============================================================================
-- Seed Data: Cập nhật Lương Cứng Mẫu cho Stylists & Nhân viên Chi nhánh
-- ============================================================================
UPDATE users SET base_salary = 12000000.00 WHERE username = 'stylist.minh';
UPDATE users SET base_salary = 10000000.00 WHERE username = 'stylist.lan';
UPDATE users SET base_salary = 9000000.00 WHERE username = 'stylist.hung';
UPDATE users SET base_salary = 8000000.00 WHERE username = 'staff.le';
UPDATE users SET base_salary = 11000000.00 WHERE username = 'stylist.thao';

-- ============================================================================
-- Seed Data: Khách hàng thân thiết mẫu (Customers)
-- ============================================================================
INSERT INTO users (id, branch_id, username, password_hash, full_name, phone, email, is_active, created_by)
VALUES
    (8, 1, 'cust.ha', '$2a$10$DZJ6dkpX7yQ3qTx1TVzLOOCBc8qXRqkF5ji.FkPez./skNqXqxWTm', 'Nguyễn Thu Hà', '0988111222', 'ha.nguyen@smartsalon.vn', 1, 'SYSTEM'),
    (9, 1, 'cust.tri', '$2a$10$DZJ6dkpX7yQ3qTx1TVzLOOCBc8qXRqkF5ji.FkPez./skNqXqxWTm', 'Vũ Minh Trí', '0988222333', 'tri.vu@smartsalon.vn', 1, 'SYSTEM'),
    (10, 1, 'cust.ngoc', '$2a$10$DZJ6dkpX7yQ3qTx1TVzLOOCBc8qXRqkF5ji.FkPez./skNqXqxWTm', 'Hoàng Bảo Ngọc', '0988333444', 'ngoc.hoang@smartsalon.vn', 1, 'SYSTEM')
ON DUPLICATE KEY UPDATE username = VALUES(username);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username IN ('cust.ha', 'cust.tri', 'cust.ngoc') AND r.name = 'CUSTOMER'
ON DUPLICATE KEY UPDATE user_id = VALUES(user_id);

-- ============================================================================
-- Seed Data: Cập nhật Trạng thái Kho Cảnh báo (LOW_STOCK & NEAR_THRESHOLD)
-- ============================================================================
-- Product 1: min_stock = 5, gán stock_units = 3 (LOW_STOCK)
UPDATE branch_inventories SET stock_units = 3, current_volume = 40.00 WHERE branch_id = 1 AND product_id = 1;
-- Product 2: min_stock = 3, gán stock_units = 4 (NEAR_THRESHOLD: min_stock + 1)
UPDATE branch_inventories SET stock_units = 4, current_volume = 450.00 WHERE branch_id = 1 AND product_id = 2;

-- ============================================================================
-- Seed Data: Lịch hẹn Lịch sử Đã Hoàn Thành (Historical COMPLETED Bookings)
-- ============================================================================
INSERT INTO bookings (id, branch_id, customer_id, staff_id, booking_code, booking_time, end_time, total_duration_minutes, total_price, deposit_amount, deposit_status, status, is_stylist_requested, customer_name, customer_phone, notes, created_at, created_by)
VALUES
    (1, 1, 8, 2, 'BK-20261015-0001', '2026-10-15 09:30:00', '2026-10-15 11:30:00', 120, 850000.00, 170000.00, 'PAID', 'COMPLETED', 1, 'Nguyễn Thu Hà', '0988111222', 'Nhuộm tông nâu lạnh', '2026-10-14 19:00:00', 'cust.ha'),
    (2, 1, 9, 3, 'BK-20261016-0002', '2026-10-16 14:00:00', '2026-10-16 15:00:00', 60, 250000.00, 50000.00, 'PAID', 'COMPLETED', 0, 'Vũ Minh Trí', '0988222333', 'Gội thư giãn sau giờ làm', '2026-10-15 20:30:00', 'cust.tri'),
    (3, 1, 8, 2, 'BK-20261017-0003', '2026-10-17 10:00:00', '2026-10-17 11:30:00', 90, 650000.00, 130000.00, 'PAID', 'COMPLETED', 1, 'Nguyễn Thu Hà', '0988111222', 'Khách quen quay lại phục hồi Kérastase', '2026-10-16 18:00:00', 'cust.ha'),
    (4, 1, 10, 4, 'BK-20261017-0004', '2026-10-17 15:00:00', '2026-10-17 15:45:00', 45, 180000.00, 360000.00, 'PAID', 'COMPLETED', 0, 'Hoàng Bảo Ngọc', '0988333444', 'Cắt layer nữ', '2026-10-17 08:00:00', 'cust.ngoc'),
    (5, 1, 9, 3, 'BK-20261018-0005', '2026-10-18 09:30:00', '2026-10-18 11:30:00', 120, 850000.00, 170000.00, 'PAID', 'COMPLETED', 1, 'Vũ Minh Trí', '0988222333', 'Quay lại đặt đích danh stylist Lan nhuộm thời trang', '2026-10-17 19:30:00', 'cust.tri'),
    (6, 1, 8, 2, 'BK-20261018-0006', '2026-10-18 14:00:00', '2026-10-18 14:45:00', 45, 180000.00, 360000.00, 'PAID', 'COMPLETED', 1, 'Nguyễn Thu Hà', '0988111222', 'Cắt tỉa đuôi tóc VIP', '2026-10-18 08:30:00', 'cust.ha')
ON DUPLICATE KEY UPDATE booking_code = VALUES(booking_code);

INSERT INTO booking_services (id, booking_id, service_id, price, duration_minutes, created_at, created_by)
VALUES
    (1, 1, 1, 850000.00, 120, '2026-10-14 19:00:00', 'SYSTEM'),
    (2, 2, 2, 250000.00, 60, '2026-10-15 20:30:00', 'SYSTEM'),
    (3, 3, 3, 650000.00, 90, '2026-10-16 18:00:00', 'SYSTEM'),
    (4, 4, 4, 180000.00, 45, '2026-10-17 08:00:00', 'SYSTEM'),
    (5, 5, 1, 850000.00, 120, '2026-10-17 19:30:00', 'SYSTEM'),
    (6, 6, 4, 180000.00, 45, '2026-10-18 08:30:00', 'SYSTEM')
ON DUPLICATE KEY UPDATE service_id = VALUES(service_id);

-- ============================================================================
-- Seed Data: Đơn Hàng Lịch Sử Đã Thanh Toán (Historical PAID Orders)
-- ============================================================================
INSERT INTO orders (id, branch_id, customer_id, booking_id, order_code, subtotal, discount_amount, deposit_deducted, final_amount, status, customer_name, customer_phone, payment_method, notes, created_at, created_by)
VALUES
    (1, 1, 8, 1, 'ORD-20261015-001', 2100000.00, 100000.00, 170000.00, 1830000.00, 'PAID', 'Nguyễn Thu Hà', '0988111222', 'CASH', 'Nhuộm tóc + mua dầu gội Kérastase', '2026-10-15 11:35:00', 'staff.le'),
    (2, 1, 9, 2, 'ORD-20261016-002', 250000.00, 0.00, 50000.00, 200000.00, 'PAID', 'Vũ Minh Trí', '0988222333', 'VIETQR', 'Gội đầu dưỡng sinh thư giãn', '2026-10-16 15:05:00', 'staff.le'),
    (3, 1, 8, 3, 'ORD-20261017-003', 650000.00, 50000.00, 130000.00, 470000.00, 'PAID', 'Nguyễn Thu Hà', '0988111222', 'VIETQR', 'Phục hồi Kérastase - Giảm giá khách quen', '2026-10-17 11:35:00', 'staff.le'),
    (4, 1, 10, 4, 'ORD-20261017-004', 180000.00, 0.00, 36000.00, 144000.00, 'PAID', 'Hoàng Bảo Ngọc', '0988333444', 'CASH', 'Cắt tóc VIP', '2026-10-17 15:50:00', 'staff.le'),
    (5, 1, 9, 5, 'ORD-20261018-005', 1950000.00, 150000.00, 170000.00, 1630000.00, 'PAID', 'Vũ Minh Trí', '0988222333', 'VIETQR', 'Nhuộm tóc + mua mặt nạ Kérastase', '2026-10-18 11:40:00', 'staff.le'),
    (6, 1, 7, NULL, 'ORD-20261018-006', 250000.00, 0.00, 0.00, 250000.00, 'PAID', 'Khách vãng lai (Walk-in)', '0000000000', 'CASH', 'Khách vãng lai gội đầu trực tiếp', '2026-10-18 16:00:00', 'staff.le')
ON DUPLICATE KEY UPDATE order_code = VALUES(order_code);

-- ============================================================================
-- Seed Data: Chi Tiết Đơn Hàng (Order Items - Dịch vụ & Bán lẻ Sản phẩm)
-- ============================================================================
INSERT INTO order_items (id, order_id, service_id, product_id, item_type, quantity, unit_price, total_price, created_at)
VALUES
    -- Đơn 1: Dịch vụ Nhuộm (850k) + Dầu gội (1250k)
    (1, 1, 1, NULL, 'SERVICE', 1, 850000.00, 850000.00, '2026-10-15 09:35:00'),
    (2, 1, NULL, 3, 'PRODUCT', 1, 1250000.00, 1250000.00, '2026-10-15 11:30:00'),
    -- Đơn 2: Gội đầu dưỡng sinh (250k)
    (3, 2, 2, NULL, 'SERVICE', 1, 250000.00, 250000.00, '2026-10-16 14:05:00'),
    -- Đơn 3: Phục hồi tóc Kérastase (650k)
    (4, 3, 3, NULL, 'SERVICE', 1, 650000.00, 650000.00, '2026-10-17 10:05:00'),
    -- Đơn 4: Cắt tóc & Tạo kiểu (180k)
    (5, 4, 4, NULL, 'SERVICE', 1, 180000.00, 180000.00, '2026-10-17 15:05:00'),
    -- Đơn 5: Nhuộm tóc (850k) + Mặt nạ Kérastase (1100k)
    (6, 5, 1, NULL, 'SERVICE', 1, 850000.00, 850000.00, '2026-10-18 09:35:00'),
    (7, 5, NULL, 4, 'PRODUCT', 1, 1100000.00, 1100000.00, '2026-10-18 11:30:00'),
    -- Đơn 6: Gội đầu dưỡng sinh (250k)
    (8, 6, 2, NULL, 'SERVICE', 1, 250000.00, 250000.00, '2026-10-18 15:30:00')
ON DUPLICATE KEY UPDATE id = VALUES(id);

-- ============================================================================
-- Seed Data: Phân Bổ Bước Thực Hiện (Order Step Assignments)
-- ============================================================================
INSERT INTO order_step_assignments (id, order_item_id, step_name, staff_id, commission_rate, commission_amount, status, started_at, completed_at, created_at)
VALUES
    -- Đơn 1 (Nhuộm tóc - Item 1)
    (1, 1, 'Chuẩn bị & Xả tóc', 5, 15.00, 25500.00, 'COMPLETED', '2026-10-15 09:35:00', '2026-10-15 09:50:00', '2026-10-15 09:35:00'),
    (2, 1, 'Pha & Vào thuốc nhuộm', 2, 65.00, 110500.00, 'COMPLETED', '2026-10-15 09:55:00', '2026-10-15 10:55:00', '2026-10-15 09:35:00'),
    (3, 1, 'Gội xả & Sấy tạo kiểu', 2, 20.00, 34000.00, 'COMPLETED', '2026-10-15 11:00:00', '2026-10-15 11:30:00', '2026-10-15 09:35:00'),
    -- Đơn 2 (Gội dưỡng sinh - Item 3)
    (4, 3, 'Khai huyệt & Gội dưỡng sinh', 3, 70.00, 35000.00, 'COMPLETED', '2026-10-16 14:05:00', '2026-10-16 14:45:00', '2026-10-16 14:05:00'),
    (5, 3, 'Sấy khô & Xịt dưỡng', 3, 30.00, 15000.00, 'COMPLETED', '2026-10-16 14:45:00', '2026-10-16 15:00:00', '2026-10-16 14:05:00'),
    -- Đơn 3 (Phục hồi Kérastase - Item 4)
    (6, 4, 'Gội sạch sâu', 5, 20.00, 26000.00, 'COMPLETED', '2026-10-17 10:05:00', '2026-10-17 10:25:00', '2026-10-17 10:05:00'),
    (7, 4, 'Đưa dưỡng chất & Hấp nhiệt', 2, 60.00, 78000.00, 'COMPLETED', '2026-10-17 10:30:00', '2026-10-17 11:15:00', '2026-10-17 10:05:00'),
    (8, 4, 'Xả nguội & Sấy tạo kiểu', 2, 20.00, 26000.00, 'COMPLETED', '2026-10-17 11:15:00', '2026-10-17 11:30:00', '2026-10-17 10:05:00'),
    -- Đơn 4 (Cắt tóc VIP - Item 5)
    (9, 5, 'Tư vấn & Cắt tóc định hình', 4, 80.00, 28800.00, 'COMPLETED', '2026-10-17 15:05:00', '2026-10-17 15:35:00', '2026-10-17 15:05:00'),
    (10, 5, 'Sấy vuốt sáp tạo kiểu', 4, 20.00, 7200.00, 'COMPLETED', '2026-10-17 15:35:00', '2026-10-17 15:45:00', '2026-10-17 15:05:00'),
    -- Đơn 5 (Nhuộm tóc - Item 6)
    (11, 6, 'Chuẩn bị & Xả tóc', 5, 15.00, 25500.00, 'COMPLETED', '2026-10-18 09:35:00', '2026-10-18 09:50:00', '2026-10-18 09:35:00'),
    (12, 6, 'Pha & Vào thuốc nhuộm', 3, 65.00, 110500.00, 'COMPLETED', '2026-10-18 09:55:00', '2026-10-18 10:55:00', '2026-10-18 09:35:00'),
    (13, 6, 'Gội xả & Sấy tạo kiểu', 3, 20.00, 34000.00, 'COMPLETED', '2026-10-18 11:00:00', '2026-10-18 11:30:00', '2026-10-18 09:35:00'),
    -- Đơn 6 (Gội dưỡng sinh - Item 8)
    (14, 8, 'Khai huyệt & Gội dưỡng sinh', 2, 70.00, 35000.00, 'COMPLETED', '2026-10-18 15:30:00', '2026-10-18 15:50:00', '2026-10-18 15:30:00'),
    (15, 8, 'Sấy khô & Xịt dưỡng', 2, 30.00, 15000.00, 'COMPLETED', '2026-10-18 15:50:00', '2026-10-18 16:00:00', '2026-10-18 15:30:00')
ON DUPLICATE KEY UPDATE id = VALUES(id);

-- ============================================================================
-- Seed Data: Nhật Ký Kỹ Thuật (Visual Logs với actual_bom_json)
-- ============================================================================
INSERT INTO technical_logs (id, order_id, customer_id, staff_id, formula_notes, hair_condition_notes, actual_bom_json, created_at)
VALUES
    (1, 1, 8, 2, 'Công thức Wella 7/1 + Oxy 6% tỷ lệ 1:1, tóc dày tăng thêm 10ml mỗi loại', 'Tóc khỏe tự nhiên level 4', '[{"productId":1,"productName":"Kem nhuộm tóc Wella Color Perfect","actualAmount":70.00,"unit":"ml"},{"productId":2,"productName":"Trợ nhuộm L''Oréal Oxydant Creme 6%","actualAmount":70.00,"unit":"ml"}]', '2026-10-15 10:00:00'),
    (2, 3, 8, 2, 'Phục hồi Kérastase kết hợp máy hấp nano', 'Tóc xơ nhẹ sau nhuộm, bù đắp keratin 45g', '[{"productId":3,"productName":"Dầu gội phục hồi Kérastase","actualAmount":30.00,"unit":"ml"},{"productId":4,"productName":"Mặt nạ ủ tóc Kérastase","actualAmount":45.00,"unit":"g"}]', '2026-10-17 10:35:00'),
    (3, 5, 9, 3, 'Nhuộm nâu ánh đồng, tăng 5ml thuốc pha', 'Tóc nam mật độ dày', '[{"productId":1,"productName":"Kem nhuộm tóc Wella Color Perfect","actualAmount":65.00,"unit":"ml"},{"productId":2,"productName":"Trợ nhuộm L''Oréal Oxydant Creme 6%","actualAmount":65.00,"unit":"ml"}]', '2026-10-18 10:00:00')
ON DUPLICATE KEY UPDATE id = VALUES(id);

-- ============================================================================
-- Seed Data: Sổ Cái Hoa Hồng (Commission Ledgers - Trạng Thái EARNED)
-- ============================================================================
INSERT INTO commission_ledgers (id, staff_id, order_id, step_assignment_id, amount, status, calculation_notes, created_at)
VALUES
    (1, 5, 1, 1, 25500.00, 'EARNED', '850.000 x 20% x 15% (Chuẩn bị & Xả tóc)', '2026-10-15 11:35:00'),
    (2, 2, 1, 2, 110500.00, 'EARNED', '850.000 x 20% x 65% (Pha & Vào thuốc nhuộm)', '2026-10-15 11:35:00'),
    (3, 2, 1, 3, 34000.00, 'EARNED', '850.000 x 20% x 20% (Gội xả & Sấy tạo kiểu)', '2026-10-15 11:35:00'),
    (4, 3, 2, 4, 35000.00, 'EARNED', '250.000 x 20% x 70% (Khai huyệt & Gội dưỡng sinh)', '2026-10-16 15:05:00'),
    (5, 3, 2, 5, 15000.00, 'EARNED', '250.000 x 20% x 30% (Sấy khô & Xịt dưỡng)', '2026-10-16 15:05:00'),
    (6, 5, 3, 6, 26000.00, 'EARNED', '650.000 x 20% x 20% (Gội sạch sâu)', '2026-10-17 11:35:00'),
    (7, 2, 3, 7, 78000.00, 'EARNED', '650.000 x 20% x 60% (Đưa dưỡng chất & Hấp nhiệt)', '2026-10-17 11:35:00'),
    (8, 2, 3, 8, 26000.00, 'EARNED', '650.000 x 20% x 20% (Xả nguội & Sấy tạo kiểu)', '2026-10-17 11:35:00'),
    (9, 4, 4, 9, 28800.00, 'EARNED', '180.000 x 20% x 80% (Tư vấn & Cắt tóc định hình)', '2026-10-17 15:50:00'),
    (10, 4, 4, 10, 7200.00, 'EARNED', '180.000 x 20% x 20% (Sấy vuốt sáp tạo kiểu)', '2026-10-17 15:50:00'),
    (11, 5, 5, 11, 25500.00, 'EARNED', '850.000 x 20% x 15% (Chuẩn bị & Xả tóc)', '2026-10-18 11:40:00'),
    (12, 3, 5, 12, 110500.00, 'EARNED', '850.000 x 20% x 65% (Pha & Vào thuốc nhuộm)', '2026-10-18 11:40:00'),
    (13, 3, 5, 13, 34000.00, 'EARNED', '850.000 x 20% x 20% (Gội xả & Sấy tạo kiểu)', '2026-10-18 11:40:00'),
    (14, 2, 6, 14, 35000.00, 'EARNED', '250.000 x 20% x 70% (Khai huyệt & Gội dưỡng sinh)', '2026-10-18 16:00:00'),
    (15, 2, 6, 15, 15000.00, 'EARNED', '250.000 x 20% x 30% (Sấy khô & Xịt dưỡng)', '2026-10-18 16:00:00')
ON DUPLICATE KEY UPDATE id = VALUES(id);

-- ============================================================================
-- Seed Data: Giao Dịch Kho với Cost Snapshots (Inventory Transactions)
-- ============================================================================
INSERT INTO inventory_transactions (id, product_id, branch_id, transaction_type, quantity_units, volume_amount, unit, balance_after_volume, reference_order_id, notes, unit_cost_snapshot, total_cost_amount, created_at, created_by)
VALUES
    -- Đơn 1: Tiêu hao nhuộm Wella 70ml (95k/100ml -> 950 VND/ml)
    (1, 1, 1, 'SERVICE_CONSUMPTION', 0, -70.00, 'ml', 40.00, 1, 'Tiêu hao định lượng kỹ thuật dịch vụ Đơn #1', 950.0000, 66500.00, '2026-10-15 11:35:00', 'SYSTEM'),
    -- Đơn 1: Tiêu hao Oxy L''Oréal 70ml (150k/1000ml -> 150 VND/ml)
    (2, 2, 1, 'SERVICE_CONSUMPTION', 0, -70.00, 'ml', 380.00, 1, 'Tiêu hao định lượng kỹ thuật dịch vụ Đơn #1', 150.0000, 10500.00, '2026-10-15 11:35:00', 'SYSTEM'),
    -- Đơn 1: Bán lẻ 1 Chai Dầu gội Kérastase (Giá vốn 750k)
    (3, 3, 1, 'RETAIL_SALE', -1, 0.00, 'Chai', 800.00, 1, 'Xuất kho bán lẻ sản phẩm tại POS (Đơn hàng #1)', 750000.0000, 750000.00, '2026-10-15 11:35:00', 'SYSTEM'),
    -- Đơn 2: Tiêu hao Dầu gội Kérastase 30ml (750k/1000ml -> 750 VND/ml)
    (4, 3, 1, 'SERVICE_CONSUMPTION', 0, -30.00, 'ml', 770.00, 2, 'Tiêu hao định lượng kỹ thuật dịch vụ Đơn #2', 750.0000, 22500.00, '2026-10-16 15:05:00', 'SYSTEM'),
    -- Đơn 3: Tiêu hao Dầu gội 30ml + Mặt nạ Kérastase 45g (650k/500g -> 1300 VND/g)
    (5, 3, 1, 'SERVICE_CONSUMPTION', 0, -30.00, 'ml', 740.00, 3, 'Tiêu hao định lượng kỹ thuật dịch vụ Đơn #3', 750.0000, 22500.00, '2026-10-17 11:35:00', 'SYSTEM'),
    (6, 4, 1, 'SERVICE_CONSUMPTION', 0, -45.00, 'g', 155.00, 3, 'Tiêu hao định lượng kỹ thuật dịch vụ Đơn #3', 1300.0000, 58500.00, '2026-10-17 11:35:00', 'SYSTEM'),
    -- Đơn 5: Tiêu hao nhuộm Wella 65ml + Oxy 65ml
    (7, 1, 1, 'SERVICE_CONSUMPTION', 0, -65.00, 'ml', 40.00, 5, 'Tiêu hao định lượng kỹ thuật dịch vụ Đơn #5', 950.0000, 61750.00, '2026-10-18 11:40:00', 'SYSTEM'),
    (8, 2, 1, 'SERVICE_CONSUMPTION', 0, -65.00, 'ml', 315.00, 5, 'Tiêu hao định lượng kỹ thuật dịch vụ Đơn #5', 150.0000, 9750.00, '2026-10-18 11:40:00', 'SYSTEM'),
    -- Đơn 5: Bán lẻ 1 Hộp Mặt nạ Kérastase (Giá vốn 650k)
    (9, 4, 1, 'RETAIL_SALE', -1, 0.00, 'Hộp', 155.00, 5, 'Xuất kho bán lẻ sản phẩm tại POS (Đơn hàng #5)', 650000.0000, 650000.00, '2026-10-18 11:40:00', 'SYSTEM'),
    -- Đơn 6: Tiêu hao Dầu gội Kérastase 30ml
    (10, 3, 1, 'SERVICE_CONSUMPTION', 0, -30.00, 'ml', 710.00, 6, 'Tiêu hao định lượng kỹ thuật dịch vụ Đơn #6', 750.0000, 22500.00, '2026-10-18 16:00:00', 'SYSTEM'),
    -- Hao hụt kiểm kê (negative STOCK_ADJUSTMENT): rò rỉ 25ml tuýp nhuộm Wella
    (11, 1, 1, 'STOCK_ADJUSTMENT', 0, -25.00, 'ml', 40.00, NULL, 'Hao hụt kiểm kê tuýp nhuộm rò rỉ', 950.0000, 23750.00, '2026-10-17 18:00:00', 'SYSTEM')
ON DUPLICATE KEY UPDATE id = VALUES(id);
