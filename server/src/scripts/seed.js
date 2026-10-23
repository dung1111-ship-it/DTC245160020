/**
 * src/scripts/seed.js
 * Script nạp dữ liệu mẫu 3 tháng thực tế cho sinh viên Trần Mạnh Dũng (DTC245160020, Đề 38)
 * Quản lý Chi tiêu Cá nhân & Phân tích Tài chính
 */

const { getDatabase } = require('../config/database');
const { initSchema } = require('../models/schema');
const { hashPassword } = require('../utils/authHelper');

const SEED_USERS = [
  {
    id: 'usr_admin_001',
    username: 'admin',
    email: 'dung.dtc245160020@phenikaa.edu.vn',
    password: 'admin123',
    full_name: 'Trần Mạnh Dũng',
    student_id: 'DTC245160020',
    role: 'admin'
  },
  {
    id: 'usr_demo_002',
    username: 'demo_user',
    email: 'demo@expensetracker.vn',
    password: 'user123',
    full_name: 'Nguyễn Văn Demo',
    student_id: 'DTC245160099',
    role: 'user'
  }
];

const SEED_CATEGORIES = [
  // Thu nhập (Income)
  { id: 'cat_salary', name: 'Lương hàng tháng', type: 'income', icon: 'Briefcase', color: '#10B981', is_default: 1 },
  { id: 'cat_scholarship', name: 'Học bổng', type: 'income', icon: 'Award', color: '#059669', is_default: 1 },
  { id: 'cat_freelance', name: 'Thu nhập làm thêm', type: 'income', icon: 'Laptop', color: '#34D399', is_default: 1 },
  { id: 'cat_gift', name: 'Thưởng & Quà tặng', type: 'income', icon: 'Gift', color: '#6EE7B7', is_default: 1 },
  { id: 'cat_income_other', name: 'Thu nhập khác', type: 'income', icon: 'TrendingUp', color: '#A7F3D0', is_default: 1 },

  // Chi tiêu (Expense)
  { id: 'cat_food', name: 'Ăn uống & Nhà hàng', type: 'expense', icon: 'Utensils', color: '#EF4444', is_default: 1 },
  { id: 'cat_shopping', name: 'Mua sắm', type: 'expense', icon: 'ShoppingBag', color: '#F97316', is_default: 1 },
  { id: 'cat_tuition', name: 'Học phí & Giáo dục', type: 'expense', icon: 'GraduationCap', color: '#8B5CF6', is_default: 1 },
  { id: 'cat_housing', name: 'Nhà ở & Điện nước', type: 'expense', icon: 'Home', color: '#6366F1', is_default: 1 },
  { id: 'cat_rent', name: 'Tiền thuê trọ', type: 'expense', icon: 'Home', color: '#F97316', is_default: 1 },
  { id: 'cat_tech', name: 'Thiết bị & Cloud', type: 'expense', icon: 'Server', color: '#3B82F6', is_default: 1 },
  { id: 'cat_transport', name: 'Di chuyển & Xăng xe', type: 'expense', icon: 'Car', color: '#EAB308', is_default: 1 },
  { id: 'cat_entertainment', name: 'Giải trí & Giao lưu', type: 'expense', icon: 'Film', color: '#EC4899', is_default: 1 },
  { id: 'cat_health', name: 'Y tế & Sức khỏe', type: 'expense', icon: 'HeartPulse', color: '#14B8A6', is_default: 1 },
  { id: 'cat_expense_other', name: 'Chi tiêu khác', type: 'expense', icon: 'MoreHorizontal', color: '#9CA3AF', is_default: 1 }
];

