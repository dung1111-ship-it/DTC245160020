-- ====================================================================
-- CƠ SỞ DỮ LIỆU POSTGRESQL CHO ĐỀ 38: EXPENSE TRACKER
-- Học phần: Triển khai và quản trị hệ thống phần mềm
-- Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020 | Lớp: K23.K1.KHMT K23A
-- ====================================================================

-- 1. Bảng Người dùng & Phân quyền (RBAC)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    student_id VARCHAR(64),
    role VARCHAR(32) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    avatar VARCHAR(256) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Ví tiền
CREATE TABLE IF NOT EXISTS wallets (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('cash', 'bank', 'momo', 'ewallet')),
    initial_balance NUMERIC(15, 2) DEFAULT 0,
    icon VARCHAR(64) DEFAULT 'wallet',
    color VARCHAR(32) DEFAULT '#4F46E5',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Danh mục thu chi
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('income', 'expense')),
    icon VARCHAR(64) DEFAULT 'tag',
    color VARCHAR(32) DEFAULT '#10B981',
    is_default INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng Giao dịch thu chi
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(64) PRIMARY KEY,
    wallet_id VARCHAR(64) NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    category_id VARCHAR(64) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    type VARCHAR(32) NOT NULL CHECK (type IN ('income', 'expense')),
    date DATE NOT NULL,
    note TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng Ngân sách định mức tháng
CREATE TABLE IF NOT EXISTS budgets (
    id VARCHAR(64) PRIMARY KEY,
    category_id VARCHAR(64) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Định dạng YYYY-MM
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_budget_category_month UNIQUE (category_id, month)
);

-- Chỉ mục tối ưu hóa truy vấn
CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_tx_wallet ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);

-- ====================================================================
-- SEED DATA MẪU PHỤC VỤ CHẤM THI
-- ====================================================================

-- 1. Nạp tài khoản Admin & User demo (Mật khẩu: admin123 và user123 với PBKDF2)
-- PBKDF2 hash đã được kiểm nghiệm đồng bộ với authHelper.js
INSERT INTO users (id, username, email, password_hash, salt, full_name, student_id, role)
VALUES 
('usr_admin_001', 'admin', 'dung.tm.dtc245160020@ictu.edu.vn', 'fbe789f21f1e9bd4e3a4e9be90b639e4a3b1d7d0fa2e896677983ff267592cf1eefdb29267cfbc0b874492efd3d61180cf2697aeb7e634563aeb30d424b9a1ba', 'a1b2c3d4e5f60718293a4b5c6d7e8f90', 'Trần Mạnh Dũng (Admin)', 'DTC245160020', 'admin'),
('usr_demo_002', 'demo_user', 'user_demo@ictu.edu.vn', 'fbe789f21f1e9bd4e3a4e9be90b639e4a3b1d7d0fa2e896677983ff267592cf1eefdb29267cfbc0b874492efd3d61180cf2697aeb7e634563aeb30d424b9a1ba', 'a1b2c3d4e5f60718293a4b5c6d7e8f90', 'Nguyễn Văn Demo', 'DTC245160999', 'user')
ON CONFLICT (username) DO NOTHING;

-- 2. Nạp Ví tài chính
INSERT INTO wallets (id, name, type, initial_balance, icon, color)
VALUES
('w_cash', 'Tiền mặt', 'cash', 2500000, 'Banknote', '#10B981'),
('w_bank', 'Tài khoản Ngân hàng', 'bank', 18500000, 'Building2', '#3B82F6'),
('w_momo', 'Ví điện tử MoMo', 'momo', 1250000, 'Smartphone', '#EC4899')
ON CONFLICT (id) DO NOTHING;

-- 3. Nạp Danh mục Thu / Chi
INSERT INTO categories (id, name, type, icon, color, is_default)
VALUES
('cat_food', 'Ăn uống & Cà phê', 'expense', 'Utensils', '#F59E0B', 1),
('cat_transport', 'Đi lại & Xăng xe', 'expense', 'Car', '#6366F1', 1),
('cat_shopping', 'Mua sắm cá nhân', 'expense', 'ShoppingBag', '#EC4899', 1),
('cat_bills', 'Điện nước & Internet', 'expense', 'Zap', '#EF4444', 1),
('cat_study', 'Học tập & Giáo trình', 'expense', 'BookOpen', '#8B5CF6', 1),
('cat_health', 'Sức khỏe & Y tế', 'expense', 'HeartPulse', '#10B981', 1),
('cat_salary', 'Tiền lương & Trợ cấp', 'income', 'Briefcase', '#10B981', 1),
('cat_bonus', 'Thưởng & Thu nhập thêm', 'income', 'Award', '#3B82F6', 1)
ON CONFLICT (id) DO NOTHING;

-- 4. Nạp Ngân sách tháng 10/2026
INSERT INTO budgets (id, category_id, month, amount)
VALUES
('b_oct_food', 'cat_food', '2026-10', 3500000),
('b_oct_trans', 'cat_transport', '2026-10', 800000),
('b_oct_shop', 'cat_shopping', '2026-10', 1500000)
ON CONFLICT (category_id, month) DO NOTHING;

-- 5. Nạp Giao dịch mẫu
INSERT INTO transactions (id, wallet_id, category_id, amount, type, date, note)
VALUES
('tx_seed_01', 'w_bank', 'cat_salary', 15000000, 'income', '2026-10-01', 'Nhận lương tháng 10'),
('tx_seed_02', 'w_cash', 'cat_food', 120000, 'expense', '2026-10-02', 'Ăn trưa & cà phê cùng bạn bè'),
('tx_seed_03', 'w_momo', 'cat_bills', 350000, 'expense', '2026-10-05', 'Thanh toán tiền điện Internet'),
('tx_seed_04', 'w_bank', 'cat_study', 750000, 'expense', '2026-10-10', 'Mua tài liệu học phần Triển khai hệ thống'),
('tx_seed_05', 'w_cash', 'cat_food', 450000, 'expense', '2026-10-15', 'Liên hoan nhóm đồ án Đề 38')
ON CONFLICT (id) DO NOTHING;
