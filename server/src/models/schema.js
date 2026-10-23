/**
 * src/models/schema.js
 * Định nghĩa DDL Schema, Index và View cho SQLite
 * Đề 38 - Môn Triển khai và quản trị hệ thống phần mềm
 */

const SCHEMA_SQL = `
-- 0. Bảng Quản trị Người dùng & Phân quyền (Users & Authentication)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    full_name TEXT NOT NULL,
    student_id TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
    avatar TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 1. Bảng Danh mục Thu / Chi (Categories)
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 2. Bảng Ví & Tài khoản thanh toán (Wallets)
CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('cash', 'bank', 'ewallet', 'e_wallet')),
    initial_balance REAL NOT NULL DEFAULT 0,
    current_balance REAL NOT NULL DEFAULT 0,
    account_number TEXT,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 3. Bảng Giao dịch Thu / Chi (Transactions)
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    wallet_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    amount REAL NOT NULL CHECK(amount > 0),
    transaction_date TEXT NOT NULL,
    note TEXT,
    payee_payer TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- Chỉ mục tối ưu hóa truy vấn
CREATE INDEX IF NOT EXISTS idx_trans_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_trans_wallet ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_trans_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_trans_type ON transactions(type);

-- 4. Bảng Kế hoạch Ngân sách (Budgets)
CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    month TEXT NOT NULL,
    limit_amount REAL NOT NULL CHECK(limit_amount > 0),
    warning_threshold REAL NOT NULL DEFAULT 0.80,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(category_id, month)
);

CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);

-- 5. View Tính Tiến độ & Cảnh báo Ngân sách (v_budget_progress)
DROP VIEW IF EXISTS v_budget_progress;
CREATE VIEW v_budget_progress AS
SELECT 
    b.id AS budget_id,
    b.category_id,
    c.name AS category_name,
    c.icon AS category_icon,
    c.color AS category_color,
    b.month,
    b.limit_amount,
    b.warning_threshold,
    COALESCE(SUM(t.amount), 0) AS spent_amount,
    (b.limit_amount - COALESCE(SUM(t.amount), 0)) AS remaining_amount,
    ROUND((CAST(COALESCE(SUM(t.amount), 0) AS REAL) / b.limit_amount) * 100, 2) AS spent_percentage,
    CASE 
        WHEN COALESCE(SUM(t.amount), 0) >= b.limit_amount THEN 'exceeded'
        WHEN COALESCE(SUM(t.amount), 0) >= (b.limit_amount * b.warning_threshold) THEN 'warning'
        ELSE 'safe'
    END AS status
FROM budgets b
JOIN categories c ON b.category_id = c.id
LEFT JOIN transactions t ON t.category_id = b.category_id 
    AND t.type = 'expense'
    AND strftime('%Y-%m', t.transaction_date) = b.month
GROUP BY b.id, b.category_id, c.name, c.icon, c.color, b.month, b.limit_amount, b.warning_threshold;
`;

/**
 * Khởi tạo toàn bộ DDL schema
 * @param {import('better-sqlite3').Database} db 
 */
function initSchema(db) {
  db.exec(SCHEMA_SQL);
}

/**
 * Kiểm tra xem bảng dữ liệu đã tồn tại hay chưa
 * @param {import('better-sqlite3').Database} db 
 * @returns {boolean}
 */
function checkTablesExist(db) {
  const row = db.prepare(`
    SELECT count(*) as count FROM sqlite_master 
    WHERE type='table' AND name IN ('categories', 'wallets', 'transactions', 'budgets')
  `).get();
  return row.count === 4;
}

module.exports = {
  SCHEMA_SQL,
  initSchema,
  checkTablesExist
};
