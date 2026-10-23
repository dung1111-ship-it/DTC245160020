/**
 * Automated Integration Test Runner for Expense Tracker REST API
 * Học phần: Triển khai và quản trị hệ thống phần mềm (Đề 38)
 * Sinh viên: Trần Mạnh Dũng - MSSV: DTC245160020 - Lớp: K23.K1.KHMT K23A
 *
 * Usage:
 *   node test_api.js [BASE_URL]
 * Example:
 *   node test_api.js http://localhost:5000
 */

const BASE_URL = process.argv[2] || process.env.API_URL || 'http://localhost:5000';

// ANSI Color formatting
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m'
};

let passedCount = 0;
let failedCount = 0;
const failures = [];
const startTime = Date.now();
let inProcessServer = null;

async function test(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    const duration = Date.now() - t0;
    console.log(`  ${colors.green}✓ PASS${colors.reset} ${name} ${colors.gray}(${duration}ms)${colors.reset}`);
    passedCount++;
  } catch (err) {
    const duration = Date.now() - t0;
    console.log(`  ${colors.red}✗ FAIL${colors.reset} ${name} ${colors.gray}(${duration}ms)${colors.reset}`);
    console.log(`    ${colors.red}Error: ${err.message}${colors.reset}`);
    failedCount++;
    failures.push({ name, error: err.message });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'} - Expected: ${expected}, Actual: ${actual}`);
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, data, headers: response.headers };
}

async function ensureServerRunning() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(1000) }).catch(() => null);
    if (res && res.status === 200) {
      return;
    }
  } catch {
    // not running
  }

  // Khởi động server trong tiến trình nếu chưa có server độc lập
  console.log(`${colors.yellow}[Runner] Khởi động máy chủ Express nội bộ để chạy kiểm thử...${colors.reset}`);
  const app = require('./src/app');
  const { getDatabase } = require('./src/config/database');
  const { initSchema } = require('./src/models/schema');
  const { seedDatabase } = require('./src/scripts/seed');

  const db = getDatabase();
  initSchema(db);
  seedDatabase(db, true);

  const port = parseInt(new URL(BASE_URL).port || '5000', 10);
  await new Promise((resolve) => {
    inProcessServer = app.listen(port, () => {
      console.log(`${colors.green}[Runner] Máy chủ đã sẵn sàng tại ${BASE_URL}${colors.reset}\n`);
      resolve();
    });
  });
}

