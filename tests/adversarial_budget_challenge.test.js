/**
 * tests/adversarial_budget_challenge.test.js
 * EMPIRICAL ADVERSARIAL CHALLENGER: BUDGET CALCULATIONS, THRESHOLDS & DEFICIT MATH
 * 
 * Milestone: Milestone 3 - Adversarial & Invariant Verification
 * Subject: Triển khai và quản trị hệ thống phần mềm (Đề 38)
 * Student: Trần Mạnh Dũng | MSSV: DTC245160020 | Lớp: K23.K1.KHMT K23A
 * Agent: Empirical Challenger (challenger_m3_1)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Terminal colors
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m'
};

let totalPassed = 0;
let totalFailed = 0;
const failures = [];

async function test(suite, name, fn) {
  const start = performance.now();
  try {
    await fn();
    const duration = (performance.now() - start).toFixed(2);
    console.log(`  ${c.green}✓ PASS${c.reset} ${name} ${c.gray}(${duration}ms)${c.reset}`);
    totalPassed++;
  } catch (err) {
    const duration = (performance.now() - start).toFixed(2);
    console.log(`  ${c.red}✗ FAIL${c.reset} ${name} ${c.gray}(${duration}ms)${c.reset}`);
    console.log(`    ${c.red}Error: ${err.message}${c.reset}`);
    totalFailed++;
    failures.push({ suite, name, error: err.message, stack: err.stack });
  }
}

// 1. Backend Modules & DB
const { getDatabase } = require('../server/src/config/database');
const { initSchema } = require('../server/src/models/schema');
const { seedDatabase } = require('../server/src/scripts/seed');
const budgetModel = require('../server/src/models/budgetModel');
const transactionModel = require('../server/src/models/transactionModel');

// 2. Client JSX Loader via esbuild & react-dom/server
const esbuild = require(path.resolve('./client/node_modules/esbuild'));
const React = require(path.resolve('./client/node_modules/react'));
const ReactDOMServer = require(path.resolve('./client/node_modules/react-dom/server'));
const lucide = require(path.resolve('./client/node_modules/lucide-react'));

function loadComponent(filePath) {
  const absPath = path.resolve(filePath);
  const bundle = esbuild.buildSync({
    entryPoints: [absPath],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    nodePaths: [path.resolve('./client/node_modules')],
    external: ['react', 'react-dom', 'lucide-react', 'recharts'],
    define: {
      'import.meta.env': '{}',
      'import.meta.env.VITE_API_URL': '""'
    },
    write: false
  });

  const m = { exports: {} };
  const fn = new Function('module', 'exports', 'require', 'React', bundle.outputFiles[0].text);
  fn(m, m.exports, (id) => {
    if (id === 'react') return React;
    if (id === 'react-dom') return require(path.resolve('./client/node_modules/react-dom'));
    if (id === 'react-dom/server') return ReactDOMServer;
    if (id === 'lucide-react') return lucide;
    return {};
  }, React);

  return m.exports.default || m.exports;
}

// Load client components
const BudgetProgressBar = loadComponent('./client/src/components/budgets/BudgetProgressBar.jsx');
const BudgetCards = loadComponent('./client/src/components/budgets/BudgetCards.jsx');

// Load client storageAdapter
const storageAdapterModule = esbuild.buildSync({
  entryPoints: [path.resolve('./client/src/services/storageAdapter.js')],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  nodePaths: [path.resolve('./client/node_modules')],
  define: {
    'import.meta.env': '{}'
  },
  write: false
});
const storageAdapterObj = { exports: {} };
new Function('module', 'exports', 'require', storageAdapterModule.outputFiles[0].text)(
  storageAdapterObj,
  storageAdapterObj.exports,
  (id) => ({})
);
const storageAdapter = storageAdapterObj.exports.storageAdapter || storageAdapterObj.exports.default;

async function run() {
  console.log(`\n${c.bold}${c.magenta}======================================================================${c.reset}`);
  console.log(`${c.bold}${c.magenta}   EMPIRICAL BUDGET CALCULATIONS & ADVERSARIAL STRESS SUITE          ${c.reset}`);
  console.log(`${c.bold}   Đề 38: Triển khai và quản trị hệ thống phần mềm                    ${c.reset}`);
  console.log(`${c.bold}   Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020                    ${c.reset}`);
  console.log(`${c.bold}${c.magenta}======================================================================${c.reset}\n`);

  const db = getDatabase();
  initSchema(db);
  seedDatabase(db, false);

  // =========================================================================
  // SUITE 1: BUDGET THRESHOLD TRANSITIONS & HYSTERESIS
  // =========================================================================
  console.log(`${c.bold}${c.cyan}=== SUITE 1: Threshold Transitions (80% Warning, 100% Exceeded) ===${c.reset}`);

  await test('Thresholds', '1.1 Initial State: 0% spent is strictly "safe"', async () => {
    const testMonth = '2029-01';
    const catId = 'cat_food';
    const limit = 1000000; // 1M

    budgetModel.upsert({ categoryId: catId, month: testMonth, limitAmount: limit, warningThreshold: 0.80 });
    const b = budgetModel.getById(`bgt_${testMonth}_${catId}`);

    assert.strictEqual(b.spentAmount, 0);
    assert.strictEqual(b.percentage, 0);
    assert.strictEqual(b.remainingAmount, 1000000);
    assert.strictEqual(b.status, 'safe');

    // Clean up
    budgetModel.delete(b.id);
  });

  await test('Thresholds', '1.2 Sub-80% Boundary: 79.9% spent (799,000 / 1,000,000) is strictly "safe"', async () => {
    const testMonth = '2029-02';
    const catId = 'cat_food';
    const limit = 1000000;

    const b = budgetModel.upsert({ categoryId: catId, month: testMonth, limitAmount: limit, warningThreshold: 0.80 });
    const tx = transactionModel.create({
      walletId: 'cash',
      categoryId: catId,
      type: 'expense',
      amount: 799000,
      date: `${testMonth}-05`,
      note: '79.9% boundary test'
    });

    const refreshed = budgetModel.getById(b.id);
    assert.strictEqual(refreshed.spentAmount, 799000);
    assert.strictEqual(refreshed.percentage, 79.9);
    assert.strictEqual(refreshed.remainingAmount, 201000);
    assert.strictEqual(refreshed.status, 'safe');

    // Clean up
    transactionModel.delete(tx.id);
    budgetModel.delete(b.id);
  });

  await test('Thresholds', '1.3 80.0% Exact Transition: 800,000 / 1,000,000 flips status to "warning"', async () => {
    const testMonth = '2029-03';
    const catId = 'cat_food';
    const limit = 1000000;

    const b = budgetModel.upsert({ categoryId: catId, month: testMonth, limitAmount: limit, warningThreshold: 0.80 });
    const tx = transactionModel.create({
      walletId: 'cash',
      categoryId: catId,
      type: 'expense',
      amount: 800000,
      date: `${testMonth}-05`,
      note: '80.0% boundary test'
    });

    const refreshed = budgetModel.getById(b.id);
    assert.strictEqual(refreshed.spentAmount, 800000);
    assert.strictEqual(refreshed.percentage, 80);
    assert.strictEqual(refreshed.remainingAmount, 200000);
    assert.strictEqual(refreshed.status, 'warning');

    // Clean up
    transactionModel.delete(tx.id);
    budgetModel.delete(b.id);
  });

  await test('Thresholds', '1.4 Sub-100% Upper Boundary: 99.9% spent (999,000 / 1,000,000) remains "warning"', async () => {
    const testMonth = '2029-04';
    const catId = 'cat_food';
    const limit = 1000000;

    const b = budgetModel.upsert({ categoryId: catId, month: testMonth, limitAmount: limit, warningThreshold: 0.80 });
    const tx = transactionModel.create({
      walletId: 'cash',
      categoryId: catId,
      type: 'expense',
      amount: 999000,
      date: `${testMonth}-05`,
      note: '99.9% boundary test'
    });

    const refreshed = budgetModel.getById(b.id);
    assert.strictEqual(refreshed.spentAmount, 999000);
    assert.strictEqual(refreshed.percentage, 99.9);
    assert.strictEqual(refreshed.remainingAmount, 1000);
    assert.strictEqual(refreshed.status, 'warning');

    // Clean up
    transactionModel.delete(tx.id);
    budgetModel.delete(b.id);
  });

  await test('Thresholds', '1.5 100.0% Exact Transition: 1,000,000 / 1,000,000 flips status to "exceeded"', async () => {
    const testMonth = '2029-05';
    const catId = 'cat_food';
    const limit = 1000000;

    const b = budgetModel.upsert({ categoryId: catId, month: testMonth, limitAmount: limit, warningThreshold: 0.80 });
    const tx = transactionModel.create({
      walletId: 'cash',
      categoryId: catId,
      type: 'expense',
      amount: 1000000,
      date: `${testMonth}-05`,
      note: '100.0% boundary test'
    });

    const refreshed = budgetModel.getById(b.id);
    assert.strictEqual(refreshed.spentAmount, 1000000);
    assert.strictEqual(refreshed.percentage, 100);
    assert.strictEqual(refreshed.remainingAmount, 0);
    assert.strictEqual(refreshed.status, 'exceeded');

    // Clean up
    transactionModel.delete(tx.id);
    budgetModel.delete(b.id);
  });

  await test('Thresholds', '1.6 Deep Over-Budget: 150% and 300% spent remain "exceeded" with negative remainingAmount', async () => {
    const testMonth = '2029-06';
    const catId = 'cat_food';
    const limit = 1000000;

    const b = budgetModel.upsert({ categoryId: catId, month: testMonth, limitAmount: limit, warningThreshold: 0.80 });
    const tx = transactionModel.create({
      walletId: 'cash',
      categoryId: catId,
      type: 'expense',
      amount: 1500000,
      date: `${testMonth}-05`,
      note: '150% over budget'
    });

    let refreshed = budgetModel.getById(b.id);
    assert.strictEqual(refreshed.spentAmount, 1500000);
    assert.strictEqual(refreshed.percentage, 150);
    assert.strictEqual(refreshed.remainingAmount, -500000);
    assert.strictEqual(refreshed.status, 'exceeded');

    // Add another 1.5M -> 300%
    const tx2 = transactionModel.create({
      walletId: 'cash',
      categoryId: catId,
      type: 'expense',
      amount: 1500000,
      date: `${testMonth}-06`,
      note: '300% over budget'
    });

    refreshed = budgetModel.getById(b.id);
    assert.strictEqual(refreshed.spentAmount, 3000000);
    assert.strictEqual(refreshed.percentage, 300);
    assert.strictEqual(refreshed.remainingAmount, -2000000);
    assert.strictEqual(refreshed.status, 'exceeded');

    // Clean up
    transactionModel.delete(tx.id);
    transactionModel.delete(tx2.id);
    budgetModel.delete(b.id);
  });

  await test('Thresholds', '1.7 Bidirectional Rollback: Transitioning backwards from 120% -> 90% -> 70% restores states', async () => {
    const testMonth = '2029-07';
    const catId = 'cat_food';
    const limit = 1000000;

    const b = budgetModel.upsert({ categoryId: catId, month: testMonth, limitAmount: limit, warningThreshold: 0.80 });
    const tx1 = transactionModel.create({ walletId: 'cash', categoryId: catId, type: 'expense', amount: 700000, date: `${testMonth}-01` });
    const tx2 = transactionModel.create({ walletId: 'cash', categoryId: catId, type: 'expense', amount: 200000, date: `${testMonth}-02` });
    const tx3 = transactionModel.create({ walletId: 'cash', categoryId: catId, type: 'expense', amount: 300000, date: `${testMonth}-03` });

    // Currently at 1,200,000 (120%) -> exceeded
    let cur = budgetModel.getById(b.id);
    assert.strictEqual(cur.percentage, 120);
    assert.strictEqual(cur.status, 'exceeded');

    // Remove tx3 (300k) -> drops to 900,000 (90%) -> warning
    transactionModel.delete(tx3.id);
    cur = budgetModel.getById(b.id);
    assert.strictEqual(cur.percentage, 90);
    assert.strictEqual(cur.status, 'warning');

    // Remove tx2 (200k) -> drops to 700,000 (70%) -> safe
    transactionModel.delete(tx2.id);
    cur = budgetModel.getById(b.id);
    assert.strictEqual(cur.percentage, 70);
    assert.strictEqual(cur.status, 'safe');

    // Clean up
    transactionModel.delete(tx1.id);
    budgetModel.delete(b.id);
  });

  // =========================================================================
  // SUITE 2: DEFICIT MATH & OVERDRAFT CALCULATIONS
  // =========================================================================
  console.log(`\n${c.bold}${c.cyan}=== SUITE 2: Deficit Math & UI Overdraft Representation ===${c.reset}`);

  await test('Deficit', '2.1 Backend remainingAmount formula strictly preserves (limitAmount - spentAmount)', async () => {
    const testMonth = '2029-08';
    const catId = 'cat_shopping';
    const limit = 2000000;

    const b = budgetModel.upsert({ categoryId: catId, month: testMonth, limitAmount: limit });
    const tx = transactionModel.create({ walletId: 'cash', categoryId: catId, type: 'expense', amount: 2750000, date: `${testMonth}-10` });

    const cur = budgetModel.getById(b.id);
    assert.strictEqual(cur.remainingAmount, -750000);
    assert.strictEqual(cur.spentAmount - cur.limitAmount, 750000, 'Deficit should be exactly 750,000');

    // Clean up
    transactionModel.delete(tx.id);
    budgetModel.delete(b.id);
  });

  await test('Deficit', '2.2 BudgetProgressBar server-render converts negative remainingAmount into "Vượt: +750.000 ₫"', async () => {
    const rawHtml = ReactDOMServer.renderToString(
      React.createElement(BudgetProgressBar, {
        percentage: 137.5,
        spentAmount: 2750000,
        limitAmount: 2000000,
        remainingAmount: -750000,
        showLabels: true,
        showBadge: true
      })
    );
    const html = rawHtml.replace(/<!--.*?-->/g, '');

    assert.ok(html.includes('Vượt:'), 'Must display deficit label "Vượt:"');
    assert.ok(html.includes('+750.000'), 'Must display formatted deficit amount "+750.000"');
    assert.ok(html.includes('bg-rose-500 animate-pulse'), 'Exceeded bar must have red pulsing color');
    assert.ok(html.includes('Vượt hạn mức'), 'Exceeded badge must state "Vượt hạn mức"');
    assert.ok(html.includes('style="width:100%"'), 'Bar width must be clamped at 100% so it does not overflow track');
  });

  await test('Deficit', '2.3 BudgetProgressBar server-render at <80% displays "Còn lại:" and emerald bar', async () => {
    const rawHtml = ReactDOMServer.renderToString(
      React.createElement(BudgetProgressBar, {
        percentage: 60.0,
        spentAmount: 600000,
        limitAmount: 1000000,
        remainingAmount: 400000,
        showLabels: true,
        showBadge: true
      })
    );
    const html = rawHtml.replace(/<!--.*?-->/g, '');

    assert.ok(html.includes('Còn lại:'), 'Must display remaining label "Còn lại:"');
    assert.ok(html.includes('400.000'), 'Must display formatted remaining amount "400.000"');
    assert.ok(html.includes('bg-emerald-500'), 'Safe bar must be emerald');
    assert.ok(html.includes('An toàn'), 'Safe badge must state "An toàn"');
  });

  await test('Deficit', '2.4 BudgetProgressBar server-render at 85% displays "Sắp chạm trần" and amber bar', async () => {
    const rawHtml = ReactDOMServer.renderToString(
      React.createElement(BudgetProgressBar, {
        percentage: 85.0,
        spentAmount: 850000,
        limitAmount: 1000000,
        remainingAmount: 150000,
        showLabels: true,
        showBadge: true
      })
    );
    const html = rawHtml.replace(/<!--.*?-->/g, '');

    assert.ok(html.includes('Sắp chạm trần'), 'Warning badge must state "Sắp chạm trần"');
    assert.ok(html.includes('bg-amber-500'), 'Warning bar must be amber');
    assert.ok(html.includes('Còn lại:'), 'Remaining label should still be "Còn lại:" since it is not over budget');
  });

  await test('Deficit', '2.5 BudgetCards renders cards for both safe, warning, and deficit exceeded budgets', async () => {
    const items = [
      {
        id: 'b1',
        categoryId: 'cat_food',
        categoryName: 'Ăn uống',
        categoryColor: '#EF4444',
        categoryIcon: 'Utensils',
        limitAmount: 1000000,
        spentAmount: 500000,
        remainingAmount: 500000,
        percentage: 50.0,
        status: 'safe'
      },
      {
        id: 'b2',
        categoryId: 'cat_transport',
        categoryName: 'Di chuyển',
        categoryColor: '#3B82F6',
        categoryIcon: 'Car',
        limitAmount: 500000,
        spentAmount: 450000,
        remainingAmount: 50000,
        percentage: 90.0,
        status: 'warning'
      },
      {
        id: 'b3',
        categoryId: 'cat_shopping',
        categoryName: 'Mua sắm',
        categoryColor: '#EC4899',
        categoryIcon: 'ShoppingBag',
        limitAmount: 1000000,
        spentAmount: 1400000,
        remainingAmount: -400000,
        percentage: 140.0,
        status: 'exceeded'
      }
    ];

    const rawHtml = ReactDOMServer.renderToString(
      React.createElement(BudgetCards, { items })
    );
    const html = rawHtml.replace(/<!--.*?-->/g, '');

    assert.ok(html.includes('Ăn uống'), 'Contains cat_food');
    assert.ok(html.includes('Di chuyển'), 'Contains cat_transport');
    assert.ok(html.includes('Mua sắm'), 'Contains cat_shopping');
    assert.ok(html.includes('An toàn (50.0%)'), 'Contains safe badge');
    assert.ok(html.includes('Sắp chạm trần (90.0%)'), 'Contains warning badge');
    assert.ok(html.includes('Vượt hạn mức (140.0%)'), 'Contains exceeded badge');
    assert.ok(html.includes('Vượt:'), 'Contains deficit amount in cards');
  });

  // =========================================================================
  // SUITE 3: DIVISION BY ZERO & DEFENSIVE BOUNDARY PROTECTION
  // =========================================================================
  console.log(`\n${c.bold}${c.cyan}=== SUITE 3: Division-by-Zero & Defensive Boundary Protection ===${c.reset}`);

  await test('ZeroDivision', '3.1 Budget Upsert strictly rejects limitAmount <= 0 with validation error', async () => {
    let thrown = false;
    try {
      budgetModel.upsert({ categoryId: 'cat_food', month: '2029-09', limitAmount: 0 });
    } catch (err) {
      thrown = true;
      assert.strictEqual(err.code, 'VALIDATION_ERROR');
    }
    assert.ok(thrown, 'Should reject limitAmount = 0');

    let negThrown = false;
    try {
      budgetModel.upsert({ categoryId: 'cat_food', month: '2029-09', limitAmount: -100000 });
    } catch (err) {
      negThrown = true;
      assert.strictEqual(err.code, 'VALIDATION_ERROR');
    }
    assert.ok(negThrown, 'Should reject negative limitAmount');
  });

  await test('ZeroDivision', '3.2 SQLite Table Schema CHECK constraint rejects limit_amount <= 0 directly', async () => {
    let sqlThrown = false;
    try {
      db.prepare(`
        INSERT INTO budgets (id, category_id, month, limit_amount, warning_threshold)
        VALUES ('bgt_test_zero', 'cat_food', '2029-10', 0, 0.8)
      `).run();
    } catch (err) {
      sqlThrown = true;
      assert.ok(err.message.includes('CHECK constraint failed'));
    }
    assert.ok(sqlThrown, 'Direct SQL insert with limit_amount=0 must fail CHECK constraint');
  });

  await test('ZeroDivision', '3.3 budgetModel.getProgress handles zero budgets without 0/0 NaN crash', async () => {
    // Query month with no budgets
    const emptyMonth = '2035-12';
    const progress = budgetModel.getProgress(emptyMonth);

    assert.strictEqual(progress.month, emptyMonth);
    assert.strictEqual(progress.items.length, 0);
    assert.strictEqual(progress.summary.totalBudgetLimit, 0);
    assert.strictEqual(progress.summary.totalBudgetSpent, 0);
    assert.strictEqual(progress.summary.remaining, 0);
    assert.strictEqual(progress.summary.overallPercentage, 0, '0 / 0 must yield 0, not NaN');
    assert.strictEqual(progress.summary.overallStatus, 'safe');
    assert.strictEqual(Number.isNaN(progress.summary.overallPercentage), false);
  });

  await test('ZeroDivision', '3.4 transactionModel.getMonthlySummary handles zero income and positive expense without division error', async () => {
    const testMonth = '2030-01';
    // Create an expense with zero income
    const tx = transactionModel.create({
      walletId: 'cash',
      categoryId: 'cat_food',
      type: 'expense',
      amount: 500000,
      date: `${testMonth}-15`
    });

    const summary = transactionModel.getMonthlySummary(testMonth);
    assert.strictEqual(summary.monthlyIncome, 0);
    assert.strictEqual(summary.monthlyExpense, 500000);
    assert.strictEqual(summary.netSavings, -500000);
    assert.strictEqual(summary.savingsRate, 0, 'Zero income with expense must yield savingsRate = 0, not -Infinity or NaN');
    assert.strictEqual(summary.isDeficit, true);
    assert.strictEqual(Number.isNaN(summary.savingsRate), false);

    // Clean up
    transactionModel.delete(tx.id);
  });

  await test('ZeroDivision', '3.5 transactionModel.getMonthlySummary handles zero income and zero expense cleanly', async () => {
    const emptyMonth = '2031-01';
    const summary = transactionModel.getMonthlySummary(emptyMonth);

    assert.strictEqual(summary.monthlyIncome, 0);
    assert.strictEqual(summary.monthlyExpense, 0);
    assert.strictEqual(summary.netSavings, 0);
    assert.strictEqual(summary.savingsRate, 0, 'Zero income and zero expense must yield savingsRate = 0');
    assert.strictEqual(summary.isDeficit, false);
    assert.strictEqual(Number.isNaN(summary.savingsRate), false);
  });

  await test('ZeroDivision', '3.6 BudgetProgressBar gracefully handles edge/invalid numeric inputs (NaN, Infinity, negative)', async () => {
    const edgeCases = [
      { percentage: NaN, spent: 0, limit: 0, rem: 0 },
      { percentage: Infinity, spent: 100, limit: 0, rem: -100 },
      { percentage: -50, spent: -500, limit: 1000, rem: 1500 },
      { percentage: 0, spent: 0, limit: 1000, rem: 1000 },
      { percentage: 999999, spent: 999999999, limit: 1000, rem: -999998999 }
    ];

    for (const ec of edgeCases) {
      let threw = false;
      try {
        const html = ReactDOMServer.renderToString(
          React.createElement(BudgetProgressBar, {
            percentage: ec.percentage,
            spentAmount: ec.spent,
            limitAmount: ec.limit,
            remainingAmount: ec.rem,
            showLabels: true,
            showBadge: true
          })
        );
        assert.ok(typeof html === 'string' && html.length > 0);
      } catch (e) {
        threw = true;
      }
      assert.strictEqual(threw, false, `Render threw on percentage=${ec.percentage}`);
    }
  });

  // =========================================================================
  // SUITE 4: BACKEND & FRONTEND OFFLINE ENGINE PARITY
  // =========================================================================
  console.log(`\n${c.bold}${c.cyan}=== SUITE 4: Backend & Offline StorageAdapter Logic Parity ===${c.reset}`);

  await test('Parity', '4.1 storageAdapter.getBudgets applies identical threshold transition rules (<80%, 80-100%, >=100%)', async () => {
    const testMonth = '2026-10';
    const budgets = await storageAdapter.getBudgets(testMonth);
    assert.ok(Array.isArray(budgets) && budgets.length > 0, 'StorageAdapter should return budgets');

    for (const b of budgets) {
      const pct = b.percentage;
      if (pct >= 100) {
        assert.strictEqual(b.status, 'exceeded', `Budget at ${pct}% must be 'exceeded'`);
      } else if (pct >= 80) {
        assert.strictEqual(b.status, 'warning', `Budget at ${pct}% must be 'warning'`);
      } else {
        assert.strictEqual(b.status, 'safe', `Budget at ${pct}% must be 'safe'`);
      }
      assert.strictEqual(b.remainingAmount, b.limitAmount - b.spentAmount, 'Remaining amount parity');
    }
  });

  await test('Parity', '4.2 storageAdapter.getBudgetProgress calculates overall percentage with zero-division safety', async () => {
    const prog = await storageAdapter.getBudgetProgress('2026-10');
    assert.ok(prog.summary, 'Summary object present');
    assert.ok(typeof prog.summary.overallPercentage === 'number');
    assert.strictEqual(Number.isNaN(prog.summary.overallPercentage), false);

    // Test with empty month
    const emptyProg = await storageAdapter.getBudgetProgress('2099-01');
    assert.strictEqual(emptyProg.summary.totalBudgetLimit, 0);
    assert.strictEqual(emptyProg.summary.overallPercentage, 0);
    assert.strictEqual(emptyProg.summary.overallStatus, 'safe');
    assert.strictEqual(Number.isNaN(emptyProg.summary.overallPercentage), false);
  });

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log(`\n${c.bold}${c.magenta}======================================================================${c.reset}`);
  console.log(`${c.bold}CHALLENGER VERIFICATION SUMMARY:${c.reset}`);
  console.log(`  Total Checks: ${totalPassed + totalFailed}`);
  console.log(`  ${c.green}Passed:       ${totalPassed}${c.reset}`);
  console.log(`  ${c.red}Failed:       ${totalFailed}${c.reset}`);

  if (totalFailed === 0) {
    console.log(`\n${c.bold}${c.green}>>> VERDICT: APPROVE (BUDGET CALCULATIONS, THRESHOLDS & INVARIANTS RIGOROUSLY VERIFIED) <<<${c.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${c.bold}${c.red}>>> VERDICT: FAIL (${totalFailed} INVARIANT DEFECTS FOUND) <<<${c.reset}\n`);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
