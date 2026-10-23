/**
 * tests/financial_invariants.test.js
 * Adversarial Verification of Financial Invariants & Mathematical Correctness
 * 
 * Học phần: Triển khai và quản trị hệ thống phần mềm (Đề 38)
 * Sinh viên: Trần Mạnh Dũng - MSSV: DTC245160020 - Lớp: K23.K1.KHMT K23A
 * Agent: Financial Logic & Invariant Challenger (challenger_m1_2)
 * 
 * Verifies:
 * 1. Balance Conservation Law:
 *    - Initial wallet invariant
 *    - 100-step randomized CRUD sequence with cross-wallet and cross-type mutations
 *    - Overdraft/deficit handling
 *    - Initial balance update propagation
 * 2. Budget Alert Threshold Transitions:
 *    - Exact points: 0.0%, 79.9% (safe), 80.0% (warning), 99.9% (warning), 100.0% (exceeded), 150.0% (exceeded)
 *    - Bidirectional hysteresis rollback (backward transitions from 150% down to safe)
 *    - Custom warning threshold (50% threshold: 49.9% safe, 50.0% warning)
 *    - Filtered alerts endpoint (/api/budgets/alerts) matching
 * 3. Savings Rate Formula & Zero-Income Division Safety:
 *    - Income=0, Expense=0 -> 0%
 *    - Income=0, Expense>0 -> 0% & isDeficit=true (zero-division safe)
 *    - Income>0, Expense=0 -> 100%
 *    - Standard (Income - Expense) / Income * 100%
 *    - Break-even (Income == Expense) -> 0% & isDeficit=false
 *    - Deficit (Expense > Income) -> 0% in KPI card & isDeficit=true
 *    - Fractional precision (66.67%)
 *    - MoM January rollover to December
 */

const assert = require('assert');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
let inProcessServer = null;

// ANSI Colors
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

let passedTests = 0;
let failedTests = 0;
const failureList = [];

async function runTest(name, fn) {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    console.log(`  ${colors.green}✓ PASS${colors.reset} ${name} ${colors.gray}(${duration}ms)${colors.reset}`);
    passedTests++;
  } catch (err) {
    const duration = Date.now() - start;
    console.log(`  ${colors.red}✗ FAIL${colors.reset} ${name} ${colors.gray}(${duration}ms)${colors.reset}`);
    console.log(`    ${colors.red}Error: ${err.message}${colors.reset}`);
    failedTests++;
    failureList.push({ name, error: err.message, stack: err.stack });
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

async function ensureServer() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(1000) }).catch(() => null);
    if (res && res.status === 200) {
      console.log(`${colors.cyan}[Runner] Using active server at ${BASE_URL}${colors.reset}`);
      return;
    }
  } catch {
    // not running
  }

  console.log(`${colors.yellow}[Runner] Starting in-process Express server for adversarial tests...${colors.reset}`);
  const app = require('../server/src/app');
  const { getDatabase } = require('../server/src/config/database');
  const { initSchema } = require('../server/src/models/schema');
  const { seedDatabase } = require('../server/src/scripts/seed');

  const db = getDatabase();
  initSchema(db);
  seedDatabase(db, true);

  const port = parseInt(new URL(BASE_URL).port || '5000', 10);
  await new Promise((resolve) => {
    inProcessServer = app.listen(port, () => {
      console.log(`${colors.green}[Runner] Server ready at ${BASE_URL}${colors.reset}`);
      resolve();
    });
  });
}

function extractTransactions(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.transactions)) return data.transactions;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