async function runAllTests() {
  await ensureServerRunning();

  console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}   EXPENSE TRACKER - BACKEND REST API AUTOMATED TEST RUNNER           ${colors.reset}`);
  console.log(`${colors.bold}   Đề 38: Hệ thống Quản lý Chi tiêu Cá nhân & Phân tích Tài chính     ${colors.reset}`);
  console.log(`${colors.bold}   Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020 | Lớp: K23A         ${colors.reset}`);
  console.log(`${colors.bold}   Target Server: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}\n`);

  // ==========================================
  // SUITE 1: System Health & Student Metadata
  // ==========================================
  console.log(`${colors.bold}${colors.magenta}[SUITE 1] System Health & Exam Metadata${colors.reset}`);
  await test('GET /api/health - Returns 200 and healthy status', async () => {
    const { status, data } = await request('/api/health');
    assertEqual(status, 200, 'Health endpoint should return 200');
    assert(data.success === true, 'Envelope success must be true');
    assertEqual(data.data.status, 'healthy', 'Server status should be healthy');
    assert(data.data.database.connected === true, 'SQLite DB must be connected');
  });

  await test('GET /api/health - Student Exam Metadata matches requirements', async () => {
    const { data } = await request('/api/health');
    const project = data.data.project || data.data.examInfo || data.data.student;
    assert(project !== undefined, 'Project metadata object must exist');
    const name = project.student || project.studentName;
    assertEqual(name, 'Trần Mạnh Dũng', 'Student name must match exactly');
    assertEqual(project.studentId, 'DTC245160020', 'Student ID must match DTC245160020');
    assert(project.topic.includes('Đề 38'), 'Topic must state Đề 38');
  });

  // ==========================================
  // SUITE 2: Categories Management & Integrity
  // ==========================================
  console.log(`\n${colors.bold}${colors.magenta}[SUITE 2] Categories Management & Business Integrity${colors.reset}`);
  let createdCategoryId = null;

  await test('GET /api/categories - Lists categories with required fields', async () => {
    const { status, data } = await request('/api/categories');
    assertEqual(status, 200, 'Categories endpoint should return 200');
    assert(Array.isArray(data.data), 'Data must be an array of categories');
    assert(data.data.length >= 6, 'Must have at least 6 seeded categories');
    const first = data.data[0];
    assert(first.id && first.name && first.type && first.icon && first.color, 'Category missing required fields');
  });

  await test('POST /api/categories - Successfully creates custom category', async () => {
    const payload = {
      name: 'Kiểm thử Danh mục Mới',
      type: 'expense',
      icon: 'Tag',
      color: '#6366F1'
    };
    const { status, data } = await request('/api/categories', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    assertEqual(status, 201, 'Category creation should return 201');
    assert(data.success === true, 'Success envelope must be true');
    assertEqual(data.data.name, payload.name, 'Category name must match');
    createdCategoryId = data.data.id;
  });

  await test('POST /api/categories - Validation rejects empty name or invalid type', async () => {
    const invalidPayload = { name: '', type: 'invalid_type', icon: 'Tag', color: '#123' };
    const { status, data } = await request('/api/categories', {
      method: 'POST',
      body: JSON.stringify(invalidPayload)
    });
    assertEqual(status, 400, 'Invalid category should return 400 Bad Request');
    assertEqual(data.error.code, 'VALIDATION_ERROR', 'Error code must be VALIDATION_ERROR');
  });

  await test('PUT /api/categories/:id - Updates category information', async () => {
    assert(createdCategoryId, 'Must have a category to update');
    const updatePayload = { name: 'Danh mục Kiểm thử (Đã sửa)', icon: 'Edit3', color: '#8B5CF6' };
    const { status, data } = await request(`/api/categories/${createdCategoryId}`, {
      method: 'PUT',
      body: JSON.stringify(updatePayload)
    });
    assertEqual(status, 200, 'Update should return 200');
    assertEqual(data.data.name, 'Danh mục Kiểm thử (Đã sửa)', 'Name should be updated');
  });

  // ==========================================
  // SUITE 3: Wallets & Dynamic Balances
  // ==========================================
  console.log(`\n${colors.bold}${colors.magenta}[SUITE 3] Wallets & Dynamic Balance Calculations${colors.reset}`);
  let initialCashBalance = 0;
  let testWalletId = 'cash';

  await test('GET /api/wallets - Returns all standard wallets with computed balances', async () => {
    const { status, data } = await request('/api/wallets');
    assertEqual(status, 200, 'Wallets endpoint should return 200');
    assert(Array.isArray(data.data), 'Data must be an array of wallets');
    assert(data.data.length >= 3, 'Must contain cash, bank, and ewallet');
    const cashWallet = data.data.find(w => w.id === 'cash' || w.id === 'wal_cash');
    assert(cashWallet !== undefined, 'cash wallet must exist');
    assert(typeof cashWallet.currentBalance === 'number', 'currentBalance must be a calculated number');
    initialCashBalance = cashWallet.currentBalance;
    testWalletId = cashWallet.id;
  });

  // ==========================================
  // SUITE 4: Transactions CRUD & Balance Synchronization
  // ==========================================
  console.log(`\n${colors.bold}${colors.magenta}[SUITE 4] Transactions CRUD & Wallet Balance Sync${colors.reset}`);
  let testTxId = null;
  const testExpenseAmount = 150000;

  await test('POST /api/transactions - Creates transaction & decreases wallet balance atomically', async () => {
    const payload = {
      walletId: testWalletId,
      categoryId: createdCategoryId,
      type: 'expense',
      amount: testExpenseAmount,
      date: '2026-10-22',
      note: 'Giao dịch kiểm thử tích hợp tự động',
      payeePayer: 'Cửa hàng Test'
    };
    const { status, data } = await request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    assertEqual(status, 201, 'Create transaction should return 201 Created');
    assert(data.data.id !== undefined, 'Transaction ID must be returned');
    testTxId = data.data.id;

    // Verify wallet balance immediately decreased
    const { data: walletsData } = await request('/api/wallets');
    const cashWallet = walletsData.data.find(w => w.id === testWalletId);
    const expectedBalance = initialCashBalance - testExpenseAmount;
    assertEqual(cashWallet.currentBalance, expectedBalance, 'Wallet currentBalance must decrease by exact expense amount');
  });

  await test('GET /api/transactions - Query filters by categoryId, type, search', async () => {
    const { status, data } = await request(`/api/transactions?categoryId=${createdCategoryId}&type=expense`);
    assertEqual(status, 200, 'Filtered query should return 200');
    assert(Array.isArray(data.data), 'Data must be an array');
    assert(data.data.some(t => t.id === testTxId), 'Created test transaction must be present in filtered list');
  });

  await test('POST /api/transactions - Validation rejects negative or zero amount', async () => {
    const invalidPayload = {
      walletId: testWalletId,
      categoryId: createdCategoryId,
      type: 'expense',
      amount: -50000,
      date: '2026-10-22'
    };
    const { status, data } = await request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(invalidPayload)
    });
    assertEqual(status, 400, 'Negative amount must be rejected with 400');
    assertEqual(data.error.code, 'VALIDATION_ERROR', 'Error code must be VALIDATION_ERROR');
  });

  await test('DELETE /api/categories/:id - REJECTS deletion when category has linked transactions', async () => {
    const { status, data } = await request(`/api/categories/${createdCategoryId}`, {
      method: 'DELETE'
    });
    assertEqual(status, 400, 'Deleting category in-use must return 400 Bad Request');
    assertEqual(data.error.code, 'CATEGORY_IN_USE', 'Error code must be CATEGORY_IN_USE');
  });

  await test('DELETE /api/transactions/:id - Deletes transaction & restores wallet balance', async () => {
    assert(testTxId, 'Must have transaction ID to delete');
    const { status } = await request(`/api/transactions/${testTxId}`, {
      method: 'DELETE'
    });
    assertEqual(status, 200, 'Delete transaction should return 200');

    // Verify wallet balance restored
    const { data: walletsData } = await request('/api/wallets');
    const cashWallet = walletsData.data.find(w => w.id === testWalletId);
    assertEqual(cashWallet.currentBalance, initialCashBalance, 'Wallet balance must be restored to initial state');
  });

  await test('DELETE /api/categories/:id - SUCCEEDS after linked transaction is deleted', async () => {
    const { status, data } = await request(`/api/categories/${createdCategoryId}`, {
      method: 'DELETE'
    });
    assertEqual(status, 200, 'Category should be successfully deleted now that transactions are gone');
    assert(data.success === true, 'Success must be true');
  });

  // ==========================================
  // SUITE 5: Budgets & Alert Thresholds
  // ==========================================
  console.log(`\n${colors.bold}${colors.magenta}[SUITE 5] Budgets & Alert Thresholds${colors.reset}`);
  await test('POST /api/budgets - Sets or updates monthly category limit', async () => {
    const payload = {
      categoryId: 'cat_food',
      month: '2026-10',
      limitAmount: 3000000,
      warningThreshold: 0.8
    };
    const { status, data } = await request('/api/budgets', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    assert([200, 201].includes(status), 'Budget set should return 200 or 201');
    assert(data.success === true, 'Success envelope must be true');
  });

  await test('GET /api/budgets/progress - Calculates spentAmount, remainingAmount & alert status', async () => {
    const { status, data } = await request('/api/budgets/progress?month=2026-10');
    assertEqual(status, 200, 'Budget progress should return 200');
    assert(data.data.summary !== undefined, 'Summary object must exist');
    assert(Array.isArray(data.data.items), 'Items array must exist');
    const foodBudget = data.data.items.find(b => b.categoryId === 'cat_food');
    assert(foodBudget !== undefined, 'Food budget must be present');
    assert(['safe', 'warning', 'exceeded'].includes(foodBudget.status), 'Status must be safe, warning, or exceeded');
    assertEqual(foodBudget.limitAmount, 3000000, 'Limit amount must match');
  });

  // ==========================================
  // SUITE 6: Financial Analytics & Trends
  // ==========================================
  console.log(`\n${colors.bold}${colors.magenta}[SUITE 6] Financial Analytics & Visualization Feeds${colors.reset}`);
  await test('GET /api/analytics/summary - Returns 4 Core KPIs and MoM comparisons', async () => {
    const { status, data } = await request('/api/analytics/summary?month=2026-10');
    assertEqual(status, 200, 'Summary endpoint should return 200');
    const kpi = data.data;
    assert(typeof kpi.totalBalance === 'number', 'totalBalance must be number');
    assert(typeof kpi.monthlyIncome === 'number', 'monthlyIncome must be number');
    assert(typeof kpi.monthlyExpense === 'number', 'monthlyExpense must be number');
    assert(typeof kpi.savingsRate === 'number', 'savingsRate must be number');
    assertEqual(kpi.netSavings, kpi.monthlyIncome - kpi.monthlyExpense, 'netSavings must equal income - expense');
  });

  await test('GET /api/analytics/category-breakdown - Feeds Doughnut Chart with descending amounts', async () => {
    const { status, data } = await request('/api/analytics/category-breakdown?month=2026-10&type=expense');
    assertEqual(status, 200, 'Category breakdown should return 200');
    assert(Array.isArray(data.data.items), 'Breakdown items must be an array');
    if (data.data.items.length > 1) {
      assert(data.data.items[0].amount >= data.data.items[1].amount, 'Must be sorted in descending order of amount');
    }
  });

  await test('GET /api/analytics/trends - Feeds Cash Flow Area Chart with monthly chronological data', async () => {
    const { status, data } = await request('/api/analytics/trends?year=2026');
    assertEqual(status, 200, 'Trends endpoint should return 200');
    assert(Array.isArray(data.data), 'Trends must be an array');
    assert(data.data.length >= 3, 'Must contain at least 3 seeded months (Aug, Sep, Oct)');
    const aug = data.data.find(d => d.period === '2026-08');
    const oct = data.data.find(d => d.period === '2026-10');
    assert(aug && oct, 'Both Aug and Oct 2026 must be present in trend data');
  });

  await test('GET /api/analytics/top-expenses - Returns top 5 largest expenses', async () => {
    const { status, data } = await request('/api/analytics/top-expenses?month=2026-10&limit=5');
    assertEqual(status, 200, 'Top expenses endpoint should return 200');
    assert(Array.isArray(data.data), 'Data must be an array');
    assert(data.data.length <= 5, 'Must not exceed limit of 5 items');
  });

  await test('GET /api/analytics/financial-tips - Returns smart advice based on spending', async () => {
    const { status, data } = await request('/api/analytics/financial-tips?month=2026-10');
    assertEqual(status, 200, 'Tips endpoint should return 200');
    const tipsList = Array.isArray(data.data) ? data.data : data.data?.tips;
    assert(Array.isArray(tipsList), 'Tips must be an array');
    assert(tipsList.length >= 1, 'Must contain at least 1 tip');
  });

  await test('GET /api/export/csv - Returns CSV with UTF-8 BOM', async () => {
    const { status, data } = await request('/api/export/csv?month=2026-10');
    assertEqual(status, 200, 'Export CSV endpoint should return 200');
    assert(typeof data === 'string', 'Data should be string');
    assert(data.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM');
  });

  // ==========================================
  // SUITE 7: Authentication & RBAC (Admin/User)
  // ==========================================
  console.log(`\n${colors.cyan}[SUITE 7] Authentication & Role-Based Access Control (RBAC)${colors.reset}`);
  let adminToken = '';
  let userToken = '';

  await test('POST /api/auth/login - Admin login returns JWT & profile', async () => {
    const { status, data } = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: 'admin', password: 'admin123' })
    });
    assertEqual(status, 200, 'Admin login should return 200');
    assert(data.success, 'Response success must be true');
    assert(data.data.token, 'Response must include JWT token');
    assertEqual(data.data.user.role, 'admin', 'Role must be admin');
    adminToken = data.data.token;
  });

  await test('POST /api/auth/login - Demo user login returns JWT & profile', async () => {
    const { status, data } = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: 'demo_user', password: 'user123' })
    });
    assertEqual(status, 200, 'User login should return 200');
    assert(data.data.token, 'Must return token');
    assertEqual(data.data.user.role, 'user', 'Role must be user');
    userToken = data.data.token;
  });

  await test('GET /api/auth/me - Authenticated endpoint returns current user', async () => {
    const { status, data } = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assertEqual(status, 200, 'Should return 200 with valid token');
    assertEqual(data.data.username, 'admin', 'Username matches');
  });

  await test('POST /api/auth/register - Public registration creates active user', async () => {
    const uniqueName = `tester_${Date.now().toString(36)}`;
    const { status, data } = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: uniqueName,
        email: `${uniqueName}@test.edu.vn`,
        password: 'Password@123',
        fullName: 'Sinh Viên Tự Do'
      })
    });
    assertEqual(status, 201, 'Registration returns 201 Created');
    assert(data.data.token, 'Registration returns valid token');
    assertEqual(data.data.user.role, 'user', 'Default role must be user');
  });

  await test('GET /api/admin/users - 401 Unauthorized when no token provided', async () => {
    const { status } = await request('/api/admin/users');
    assertEqual(status, 401, 'Should reject unauthenticated request with 401');
  });

  await test('GET /api/admin/users - 403 Forbidden when regular user tries to access admin API', async () => {
    const { status } = await request('/api/admin/users', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assertEqual(status, 403, 'Should forbid standard user with 403');
  });

  await test('GET /api/admin/users - 200 OK when Admin accesses user management', async () => {
    const { status, data } = await request('/api/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assertEqual(status, 200, 'Admin can list users with 200 OK');
    assert(Array.isArray(data.data), 'Returns array of users');
    assert(data.data.length >= 2, 'Has at least admin and demo_user');
  });

  await test('GET /api/admin/stats - Admin accesses system and database telemetry', async () => {
    const { status, data } = await request('/api/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assertEqual(status, 200, 'Admin can access system stats');
    assert(data.data.usersCount >= 2, 'Users count tracked');
    assert(data.data.dbEngine.includes('SQLite'), 'Database engine reported');
  });

  // ==========================================
  // FINAL REPORT & SUMMARY
  // ==========================================
  const totalDuration = Date.now() - startTime;
  console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}TEST EXECUTION SUMMARY:${colors.reset}`);
  console.log(`  Total Tests Run: ${colors.bold}${passedCount + failedCount}${colors.reset}`);
  console.log(`  Passed Tests:    ${colors.green}${colors.bold}${passedCount}${colors.reset}`);
  console.log(`  Failed Tests:    ${colors.red}${colors.bold}${failedCount}${colors.reset}`);
  console.log(`  Execution Time:  ${colors.gray}${totalDuration}ms${colors.reset}`);

  if (inProcessServer) {
    inProcessServer.close();
  }

  if (failedCount === 0) {
    console.log(`\n${colors.bold}${colors.green}>>> RESULT: 100% OF REST API INTEGRATION TESTS PASSED! READY FOR DEFENSE. <<<${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.bold}${colors.red}>>> RESULT: TEST RUN FAILED WITH ${failedCount} FAILURES. <<<${colors.reset}`);
    failures.forEach((f, idx) => {
      console.log(`  ${idx + 1}. ${f.name} -> ${f.error}`);
    });
    console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}\n`);
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error(`${colors.red}Fatal test runner error:${colors.reset}`, err);
  if (inProcessServer) inProcessServer.close();
  process.exit(1);
});
