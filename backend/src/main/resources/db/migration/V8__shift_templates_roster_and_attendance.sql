-- ============================================================================
-- SmartSalon Database Migration: V8__shift_templates_roster_and_attendance.sql
-- Module: Branch Shift Templates, Weekly Staff Shift Roster & 1-Touch POS Attendance
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================================

-- 1. Bổ sung mã PIN chấm công 4 chữ số (mặc định '1234') vào bảng users
ALTER TABLE users ADD COLUMN attendance_pin VARCHAR(10) NOT NULL DEFAULT '1234';

-- 2. Bảng Mẫu ca làm việc theo Chi nhánh (shift_templates)
CREATE TABLE IF NOT EXISTS shift_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_overtime_minutes INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT fk_shift_templates_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT uq_shift_templates_branch_code UNIQUE (branch_id, code),
    INDEX idx_shift_templates_branch (branch_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng Lịch trực nhân sự theo ngày (staff_schedules)
CREATE TABLE IF NOT EXISTS staff_schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    shift_template_id BIGINT NULL,
    schedule_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'WORKING',
    notes VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT fk_staff_schedules_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_staff_schedules_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_staff_schedules_template FOREIGN KEY (shift_template_id) REFERENCES shift_templates(id) ON DELETE SET NULL,
    CONSTRAINT uq_staff_schedules_user_date UNIQUE (user_id, schedule_date),
    INDEX idx_staff_schedules_branch_date (branch_id, schedule_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng Chấm công và hiện diện sàn POS (staff_attendances)
CREATE TABLE IF NOT EXISTS staff_attendances (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    schedule_id BIGINT NULL,
    attendance_date DATE NOT NULL,
    clock_in_at DATETIME(6) NULL,
    break_start_at DATETIME(6) NULL,
    break_end_at DATETIME(6) NULL,
    clock_out_at DATETIME(6) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
    overtime_minutes INT NOT NULL DEFAULT 0,
    notes VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT fk_staff_attendances_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_staff_attendances_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_staff_attendances_schedule FOREIGN KEY (schedule_id) REFERENCES staff_schedules(id) ON DELETE SET NULL,
    CONSTRAINT uq_staff_attendances_user_date UNIQUE (user_id, attendance_date),
    INDEX idx_staff_attendances_branch_date (branch_id, attendance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Seed Data: Tài khoản Quản lý cơ sở mẫu (Managers) cho Branch 1 & Branch 2
-- ============================================================================
INSERT INTO users (id, branch_id, username, password_hash, full_name, phone, email, is_active, base_salary, attendance_pin, created_by)
VALUES
    (11, 1, 'manager.q1', '$2a$10$DZJ6dkpX7yQ3qTx1TVzLOOCBc8qXRqkF5ji.FkPez./skNqXqxWTm', 'Lê Quản Lý (Flagship Q1)', '0911000011', 'manager.q1@smartsalon.vn', 1, 15000000.00, '1234', 'SYSTEM'),
    (12, 2, 'manager.q3', '$2a$10$DZJ6dkpX7yQ3qTx1TVzLOOCBc8qXRqkF5ji.FkPez./skNqXqxWTm', 'Hoàng Quản Lý (Luxury Q3)', '0911000012', 'manager.q3@smartsalon.vn', 1, 15000000.00, '1234', 'SYSTEM')
ON DUPLICATE KEY UPDATE username = VALUES(username);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username IN ('manager.q1', 'manager.q3') AND r.name = 'MANAGER'
ON DUPLICATE KEY UPDATE user_id = VALUES(user_id);

-- ============================================================================
-- Seed Data: Mẫu ca làm việc tiêu chuẩn (Shift Templates) cho 2 chi nhánh
-- ============================================================================
INSERT INTO shift_templates (id, branch_id, code, name, start_time, end_time, max_overtime_minutes, is_active, created_by)
VALUES
    -- Chi nhánh 1 (Flagship Q1)
    (1, 1, 'MORNING', 'Ca Sáng', '08:30:00', '15:00:00', 60, 1, 'SYSTEM'),
    (2, 1, 'AFTERNOON', 'Ca Chiều', '14:00:00', '20:30:00', 0, 1, 'SYSTEM'),
    (3, 1, 'FULL_DAY', 'Ca Cả ngày', '08:30:00', '20:30:00', 0, 1, 'SYSTEM'),
    -- Chi nhánh 2 (Luxury Q3)
    (4, 2, 'MORNING', 'Ca Sáng', '08:30:00', '15:00:00', 60, 1, 'SYSTEM'),
    (5, 2, 'AFTERNOON', 'Ca Chiều', '14:00:00', '20:30:00', 0, 1, 'SYSTEM'),
    (6, 2, 'FULL_DAY', 'Ca Cả ngày', '08:30:00', '20:30:00', 0, 1, 'SYSTEM')
ON DUPLICATE KEY UPDATE name = VALUES(name), start_time = VALUES(start_time), end_time = VALUES(end_time), max_overtime_minutes = VALUES(max_overtime_minutes);

-- ============================================================================
-- Seed Data: Rolling 60-day Staff Schedules (-30 days to +30 days)
-- ============================================================================
-- User 2 (stylist.minh, Branch 1): Mon-Fri Ca Sáng (1), Sat Ca Cả ngày (3), Sun OFF
INSERT INTO staff_schedules (branch_id, user_id, shift_template_id, schedule_date, status, notes, created_by)
SELECT
    1,
    2,
    CASE WHEN DAYOFWEEK(cal.dt) = 1 THEN NULL
         WHEN DAYOFWEEK(cal.dt) = 7 THEN 3
         ELSE 1 END,
    cal.dt,
    CASE WHEN DAYOFWEEK(cal.dt) = 1 THEN 'OFF' ELSE 'WORKING' END,
    'Lịch xoay ca Master Stylist Minh',
    'SYSTEM'
FROM (
    SELECT CAST(TIMESTAMPADD(DAY, (a.N + b.N * 10 - 30), CURRENT_DATE) AS DATE) AS dt
    FROM (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a,
         (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) b
    WHERE (a.N + b.N * 10) <= 60
) cal
ON DUPLICATE KEY UPDATE status = VALUES(status), shift_template_id = VALUES(shift_template_id);

-- User 3 (stylist.lan, Branch 1): Tue-Sat Ca Chiều (2), Sun Ca Sáng (1), Mon OFF
INSERT INTO staff_schedules (branch_id, user_id, shift_template_id, schedule_date, status, notes, created_by)
SELECT
    1,
    3,
    CASE WHEN DAYOFWEEK(cal.dt) = 2 THEN NULL
         WHEN DAYOFWEEK(cal.dt) = 1 THEN 1
         ELSE 2 END,
    cal.dt,
    CASE WHEN DAYOFWEEK(cal.dt) = 2 THEN 'OFF' ELSE 'WORKING' END,
    'Lịch xoay ca Senior Stylist Lan',
    'SYSTEM'
FROM (
    SELECT CAST(TIMESTAMPADD(DAY, (a.N + b.N * 10 - 30), CURRENT_DATE) AS DATE) AS dt
    FROM (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a,
         (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) b
    WHERE (a.N + b.N * 10) <= 60
) cal
ON DUPLICATE KEY UPDATE status = VALUES(status), shift_template_id = VALUES(shift_template_id);

-- User 4 (stylist.hung, Branch 1): Wed-Sun Ca Chiều (2), Mon-Tue OFF
INSERT INTO staff_schedules (branch_id, user_id, shift_template_id, schedule_date, status, notes, created_by)
SELECT
    1,
    4,
    CASE WHEN DAYOFWEEK(cal.dt) IN (2, 3) THEN NULL
         ELSE 2 END,
    cal.dt,
    CASE WHEN DAYOFWEEK(cal.dt) IN (2, 3) THEN 'OFF' ELSE 'WORKING' END,
    'Lịch xoay ca Creative Stylist Hùng',
    'SYSTEM'
FROM (
    SELECT CAST(TIMESTAMPADD(DAY, (a.N + b.N * 10 - 30), CURRENT_DATE) AS DATE) AS dt
    FROM (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a,
         (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) b
    WHERE (a.N + b.N * 10) <= 60
) cal
ON DUPLICATE KEY UPDATE status = VALUES(status), shift_template_id = VALUES(shift_template_id);

-- User 5 (staff.le, Branch 1): Mon-Sat Ca Cả ngày (3), Sun OFF
INSERT INTO staff_schedules (branch_id, user_id, shift_template_id, schedule_date, status, notes, created_by)
SELECT
    1,
    5,
    CASE WHEN DAYOFWEEK(cal.dt) = 1 THEN NULL
         ELSE 3 END,
    cal.dt,
    CASE WHEN DAYOFWEEK(cal.dt) = 1 THEN 'OFF' ELSE 'WORKING' END,
    'Lịch trực Lễ tân Lê',
    'SYSTEM'
FROM (
    SELECT CAST(TIMESTAMPADD(DAY, (a.N + b.N * 10 - 30), CURRENT_DATE) AS DATE) AS dt
    FROM (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a,
         (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) b
    WHERE (a.N + b.N * 10) <= 60
) cal
ON DUPLICATE KEY UPDATE status = VALUES(status), shift_template_id = VALUES(shift_template_id);

-- User 6 (stylist.thao, Branch 2): Mon-Sat Ca Cả ngày (6), Sun OFF
INSERT INTO staff_schedules (branch_id, user_id, shift_template_id, schedule_date, status, notes, created_by)
SELECT
    2,
    6,
    CASE WHEN DAYOFWEEK(cal.dt) = 1 THEN NULL
         ELSE 6 END,
    cal.dt,
    CASE WHEN DAYOFWEEK(cal.dt) = 1 THEN 'OFF' ELSE 'WORKING' END,
    'Lịch xoay ca Master Stylist Thảo Q3',
    'SYSTEM'
FROM (
    SELECT CAST(TIMESTAMPADD(DAY, (a.N + b.N * 10 - 30), CURRENT_DATE) AS DATE) AS dt
    FROM (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a,
         (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) b
    WHERE (a.N + b.N * 10) <= 60
) cal
ON DUPLICATE KEY UPDATE status = VALUES(status), shift_template_id = VALUES(shift_template_id);

-- ============================================================================
-- Seed Data: Staff Attendances for Past Days (COMPLETED) & Today (PRESENT)
-- ============================================================================
-- Past working days (schedule_date < CURRENT_DATE and status = 'WORKING')
INSERT INTO staff_attendances (branch_id, user_id, schedule_id, attendance_date, clock_in_at, clock_out_at, status, overtime_minutes, notes, created_by)
SELECT
    s.branch_id,
    s.user_id,
    s.id,
    s.schedule_date,
    CONCAT(s.schedule_date, ' 08:25:00'),
    CONCAT(s.schedule_date, ' 15:05:00'),
    'COMPLETED',
    5,
    'Chấm công tự động hệ thống',
    'SYSTEM'
FROM staff_schedules s
WHERE s.schedule_date < CURRENT_DATE AND s.status = 'WORKING'
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- Today's scheduled working staff (PRESENT)
INSERT INTO staff_attendances (branch_id, user_id, schedule_id, attendance_date, clock_in_at, clock_out_at, status, overtime_minutes, notes, created_by)
SELECT
    s.branch_id,
    s.user_id,
    s.id,
    s.schedule_date,
    CONCAT(s.schedule_date, ' 08:28:00'),
    NULL,
    'PRESENT',
    0,
    'Đang trong ca trực hôm nay',
    'SYSTEM'
FROM staff_schedules s
WHERE s.schedule_date = CURRENT_DATE AND s.status = 'WORKING'
ON DUPLICATE KEY UPDATE status = VALUES(status);