const SEED_WALLETS = [
  {
    id: 'cash',
    name: 'Tiền mặt',
    type: 'cash',
    initial_balance: 2000000,
    current_balance: 2000000,
    account_number: 'Ví tiền mặt cá nhân',
    icon: 'Banknote',
    color: '#10B981',
    is_active: 1
  },
  {
    id: 'bank',
    name: 'Tài khoản Ngân hàng (ATM)',
    type: 'bank',
    initial_balance: 10000000,
    current_balance: 10000000,
    account_number: '0987654321 - MB Bank',
    icon: 'CreditCard',
    color: '#3B82F6',
    is_active: 1
  },
  {
    id: 'ewallet',
    name: 'Ví điện tử (Momo/ZaloPay)',
    type: 'ewallet',
    initial_balance: 1500000,
    current_balance: 1500000,
    account_number: '0912345678 (MoMo)',
    icon: 'Smartphone',
    color: '#EC4899',
    is_active: 1
  }
];

const SEED_BUDGETS = [
  {
    id: 'bgt_oct_food',
    category_id: 'cat_food',
    month: '2026-10',
    limit_amount: 3000000,
    warning_threshold: 0.80
  },
  {
    id: 'bgt_oct_housing',
    category_id: 'cat_housing',
    month: '2026-10',
    limit_amount: 2500000,
    warning_threshold: 0.80
  },
  {
    id: 'bgt_oct_shopping',
    category_id: 'cat_shopping',
    month: '2026-10',
    limit_amount: 500000,
    warning_threshold: 0.80
  }
];