// =========================================================================
// PSEUDO-RANDOM GENERATOR WITH SEED FOR DETERMINISTIC REPRODUCIBILITY
// =========================================================================
class PRNG {
  constructor(seed = 987654321) {
    this.s = seed;
  }
  next() {
    this.s = (this.s * 1664525 + 1013904223) % 4294967296;
    return this.s / 4294967296;
  }
  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  choice(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

async function main() {
  await ensureServer();

  console.log(`\n${colors.bold}${colors.magenta}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}   ADVERSARIAL FINANCIAL INVARIANTS & LOGIC VERIFICATION SUITE       ${colors.reset}`);
  console.log(`${colors.bold}   Đề 38: Môn Triển khai và quản trị hệ thống phần mềm                ${colors.reset}`);
  console.log(`${colors.bold}   Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020                    ${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}======================================================================${colors.reset}\n`);

  // Dynamically query valid categories and wallets
  const { data: catRes } = await request('/api/categories');
  assert.ok(catRes && Array.isArray(catRes.data), 'Categories should be returned');
  const validIncomeCats = catRes.data.filter(c => c.type === 'income').map(c => c.id);
  const validExpenseCats = catRes.data.filter(c => c.type === 'expense').map(c => c.id);

  // =========================================================================
  // SUITE 1: BALANCE CONSERVATION LAW
  // =========================================================================
  console.log(`${colors.bold}${colors.cyan}[INVARIANT 1] Balance Conservation Law across Random CRUD Sequences${colors.reset}`);

  await runTest('1.1 Baseline Invariant: Every initial wallet satisfies Conservation Law', async () => {
    const { status: wStatus, data: wData } = await request('/api/wallets');
    assert.strictEqual(wStatus, 200);
    const wallets = wData.data;

    const { status: tStatus, data: tData } = await request('/api/transactions?all=true');
    assert.strictEqual(tStatus, 200);
    const transactions = extractTransactions(tData.data);

    for (const w of wallets) {
      const walletTxns = transactions.filter(t => t.walletId === w.id);
      const sumIncome = walletTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const sumExpense = walletTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const expectedBalance = w.initialBalance + sumIncome - sumExpense;

      assert.strictEqual(w.currentBalance, expectedBalance, 
        `Wallet ${w.id} balance mismatch: expected ${expectedBalance}, got ${w.currentBalance}`);
    }
  });

  await runTest('1.2 Stress Invariant: 100 Random CRUD Actions preserve Balance Conservation Law on all wallets', async () => {
    const rng = new PRNG(987654321);
    const createdTxIds = [];
    const walletIds = ['cash', 'bank', 'ewallet'];

    // Helper to verify conservation across all wallets
    async function assertAllWalletsConserved(stepDesc) {
      const { data: wRes } = await request('/api/wallets');
      const wallets = wRes.data;
      const { data: tRes } = await request('/api/transactions?all=true');
      const txns = extractTransactions(tRes.data);

      let totalExpectedAssets = 0;
      let totalActualAssets = 0;

      for (const w of wallets) {
        const wTxns = txns.filter(t => t.walletId === w.id);
        const sumInc = wTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const sumExp = wTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const expectedBal = w.initialBalance + sumInc - sumExp;

        assert.strictEqual(w.currentBalance, expectedBal,
          `Conservation violated at ${stepDesc} for wallet ${w.id}: expected ${expectedBal}, got ${w.currentBalance}`);
        
        totalExpectedAssets += expectedBal;
        totalActualAssets += w.currentBalance;
      }

      assert.strictEqual(totalActualAssets, totalExpectedAssets,
        `Global asset invariant violated at ${stepDesc}: expected ${totalExpectedAssets}, got ${totalActualAssets}`);
    }

    // Execute 100 randomized CRUD mutations
    for (let step = 1; step <= 100; step++) {
      const opRoll = rng.next();

      if (opRoll < 0.40 || createdTxIds.length < 5) {
        // ACTION A: CREATE TRANSACTION (40%)
        const type = rng.next() > 0.5 ? 'income' : 'expense';
        const walletId = rng.choice(walletIds);
        const categoryId = type === 'income' ? rng.choice(validIncomeCats) : rng.choice(validExpenseCats);
        const amount = rng.nextInt(10, 5000) * 1000; // 10,000 to 5,000,000 VND
        const day = String(rng.nextInt(1, 28)).padStart(2, '0');
        const date = `2026-11-${day}`;

        const { status, data } = await request('/api/transactions', {
          method: 'POST',
          body: JSON.stringify({
            walletId,
            categoryId,
            type,
            amount,
            date,
            note: `Random Stress Tx #${step}`
          })
        });

        assert.strictEqual(status, 201, `Failed to create tx in step ${step}: ${JSON.stringify(data)}`);
        createdTxIds.push(data.data.id);
      } else if (opRoll < 0.60) {
        // ACTION B: UPDATE AMOUNT / NOTE (20%)
        const targetId = rng.choice(createdTxIds);
        const newAmount = rng.nextInt(5, 4000) * 1000;

        const { status } = await request(`/api/transactions/${targetId}`, {
          method: 'PUT',
          body: JSON.stringify({
            amount: newAmount,
            note: `Updated Stress Tx #${step}`
          })
        });
        assert.strictEqual(status, 200, `Failed to update amount in step ${step}`);
      } else if (opRoll < 0.75) {
        // ACTION C: TRANSFER BETWEEN WALLETS (15%)
        const targetId = rng.choice(createdTxIds);
        const newWalletId = rng.choice(walletIds);

        const { status } = await request(`/api/transactions/${targetId}`, {
          method: 'PUT',
          body: JSON.stringify({
            walletId: newWalletId,
            note: `Wallet Shifted Tx #${step}`
          })
        });
        assert.strictEqual(status, 200, `Failed to update walletId in step ${step}`);
      } else if (opRoll < 0.85) {
        // ACTION D: FLIP TYPE AND CATEGORY (10%)
        const targetId = rng.choice(createdTxIds);
        const { data: curTx } = await request(`/api/transactions/${targetId}`);
        if (curTx && curTx.data) {
          const newType = curTx.data.type === 'income' ? 'expense' : 'income';
          const newCat = newType === 'income' ? rng.choice(validIncomeCats) : rng.choice(validExpenseCats);
          const { status } = await request(`/api/transactions/${targetId}`, {
            method: 'PUT',
            body: JSON.stringify({
              type: newType,
              categoryId: newCat,
              note: `Type Flipped Tx #${step}`
            })
          });
          assert.strictEqual(status, 200, `Failed to flip type in step ${step}`);
        }
      } else {
        // ACTION E: DELETE TRANSACTION (15%)
        const idx = rng.nextInt(0, createdTxIds.length - 1);
        const targetId = createdTxIds.splice(idx, 1)[0];

        const { status } = await request(`/api/transactions/${targetId}`, {
          method: 'DELETE'
        });
        assert.strictEqual(status, 200, `Failed to delete tx in step ${step}`);
      }

      // Check invariant periodically and at end
      if (step % 10 === 0 || step === 100) {
        await assertAllWalletsConserved(`Step #${step}`);
      }
    }

    // Clean up all remaining created test transactions
    for (const txId of createdTxIds) {
      await request(`/api/transactions/${txId}`, { method: 'DELETE' });
    }
    await assertAllWalletsConserved('Post-cleanup');
  });

  await runTest('1.3 Overdraft / Negative Balance Invariant: Balance conservation holds when expense > initial balance', async () => {
    // Expense exceeding cash wallet balance
    const { data: wBefore } = await request('/api/wallets');
    const cashBefore = wBefore.data.find(w => w.id === 'cash');
    const overdraftAmount = cashBefore.currentBalance + 10000000; // overdraft by 10M

    const { status, data: txRes } = await request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        walletId: 'cash',
        categoryId: 'cat_shopping',
        type: 'expense',
        amount: overdraftAmount,
        date: '2026-11-20',
        note: 'Overdraft test transaction'
      })
    });
    assert.strictEqual(status, 201);
    const txId = txRes.data.id;

