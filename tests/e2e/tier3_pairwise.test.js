/**
 * Tier 3: Cross-Feature Pairwise & Stateful Invariants Test Suite
 * Tests interactions between transactions, wallets, budgets, categories, and analytics.
 * Student: Trần Mạnh Dũng | MSSV: DTC245160020 | Đề 38
 */

const assert = require('node:assert/strict');
const { ApiTestClient } = require('../helpers/client');

async function runTier3Tests(client = new ApiTestClient()) {
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

  // Setup: Reset state
  await client.reset();

  // --- PAIRWISE 1: TRANSACTIONS & WALLET BALANCES ---
  await test('T3-P01: Transaction lifecycle updates wallet balances accurately', async () => {
    const initialWallets = await client.getWallets();
    const bankInitial = initialWallets.find(w => w.id === 'bank').currentBalance;
    const cashInitial = initialWallets.find(w => w.id === 'cash').currentBalance;

    // 1. Add income to bank
    const tIncome = await client.createTransaction({
      date: '2026-10-01',
      amount: 5000000,
      type: 'income',
      walletId: 'bank',
      categoryId: 'cat_salary',
      note: 'Nhận lương ngân hàng'
    });

    let wallets = await client.getWallets();
    let bank = wallets.find(w => w.id === 'bank');
    assert.equal(bank.currentBalance, bankInitial + 5000000, 'Bank balance should increase by 5,000,000');

    // 2. Add expense from bank
    const tExpense = await client.createTransaction({
      date: '2026-10-02',
      amount: 1500000,
      type: 'expense',
      walletId: 'bank',
      categoryId: 'cat_tuition',
      note: 'Đóng tiền học phần'
    });

    wallets = await client.getWallets();
    bank = wallets.find(w => w.id === 'bank');
    assert.equal(bank.currentBalance, bankInitial + 5000000 - 1500000);

    // 3. Move transaction to different wallet (switch from bank to cash)
    await client.updateTransaction(tExpense.id, {
      walletId: 'cash'
    });

    wallets = await client.getWallets();
    bank = wallets.find(w => w.id === 'bank');
    let cash = wallets.find(w => w.id === 'cash');
    assert.equal(bank.currentBalance, bankInitial + 5000000, 'Bank balance should be restored');
    assert.equal(cash.currentBalance, cashInitial - 1500000, 'Cash balance should be deducted');

    // 4. Update amount of expense from 1,500,000 to 2,000,000
    await client.updateTransaction(tExpense.id, {
      amount: 2000000
    });

    wallets = await client.getWallets();
    cash = wallets.find(w => w.id === 'cash');
    assert.equal(cash.currentBalance, cashInitial - 2000000, 'Cash balance adjusted to 2,000,000 deduction');

    // 5. Delete expense transaction
    await client.deleteTransaction(tExpense.id);
    wallets = await client.getWallets();
    cash = wallets.find(w => w.id === 'cash');
    assert.equal(cash.currentBalance, cashInitial, 'Cash balance restored after deletion');

    // Clean up income
    await client.deleteTransaction(tIncome.id);
  });

  // --- PAIRWISE 2: TRANSACTIONS & BUDGET THRESHOLD TRANSITIONS ---
  await test('T3-P02: Transaction amounts trigger budget 80% warning and 100% exceeded state transitions', async () => {
    const budgetMonth = '2026-10';
    const bgt = await client.setBudget({
      categoryId: 'cat_food',
      month: budgetMonth,
      limitAmount: 2000000 // 2,000,000 VND limit
    });

    // Step A: 50% spending (1,000,000 VND) -> Safe
    const txn1 = await client.createTransaction({
      date: '2026-10-05',
      amount: 1000000,
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_food'
    });

    let budgets = await client.getBudgets(budgetMonth);
    let currentBgt = budgets.find(b => b.id === bgt.id);
    assert.equal(currentBgt.spentAmount, 1000000);
    assert.equal(currentBgt.percentage, 50);
    assert.equal(currentBgt.status, 'safe');

    // Step B: Add 650,000 VND (Total 1,650,000 / 2,000,000 = 82.5%) -> Warning
    const txn2 = await client.createTransaction({
      date: '2026-10-10',
      amount: 650000,
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_food'
    });

    budgets = await client.getBudgets(budgetMonth);
    currentBgt = budgets.find(b => b.id === bgt.id);
    assert.equal(currentBgt.spentAmount, 1650000);
    assert.equal(currentBgt.percentage, 82.5);
    assert.equal(currentBgt.status, 'warning');

    // Step C: Add 400,000 VND (Total 2,050,000 / 2,000,000 = 102.5%) -> Exceeded
    const txn3 = await client.createTransaction({
      date: '2026-10-15',
      amount: 400000,
      type: 'expense',
      walletId: 'ewallet',
      categoryId: 'cat_food'
    });

    budgets = await client.getBudgets(budgetMonth);
    currentBgt = budgets.find(b => b.id === bgt.id);
    assert.equal(currentBgt.spentAmount, 2050000);
    assert.equal(currentBgt.percentage, 102.5);
    assert.equal(currentBgt.status, 'exceeded');

    // Step D: Edit txn3 amount down to 200,000 VND (Total 1,850,000 / 2,000,000 = 92.5%) -> Reverts to Warning
    await client.updateTransaction(txn3.id, {
      amount: 200000
    });

    budgets = await client.getBudgets(budgetMonth);
    currentBgt = budgets.find(b => b.id === bgt.id);
    assert.equal(currentBgt.spentAmount, 1850000);
    assert.equal(currentBgt.percentage, 92.5);
    assert.equal(currentBgt.status, 'warning');

    // Step E: Delete txn2 (650,000 VND) -> Total becomes 1,200,000 / 2,000,000 = 60.0% -> Reverts to Safe
    await client.deleteTransaction(txn2.id);

    budgets = await client.getBudgets(budgetMonth);
    currentBgt = budgets.find(b => b.id === bgt.id);
    assert.equal(currentBgt.spentAmount, 1200000);
    assert.equal(currentBgt.percentage, 60.0);
    assert.equal(currentBgt.status, 'safe');

    // Clean up
    await client.deleteTransaction(txn1.id);
    await client.deleteTransaction(txn3.id);
    await client.deleteBudget(bgt.id);
  });

  // --- PAIRWISE 3: CATEGORY DELETION INTEGRITY ---
  await test('T3-P03: Category deletion prevents orphan transactions and preserves foreign key integrity', async () => {
    // 1. Create a custom category
    const cat = await client.createCategory({
      name: 'Chi tiêu dự án phụ',
      type: 'expense',
      icon: 'Briefcase',
      color: '#8B5CF6'
    });

    // 2. Add transaction using this category
    const txn = await client.createTransaction({
      date: '2026-10-18',
      amount: 300000,
      type: 'expense',
      walletId: 'cash',
      categoryId: cat.id,
      note: 'Mua linh kiện'
    });

    // 3. Deleting category should be rejected due to foreign key constraint
    await assert.rejects(async () => client.deleteCategory(cat.id), /không thể xóa|đang có giao dịch/i);

    // 4. Delete transaction first
    await client.deleteTransaction(txn.id);

    // 5. Now category deletion succeeds
    const delRes = await client.deleteCategory(cat.id);
    assert.ok(delRes.success);

    // Verify category no longer in list
    const cats = await client.getCategories();
    assert.ok(!cats.some(c => c.id === cat.id));
  });

  // --- PAIRWISE 4: MULTI-FILTER INTERSECTION & AGGREGATE RECONCILIATION ---
  await test('T3-P04: Multi-filter query intersection matches sum of filtered transactions', async () => {
    // Populate known sample transactions
    const t1 = await client.createTransaction({
      date: '2026-10-10',
      amount: 300000,
      type: 'expense',
      walletId: 'bank',
      categoryId: 'cat_shopping',
      note: 'Tai nghe bluetooth'
    });
    const t2 = await client.createTransaction({
      date: '2026-10-12',
      amount: 450000,
      type: 'expense',
      walletId: 'bank',
      categoryId: 'cat_shopping',
      note: 'Chuột không dây'
    });
    const t3 = await client.createTransaction({
      date: '2026-10-15',
      amount: 200000,
      type: 'expense',
      walletId: 'cash', // different wallet
      categoryId: 'cat_shopping',
      note: 'Lót chuột'
    });

    // Query with multi-filter: walletId=bank AND categoryId=cat_shopping AND month=2026-10
    const filtered = await client.getTransactions({
      walletId: 'bank',
      categoryId: 'cat_shopping',
      month: '2026-10'
    });

    assert.equal(filtered.length, 2);
    const sum = filtered.reduce((acc, t) => acc + t.amount, 0);
    assert.equal(sum, 750000);

    // Clean up
    await client.deleteTransaction(t1.id);
    await client.deleteTransaction(t2.id);
    await client.deleteTransaction(t3.id);
  });

  // --- PAIRWISE 5: EXPORT CONSISTENCY WITH FILTERED TRANSACTIONS ---
  await test('T3-P05: Exported CSV data matches filtered transaction record count and values', async () => {
    const t1 = await client.createTransaction({
      date: '2026-10-20',
      amount: 120000,
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_food',
      note: 'Cơm tấm Sài Gòn'
    });

    const txns = await client.getTransactions({ month: '2026-10' });
    const csvData = await client.exportCsv({ month: '2026-10' });

    // Lines in CSV = 1 header line + N transaction rows
    const lines = csvData.trim().split('\r\n');
    assert.equal(lines.length - 1, txns.length, 'CSV data rows must match number of month transactions');
    assert.ok(csvData.includes('Cơm tấm Sài Gòn'));

    await client.deleteTransaction(t1.id);
  });

  return results;
}

module.exports = { runTier3Tests };