const SEED_TRANSACTIONS = [
  // ==========================================
  // THÁNG 8/2026 (Đầu Học Kỳ Mới)
  // Thu: 7,000,000đ | Chi: 9,000,000đ (Deficit planned do học phí)
  // ==========================================
  {
    id: 'txn_aug_01',
    wallet_id: 'bank',
    category_id: 'cat_freelance',
    type: 'income',
    amount: 4000000,
    transaction_date: '2026-08-01',
    note: 'Lương làm thêm hè',
    payee_payer: 'Công ty Đối tác'
  },
  {
    id: 'txn_aug_02',
    wallet_id: 'bank',
    category_id: 'cat_gift',
    type: 'income',
    amount: 3000000,
    transaction_date: '2026-08-03',
    note: 'Gia đình hỗ trợ đầu năm học',
    payee_payer: 'Gia đình chuyển khoản'
  },
  {
    id: 'txn_aug_03',
    wallet_id: 'bank',
    category_id: 'cat_tuition',
    type: 'expense',
    amount: 6500000,
    transaction_date: '2026-08-05',
    note: 'Đóng học phí Học kỳ 1 (Đề 38)',
    payee_payer: 'Phòng Kế hoạch Tài chính Đại học'
  },
  {
    id: 'txn_aug_04',
    wallet_id: 'cash',
    category_id: 'cat_tuition',
    type: 'expense',
    amount: 450000,
    transaction_date: '2026-08-08',
    note: 'Sách giáo trình và văn phòng phẩm',
    payee_payer: 'Hiệu sách Đại học'
  },
  {
    id: 'txn_aug_05',
    wallet_id: 'cash',
    category_id: 'cat_food',
    type: 'expense',
    amount: 1800000,
    transaction_date: '2026-08-12',
    note: 'Tiền ăn cả tháng 8',
    payee_payer: 'Quán ăn sinh viên'
  },
  {
    id: 'txn_aug_06',
    wallet_id: 'cash',
    category_id: 'cat_transport',
    type: 'expense',
    amount: 250000,
    transaction_date: '2026-08-15',
    note: 'Xăng xe đi lại',
    payee_payer: 'Cây xăng Petrolimex'
  },

  // ==========================================
  // THÁNG 9/2026 (Sinh Hoạt & Dự Án Freelance)
  // Thu: 7,000,000đ | Chi: 5,850,000đ | Tiết kiệm: 1,150,000đ (16.43%)
  // ==========================================
  {
    id: 'txn_sep_01',
    wallet_id: 'bank',
    category_id: 'cat_freelance',
    type: 'income',
    amount: 5000000,
    transaction_date: '2026-09-01',
    note: 'Dự án lập trình website',
    payee_payer: 'Khách hàng Freelance'
  },
  {
    id: 'txn_sep_02',
    wallet_id: 'bank',
    category_id: 'cat_scholarship',
    type: 'income',
    amount: 2000000,
    transaction_date: '2026-09-05',
    note: 'Học bổng khuyến khích học tập',
    payee_payer: 'Khoa Công nghệ Thông tin'
  },
  {
    id: 'txn_sep_03',
    wallet_id: 'bank',
    category_id: 'cat_housing',
    type: 'expense',
    amount: 2500000,
    transaction_date: '2026-09-06',
    note: 'Tiền trọ và điện nước tháng 9',
    payee_payer: 'Chủ nhà trọ'
  },
  {
    id: 'txn_sep_04',
    wallet_id: 'ewallet',
    category_id: 'cat_food',
    type: 'expense',
    amount: 2600000,
    transaction_date: '2026-09-10',
    note: 'Ăn uống và đi chợ nấu cơm',
    payee_payer: 'Siêu thị WinMart'
  },
  {
    id: 'txn_sep_05',
    wallet_id: 'ewallet',
    category_id: 'cat_shopping',
    type: 'expense',
    amount: 400000,
    transaction_date: '2026-09-18',
    note: 'Mua phụ kiện bàn phím chuột',
    payee_payer: 'Shopee Mall'
  },
  {
    id: 'txn_sep_06',
    wallet_id: 'cash',
    category_id: 'cat_entertainment',
    type: 'expense',
    amount: 350000,
    transaction_date: '2026-09-25',
    note: 'Liên hoan nhóm bạn',
    payee_payer: 'Quán ăn cuối tuần'
  },

  // ==========================================
  // THÁNG 10/2026 (Bảo Vệ Đồ Án Đề 38)
  // Thu: 7,500,000đ | Chi: 5,800,000đ | Tiết kiệm: 1,700,000đ (22.67%)
  // ==========================================
  {
    id: 'txn_oct_01',
    wallet_id: 'bank',
    category_id: 'cat_salary',
    type: 'income',
    amount: 6000000,
    transaction_date: '2026-10-01',
    note: 'Lương thực tập doanh nghiệp',
    payee_payer: 'Công ty TNHH Phần mềm TechSol'
  },
  {
    id: 'txn_oct_02',
    wallet_id: 'bank',
    category_id: 'cat_gift',
    type: 'income',
    amount: 1500000,
    transaction_date: '2026-10-05',
    note: 'Thưởng hoàn thành tiến độ dự án',
    payee_payer: 'Công ty TNHH Phần mềm TechSol'
  },
  {
    id: 'txn_oct_03',
    wallet_id: 'bank',
    category_id: 'cat_housing',
    type: 'expense',
    amount: 2500000,
    transaction_date: '2026-10-06',
    note: 'Tiền trọ và internet tháng 10',
    payee_payer: 'Chủ nhà trọ'
  },
  {
    id: 'txn_oct_04',
    wallet_id: 'cash',
    category_id: 'cat_food',
    type: 'expense',
    amount: 2800000,
    transaction_date: '2026-10-10',
    note: 'Ăn uống hàng ngày',
    payee_payer: 'Chi tiêu tiền mặt cá nhân'
  },
  {
    id: 'txn_oct_05',
    wallet_id: 'cash',
    category_id: 'cat_tuition',
    type: 'expense',
    amount: 220000,
    transaction_date: '2026-10-14',
    note: 'In ấn báo cáo & đóng bìa Đề 38',
    payee_payer: 'Cửa hàng Photocopy cổng trường'
  },
  {
    id: 'txn_oct_06',
    wallet_id: 'ewallet',
    category_id: 'cat_shopping',
    type: 'expense',
    amount: 280000,
    transaction_date: '2026-10-20',
    note: 'Gia hạn dịch vụ cloud demo',
    payee_payer: 'Nhà cung cấp Cloud'
  }
];

/**
 * Xóa dữ liệu và đưa về trạng thái trắng (Reset)
 * @param {import('better-sqlite3').Database} db 
 */
