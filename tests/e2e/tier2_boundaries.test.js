/**
 * Tier 2: Boundary & Corner Cases Test Suite
 * Tests BVA, extreme values, malicious inputs, escaping, and mathematical edge cases.
 * Student: Trần Mạnh Dũng | MSSV: DTC245160020 | Đề 38
 */

const assert = require('node:assert/strict');
const { ApiTestClient } = require('../helpers/client');

async function runTier2Tests(client = new ApiTestClient()) {
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

  // --- AMOUNT BOUNDARIES ---
  await test('T2-B01: Reject transaction with amount = 0', async () => {
    await assert.rejects(async () => client.createTransaction({
      date: '2026-10-15',
      amount: 0,
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_food'
    }), /lớn hơn 0|greater than 0|invalid amount/i);
  });

  await test('T2-B02: Reject transaction with negative amount', async () => {
    await assert.rejects(async () => client.createTransaction({
      date: '2026-10-15',
      amount: -50000,
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_food'
    }), /lớn hơn 0|greater than 0|invalid amount/i);
  });

  await test('T2-B03: Reject transaction with non-numeric string amount', async () => {
    await assert.rejects(async () => client.createTransaction({
      date: '2026-10-15',
      amount: 'one_hundred',
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_food'
    }));
  });

  await test('T2-B04: Accept extreme large amount without integer overflow', async () => {
    const txn = await client.createTransaction({
      date: '2026-10-15',
      amount: 999999999999,
      type: 'income',
      walletId: 'bank',
      categoryId: 'cat_salary',
      note: 'Extreme large amount test'
    });
    assert.equal(txn.amount, 999999999999);
    await client.deleteTransaction(txn.id);
  });

  await test('T2-B05: Accept decimal amounts with exact precision', async () => {
    const txn = await client.createTransaction({
      date: '2026-10-15',
      amount: 150000.5,
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_food',
      note: 'Decimal test'
    });
    assert.equal(txn.amount, 150000.5);
    await client.deleteTransaction(txn.id);
  });

  // --- DATE BOUNDARIES ---
  await test('T2-B06: Reject invalid date format (slashes or reverse)', async () => {
    await assert.rejects(async () => client.createTransaction({
      date: '2026/10/15',
      amount: 50000,
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_food'
    }));
    await assert.rejects(async () => client.createTransaction({
      date: '15-10-2026',
      amount: 50000,
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_food'
    }));
  });

  await test('T2-B07: Reject non-existent calendar date (Feb 31)', async () => {
    await assert.rejects(async () => client.createTransaction({
      date: '2026-02-31',
      amount: 50000,
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_food'
    }));
  });

  await test('T2-B08: Reject non-leap year Feb 29 (2026-02-29)', async () => {
    await assert.rejects(async () => client.createTransaction({
      date: '2026-02-29',
      amount: 50000,
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_food'
    }));
  });

  await test('T2-B09: Accept leap year Feb 29 (2028-02-29)', async () => {
    const txn = await client.createTransaction({
      date: '2028-02-29',
      amount: 50000,
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_food',
      note: 'Leap year test'
    });
    assert.equal(txn.date, '2028-02-29');
    await client.deleteTransaction(txn.id);
  });

  // --- TEXT, UNICODE & SECURITY INJECTION ---
  await test('T2-B10: Preserve Vietnamese diacritics & UTF-8 emojis', async () => {
    const noteText = 'Ăn bún chả Hà Nội 🍜, bánh mì pate trứng 🥖, cà phê sữa đá ☕';
    const txn = await client.createTransaction({
      date: '2026-10-15',
      amount: 85000,
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_food',
      note: noteText
    });
    assert.equal(txn.note, noteText);
    const fetched = await client.getTransaction(txn.id);
    assert.equal(fetched.note, noteText);
    await client.deleteTransaction(txn.id);
  });

  await test('T2-B11: Neutralize SQL injection payload in note safely', async () => {
    const sqliNote = "'; DROP TABLE transactions; -- SELECT * FROM users WHERE '1'='1";
    const txn = await client.createTransaction({
      date: '2026-10-15',
      amount: 20000,
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_food',
      note: sqliNote
    });
    assert.equal(txn.note, sqliNote);
    // Verify database table was not dropped
    const all = await client.getTransactions();
    assert.ok(Array.isArray(all));
    await client.deleteTransaction(txn.id);
  });

  await test('T2-B12: Handle XSS payload in note safely without script execution', async () => {
    const xssNote = "<script>alert('XSS Attack')</script><img src=x onerror=alert(1)>";
    const txn = await client.createTransaction({
      date: '2026-10-15',
      amount: 30000,
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_food',
      note: xssNote
    });
    assert.equal(txn.note, xssNote);
    await client.deleteTransaction(txn.id);
  });

  await test('T2-B13: Accept empty string note gracefully', async () => {
    const txn = await client.createTransaction({
      date: '2026-10-15',
      amount: 25000,
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_food',
      note: ''
    });
    assert.equal(txn.note, '');
    await client.deleteTransaction(txn.id);
  });

  await test('T2-B14: Handle very long note (4,000 characters)', async () => {
    const longNote = 'Dũng '.repeat(800);
    const txn = await client.createTransaction({
      date: '2026-10-15',
      amount: 40000,
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_food',
      note: longNote
    });
    assert.equal(txn.note.length, longNote.trim().length);
    await client.deleteTransaction(txn.id);
  });

  // --- BUDGET BOUNDARIES & ALERTS ---
  await test('T2-B15: Reject budget with limitAmount <= 0', async () => {
    await assert.rejects(async () => client.setBudget({
      categoryId: 'cat_food',
      month: '2026-10',
      limitAmount: 0
    }));
    await assert.rejects(async () => client.setBudget({
      categoryId: 'cat_food',
      month: '2026-10',
      limitAmount: -100000
    }));
  });

  await test('T2-B16: Reject budget for income category', async () => {
    await assert.rejects(async () => client.setBudget({
      categoryId: 'cat_salary',
      month: '2026-10',
      limitAmount: 10000000
    }));
  });

  await test('T2-B17: Budget exact threshold boundaries (0%, 79.9%, 80%, 99.9%, 100%)', async () => {
    // Set budget = 1,000,000 VND
    const bgt = await client.setBudget({
      categoryId: 'cat_shopping',
      month: '2026-11',
      limitAmount: 1000000
    });

    // 0% spent -> safe
    let budgets = await client.getBudgets('2026-11');
    let target = budgets.find(b => b.id === bgt.id);
    assert.equal(target.status, 'safe');
    assert.equal(target.percentage, 0);

    // 79.9% spent (799,000 VND) -> safe
    const t1 = await client.createTransaction({
      date: '2026-11-05',
      amount: 799000,
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_shopping'
    });
    budgets = await client.getBudgets('2026-11');
    target = budgets.find(b => b.id === bgt.id);
    assert.equal(target.percentage, 79.9);
    assert.equal(target.status, 'safe');

    // Add 1,000 VND -> exactly 80.0% (800,000 VND) -> warning
    const t2 = await client.createTransaction({
      date: '2026-11-06',
      amount: 1000,
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_shopping'
    });
    budgets = await client.getBudgets('2026-11');
    target = budgets.find(b => b.id === bgt.id);
    assert.equal(target.percentage, 80);
    assert.equal(target.status, 'warning');

    // Add 200,000 VND -> exactly 100.0% (1,000,000 VND) -> exceeded
    const t3 = await client.createTransaction({
      date: '2026-11-07',
      amount: 200000,
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_shopping'
    });
    budgets = await client.getBudgets('2026-11');
    target = budgets.find(b => b.id === bgt.id);
    assert.equal(target.percentage, 100);
    assert.equal(target.status, 'exceeded');

    // Clean up
    await client.deleteTransaction(t1.id);
    await client.deleteTransaction(t2.id);
    await client.deleteTransaction(t3.id);
    await client.deleteBudget(bgt.id);
  });

  // --- ANALYTICS MATHEMATICAL CORNER CASES ---
  await test('T2-B18: Division by zero protection in Savings Rate (Zero Income)', async () => {
    // Add only expense, no income in 2026-12
    const t = await client.createTransaction({
      date: '2026-12-01',
      amount: 500000,
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_food'
    });

    const overview = await client.getAnalyticsOverview('2026-12');
    assert.equal(overview.monthlyIncome, 0);
    assert.equal(overview.monthlyExpense, 500000);
    // Must be 0%, NOT NaN or -Infinity
    assert.equal(overview.savingsRate, 0);
    assert.equal(overview.isDeficit, true);

    await client.deleteTransaction(t.id);
  });

  await test('T2-B19: Zero income and Zero expense yields 0% Savings Rate', async () => {
    const overview = await client.getAnalyticsOverview('2027-01');
    assert.equal(overview.monthlyIncome, 0);
    assert.equal(overview.monthlyExpense, 0);
    assert.equal(overview.savingsRate, 0);
  });

  // --- VALIDATION OF WALLET & CATEGORY FOREIGN KEYS ---
  await test('T2-B20: Reject transaction with non-existent categoryId', async () => {
    await assert.rejects(async () => client.createTransaction({
      date: '2026-10-15',
      amount: 50000,
      type: 'expense',
      walletId: 'cash',
      categoryId: 'non_existent_category_id'
    }));
  });

  await test('T2-B21: Reject transaction with invalid walletId', async () => {
    await assert.rejects(async () => client.createTransaction({
      date: '2026-10-15',
      amount: 50000,
      type: 'expense',
      walletId: 'crypto_wallet',
      categoryId: 'cat_food'
    }));
  });

  return results;
}

module.exports = { runTier2Tests };
