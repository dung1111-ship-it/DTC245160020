/**
 * Tier 4: Real-World Workload Scenarios Test Suite
 * End-to-end multi-month student lifecycle for Trần Mạnh Dũng (MSSV: DTC245160020).
 * Simulates complete semester cash flows (Aug - Oct 2026) across Cash, Bank, and E-Wallet.
 * Học phần: Triển khai và quản trị hệ thống phần mềm | Đề tài 38
 */

const assert = require('node:assert/strict');
const { ApiTestClient } = require('../helpers/client');

async function runTier4Tests(client = new ApiTestClient()) {
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

  // Setup: Clean seed
  await client.seed();

  // --- WORKLOAD 1: MULTI-MONTH STUDENT FINANCIAL PROFILE ---
  await test('T4-W01: Seed multi-month student lifecycle records (Aug, Sep, Oct 2026)', async () => {
    const allTxns = await client.getTransactions();
    assert.ok(allTxns.length >= 18, `Should contain at least 18 transactions, got ${allTxns.length}`);

    const aug = allTxns.filter(t => t.date.startsWith('2026-08'));
    const sep = allTxns.filter(t => t.date.startsWith('2026-09'));
    const oct = allTxns.filter(t => t.date.startsWith('2026-10'));

    assert.ok(aug.length >= 6, 'August should have >= 6 transactions');
    assert.ok(sep.length >= 6, 'September should have >= 6 transactions');
    assert.ok(oct.length >= 6, 'October should have >= 6 transactions');
  });

  // --- WORKLOAD 2: THREE-WALLET FLOW RECONCILIATION ---
  await test('T4-W02: Reconcile Cash, Bank, and E-Wallet balances across the entire semester', async () => {
    const wallets = await client.getWallets();
    const cash = wallets.find(w => w.id === 'cash');
    const bank = wallets.find(w => w.id === 'bank');
    const ewallet = wallets.find(w => w.id === 'ewallet');

    assert.ok(cash, 'Cash wallet must exist');
    assert.ok(bank, 'Bank wallet must exist');
    assert.ok(ewallet, 'E-Wallet must exist');

    // All current balances must equal initial + incomeSum - expenseSum
    assert.equal(cash.currentBalance, cash.initialBalance + cash.incomeSum - cash.expenseSum);
    assert.equal(bank.currentBalance, bank.initialBalance + bank.incomeSum - bank.expenseSum);
    assert.equal(ewallet.currentBalance, ewallet.initialBalance + ewallet.incomeSum - ewallet.expenseSum);

    // Verify all 3 channels were actively utilized
    assert.ok(cash.expenseSum > 0, 'Cash wallet should have recorded expenditures');
    assert.ok(bank.incomeSum > 0, 'Bank wallet should have received salaries/allowance');
    assert.ok(bank.expenseSum > 0, 'Bank wallet should have paid tuition/housing');
    assert.ok(ewallet.expenseSum > 0, 'E-Wallet should have food delivery & shopping expenditures');
  });

  // --- WORKLOAD 3: MONTHLY KPI AUDIT & FINANCIAL HEALTH ---
  await test('T4-W03: Monthly KPI Cards and Savings Rate audit across 3 months', async () => {
    // 1. August 2026: Semester start with tuition payment
    const augOverview = await client.getAnalyticsOverview('2026-08');
    assert.equal(augOverview.monthlyIncome, 7000000); // 4M salary + 3M allowance
    assert.equal(augOverview.monthlyExpense, 9000000); // 6.5M tuition + 450k books + 1.8M food + 250k transport
    assert.equal(augOverview.isDeficit, true); // Tuition caused planned deficit
    assert.equal(augOverview.savingsRate, 0);

    // 2. September 2026: Normal study month with positive savings
    const sepOverview = await client.getAnalyticsOverview('2026-09');
    assert.equal(sepOverview.monthlyIncome, 7000000); // 5M freelance + 2M scholarship
    assert.equal(sepOverview.monthlyExpense, 5850000); // 2.5M rent + 2.6M food + 400k accessories + 350k social
    assert.equal(sepOverview.isDeficit, false);
    // Savings = (7,000,000 - 5,850,000) / 7,000,000 = 16.43%
    assert.equal(sepOverview.savingsRate, 16.43);

    // 3. October 2026: Final exam month (Đề 38)
    const octOverview = await client.getAnalyticsOverview('2026-10');
    assert.equal(octOverview.monthlyIncome, 7500000); // 6M internship + 1.5M bonus
    assert.equal(octOverview.monthlyExpense, 5800000); // 2.5M rent + 2.8M food + 220k print + 280k cloud
    assert.equal(octOverview.isDeficit, false);
    // Savings = (7,500,000 - 5,800,000) / 7,500,000 = 22.67%
    assert.equal(octOverview.savingsRate, 22.67);
  });

  // --- WORKLOAD 4: CASH FLOW TREND ACROSS SEMESTER ---
  await test('T4-W04: Verify semester cash flow trend points matching exact monthly totals', async () => {
    const trend = await client.getTrend(6);
    assert.ok(trend.length >= 3);

    const mAug = trend.find(t => t.month === '2026-08');
    const mSep = trend.find(t => t.month === '2026-09');
    const mOct = trend.find(t => t.month === '2026-10');

    assert.ok(mAug && mSep && mOct, 'Trend must contain all 3 student months');
    assert.equal(mAug.income, 7000000);
    assert.equal(mAug.expense, 9000000);
    assert.equal(mSep.income, 7000000);
    assert.equal(mSep.expense, 5850000);
    assert.equal(mOct.income, 7500000);
    assert.equal(mOct.expense, 5800000);
  });

  // --- WORKLOAD 5: DEFENSE-READY BUDGET & ALERT VERIFICATION ---
  await test('T4-W05: October 2026 Budget Progress & Threshold Alerts verification for exam presentation', async () => {
    const budgets = await client.getBudgets('2026-10');
    assert.ok(budgets.length >= 3, 'Must have at least 3 active budgets for October');

    // 1. Food: limit 3,000,000đ, spent 2,800,000đ -> 93.33% -> warning
    const foodBgt = budgets.find(b => b.categoryId === 'cat_food');
    assert.ok(foodBgt);
    assert.equal(foodBgt.spentAmount, 2800000);
    assert.equal(foodBgt.percentage, 93.33);
    assert.equal(foodBgt.status, 'warning');

    // 2. Housing: limit 2,500,000đ, spent 2,500,000đ -> 100% -> exceeded
    const houseBgt = budgets.find(b => b.categoryId === 'cat_housing');
    assert.ok(houseBgt);
    assert.equal(houseBgt.spentAmount, 2500000);
    assert.equal(houseBgt.percentage, 100);
    assert.equal(houseBgt.status, 'exceeded');

    // 3. Shopping: limit 500,000đ, spent 280,000đ -> 56% -> safe
    const shopBgt = budgets.find(b => b.categoryId === 'cat_shopping');
    assert.ok(shopBgt);
    assert.equal(shopBgt.spentAmount, 280000);
    assert.equal(shopBgt.percentage, 56);
    assert.equal(shopBgt.status, 'safe');
  });

  // --- WORKLOAD 6: TOP 5 SEMESTER EXPENDITURES AUDIT ---
  await test('T4-W06: Semester Top 5 highest expenditure transactions ranking', async () => {
    const top = await client.getTopExpenses(null, 5);
    assert.equal(top.length, 5);

    // Rank 1: Semester 1 Tuition (6,500,000 VND)
    assert.equal(top[0].amount, 6500000);
    assert.ok(top[0].note.toLowerCase().includes('học phí'));

    // Ranks 2 & 3: Monthly room rent (2,500,000 VND each) or Food (2,800,000 / 2,600,000 VND)
    assert.ok(top[1].amount >= 2500000);
    assert.ok(top[2].amount >= 2500000);
    assert.ok(top[3].amount >= 2500000);
    assert.ok(top[4].amount >= 1800000);
  });

  // --- WORKLOAD 7: STUDENT EXAM BRANDING & EXPORT VERIFICATION ---
  await test('T4-W07: Complete Student Exam Branding & Export verification for Trần Mạnh Dũng (DTC245160020)', async () => {
    const health = await client.getHealth();
    assert.equal(health.student.studentName, 'Trần Mạnh Dũng');
    assert.equal(health.student.studentId, 'DTC245160020');
    assert.equal(health.student.className, 'K23.K1.KHMT K23A');
    assert.equal(health.student.topic, 'Đề 38 - Hệ thống Quản lý Chi tiêu Cá nhân & Phân tích Tài chính');

    const csvData = await client.exportCsv();
    assert.ok(csvData.startsWith('\uFEFF'), 'Export CSV must include UTF-8 BOM for Microsoft Excel');
    assert.ok(csvData.includes('Đóng học phí Học kỳ 1 (Đề 38)'));
    assert.ok(csvData.includes('In ấn báo cáo & đóng bìa Đề 38'));
  });

  return results;
}

module.exports = { runTier4Tests };