function resetDatabase(db) {
  initSchema(db);
  const runResetTx = db.transaction(() => {
    db.prepare('DELETE FROM transactions').run();
    db.prepare('DELETE FROM budgets').run();
    db.prepare('DELETE FROM categories').run();
    db.prepare('DELETE FROM wallets').run();

    const insertCat = db.prepare(`
      INSERT OR REPLACE INTO categories (id, name, type, icon, color, is_default)
      VALUES (@id, @name, @type, @icon, @color, @is_default)
    `);
    for (const cat of SEED_CATEGORIES) {
      insertCat.run(cat);
    }

    const insertWallet = db.prepare(`
      INSERT OR REPLACE INTO wallets (id, name, type, initial_balance, current_balance, account_number, icon, color, is_active)
      VALUES (@id, @name, @type, @initial_balance, @current_balance, @account_number, @icon, @color, @is_active)
    `);
    for (const wal of SEED_WALLETS) {
      insertWallet.run(wal);
    }
  });
  runResetTx();
}

/**
 * Thực thi seed toàn bộ dữ liệu mẫu vào SQLite
 * @param {import('better-sqlite3').Database} db 
 * @param {boolean} [forceReset=false] 
 */
function seedDatabase(db, forceReset = false) {
  initSchema(db);

  const txCount = db.prepare('SELECT count(*) as count FROM transactions').get().count;
  if (txCount > 0 && !forceReset) {
    console.log(`[Seed] Database đã có ${txCount} giao dịch, bỏ qua seed mặc định.`);
    return;
  }

  resetDatabase(db);

  const runSeedTx = db.transaction(() => {
    // 0. Chèn Người dùng (Users & RBAC)
    const insertUser = db.prepare(`
      INSERT OR REPLACE INTO users (id, username, email, password_hash, salt, full_name, student_id, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const u of SEED_USERS) {
      const { salt, hash } = hashPassword(u.password);
      insertUser.run(u.id, u.username, u.email, hash, salt, u.full_name, u.student_id, u.role);
    }

    // 1. Chèn Budgets
    const insertBudget = db.prepare(`
      INSERT OR REPLACE INTO budgets (id, category_id, month, limit_amount, warning_threshold)
      VALUES (@id, @category_id, @month, @limit_amount, @warning_threshold)
    `);
    for (const bud of SEED_BUDGETS) {
      insertBudget.run(bud);
    }

    // 2. Chèn Transactions
    const insertTx = db.prepare(`
      INSERT OR REPLACE INTO transactions (id, wallet_id, category_id, type, amount, transaction_date, note, payee_payer)
      VALUES (@id, @wallet_id, @category_id, @type, @amount, @transaction_date, @note, @payee_payer)
    `);
    for (const tx of SEED_TRANSACTIONS) {
      insertTx.run(tx);
    }

    // 3. Cập nhật current_balance cho từng ví theo công thức:
    // current_balance = initial_balance + sum(incomes) - sum(expenses)
    db.prepare(`
      UPDATE wallets SET current_balance = initial_balance + (
        COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = wallets.id AND type = 'income'), 0) -
        COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = wallets.id AND type = 'expense'), 0)
      )
    `).run();
  });

  runSeedTx();
  console.log(`[Seed] Nạp thành công dữ liệu mẫu sinh viên Trần Mạnh Dũng (DTC245160020) gồm ${SEED_CATEGORIES.length} danh mục, ${SEED_WALLETS.length} ví, ${SEED_BUDGETS.length} hạn mức và ${SEED_TRANSACTIONS.length} giao dịch.`);
}

/**
 * Tự động kiểm tra và seed nếu dữ liệu đang rỗng
 * @param {import('better-sqlite3').Database} db 
 */
function seedIfEmpty(db) {
  initSchema(db);
  const count = db.prepare('SELECT count(*) as count FROM transactions').get().count;
  if (count === 0) {
    seedDatabase(db, false);
  }
}

// Cho phép chạy trực tiếp từ CLI: node src/scripts/seed.js [--force]
if (require.main === module) {
  const db = getDatabase();
  const force = process.argv.includes('--force');
  seedDatabase(db, force);
}

module.exports = {
  SEED_CATEGORIES,
  SEED_WALLETS,
  SEED_BUDGETS,
  SEED_TRANSACTIONS,
  resetDatabase,
  seedDatabase,
  seedIfEmpty
};