    const { data: wAfter } = await request('/api/wallets');
    const cashAfter = wAfter.data.find(w => w.id === 'cash');
    assert.strictEqual(cashAfter.currentBalance, cashBefore.currentBalance - overdraftAmount);
    assert.ok(cashAfter.currentBalance < 0, 'Current balance should accurately reflect deficit');

    // Clean up
    await request(`/api/transactions/${txId}`, { method: 'DELETE' });
    const { data: wRestored } = await request('/api/wallets');
    const cashRestored = wRestored.data.find(w => w.id === 'cash');
    assert.strictEqual(cashRestored.currentBalance, cashBefore.currentBalance);
  });

  await runTest('1.4 Initial Balance Propagation: Updating initial balance recalculates current balance accurately', async () => {
    const { data: wBefore } = await request('/api/wallets');
    const bankWallet = wBefore.data.find(w => w.id === 'bank');
    const oldInitial = bankWallet.initialBalance;
    const oldCurrent = bankWallet.currentBalance;
    const delta = 5000000; // Increase initial by 5M

    // Directly test walletModel update via model
    const walletModel = require('../server/src/models/walletModel');
    walletModel.update('bank', { initialBalance: oldInitial + delta });

    const { data: wAfter } = await request('/api/wallets');
    const bankAfter = wAfter.data.find(w => w.id === 'bank');
    assert.strictEqual(bankAfter.initialBalance, oldInitial + delta);
    assert.strictEqual(bankAfter.currentBalance, oldCurrent + delta);

    // Restore original initial balance
    walletModel.update('bank', { initialBalance: oldInitial });
    const { data: wRestored } = await request('/api/wallets');
    const bankRestored = wRestored.data.find(w => w.id === 'bank');
    assert.strictEqual(bankRestored.initialBalance, oldInitial);
    assert.strictEqual(bankRestored.currentBalance, oldCurrent);
  });

  // =========================================================================
  // SUITE 2: BUDGET ALERT THRESHOLD TRANSITIONS
  // =========================================================================
  console.log(`\n${colors.bold}${colors.cyan}[INVARIANT 2] Budget Alert Threshold Transitions (79.9%, 80.0%, 99.9%, 100.0%, 150.0%)${colors.reset}`);

  await runTest('2.1 Stepwise threshold transitions on 1,000,000 VND budget with warningThreshold=0.80', async () => {
    const testMonth = '2027-05';
    const limitAmount = 1000000; // 1,000,000 VND
    const catId = 'cat_food';

    // 1. Create Budget
    const { status: bgtStatus, data: bgtRes } = await request('/api/budgets', {
      method: 'POST',
      body: JSON.stringify({
        categoryId: catId,
        month: testMonth,
        limitAmount: limitAmount,
        warningThreshold: 0.80
      })
    });
    assert.strictEqual(bgtStatus, 200);
    const budgetId = bgtRes.data.id;

    // Helper to get target budget
    async function getTargetBudget() {
      const { data } = await request(`/api/budgets?month=${testMonth}`);
      return data.data.find(b => b.categoryId === catId);
    }

    // 2. Initial state (0% spent)
    let b = await getTargetBudget();
    assert.strictEqual(b.spentAmount, 0);
    assert.strictEqual(b.percentage, 0);
    assert.strictEqual(b.status, 'safe');
    assert.strictEqual(b.remainingAmount, 1000000);

    // 3. Point 1: Exact 79.9% (799,000 VND) -> 'safe'
    const { data: tx1 } = await request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        walletId: 'cash',
        categoryId: catId,
        type: 'expense',
        amount: 799000,
        date: `${testMonth}-01`,
        note: 'Point 1: 79.9%'
      })
    });
    b = await getTargetBudget();
    assert.strictEqual(b.spentAmount, 799000);
    assert.strictEqual(b.percentage, 79.9);
    assert.strictEqual(b.status, 'safe', `Expected 'safe' at 79.9%, got ${b.status}`);
    assert.strictEqual(b.remainingAmount, 201000);

    // 4. Point 2: Exact 80.0% (800,000 VND, +1,000 VND) -> 'warning'
    const { data: tx2 } = await request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        walletId: 'cash',
        categoryId: catId,
        type: 'expense',
        amount: 1000,
        date: `${testMonth}-02`,
        note: 'Point 2: 80.0%'
      })
    });
    b = await getTargetBudget();
    assert.strictEqual(b.spentAmount, 800000);
    assert.strictEqual(b.percentage, 80.0);
    assert.strictEqual(b.status, 'warning', `Expected 'warning' at 80.0%, got ${b.status}`);
    assert.strictEqual(b.remainingAmount, 200000);

    // 5. Point 3: Exact 99.9% (999,000 VND, +199,000 VND) -> 'warning'
    const { data: tx3 } = await request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        walletId: 'cash',
        categoryId: catId,
        type: 'expense',
        amount: 199000,
        date: `${testMonth}-03`,
        note: 'Point 3: 99.9%'
      })
    });
    b = await getTargetBudget();
    assert.strictEqual(b.spentAmount, 999000);
    assert.strictEqual(b.percentage, 99.9);
    assert.strictEqual(b.status, 'warning', `Expected 'warning' at 99.9%, got ${b.status}`);
    assert.strictEqual(b.remainingAmount, 1000);

    // 6. Point 4: Exact 100.0% (1,000,000 VND, +1,000 VND) -> 'exceeded'
    const { data: tx4 } = await request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        walletId: 'cash',
        categoryId: catId,
        type: 'expense',
        amount: 1000,
        date: `${testMonth}-04`,
        note: 'Point 4: 100.0%'
      })
    });
    b = await getTargetBudget();
    assert.strictEqual(b.spentAmount, 1000000);
    assert.strictEqual(b.percentage, 100.0);
    assert.strictEqual(b.status, 'exceeded', `Expected 'exceeded' at 100.0%, got ${b.status}`);
    assert.strictEqual(b.remainingAmount, 0);

    // 7. Point 5: Exact 150.0% (1,500,000 VND, +500,000 VND) -> 'exceeded'
    const { data: tx5 } = await request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        walletId: 'cash',
        categoryId: catId,
        type: 'expense',
        amount: 500000,
        date: `${testMonth}-05`,
        note: 'Point 5: 150.0%'
      })
    });
    b = await getTargetBudget();
    assert.strictEqual(b.spentAmount, 1500000);
    assert.strictEqual(b.percentage, 150.0);
    assert.strictEqual(b.status, 'exceeded', `Expected 'exceeded' at 150.0%, got ${b.status}`);
    assert.strictEqual(b.remainingAmount, -500000);

    // 8. Bidirectional Test: Delete transactions and verify status rolls back accurately
    // Delete tx5 (500,000 VND) -> drops back to 100.0% -> 'exceeded'
    await request(`/api/transactions/${tx5.data.id}`, { method: 'DELETE' });
    b = await getTargetBudget();
    assert.strictEqual(b.percentage, 100.0);
    assert.strictEqual(b.status, 'exceeded');

    // Delete tx4 (1,000 VND) -> drops back to 99.9% -> 'warning'
    await request(`/api/transactions/${tx4.data.id}`, { method: 'DELETE' });
    b = await getTargetBudget();
    assert.strictEqual(b.percentage, 99.9);
    assert.strictEqual(b.status, 'warning');

    // Delete tx3 (199,000 VND) -> drops back to 80.0% -> 'warning'
    await request(`/api/transactions/${tx3.data.id}`, { method: 'DELETE' });
    b = await getTargetBudget();
    assert.strictEqual(b.percentage, 80.0);
    assert.strictEqual(b.status, 'warning');

    // Delete tx2 (1,000 VND) -> drops back to 79.9% -> 'safe'
    await request(`/api/transactions/${tx2.data.id}`, { method: 'DELETE' });
    b = await getTargetBudget();
    assert.strictEqual(b.percentage, 79.9);
    assert.strictEqual(b.status, 'safe');

    // Clean up tx1 and budget
    await request(`/api/transactions/${tx1.data.id}`, { method: 'DELETE' });
    await request(`/api/budgets/${budgetId}`, { method: 'DELETE' });
  });

  await runTest('2.2 Custom warning threshold (threshold = 0.50): Safe at 49.9%, Warning at 50.0%', async () => {
    const testMonth = '2027-06';
    const limitAmount = 2000000; // 2,000,000 VND

    const { data: bgtRes } = await request('/api/budgets', {
      method: 'POST',
      body: JSON.stringify({
        categoryId: 'cat_transport',
        month: testMonth,
        limitAmount: limitAmount,
        warningThreshold: 0.50
      })
    });
    const budgetId = bgtRes.data.id;

    // 49.9% of 2M = 998,000 VND -> 'safe'
    const { data: tx1 } = await request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        walletId: 'cash',
        categoryId: 'cat_transport',
        type: 'expense',
        amount: 998000,
        date: `${testMonth}-01`
      })
    });
    const { data: res1 } = await request(`/api/budgets?month=${testMonth}`);
    const b1 = res1.data.find(b => b.id === budgetId);
    assert.strictEqual(b1.percentage, 49.9);
    assert.strictEqual(b1.status, 'safe', `Expected 'safe' at 49.9% with 50% threshold, got ${b1.status}`);

    // Add 2,000 VND -> 1,000,000 VND (50.0%) -> 'warning'
    const { data: tx2 } = await request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        walletId: 'cash',
        categoryId: 'cat_transport',
        type: 'expense',
        amount: 2000,
        date: `${testMonth}-02`
      })
    });
    const { data: res2 } = await request(`/api/budgets?month=${testMonth}`);
    const b2 = res2.data.find(b => b.id === budgetId);
    assert.strictEqual(b2.percentage, 50.0);
    assert.strictEqual(b2.status, 'warning', `Expected 'warning' at 50.0% with 50% threshold, got ${b2.status}`);

    // Clean up
    await request(`/api/transactions/${tx1.data.id}`, { method: 'DELETE' });
    await request(`/api/transactions/${tx2.data.id}`, { method: 'DELETE' });
    await request(`/api/budgets/${budgetId}`, { method: 'DELETE' });
  });

  await runTest('2.3 Filtered Alerts Endpoint (/api/budgets/alerts) accurately excludes "safe" budgets', async () => {
    const testMonth = '2027-09';
    // Create one safe budget (50% spent) and one warning budget (85% spent)
    const { data: bgt1 } = await request('/api/budgets', {
      method: 'POST',
      body: JSON.stringify({ categoryId: 'cat_food', month: testMonth, limitAmount: 1000000 })
    });
    const { data: bgt2 } = await request('/api/budgets', {
      method: 'POST',
      body: JSON.stringify({ categoryId: 'cat_housing', month: testMonth, limitAmount: 1000000 })
    });

    const { data: txSafe } = await request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({ walletId: 'cash', categoryId: 'cat_food', type: 'expense', amount: 500000, date: `${testMonth}-01` })
    });
    const { data: txWarn } = await request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({ walletId: 'cash', categoryId: 'cat_housing', type: 'expense', amount: 850000, date: `${testMonth}-01` })
    });

    const { data: alertsRes } = await request(`/api/budgets/alerts?month=${testMonth}`);
    const alerts = alertsRes.data;

    // Only cat_housing should be in alerts, cat_food must be excluded
    assert.ok(alerts.some(a => a.categoryId === 'cat_housing'), 'Housing should be in alerts');
    assert.ok(!alerts.some(a => a.categoryId === 'cat_food'), 'Food (safe) must NOT be in alerts');

    // Clean up
    await request(`/api/transactions/${txSafe.data.id}`, { method: 'DELETE' });
    await request(`/api/transactions/${txWarn.data.id}`, { method: 'DELETE' });
    await request(`/api/budgets/${bgt1.data.id}`, { method: 'DELETE' });
    await request(`/api/budgets/${bgt2.data.id}`, { method: 'DELETE' });
  });

  // =========================================================================
  // SUITE 3: SAVINGS RATE FORMULA & DIVISION BY ZERO SAFETY
  // =========================================================================
  console.log(`\n${colors.bold}${colors.cyan}[INVARIANT 3] Savings Rate Formula & Zero-Income Division Safety${colors.reset}`);

  await runTest('3.1 Division by Zero Safety: Month with 0 Income and 0 Expense returns savingsRate === 0', async () => {
    const testMonth = '2027-10';
    const { status, data: res } = await request(`/api/analytics/summary?month=${testMonth}`);
    assert.strictEqual(status, 200);
    const summary = res.data;

    assert.strictEqual(summary.monthlyIncome, 0);
    assert.strictEqual(summary.monthlyExpense, 0);
    assert.strictEqual(summary.netSavings, 0);
    assert.strictEqual(summary.savingsRate, 0, 'savingsRate must be 0, not NaN or null');
    assert.strictEqual(summary.isDeficit, false);
    assert.strictEqual(typeof summary.savingsRate, 'number');
    assert.ok(!isNaN(summary.savingsRate), 'savingsRate must not be NaN');
    assert.ok(isFinite(summary.savingsRate), 'savingsRate must be finite');
  });

  await runTest('3.2 Division by Zero Safety: Month with 0 Income and Positive Expense returns savingsRate === 0 & isDeficit === true', async () => {
    const testMonth = '2027-11';
    const { data: tx } = await request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        walletId: 'cash',
        categoryId: 'cat_food',
        type: 'expense',
        amount: 750000,
        date: `${testMonth}-10`,
        note: 'Zero-income expense test'
      })
    });

    const { status, data: res } = await request(`/api/analytics/summary?month=${testMonth}`);
    assert.strictEqual(status, 200);
    const summary = res.data;

    assert.strictEqual(summary.monthlyIncome, 0);
    assert.strictEqual(summary.monthlyExpense, 750000);
    assert.strictEqual(summary.netSavings, -750000);
    assert.strictEqual(summary.savingsRate, 0, 'Zero income with expense must yield savingsRate 0 without NaN/Infinity');
    assert.strictEqual(summary.isDeficit, true, 'Must flag isDeficit as true');
    assert.ok(!isNaN(summary.savingsRate));
    assert.ok(isFinite(summary.savingsRate));

    // Clean up
    await request(`/api/transactions/${tx.data.id}`, { method: 'DELETE' });
  });

  await runTest('3.3 100% Savings Rate: Income > 0 and Expense == 0 yields exact 100% savingsRate', async () => {
    const testMonth = '2027-12';
    const { data: tx } = await request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        walletId: 'bank',
        categoryId: 'cat_salary',
        type: 'income',
        amount: 15000000,
        date: `${testMonth}-05`,
        note: 'Full savings salary'
      })
    });

    const { status, data: res } = await request(`/api/analytics/summary?month=${testMonth}`);
    assert.strictEqual(status, 200);
    const summary = res.data;

    assert.strictEqual(summary.monthlyIncome, 15000000);
    assert.strictEqual(summary.monthlyExpense, 0);
    assert.strictEqual(summary.netSavings, 15000000);
    assert.strictEqual(summary.savingsRate, 100.0, 'Income with zero expense must yield exactly 100%');
    assert.strictEqual(summary.isDeficit, false);

    // Clean up
    await request(`/api/transactions/${tx.data.id}`, { method: 'DELETE' });
  });

  await runTest('3.4 Standard Mathematical Correctness: (Income - Expense) / Income * 100%', async () => {
    const testMonth = '2028-01';

    // Income: 20,000,000 VND
    const { data: incTx } = await request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        walletId: 'bank',
        categoryId: 'cat_salary',
        type: 'income',
        amount: 20000000,
        date: `${testMonth}-01`
      })
    });

    // Expense: 15,000,000 VND -> Net: 5,000,000 VND -> Savings Rate: 25.0%
    const { data: expTx } = await request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        walletId: 'bank',
        categoryId: 'cat_housing',
        type: 'expense',
        amount: 15000000,
        date: `${testMonth}-05`
      })
    });

    const { data: res } = await request(`/api/analytics/summary?month=${testMonth}`);
    const summary = res.data;

    assert.strictEqual(summary.monthlyIncome, 20000000);
    assert.strictEqual(summary.monthlyExpense, 15000000);
    assert.strictEqual(summary.netSavings, 5000000);
    assert.strictEqual(summary.savingsRate, 25.0);
    assert.strictEqual(summary.isDeficit, false);

    // Clean up
    await request(`/api/transactions/${incTx.data.id}`, { method: 'DELETE' });
    await request(`/api/transactions/${expTx.data.id}`, { method: 'DELETE' });
  });

  await runTest('3.5 Break-even Math: Income == Expense yields savingsRate === 0 and isDeficit === false', async () => {
    const testMonth = '2028-02';

    const { data: incTx } = await request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        walletId: 'cash',
        categoryId: 'cat_freelance',
        type: 'income',
        amount: 8000000,
        date: `${testMonth}-02`
      })
    });

    const { data: expTx } = await request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        walletId: 'cash',
        categoryId: 'cat_shopping',
        type: 'expense',
        amount: 8000000,
        date: `${testMonth}-03`
      })
    });

    const { data: res } = await request(`/api/analytics/summary?month=${testMonth}`);
    const summary = res.data;

    assert.strictEqual(summary.monthlyIncome, 8000000);
    assert.strictEqual(summary.monthlyExpense, 8000000);
    assert.strictEqual(summary.netSavings, 0);
    assert.strictEqual(summary.savingsRate, 0);
    assert.strictEqual(summary.isDeficit, false);

    // Clean up
    await request(`/api/transactions/${incTx.data.id}`, { method: 'DELETE' });
    await request(`/api/transactions/${expTx.data.id}`, { method: 'DELETE' });
  });

  await runTest('3.6 Deficit Handling: Expense > Income yields isDeficit === true & non-negative savingsRate in KPI summary', async () => {
    const testMonth = '2028-03';

    const { data: incTx } = await request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        walletId: 'cash',
        categoryId: 'cat_freelance',
        type: 'income',
        amount: 5000000,
        date: `${testMonth}-02`
      })
    });

    const { data: expTx } = await request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        walletId: 'cash',
        categoryId: 'cat_shopping',
        type: 'expense',
        amount: 9000000,
        date: `${testMonth}-03`
      })
    });

    const { data: res } = await request(`/api/analytics/summary?month=${testMonth}`);
    const summary = res.data;

    assert.strictEqual(summary.monthlyIncome, 5000000);
    assert.strictEqual(summary.monthlyExpense, 9000000);
    assert.strictEqual(summary.netSavings, -4000000);
    assert.strictEqual(summary.savingsRate, 0, 'KPI savings rate should clamp to 0 during deficit');
    assert.strictEqual(summary.isDeficit, true);

    // Clean up
    await request(`/api/transactions/${incTx.data.id}`, { method: 'DELETE' });
    await request(`/api/transactions/${expTx.data.id}`, { method: 'DELETE' });
  });

  await runTest('3.7 Precision & Rounding: Fractional decimal percentages rounded to 2 decimal places', async () => {
    const testMonth = '2028-04';

    // 3,000,000 Income, 1,000,000 Expense -> Net: 2,000,000 -> 2M / 3M = 66.6666...% -> 66.67%
    const { status: incStatus, data: incTx } = await request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        walletId: 'ewallet',
        categoryId: 'cat_freelance',
        type: 'income',
        amount: 3000000,
        date: `${testMonth}-02`
      })
    });
    assert.strictEqual(incStatus, 201, 'Income transaction should be created');

    const { status: expStatus, data: expTx } = await request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        walletId: 'ewallet',
        categoryId: 'cat_food',
        type: 'expense',
        amount: 1000000,
        date: `${testMonth}-03`
      })
    });
    assert.strictEqual(expStatus, 201, 'Expense transaction should be created');

    const { data: res } = await request(`/api/analytics/summary?month=${testMonth}`);
    const summary = res.data;

    assert.strictEqual(summary.savingsRate, 66.67, `Expected 66.67%, got ${summary.savingsRate}`);

    // Clean up
    await request(`/api/transactions/${incTx.data.id}`, { method: 'DELETE' });
    await request(`/api/transactions/${expTx.data.id}`, { method: 'DELETE' });
  });

  await runTest('3.8 MoM Rollover: Analytics MoM correctly handles Year boundary (January -> previous December)', async () => {
    // Check 2028-01 comparison points to 2027-12
    const { data: res } = await request('/api/analytics/summary?month=2028-01');
    const summary = res.data;
    assert.strictEqual(summary.comparison.previousMonth, '2027-12');
  });

  // =========================================================================
  // FINAL SUMMARY
  // =========================================================================
  console.log(`\n${colors.bold}${colors.magenta}======================================================================${colors.reset}`);
  console.log(`${colors.bold}ADVERSARIAL VERIFICATION SUMMARY:${colors.reset}`);
  console.log(`  Total Checks: ${colors.bold}${passedTests + failedTests}${colors.reset}`);
  console.log(`  Passed:       ${colors.green}${colors.bold}${passedTests}${colors.reset}`);
  console.log(`  Failed:       ${colors.red}${colors.bold}${failedTests}${colors.reset}`);

  if (inProcessServer) {
    inProcessServer.close();
  }

  if (failedTests === 0) {
    console.log(`\n${colors.bold}${colors.green}>>> VERDICT: APPROVE (ALL FINANCIAL INVARIANTS RIGOROUSLY PRESERVED) <<<${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}======================================================================${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.bold}${colors.red}>>> VERDICT: CHALLENGE_FAILED (${failedTests} INVARIANT FAILURES FOUND) <<<${colors.reset}`);
    failureList.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name} -> ${f.error}`);
    });
    console.log(`${colors.bold}${colors.magenta}======================================================================${colors.reset}\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`${colors.red}Fatal execution error:${colors.reset}`, err);
  if (inProcessServer) inProcessServer.close();
  process.exit(1);
});
