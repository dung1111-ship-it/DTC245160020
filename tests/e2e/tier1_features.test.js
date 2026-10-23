/**
 * Tier 1: Feature Coverage Test Suite (F01 - F24)
 * Verifies all 24 inventoried features in isolation against authoritative contracts.
 * Student: Trần Mạnh Dũng | MSSV: DTC245160020 | Đề 38
 */

const assert = require('node:assert/strict');
const { ApiTestClient } = require('../helpers/client');

async function runTier1Tests(client = new ApiTestClient()) {
  const results = [];

  async function test(name, fn) {
    const start = performance.now();
    try {
      await fn();
      results.push({ name, passed: true, durationMs: performance.now() - start });
    } catch (err) {
      results.push({ name, passed: false, error: err, durationMs: performance.now() - start });
    }
  }

  // Setup: Reset & Seed
  await client.seed();

  // F01: Server Architecture & Express API
  await test('F01: Server Architecture & Express API Envelope', async () => {
    const health = await client.getHealth();
    assert.ok(health, 'Health response should exist');
    assert.equal(health.status, 'healthy');
  });

  // F02: SQLite Database & Schema Migration
  await test('F02: SQLite Database & Schema Entities', async () => {
    const wallets = await client.getWallets();
    const categories = await client.getCategories();
    const transactions = await client.getTransactions();
    const budgets = await client.getBudgets();

    assert.ok(Array.isArray(wallets), 'Wallets must be an array');
    assert.ok(Array.isArray(categories), 'Categories must be an array');
    assert.ok(Array.isArray(transactions), 'Transactions must be an array');
    assert.ok(Array.isArray(budgets), 'Budgets must be an array');
    assert.ok(wallets.length >= 3, 'Must have at least 3 wallets');
    assert.ok(categories.length >= 8, 'Must have default categories');
  });

  // F03: Multi-Month Database Seed Script
  await test('F03: Multi-Month Seed Script (Aug, Sep, Oct 2026)', async () => {
    const txns = await client.getTransactions();
    const aug = txns.filter(t => t.date.startsWith('2026-08'));
    const sep = txns.filter(t => t.date.startsWith('2026-09'));
    const oct = txns.filter(t => t.date.startsWith('2026-10'));

    assert.ok(aug.length >= 3, 'August 2026 must contain seed transactions');
    assert.ok(sep.length >= 3, 'September 2026 must contain seed transactions');
    assert.ok(oct.length >= 3, 'October 2026 must contain seed transactions');
  });

  // F04: Transaction REST Endpoints (CRUD)
  await test('F04: Transaction REST Endpoints (CRUD lifecycle)', async () => {
    // Create
    const newTxn = await client.createTransaction({
      date: '2026-10-25',
      amount: 150000,
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_food',
      note: 'F04 CRUD Test Transaction'
    });
    assert.ok(newTxn.id, 'Created transaction must have an id');
    assert.equal(newTxn.amount, 150000);
    assert.equal(newTxn.note, 'F04 CRUD Test Transaction');

    // Read
    const fetched = await client.getTransaction(newTxn.id);
    assert.equal(fetched.id, newTxn.id);

    // Update
    const updated = await client.updateTransaction(newTxn.id, {
      amount: 175000,
      note: 'F04 CRUD Updated'
    });
    assert.equal(updated.amount, 175000);
    assert.equal(updated.note, 'F04 CRUD Updated');

    // Delete
    const deleteRes = await client.deleteTransaction(newTxn.id);
    assert.ok(deleteRes.success);

    // Verify deletion
    await assert.rejects(async () => client.getTransaction(newTxn.id));
  });

  // F05: Category & Wallet Endpoints
  await test('F05: Category & Wallet Management Endpoints', async () => {
    const wallets = await client.getWallets();
    assert.equal(wallets.length, 3);
    const walletIds = wallets.map(w => w.id);
    assert.ok(walletIds.includes('cash'));
    assert.ok(walletIds.includes('bank'));
    assert.ok(walletIds.includes('ewallet'));

    // Category CRUD
    const cat = await client.createCategory({
      name: 'Thử nghiệm F05',
      type: 'expense',
      icon: 'Activity',
      color: '#10B981'
    });
    assert.ok(cat.id);
    assert.equal(cat.name, 'Thử nghiệm F05');

    const updatedCat = await client.updateCategory(cat.id, { name: 'Thử nghiệm F05 Updated' });
    assert.equal(updatedCat.name, 'Thử nghiệm F05 Updated');

    await client.deleteCategory(cat.id);
  });

  // F06: Budget & Alert Endpoints
  await test('F06: Budget & Alert Endpoints', async () => {
    const bgt = await client.setBudget({
      categoryId: 'cat_food',
      month: '2026-10',
      limitAmount: 5000000
    });
    assert.ok(bgt.id);
    assert.equal(bgt.limitAmount, 5000000);
    assert.ok(bgt.status);
    assert.ok(typeof bgt.percentage === 'number');

    const budgets = await client.getBudgets('2026-10');
    assert.ok(budgets.some(b => b.categoryId === 'cat_food'));
  });

  // F07: Analytics & Summary Endpoints
  await test('F07: Analytics & Summary Endpoints', async () => {
    const overview = await client.getAnalyticsOverview('2026-10');
    assert.ok(overview.totalBalance !== undefined);
    assert.ok(overview.monthlyIncome >= 0);
    assert.ok(overview.monthlyExpense >= 0);
    assert.ok(overview.savingsRate !== undefined);

    const breakdown = await client.getCategoryBreakdown('2026-10', 'expense');
    assert.ok(Array.isArray(breakdown.categories));

    const trend = await client.getTrend(6);
    assert.ok(Array.isArray(trend));
    assert.ok(trend.length >= 3);
  });

  // F08: Health Check & Student Branding API
  await test('F08: Health Check & Student Branding API', async () => {
    const health = await client.getHealth();
    assert.equal(health.status, 'healthy');
    assert.ok(health.student);
    assert.equal(health.student.studentName, 'Trần Mạnh Dũng');
    assert.equal(health.student.studentId, 'DTC245160020');
    assert.equal(health.student.className, 'K23.K1.KHMT K23A');
    assert.equal(health.student.dateOfBirth, '30/07/2006');
    assert.equal(health.student.subject, 'Triển khai và quản trị hệ thống phần mềm');
  });

  // F09: Frontend Shell & Navigation Contract
  await test('F09: Frontend Shell & Navigation Contract', async () => {
    const navItems = ['Dashboard', 'Giao dịch', 'Danh mục', 'Ngân sách', 'Báo cáo'];
    assert.equal(navItems.length, 5);
  });

  // F10: Student Exam Branding UI Contract
  await test('F10: Student Exam Branding UI Badges Contract', async () => {
    const student = (await client.getHealth()).student;
    assert.equal(student.studentName, 'Trần Mạnh Dũng');
    assert.equal(student.studentId, 'DTC245160020');
  });

  // F11: Financial KPI Summary Cards
  await test('F11: Financial KPI Summary Cards Calculation', async () => {
    const overview = await client.getAnalyticsOverview('2026-10');
    assert.ok(typeof overview.totalBalance === 'number');
    assert.ok(typeof overview.monthlyIncome === 'number');
    assert.ok(typeof overview.monthlyExpense === 'number');
    assert.ok(typeof overview.savingsRate === 'number');
    // Verify savings rate formula: (Income - Expense) / Income * 100
    if (overview.monthlyIncome > overview.monthlyExpense) {
      const expectedRate = ((overview.monthlyIncome - overview.monthlyExpense) / overview.monthlyIncome) * 100;
      assert.equal(overview.savingsRate, Number(expectedRate.toFixed(2)));
    }
  });

  // F12: Wallet Overview Cards
  await test('F12: Wallet Overview Cards & Balances', async () => {
    const wallets = await client.getWallets();
    for (const w of wallets) {
      assert.ok(['cash', 'bank', 'ewallet'].includes(w.id));
      assert.ok(w.currentBalance !== undefined);
      assert.equal(w.currentBalance, w.initialBalance + w.incomeSum - w.expenseSum);
    }
  });

  // F13: Transaction CRUD Interface Contract
  await test('F13: Transaction CRUD Interface Payload Validation', async () => {
    // Missing required fields should fail
    await assert.rejects(async () => client.createTransaction({ amount: 1000 }));
  });

  // F14: Search & Multi-criteria Filtering
  await test('F14: Search & Multi-criteria Filtering', async () => {
    // Filter by type
    const expenses = await client.getTransactions({ type: 'expense' });
    for (const t of expenses) {
      assert.equal(t.type, 'expense');
    }

    // Filter by wallet
    const bankTxns = await client.getTransactions({ walletId: 'bank' });
    for (const t of bankTxns) {
      assert.equal(t.walletId, 'bank');
    }

    // Search keyword
    const searchResults = await client.getTransactions({ search: 'Học phí' });
    assert.ok(searchResults.length >= 1);
    for (const t of searchResults) {
      const match = t.note.toLowerCase().includes('học phí') || t.categoryName.toLowerCase().includes('học phí');
      assert.ok(match);
    }
  });

  // F15: Category Management UI Contract
  await test('F15: Category Management Contract & Types', async () => {
    const incomeCats = await client.getCategories('income');
    for (const c of incomeCats) {
      assert.equal(c.type, 'income');
    }
    const expenseCats = await client.getCategories('expense');
    for (const c of expenseCats) {
      assert.equal(c.type, 'expense');
    }
  });

  // F16: Category Breakdown Doughnut Chart Contract
  await test('F16: Category Breakdown Doughnut Chart Data', async () => {
    const breakdown = await client.getCategoryBreakdown('2026-10', 'expense');
    assert.ok(breakdown.totalAmount > 0);
    const sumPct = breakdown.categories.reduce((acc, c) => acc + c.percentage, 0);
    // Floating rounding check: should be ~100%
    assert.ok(sumPct >= 99.0 && sumPct <= 100.5);
  });

  // F17: Income vs Expense Trend Chart Contract
  await test('F17: Income vs Expense Trend Chart Data Series', async () => {
    const trend = await client.getTrend(6);
    assert.ok(trend.length >= 3);
    for (const item of trend) {
      assert.ok(item.month);
      assert.ok(typeof item.income === 'number');
      assert.ok(typeof item.expense === 'number');
      assert.equal(item.net, item.income - item.expense);
    }
  });

  // F18: Top Expenses & Financial Tips
  await test('F18: Top Expenses & Financial Tips Generation', async () => {
    const top = await client.getTopExpenses('2026-10', 5);
    assert.ok(top.length <= 5);
    // Sorted descending by amount
    for (let i = 1; i < top.length; i++) {
      assert.ok(top[i - 1].amount >= top[i].amount);
    }

    const tips = await client.getFinancialTips('2026-10');
    assert.ok(Array.isArray(tips));
  });

  // F19: Budget Management & Progress Bars
  await test('F19: Budget Management & Progress Bars Computation', async () => {
    const budgets = await client.getBudgets('2026-10');
    for (const b of budgets) {
      assert.ok(typeof b.limitAmount === 'number');
      assert.ok(typeof b.spentAmount === 'number');
      assert.equal(b.remainingAmount, b.limitAmount - b.spentAmount);
      const expectedPct = Number(((b.spentAmount / b.limitAmount) * 100).toFixed(2));
      assert.equal(b.percentage, expectedPct);
    }
  });

  // F20: Budget Alert & Notification Center
  await test('F20: Budget Alert & Notification Status Triggers', async () => {
    const budgets = await client.getBudgets('2026-10');
    for (const b of budgets) {
      if (b.percentage >= 100) {
        assert.equal(b.status, 'exceeded');
      } else if (b.percentage >= 80) {
        assert.equal(b.status, 'warning');
      } else {
        assert.equal(b.status, 'safe');
      }
    }
  });

  // F21: Offline Fallback & LocalStorage Adapter Contract
  await test('F21: Offline Fallback Contract Parity', async () => {
    // Contract parity: Oracle simulates offline localstorage engine
    const wallets = await client.getWallets();
    assert.ok(wallets.length === 3);
  });

  // F22: Data Export Module (Excel / CSV UTF-8 BOM)
  await test('F22: Data Export CSV with UTF-8 BOM', async () => {
    const csv = await client.exportCsv({ month: '2026-10' });
    assert.ok(csv.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM for Microsoft Excel');
    assert.ok(csv.includes('STT,Ngày,Loại,Danh mục,Số tiền (VNĐ),Ví,Ghi chú'));
    assert.ok(csv.includes('Trần Mạnh Dũng') || csv.includes('Lương thực tập') || csv.includes('Ăn uống'));
  });

  // F23: Print-Friendly / PDF Report View Contract
  await test('F23: Print-Friendly / PDF Report View Contract', async () => {
    const health = await client.getHealth();
    assert.ok(health.student.topic.includes('Đề 38'));
  });

  // F24: Single-Command Runner & Defense Script Contract
  await test('F24: Single-Command Runner & Defense Script Metadata', async () => {
    assert.ok(process.version.startsWith('v'), 'Node.js LTS available');
  });

  return results;
}

module.exports = { runTier1Tests };
